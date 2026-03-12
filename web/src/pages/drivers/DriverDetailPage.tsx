import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Mail,
  Phone,
  Users,
  Pencil,
  Trash2,
  Car,
  Home,
  Check,
  X,
  Baby,
  GraduationCap,
} from "lucide-react";
import { Container } from "../../components/layout/Container";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import { Skeleton } from "../../components/ui/skeleton";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../../components/ui/card";
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
import { useDriver } from "../../lib/hooks/useApiQueries";
import { api } from "../../api";
import { cn } from "../../lib/utils";

// ---------------------------------------------------------------------------
// Edit form schema
// ---------------------------------------------------------------------------

const editDriverSchema = z.object({
  fullname: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email required"),
  phone: z.string().min(1, "Phone is required"),
  capacity: z.coerce.number().int().min(1, "Capacity must be at least 1"),
  role: z.enum(["Driver", "Navigator"] as const),
  navigator: z.string().optional(),
  requireNavigator: z.boolean().optional(),
  haveChildSeat: z.boolean().optional(),
});

type EditDriverForm = z.infer<typeof editDriverSchema>;

// ---------------------------------------------------------------------------
// DriverDetailPage
// ---------------------------------------------------------------------------

export function DriverDetailPage() {
  const { id } = useParams<{ id: string }>();
  const driverId = Number(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: driver, isLoading, error } = useDriver(driverId);
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // --- mutations ---
  const updateMutation = useMutation({
    mutationFn: (payload: EditDriverForm) => api.updateDriver(driverId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drivers", driverId] });
      queryClient.invalidateQueries({ queryKey: ["drivers"] });
      setEditing(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.deleteDriver(driverId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drivers"] });
      navigate("/drivers");
    },
  });

  // --- form ---
  const form = useForm<EditDriverForm>({
    resolver: zodResolver(editDriverSchema),
    values: driver
      ? {
          fullname: driver.fullname,
          email: driver.email,
          phone: driver.phone,
          capacity: driver.capacity,
          role: driver.role,
          navigator: driver.navigator ?? "",
          requireNavigator: driver.requireNavigator,
          haveChildSeat: driver.haveChildSeat,
        }
      : undefined,
  });

  const onSubmit = (values: EditDriverForm) => {
    updateMutation.mutate(values);
  };

  // --- loading state ---
  if (isLoading) {
    return (
      <Container className="py-8">
        <Skeleton className="mb-6 h-8 w-48" />
        <div className="space-y-4">
          <Skeleton className="h-64 w-full rounded-lg" />
          <Skeleton className="h-48 w-full rounded-lg" />
        </div>
      </Container>
    );
  }

  if (error || !driver) {
    return (
      <Container className="py-8">
        <Link
          to="/drivers"
          className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to drivers
        </Link>
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Driver not found.
          </CardContent>
        </Card>
      </Container>
    );
  }

  return (
    <Container className="py-8">
      {/* Back link */}
      <Link
        to="/drivers"
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to drivers
      </Link>

      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Car className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-heading text-2xl text-foreground">{driver.fullname}</h1>
            <p className="text-sm text-muted-foreground">
              {driver.displayId} &middot; Registered{" "}
              {new Date(driver.registeredOn).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          {!editing && (
            <Button variant="outline" onClick={() => setEditing(true)}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Button>
          )}
          {!confirmDelete ? (
            <Button variant="outline" className="text-destructive hover:bg-destructive/10" onClick={() => setConfirmDelete(true)}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-sm text-destructive">Confirm?</span>
              <Button
                size="sm"
                variant="outline"
                className="text-destructive hover:bg-destructive/10"
                onClick={() => deleteMutation.mutate()}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? "Deleting..." : "Yes, delete"}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setConfirmDelete(false)}>
                Cancel
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main info card */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Driver Details</CardTitle>
          </CardHeader>
          <CardContent>
            {editing ? (
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-foreground">
                      Full name
                    </label>
                    <Input {...form.register("fullname")} />
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
                    <Input {...form.register("email")} type="email" />
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
                    <Input {...form.register("phone")} />
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
                      Navigator
                    </label>
                    <Input {...form.register("navigator")} placeholder="Optional" />
                  </div>
                </div>

                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-2">
                    <Controller
                      control={form.control}
                      name="requireNavigator"
                      render={({ field }) => (
                        <Checkbox
                          id="edit-requireNavigator"
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      )}
                    />
                    <label htmlFor="edit-requireNavigator" className="text-sm text-foreground">
                      Requires navigator
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Controller
                      control={form.control}
                      name="haveChildSeat"
                      render={({ field }) => (
                        <Checkbox
                          id="edit-haveChildSeat"
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      )}
                    />
                    <label htmlFor="edit-haveChildSeat" className="text-sm text-foreground">
                      Has child seat
                    </label>
                  </div>
                </div>

                {updateMutation.isError && (
                  <p className="text-sm text-destructive">
                    {(updateMutation.error as Error).message ?? "Failed to update driver"}
                  </p>
                )}

                <div className="flex gap-2 pt-2">
                  <Button type="submit" disabled={updateMutation.isPending}>
                    {updateMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setEditing(false);
                      form.reset();
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-foreground">{driver.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-foreground">{driver.phone}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Badge variant={driver.role === "Driver" ? "default" : "secondary"}>
                    {driver.role}
                  </Badge>
                  <Badge variant="outline">
                    <Users className="mr-1 h-3 w-3" />
                    Capacity: {driver.capacity}
                  </Badge>
                  {driver.isPresent ? (
                    <Badge variant="outline" className="border-green-200 bg-green-50 text-green-700">
                      <Check className="mr-1 h-3 w-3" />
                      Present
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground">
                      <X className="mr-1 h-3 w-3" />
                      Not present
                    </Badge>
                  )}
                  {driver.haveChildSeat && (
                    <Badge variant="outline">
                      <Baby className="mr-1 h-3 w-3" />
                      Child seat
                    </Badge>
                  )}
                  {driver.requireNavigator && (
                    <Badge variant="outline">Needs navigator</Badge>
                  )}
                </div>

                {driver.navigator && (
                  <div className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">Navigator:</span>{" "}
                    {driver.navigator}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Host info sidebar */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Home className="h-4 w-4 text-primary" />
              Assigned Host
            </CardTitle>
          </CardHeader>
          <CardContent>
            {driver.host ? (
              <div className="space-y-2">
                <p className="font-medium text-foreground">{driver.host.fullname}</p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-3 w-3" />
                  {driver.host.email}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-3 w-3" />
                  {driver.host.phone}
                </div>
                {driver.host.address && (
                  <p className="text-sm text-muted-foreground">{driver.host.address}</p>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No host assigned yet.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Students list */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-primary" />
            Assigned Students
            {driver.students.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {driver.students.length}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {driver.students.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No students assigned to this driver.
            </p>
          ) : (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="hidden sm:table-cell">Phone</TableHead>
                    <TableHead className="hidden md:table-cell">Country</TableHead>
                    <TableHead className="hidden md:table-cell">University</TableHead>
                    <TableHead>Present</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {driver.students.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium text-foreground">
                        {student.fullname}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {student.email}
                      </TableCell>
                      <TableCell className="hidden text-muted-foreground sm:table-cell">
                        {student.phone}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {student.country || <span className="text-muted-foreground">&mdash;</span>}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {student.university || <span className="text-muted-foreground">&mdash;</span>}
                      </TableCell>
                      <TableCell>
                        {student.isPresent ? (
                          <Check className="h-4 w-4 text-green-600" />
                        ) : (
                          <X className="h-4 w-4 text-muted-foreground/50" />
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </Container>
  );
}
