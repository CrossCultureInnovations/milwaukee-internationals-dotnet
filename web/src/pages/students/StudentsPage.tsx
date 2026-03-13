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
} from "lucide-react";
import { Container } from "../../components/layout/Container";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import { Skeleton } from "../../components/ui/skeleton";
import { useStudents } from "../../lib/hooks/useApiQueries";
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

function StudentCard({ student, onDelete }: { student: Student; onDelete: (id: number) => void }) {
  const [expanded, setExpanded] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="rounded-xl border border-border bg-card transition-shadow hover:shadow-md">
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
  const { data: students, isLoading } = useStudents();
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("fullname");
  const [sortDesc, setSortDesc] = useState(false);

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
            </div>
          </div>
        </Container>
      </div>

      {/* Scrollable list */}
      <div className="min-h-0 flex-1 overflow-y-auto pb-8">
        <Container>
          {!isLoading && filtered.length > 0 && <ColumnHeader />}
          {isLoading ? (
            <CardSkeleton />
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
