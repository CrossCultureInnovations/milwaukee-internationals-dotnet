import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Search,
  GraduationCap,
  Download,
  ChevronDown,
  Pencil,
  Trash2,
  Users,
  Baby,
  UtensilsCrossed,
  Car,
  Calendar,
  CopyCheck,
} from "lucide-react";
import { Container } from "../../components/layout/Container";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import { Skeleton } from "../../components/ui/skeleton";
import { useStudents } from "../../lib/hooks/useApiQueries";
import { QueryError } from "../../components/QueryError";
import { api, type Student } from "../../api";
import { exportStudentsToExcel } from "../../lib/export";
import { cn } from "../../lib/utils";

// ---------------------------------------------------------------------------
// Summary stats
// ---------------------------------------------------------------------------

function StudentStats({ students }: { students: Student[] }) {
  const total = students.length;
  const deps = students.reduce((s, x) => s + (x.isFamily ? x.familySize : 0), 0);
  const seats = students.filter((s) => s.needCarSeat).length;
  const families = students.filter((s) => s.isFamily).length;
  const kosher = students.filter((s) => s.kosherFood).length;

  const stats = [
    { label: "Students", value: total },
    { label: "Dependents", value: deps },
    { label: "Total", value: total + deps },
    { label: "Families", value: families },
    { label: "Car Seats", value: seats },
    { label: "Kosher", value: kosher },
  ];

  return (
    <div className="mb-6 grid grid-cols-3 gap-3 sm:grid-cols-6">
      {stats.map((s) => (
        <div
          key={s.label}
          className="rounded-xl border border-border bg-card px-3 py-2 text-center"
        >
          <p className="text-lg font-semibold text-foreground">{s.value}</p>
          <p className="text-xs text-muted-foreground">{s.label}</p>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Duplicate detection
//
// Two students are considered duplicates when they share a name, an email, or
// a phone number. Blank values never match — otherwise every student
// missing a phone would flag every other one.
// ---------------------------------------------------------------------------

type DuplicateField = "name" | "email" | "phone";

const normName = (v: string | null | undefined) =>
  (v || "").toLowerCase().replace(/\s+/g, " ").trim();

const normEmail = (v: string | null | undefined) => (v || "").toLowerCase().trim();

// Compare on the last 10 digits so "+1 951-556-3828" and "9515563828" match
const normPhone = (v: string | null | undefined) => {
  const digits = (v || "").replace(/\D/g, "");
  return digits.length >= 10 ? digits.slice(-10) : digits;
};

/** One set of students that all collide with each other. */
type DuplicateGroup = {
  key: string;
  fields: DuplicateField[];
  members: Student[];
};

const FIELD_ACCESSORS: { field: DuplicateField; key: (s: Student) => string }[] = [
  { field: "name", key: (s) => normName(s.fullname) },
  { field: "email", key: (s) => normEmail(s.email) },
  { field: "phone", key: (s) => normPhone(s.phone) },
];

/**
 * Finds duplicate students, returning both a per-student flag (for highlighting
 * rows in the normal list) and the matched sets grouped together (for the
 * duplicates-only view). Grouping is transitive: if A shares a phone with B and
 * B shares an email with C, all three land in one set so you see the whole
 * cluster before deciding what to delete.
 */
function findDuplicates(students: Student[]): {
  flags: Map<number, DuplicateField[]>;
  groups: DuplicateGroup[];
} {
  const flags = new Map<number, DuplicateField[]>();

  // Union-find over student indices
  const parent = students.map((_, i) => i);
  const find = (x: number): number => {
    while (parent[x] !== x) {
      parent[x] = parent[parent[x]];
      x = parent[x];
    }
    return x;
  };
  const union = (a: number, b: number) => {
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) parent[rb] = ra;
  };

  for (const { field, key } of FIELD_ACCESSORS) {
    const buckets = new Map<string, number[]>();
    students.forEach((s, i) => {
      const k = key(s);
      if (!k) return;
      const bucket = buckets.get(k);
      if (bucket) bucket.push(i);
      else buckets.set(k, [i]);
    });
    for (const idxs of buckets.values()) {
      if (idxs.length < 2) continue;
      for (const i of idxs) {
        const id = students[i].id;
        const existing = flags.get(id);
        if (existing) existing.push(field);
        else flags.set(id, [field]);
        union(idxs[0], i);
      }
    }
  }

  // Collect components of size > 1
  const components = new Map<number, Student[]>();
  students.forEach((s, i) => {
    if (!flags.has(s.id)) return;
    const root = find(i);
    const c = components.get(root);
    if (c) c.push(s);
    else components.set(root, [s]);
  });

  const groups: DuplicateGroup[] = [];
  for (const [root, members] of components) {
    if (members.length < 2) continue;

    // Which fields actually collide somewhere inside this set
    const fields = FIELD_ACCESSORS.filter(({ key }) => {
      const seen = new Set<string>();
      return members.some((m) => {
        const k = key(m);
        if (!k) return false;
        if (seen.has(k)) return true;
        seen.add(k);
        return false;
      });
    }).map(({ field }) => field);

    // Oldest registration first — usually the one worth keeping
    members.sort((a, b) => (a.registeredOn || "").localeCompare(b.registeredOn || ""));

    groups.push({ key: String(root), fields, members });
  }

  groups.sort((a, b) =>
    normName(a.members[0].fullname).localeCompare(normName(b.members[0].fullname))
  );

  return { flags, groups };
}

// ---------------------------------------------------------------------------
// Date formatter
// ---------------------------------------------------------------------------

function formatDate(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// ---------------------------------------------------------------------------
// Grid row class shared by header + all cards
// ---------------------------------------------------------------------------

const ROW_GRID = cn(
  "grid items-center gap-x-3 px-4",
  "grid-cols-[3rem_1fr_auto]",
  "sm:grid-cols-[3rem_1fr_10rem_18rem]",
);

// ---------------------------------------------------------------------------
// Column header row
// ---------------------------------------------------------------------------

function ColumnHeader() {
  return null;
}

// ---------------------------------------------------------------------------
// Student card (Google Flights style)
// ---------------------------------------------------------------------------

function StudentCard({
  student,
  duplicateOf,
  defaultExpanded = false,
  onDelete,
}: {
  student: Student;
  duplicateOf?: DuplicateField[];
  defaultExpanded?: boolean;
  onDelete: (id: number) => void;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const navigate = useNavigate();

  return (
    <div
      className={cn(
        "rounded-xl border transition-shadow hover:shadow-md",
        duplicateOf
          ? "border-red-300 bg-red-50 dark:border-red-900/60 dark:bg-red-950/25"
          : "border-border bg-card"
      )}
    >
      {/* Main row — always visible */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className={cn(ROW_GRID, "w-full py-3 text-left")}
      >
        {/* ID */}
        <div className={cn(
          "flex h-9 w-9 mx-auto shrink-0 items-center justify-center rounded-full",
          student.isPresent
            ? "bg-green-500/15 text-green-600 dark:text-green-400"
            : "bg-muted text-muted-foreground"
        )}>
          <span className="text-xs font-bold">{student.displayId?.split("-").pop() || "#"}</span>
        </div>

        {/* Name + University/Major */}
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
            <span className="truncate">{student.fullname}</span>
            {student.isFamily && (
              <span className="flex shrink-0 items-center gap-0.5 text-xs font-normal text-muted-foreground">
                <Users className="h-3 w-3" />
                {student.familySize}
              </span>
            )}
            {duplicateOf && (
              <span
                className="flex shrink-0 items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-medium text-red-700 dark:bg-red-950/60 dark:text-red-300"
                title={`Same ${duplicateOf.join(", ")} as another student`}
              >
                <CopyCheck className="h-3 w-3" />
                Same {duplicateOf.join(", ")}
              </span>
            )}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {[student.university, student.major].filter(Boolean).join(" \u00B7 ") || "\u2014"}
          </p>
        </div>

        {/* Country */}
        <p className="hidden sm:block truncate text-sm text-foreground">{student.country || "\u2014"}</p>

        {/* Badges + Chevron */}
        <div className="flex items-center gap-1.5 justify-end">
          <div className="hidden sm:flex items-center gap-1.5">
            {student.kosherFood && (
              <Badge variant="outline" className="text-xs gap-1 border-green-200 text-green-700 dark:border-green-800 dark:text-green-400">
                <UtensilsCrossed className="h-3 w-3" />
                Kosher
              </Badge>
            )}
            {student.needCarSeat && (
              <Baby className="h-4 w-4 text-amber-500 dark:text-amber-400" />
            )}
            {student.driverRefId != null && (
              <Car className="h-4 w-4 text-blue-500 dark:text-blue-400" />
            )}
          </div>
          <ChevronDown
            className={cn(
              "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
              expanded && "rotate-180"
            )}
          />
        </div>
      </button>

      {/* Expanded details */}
      {expanded && (
        <div className="border-t border-border px-4 py-3">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <span className="text-sm text-foreground break-all">{student.email}</span>
            <span className="text-sm text-foreground">{student.phone || "\u2014"}</span>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatDate(student.registeredOn)}
            </span>

            {student.interests && (
              <div className="flex flex-wrap items-center gap-1.5">
                {student.interests.split(/[,;]+/).map((t) => t.trim()).filter(Boolean).map((tag) => (
                  <span key={tag} className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-foreground">
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Mobile badges */}
            <div className="flex items-center gap-1.5 md:hidden">
              {student.kosherFood && (
                <Badge variant="outline" className="text-xs gap-1 border-green-200 text-green-700 dark:border-green-800 dark:text-green-400">
                  Kosher
                </Badge>
              )}
              {student.needCarSeat && (
                <Baby className="h-4 w-4 text-amber-500 dark:text-amber-400" />
              )}
              {student.driverRefId != null && (
                <Car className="h-4 w-4 text-blue-500 dark:text-blue-400" />
              )}
            </div>

            <div className="ml-auto flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => navigate(`/students/${student.id}`)}
              >
                <Pencil className="mr-1 h-3.5 w-3.5" />
                Edit
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                onClick={() => {
                  if (window.confirm(`Delete student "${student.fullname}"?`)) {
                    onDelete(student.id);
                  }
                }}
              >
                <Trash2 className="mr-1 h-3.5 w-3.5" />
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


// ---------------------------------------------------------------------------
// Duplicate set panel — the matched students shown together, details open, so
// the differences are visible without expanding each row separately
// ---------------------------------------------------------------------------

function DuplicateGroupPanel({
  group,
  onDelete,
}: {
  group: DuplicateGroup;
  onDelete: (id: number) => void;
}) {
  return (
    <div className="rounded-xl border border-red-300 bg-red-50/60 p-3 dark:border-red-900/60 dark:bg-red-950/20">
      <div className="mb-2 flex items-center gap-2 px-1">
        <CopyCheck className="h-4 w-4 shrink-0 text-red-600 dark:text-red-400" />
        <p className="text-xs font-medium text-red-700 dark:text-red-300">
          {group.members.length} records share the same {group.fields.join(" and ")}
        </p>
        <span className="text-xs text-muted-foreground">
          &middot; oldest first &mdash; delete the extras
        </span>
      </div>
      <div className="space-y-2">
        {group.members.map((student) => (
          <StudentCard
            key={student.id}
            student={student}
            defaultExpanded
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------

function CardSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-28" />
            </div>
            <Skeleton className="hidden h-4 w-20 sm:block" />
            <Skeleton className="hidden h-4 w-20 md:block" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sort options
// ---------------------------------------------------------------------------

type SortKey = "fullname" | "country" | "university" | "displayId";

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "fullname", label: "Name" },
  { key: "displayId", label: "Display ID" },
  { key: "country", label: "Country" },
  { key: "university", label: "University" },
];

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export function StudentsPage() {
  const queryClient = useQueryClient();
  const { data: students, isLoading, isError, error, refetch } = useStudents();
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("fullname");
  const [sortDesc, setSortDesc] = useState(false);
  const [dupsOnly, setDupsOnly] = useState(false);

  // Computed over every student, not the filtered list, so the count stays
  // accurate while a search is active
  const { flags: duplicates, groups: duplicateGroups } = useMemo(
    () => findDuplicates(students ?? []),
    [students]
  );

  // In duplicates-only mode a search keeps whole sets, so both sides of a
  // match stay visible even when only one of them matches the query
  const visibleGroups = useMemo(() => {
    if (!search.trim()) return duplicateGroups;
    const q = search.toLowerCase();
    return duplicateGroups.filter((g) =>
      g.members.some(
        (s) =>
          s.fullname?.toLowerCase().includes(q) ||
          s.email?.toLowerCase().includes(q) ||
          s.country?.toLowerCase().includes(q) ||
          s.university?.toLowerCase().includes(q) ||
          s.displayId?.toLowerCase().includes(q) ||
          s.major?.toLowerCase().includes(q)
      )
    );
  }, [duplicateGroups, search]);

  const handleSort = useCallback(
    (key: SortKey) => {
      if (sortKey === key) {
        setSortDesc((prev) => !prev);
      } else {
        setSortKey(key);
        setSortDesc(false);
      }
    },
    [sortKey]
  );

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.deleteStudent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
    },
  });

  const filtered = useMemo(() => {
    if (!students) return [];
    let list = students;

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (s) =>
          s.fullname?.toLowerCase().includes(q) ||
          s.email?.toLowerCase().includes(q) ||
          s.country?.toLowerCase().includes(q) ||
          s.university?.toLowerCase().includes(q) ||
          s.displayId?.toLowerCase().includes(q) ||
          s.major?.toLowerCase().includes(q)
      );
    }

    list = [...list].sort((a, b) => {
      let aVal: string | number = "";
      let bVal: string | number = "";

      if (sortKey === "displayId") {
        aVal = parseInt((a.displayId || "").split("-").pop() || "0");
        bVal = parseInt((b.displayId || "").split("-").pop() || "0");
      } else {
        aVal = ((a as Record<string, unknown>)[sortKey] as string || "").toLowerCase();
        bVal = ((b as Record<string, unknown>)[sortKey] as string || "").toLowerCase();
      }

      if (aVal < bVal) return sortDesc ? 1 : -1;
      if (aVal > bVal) return sortDesc ? -1 : 1;
      return 0;
    });

    return list;
  }, [students, search, sortKey, sortDesc]);

  return (
    <div className="flex h-screen flex-col">
      {/* Sticky header area */}
      <div className="shrink-0 bg-background">
        <Container className="pt-8">
          {/* Header */}
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <GraduationCap className="h-5 w-5" />
              </div>
              <h1 className="font-heading text-2xl text-foreground">Students</h1>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => students && exportStudentsToExcel(students)}
                disabled={!students?.length}
              >
                <Download className="mr-1 h-4 w-4" />
                Download
              </Button>
            </div>
          </div>

          {/* Stats */}
          {!isLoading && students && <StudentStats students={students} />}

          {/* Search + Sort */}
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, email, country, university, ID..."
                className="pl-9"
              />
            </div>
            <div className="flex items-center gap-1 overflow-x-auto">
              <Button
                variant="outline"
                size="sm"
                aria-pressed={dupsOnly}
                disabled={duplicateGroups.length === 0}
                onClick={() => setDupsOnly((v) => !v)}
                className={cn(
                  "text-xs h-8 px-2.5 mr-2 shrink-0",
                  duplicateGroups.length > 0 &&
                    (dupsOnly
                      ? "border-red-500 bg-red-500 text-white hover:bg-red-600 hover:text-white"
                      : "border-red-300 text-red-700 hover:bg-red-50 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950/40")
                )}
              >
                <CopyCheck className="mr-1 h-3.5 w-3.5" />
                Duplicates
                <span className="ml-1 font-semibold">{duplicateGroups.length}</span>
              </Button>
              {!dupsOnly && (
                <>
                  <span className="text-xs text-muted-foreground whitespace-nowrap mr-1">Sort by</span>
                  {SORT_OPTIONS.map((opt) => (
                    <Button
                      key={opt.key}
                      variant={sortKey === opt.key ? "default" : "outline"}
                      size="sm"
                      className="text-xs h-8 px-2.5"
                      onClick={() => handleSort(opt.key)}
                    >
                      {opt.label}
                      {sortKey === opt.key && (
                        <span className="ml-1">{sortDesc ? "\u2193" : "\u2191"}</span>
                      )}
                    </Button>
                  ))}
                </>
              )}
            </div>
          </div>
        </Container>
      </div>

      {/* Scrollable list */}
      <div className="min-h-0 flex-1 overflow-y-auto pb-8">
        <Container>
          {!isLoading && !isError && filtered.length > 0 && <ColumnHeader />}
          {isLoading ? (
            <CardSkeleton />
          ) : isError ? (
            <QueryError error={error} onRetry={() => refetch()} label="students" />
          ) : dupsOnly ? (
            visibleGroups.length === 0 ? (
              <div className="rounded-xl border border-border bg-card py-16 text-center text-muted-foreground">
                {search
                  ? "No duplicate sets match your search."
                  : "No duplicate students found."}
              </div>
            ) : (
              <div className="space-y-4">
                {visibleGroups.map((group) => (
                  <DuplicateGroupPanel
                    key={group.key}
                    group={group}
                    onDelete={(id) => deleteMutation.mutate(id)}
                  />
                ))}
              </div>
            )
          ) : filtered.length === 0 ? (
            <div className="rounded-xl border border-border bg-card py-16 text-center text-muted-foreground">
              {search ? "No students match your search." : "No students yet."}
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((student) => (
                <StudentCard
                  key={student.id}
                  student={student}
                  duplicateOf={duplicates.get(student.id)}
                  onDelete={(id) => deleteMutation.mutate(id)}
                />
              ))}
            </div>
          )}
        </Container>
      </div>
    </div>
  );
}
