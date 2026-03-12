import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Car,
  Search,
  Plus,
  Check,
  X,
  Baby,
  Home,
  Download,
} from "lucide-react";
import { Container } from "../../components/layout/Container";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import { Skeleton } from "../../components/ui/skeleton";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "../../components/ui/table";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "../../components/ui/select";
import { Checkbox } from "../../components/ui/checkbox";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetClose,
} from "../../components/ui/sheet";
import { useDrivers } from "../../lib/hooks/useApiQueries";
import { api, type RolesEnum } from "../../api";
import { cn } from "../../lib/utils";
import { exportDriversToExcel } from "../../lib/export";

// ---------------------------------------------------------------------------
// Create driver form schema
// ---------------------------------------------------------------------------

const createDriverSchema = z.object({
  fullname: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email required"),
  phone: z.string().min(1, "Phone is required"),
  capacity: z.coerce.number().int().min(1, "Capacity must be at least 1"),
  role: z.enum(["Driver", "Navigator"] as const),
  navigator: z.string().optional(),
  requireNavigator: z.boolean().optional(),
  haveChildSeat: z.boolean().optional(),
});

type CreateDriverForm = z.infer<typeof createDriverSchema>;

// ---------------------------------------------------------------------------
// DriversPage
// ---------------------------------------------------------------------------

export function DriversPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: drivers, isLoading } = useDrivers();

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [sheetOpen, setSheetOpen] = useState(false);

  // --- filtered list ---
  const filtered = useMemo(() => {
    if (!drivers) return [];
    const q = search.toLowerCase();
    return drivers.filter((d) => {
      const matchesSearch =
        !q ||
        d.fullname.toLowerCase().includes(q) ||
        d.email.toLowerCase().includes(q);
      const matchesRole = roleFilter === "all" || d.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [drivers, search, roleFilter]);

  // --- create mutation ---
  const createMutation = useMutation({
    mutationFn: (payload: CreateDriverForm) => api.createDriver(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drivers"] });
      setSheetOpen(false);
      form.reset();
    },
  });

  // --- form ---
  const form = useForm<CreateDriverForm>({
    resolver: zodResolver(createDriverSchema),
    defaultValues: {
      fullname: "",
      email: "",
      phone: "",
      capacity: 4,
      role: "Driver",
      navigator: "",
      requireNavigator: false,
      haveChildSeat: false,
    },
  });

  const onSubmit = (values: CreateDriverForm) => {
    createMutation.mutate(values);
  };

  // --- render ---
  return (
    <Container className="py-8">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Car className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-heading text-2xl text-foreground">Drivers</h1>
            {!isLoading && (
              <p className="text-sm text-muted-foreground">
                {drivers?.length ?? 0} total &middot; {drivers?.filter((d) => d.isPresent).length ?? 0} present
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => drivers && exportDriversToExcel(drivers)}
            disabled={!drivers?.length}
          >
            <Download className="mr-1 h-4 w-4" />
            Export
          </Button>
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Driver
              </Button>
            </SheetTrigger>
            <SheetContent className="overflow-y-auto sm:max-w-lg">
            <h2 className="mb-6 text-lg font-semibold text-foreground">
              Add Driver
            </h2>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">
                  Full name
                </label>
                <Input {...form.register("fullname")} placeholder="Jane Doe" />
                {form.formState.errors.fullname && (
                  <p className="mt-1 text-xs text-destructive">
                    {form.formState.errors.fullname.message}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">
                  Email
                </label>
                <Input {...form.register("email")} type="email" placeholder="jane@example.com" />
                {form.formState.errors.email && (
                  <p className="mt-1 text-xs text-destructive">
                    {form.formState.errors.email.message}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">
                  Phone
                </label>
                <Input {...form.register("phone")} placeholder="(414) 555-0100" />
                {form.formState.errors.phone && (
                  <p className="mt-1 text-xs text-destructive">
                    {form.formState.errors.phone.message}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">
                  Capacity
                </label>
                <Input {...form.register("capacity")} type="number" min={1} />
                {form.formState.errors.capacity && (
                  <p className="mt-1 text-xs text-destructive">
                    {form.formState.errors.capacity.message}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">
                  Role
                </label>
                <Controller
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Driver">Driver</SelectItem>
                        <SelectItem value="Navigator">Navigator</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">
                  Navigator name
                </label>
                <Input {...form.register("navigator")} placeholder="Optional" />
              </div>

              <div className="flex items-center gap-2">
                <Controller
                  control={form.control}
                  name="requireNavigator"
                  render={({ field }) => (
                    <Checkbox
                      id="requireNavigator"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
                <label htmlFor="requireNavigator" className="text-sm text-foreground">
                  Requires navigator
                </label>
              </div>

              <div className="flex items-center gap-2">
                <Controller
                  control={form.control}
                  name="haveChildSeat"
                  render={({ field }) => (
                    <Checkbox
                      id="haveChildSeat"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
                <label htmlFor="haveChildSeat" className="text-sm text-foreground">
                  Has child seat
                </label>
              </div>

              {createMutation.isError && (
                <p className="text-sm text-destructive">
                  {(createMutation.error as Error).message ?? "Failed to create driver"}
                </p>
              )}

              <div className="flex gap-2 pt-2">
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Creating..." : "Create Driver"}
                </Button>
                <SheetClose asChild>
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </SheetClose>
              </div>
            </form>
          </SheetContent>
        </Sheet>
        </div>
      </div>

      {/* Search & filters */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
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

      {/* Table */}
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead className="hidden md:table-cell">Phone</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="hidden sm:table-cell">Capacity</TableHead>
              <TableHead className="hidden lg:table-cell">Child Seat</TableHead>
              <TableHead className="hidden sm:table-cell">Present</TableHead>
              <TableHead className="hidden lg:table-cell">Host</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading &&
              Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 8 }).map((__, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-5 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}

            {!isLoading && filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="py-12 text-center text-muted-foreground">
                  {search || roleFilter !== "all"
                    ? "No drivers match your filters."
                    : "No drivers registered yet."}
                </TableCell>
              </TableRow>
            )}

            {filtered.map((driver) => (
              <TableRow
                key={driver.id}
                className="cursor-pointer transition-colors hover:bg-accent/50"
                onClick={() => navigate(`/drivers/${driver.id}`)}
              >
                <TableCell className="font-medium text-foreground">
                  {driver.fullname}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {driver.email}
                </TableCell>
                <TableCell className="hidden text-muted-foreground md:table-cell">
                  {driver.phone}
                </TableCell>
                <TableCell>
                  <Badge variant={driver.role === "Driver" ? "default" : "secondary"}>
                    {driver.role}
                  </Badge>
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  {driver.capacity}
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  {driver.haveChildSeat ? (
                    <Baby className="h-4 w-4 text-primary" />
                  ) : (
                    <span className="text-muted-foreground">&mdash;</span>
                  )}
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  {driver.isPresent ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <X className="h-4 w-4 text-muted-foreground/50" />
                  )}
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  {driver.host ? (
                    <span className="flex items-center gap-1 text-sm text-foreground">
                      <Home className="h-3 w-3 text-muted-foreground" />
                      {driver.host.fullname}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">&mdash;</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Container>
  );
}
