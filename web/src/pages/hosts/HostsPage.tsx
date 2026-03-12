import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import {
  Home,
  Search,
  Plus,
  Mail,
  Phone,
  MapPin,
  Car,
  Download,
  ChevronDown,
  Pencil,
  Trash2,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Skeleton } from "../../components/ui/skeleton";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetClose,
} from "../../components/ui/sheet";
import { Container } from "../../components/layout/Container";
import { useHosts } from "../../lib/hooks/useApiQueries";
import { api, type Host } from "../../api";
import { exportHostsToExcel } from "../../lib/export";
import { cn } from "../../lib/utils";

// ---------------------------------------------------------------------------
// Create host form (kept since hosts are added by admin)
// ---------------------------------------------------------------------------

const hostSchema = z.object({
  fullname: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(1, "Phone is required"),
  address: z.string().min(1, "Address is required"),
});

type HostFormValues = z.infer<typeof hostSchema>;

// ---------------------------------------------------------------------------
// Summary stats
// ---------------------------------------------------------------------------

function HostStats({ hosts }: { hosts: Host[] }) {
  const total = hosts.length;
  const totalDrivers = hosts.reduce((s, h) => s + (h.drivers?.length ?? 0), 0);
  const withDrivers = hosts.filter((h) => h.drivers && h.drivers.length > 0).length;
  const noDrivers = total - withDrivers;

  const stats = [
    { label: "Hosts", value: total },
    { label: "Assigned Drivers", value: totalDrivers },
    { label: "With Drivers", value: withDrivers },
    { label: "Unassigned", value: noDrivers },
  ];

  return (
    <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
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
// Grid row class shared by all cards
// ---------------------------------------------------------------------------

const ROW_GRID = cn(
  "grid items-center gap-x-3 px-4",
  "grid-cols-[2.5rem_1fr_auto]",
  "sm:grid-cols-[2.5rem_1fr_1fr_auto]",
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
// Host card
// ---------------------------------------------------------------------------

function HostCard({ host, onDelete }: { host: Host; onDelete: (id: number) => void }) {
  const [expanded, setExpanded] = useState(false);
  const driverCount = host.drivers?.length ?? 0;

  return (
    <div className="rounded-xl border border-border bg-card transition-shadow hover:shadow-md">
      {/* Main row */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className={cn(ROW_GRID, "w-full py-3 text-left")}
      >
        {/* Icon */}
        <div className={cn(
          "flex h-9 w-9 mx-auto shrink-0 items-center justify-center rounded-full",
          driverCount > 0
            ? "bg-green-500/15 text-green-600 dark:text-green-400"
            : "bg-muted text-muted-foreground"
        )}>
          <Home className="h-4 w-4" />
        </div>

        {/* Name + Address */}
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
            <span className="truncate">{host.fullname}</span>
            {driverCount > 0 && (
              <span className="flex shrink-0 items-center gap-0.5 text-xs font-normal text-muted-foreground">
                <Car className="h-3 w-3" />
                {driverCount}
              </span>
            )}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {host.address || "\u2014"}
          </p>
        </div>

        {/* Email + Phone (desktop) */}
        <div className="hidden sm:block min-w-0">
          <p className="truncate text-sm text-foreground">{host.email}</p>
          <p className="truncate text-xs text-muted-foreground">{host.phone || "\u2014"}</p>
        </div>

        {/* Chevron */}
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
            expanded && "rotate-180"
          )}
        />
      </button>

      {/* Expanded details */}
      {expanded && (
        <div className="border-t border-border px-4 py-4">
          {/* Assigned drivers */}
          {host.drivers && host.drivers.length > 0 && (
            <div className="mt-3">
              <p className="mb-1.5 text-xs text-muted-foreground flex items-center gap-1.5">
                <Car className="h-3.5 w-3.5" /> Assigned Drivers ({host.drivers.length})
              </p>
              <div className="flex flex-wrap gap-1.5">
                {host.drivers.map((d) => (
                  <span key={d.id} className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-foreground">
                    {d.fullname}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="mt-4 flex items-center gap-2 border-t border-border/50 pt-3">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {/* TODO: inline edit */}}
            >
              <Pencil className="mr-1 h-3.5 w-3.5" />
              Edit
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
              onClick={() => {
                if (window.confirm(`Delete host "${host.fullname}"?`)) {
                  onDelete(host.id);
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
              <Skeleton className="h-3 w-56" />
            </div>
            <Skeleton className="hidden h-4 w-32 sm:block" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// HostsPage
// ---------------------------------------------------------------------------

export function HostsPage() {
  const queryClient = useQueryClient();
  const { data: hosts, isLoading } = useHosts();
  const [search, setSearch] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.deleteHost(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hosts"] });
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<HostFormValues>({
    resolver: zodResolver(hostSchema),
    defaultValues: { fullname: "", email: "", phone: "", address: "" },
  });

  const createMutation = useMutation({
    mutationFn: (values: HostFormValues) => api.createHost(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hosts"] });
      reset();
      setSheetOpen(false);
    },
  });

  const filtered = useMemo(() => {
    if (!hosts) return [];
    if (!search.trim()) return hosts;
    const q = search.toLowerCase();
    return hosts.filter(
      (h) =>
        h.fullname.toLowerCase().includes(q) ||
        h.email.toLowerCase().includes(q) ||
        h.address.toLowerCase().includes(q) ||
        h.phone?.toLowerCase().includes(q)
    );
  }, [hosts, search]);

  return (
    <Container className="py-8">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Home className="h-5 w-5" />
          </div>
          <h1 className="font-heading text-2xl text-foreground">Hosts</h1>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => hosts && exportHostsToExcel(hosts)}
            disabled={!hosts?.length}
          >
            <Download className="mr-1 h-4 w-4" />
            Export
          </Button>
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <Button size="sm">
                <Plus className="mr-1 h-4 w-4" />
                Add Host
              </Button>
            </SheetTrigger>
            <SheetContent>
              <h2 className="mb-6 text-lg font-semibold text-foreground">New Host</h2>
              <form onSubmit={handleSubmit((v) => createMutation.mutate(v))} className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm text-muted-foreground">Full Name</label>
                  <Input {...register("fullname")} placeholder="Jane Smith" />
                  {errors.fullname && <p className="mt-1 text-xs text-destructive">{errors.fullname.message}</p>}
                </div>
                <div>
                  <label className="mb-1 block text-sm text-muted-foreground">Email</label>
                  <Input {...register("email")} type="email" placeholder="jane@example.com" />
                  {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>}
                </div>
                <div>
                  <label className="mb-1 block text-sm text-muted-foreground">Phone</label>
                  <Input {...register("phone")} type="tel" placeholder="(414) 555-0100" />
                  {errors.phone && <p className="mt-1 text-xs text-destructive">{errors.phone.message}</p>}
                </div>
                <div>
                  <label className="mb-1 block text-sm text-muted-foreground">Address</label>
                  <Input {...register("address")} placeholder="123 Main St, Milwaukee, WI" />
                  {errors.address && <p className="mt-1 text-xs text-destructive">{errors.address.message}</p>}
                </div>
                {createMutation.isError && (
                  <p className="text-xs text-destructive">{(createMutation.error as Error).message || "Failed to create host"}</p>
                )}
                <div className="flex gap-2 pt-2">
                  <Button type="submit" size="sm" disabled={createMutation.isPending}>
                    {createMutation.isPending ? "Creating..." : "Create Host"}
                  </Button>
                  <SheetClose asChild>
                    <Button type="button" variant="ghost" size="sm">Cancel</Button>
                  </SheetClose>
                </div>
              </form>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Stats */}
      {!isLoading && hosts && <HostStats hosts={hosts} />}

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email, address, phone..."
          className="pl-9"
        />
      </div>

      {/* Host cards */}
      {isLoading ? (
        <CardSkeleton />
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-border bg-card py-16 text-center text-muted-foreground">
          {search ? "No hosts match your search." : "No hosts yet."}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((host) => (
            <HostCard
              key={host.id}
              host={host}
              onDelete={(id) => deleteMutation.mutate(id)}
            />
          ))}
        </div>
      )}
    </Container>
  );
}
