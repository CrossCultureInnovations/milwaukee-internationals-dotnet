import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Car,
  Search,
  ChevronDown,
  Pencil,
  Trash2,
  Baby,
  Home,
  Download,
  Mail,
  Phone,
  Users as UsersIcon,
  Calendar,
  Navigation,
} from "lucide-react";
import { Container } from "../../components/layout/Container";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import { Skeleton } from "../../components/ui/skeleton";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "../../components/ui/select";
import { useDrivers } from "../../lib/hooks/useApiQueries";
import { api, type Driver, type RolesEnum } from "../../api";
import { cn } from "../../lib/utils";
import { exportDriversToExcel } from "../../lib/export";

// ---------------------------------------------------------------------------
// Summary stats
// ---------------------------------------------------------------------------

function DriverStats({ drivers }: { drivers: Driver[] }) {
  const total = drivers.length;
  const present = drivers.filter((d) => d.isPresent).length;
  const assigned = drivers.reduce((s, d) => s + (d.students?.length ?? 0), 0);
  const capacity = drivers.reduce((s, d) => s + d.capacity, 0);
  const childSeats = drivers.filter((d) => d.haveChildSeat).length;
  const navigators = drivers.filter((d) => d.role === "Navigator").length;

  const stats = [
    { label: "Drivers", value: total },
    { label: "Present", value: present },
    { label: "Assigned", value: assigned },
    { label: "Capacity", value: capacity },
    { label: "Child Seats", value: childSeats },
    { label: "Navigators", value: navigators },
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
// Grid row class shared by all cards
// ---------------------------------------------------------------------------

const ROW_GRID = cn(
  "grid items-center gap-x-3 px-4",
  "grid-cols-[3rem_1fr_auto]",
  "sm:grid-cols-[3rem_1fr_10rem_18rem]",
);

// ---------------------------------------------------------------------------
// Detail item
// ---------------------------------------------------------------------------

function DetailItem({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm text-foreground break-all">{value}</p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Driver card
// ---------------------------------------------------------------------------

function DriverCard({ driver, onDelete }: { driver: Driver; onDelete: (id: number) => void }) {
  const [expanded, setExpanded] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="rounded-xl border border-border bg-card transition-shadow hover:shadow-md">
      {/* Main row */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className={cn(ROW_GRID, "w-full py-3 text-left")}
      >
        {/* ID */}
        <div className={cn(
          "flex h-9 w-9 mx-auto shrink-0 items-center justify-center rounded-full",
          driver.isPresent
            ? "bg-green-500/15 text-green-600 dark:text-green-400"
            : "bg-muted text-muted-foreground"
        )}>
          <span className="text-xs font-bold">{driver.displayId?.split("-").pop() || "#"}</span>
        </div>

        {/* Name + Role */}
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
            <span className="truncate">{driver.fullname}</span>
            <Badge variant={driver.role === "Driver" ? "default" : "secondary"} className="text-[10px] px-1.5 py-0">
              {driver.role}
            </Badge>
          </p>
          <p className="truncate text-xs text-muted-foreground">
            Capacity: {driver.capacity}
            {driver.navigator && ` · Nav: ${driver.navigator}`}
          </p>
        </div>

        {/* Host */}
        <p className="hidden sm:block truncate text-sm text-foreground">
          {driver.host ? (
            <span className="flex items-center gap-1">
              <Home className="h-3 w-3 text-muted-foreground" />
              {driver.host.fullname}
            </span>
          ) : "\u2014"}
        </p>

        {/* Icons + Chevron */}
        <div className="flex items-center gap-1.5 justify-end">
          <div className="hidden sm:flex items-center gap-1.5">
            {driver.haveChildSeat && (
              <Baby className="h-4 w-4 text-amber-500 dark:text-amber-400" />
            )}
            {driver.requireNavigator && (
              <Navigation className="h-4 w-4 text-purple-500 dark:text-purple-400" />
            )}
            {driver.students && driver.students.length > 0 && (
              <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                <UsersIcon className="h-3.5 w-3.5" />
                {driver.students.length}
              </span>
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
        <div className="border-t border-border px-4 py-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <DetailItem icon={Mail} label="Email" value={driver.email} />
            <DetailItem icon={Phone} label="Phone" value={driver.phone || "\u2014"} />
            <DetailItem icon={Calendar} label="Registered" value={formatDate(driver.registeredOn)} />
            {driver.navigator && (
              <DetailItem icon={Navigation} label="Navigator" value={driver.navigator} />
            )}
          </div>

          {/* Assigned students */}
          {driver.students && driver.students.length > 0 && (
            <div className="mt-3">
              <p className="mb-1.5 text-xs text-muted-foreground flex items-center gap-1.5">
                <UsersIcon className="h-3.5 w-3.5" /> Assigned Students ({driver.students.length})
              </p>
              <div className="flex flex-wrap gap-1.5">
                {driver.students.map((s) => (
                  <span key={s.id} className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-foreground">
                    {s.fullname}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Mobile icons */}
          <div className="mt-3 flex flex-wrap items-center gap-2 md:hidden">
            {driver.haveChildSeat && (
              <Baby className="h-4 w-4 text-amber-500 dark:text-amber-400" />
            )}
            {driver.requireNavigator && (
              <Navigation className="h-4 w-4 text-purple-500 dark:text-purple-400" />
            )}
          </div>

          {/* Actions */}
          <div className="mt-4 flex items-center gap-2 border-t border-border/50 pt-3">
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate(`/drivers/${driver.id}`)}
            >
              <Pencil className="mr-1 h-3.5 w-3.5" />
              Edit
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
              onClick={() => {
                if (window.confirm(`Delete driver "${driver.fullname}"?`)) {
                  onDelete(driver.id);
                }
              }}
            >
              <Trash2 className="mr-1 h-3.5 w-3.5" />
              Delete
            </Button>
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
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// DriversPage
// ---------------------------------------------------------------------------

export function DriversPage() {
  const queryClient = useQueryClient();
  const { data: drivers, isLoading } = useDrivers();

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.deleteDriver(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drivers"] });
    },
  });

  const filtered = useMemo(() => {
    if (!drivers) return [];
    const q = search.toLowerCase();
    return drivers.filter((d) => {
      const matchesSearch =
        !q ||
        d.fullname.toLowerCase().includes(q) ||
        d.email.toLowerCase().includes(q) ||
        d.phone?.toLowerCase().includes(q) ||
        d.displayId?.toLowerCase().includes(q);
      const matchesRole = roleFilter === "all" || d.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [drivers, search, roleFilter]);

  return (
    <Container className="py-8">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Car className="h-5 w-5" />
          </div>
          <h1 className="font-heading text-2xl text-foreground">Drivers</h1>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => drivers && exportDriversToExcel(drivers)}
          disabled={!drivers?.length}
        >
          <Download className="mr-1 h-4 w-4" />
          Export
        </Button>
      </div>

      {/* Stats */}
      {!isLoading && drivers && <DriverStats drivers={drivers} />}

      {/* Search & filters */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, phone, ID..."
            className="pl-9"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All roles</SelectItem>
            <SelectItem value="Driver">Driver</SelectItem>
            <SelectItem value="Navigator">Navigator</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Driver cards */}
      {isLoading ? (
        <CardSkeleton />
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-border bg-card py-16 text-center text-muted-foreground">
          {search || roleFilter !== "all"
            ? "No drivers match your filters."
            : "No drivers registered yet."}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((driver) => (
            <DriverCard
              key={driver.id}
              driver={driver}
              onDelete={(id) => deleteMutation.mutate(id)}
            />
          ))}
        </div>
      )}
    </Container>
  );
}
