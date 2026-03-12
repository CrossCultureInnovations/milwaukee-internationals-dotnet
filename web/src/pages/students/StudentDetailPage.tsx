import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  GraduationCap,
  Mail,
  Phone,
  MapPin,
  Pencil,
  Trash2,
  Car,
  CalendarDays,
  Check,
  X,
  Users,
  Baby,
  UtensilsCrossed,
} from "lucide-react";
import { Container } from "../../components/layout/Container";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import { Skeleton } from "../../components/ui/skeleton";
import { Checkbox } from "../../components/ui/checkbox";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/card";
import { useStudent } from "../../lib/hooks/useApiQueries";
import { api, type Student } from "../../api";

// ---------------------------------------------------------------------------
// Edit form schema (same fields as create)
// ---------------------------------------------------------------------------

const studentSchema = z.object({
  fullname: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  phone: z.string().optional().default(""),
  university: z.string().optional().default(""),
  major: z.string().optional().default(""),
  country: z.string().optional().default(""),
  interests: z.string().optional().default(""),
  familySize: z.coerce.number().int().min(1).default(1),
  needCarSeat: z.boolean().default(false),
  kosherFood: z.boolean().default(false),
  isFamily: z.boolean().default(false),
});

type StudentFormValues = z.infer<typeof studentSchema>;

// ---------------------------------------------------------------------------
// Inline edit form
// ---------------------------------------------------------------------------

function EditForm({
  student,
  onCancel,
  onSaved,
}: {
  student: Student;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<StudentFormValues>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      fullname: student.fullname,
      email: student.email,
      phone: student.phone ?? "",
      university: student.university ?? "",
      major: student.major ?? "",
      country: student.country ?? "",
      interests: student.interests ?? "",
      familySize: student.familySize,
      needCarSeat: student.needCarSeat,
      kosherFood: student.kosherFood,
      isFamily: student.isFamily,
    },
  });

  const mutation = useMutation({
    mutationFn: (values: StudentFormValues) =>
      api.updateStudent(student.id, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      queryClient.invalidateQueries({ queryKey: ["students", student.id] });
      onSaved();
    },
  });

  const onSubmit = (values: StudentFormValues) => mutation.mutate(values);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Fullname */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            Full name *
          </label>
          <Input {...register("fullname")} />
          {errors.fullname && (
            <p className="mt-1 text-xs text-red-500">{errors.fullname.message}</p>
          )}
        </div>

        {/* Email */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            Email *
          </label>
          <Input {...register("email")} type="email" />
          {errors.email && (
            <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
          )}
        </div>

        {/* Phone */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            Phone
          </label>
          <Input {...register("phone")} />
        </div>

        {/* University */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            University
          </label>
          <Input {...register("university")} />
        </div>

        {/* Major */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            Major
          </label>
          <Input {...register("major")} />
        </div>

        {/* Country */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            Country
          </label>
          <Input {...register("country")} />
        </div>

        {/* Interests */}
        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            Interests
          </label>
          <Input {...register("interests")} />
        </div>

        {/* Family size */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            Family size
          </label>
          <Input {...register("familySize")} type="number" min={1} className="w-24" />
        </div>
      </div>

      {/* Checkboxes */}
      <div className="flex flex-wrap gap-6 pt-1">
        <Controller
          control={control}
          name="needCarSeat"
          render={({ field }) => (
            <label className="flex items-center gap-2 text-sm text-foreground">
              <Checkbox checked={field.value} onCheckedChange={field.onChange} />
              Needs car seat
            </label>
          )}
        />
        <Controller
          control={control}
          name="kosherFood"
          render={({ field }) => (
            <label className="flex items-center gap-2 text-sm text-foreground">
              <Checkbox checked={field.value} onCheckedChange={field.onChange} />
              Kosher food
            </label>
          )}
        />
        <Controller
          control={control}
          name="isFamily"
          render={({ field }) => (
            <label className="flex items-center gap-2 text-sm text-foreground">
              <Checkbox checked={field.value} onCheckedChange={field.onChange} />
              Is a family
            </label>
          )}
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2">
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? "Saving..." : "Save Changes"}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>

      {mutation.isError && (
        <p className="text-xs text-red-500">
          {(mutation.error as Error).message || "Something went wrong."}
        </p>
      )}
    </form>
  );
}

// ---------------------------------------------------------------------------
// Detail info row helper
// ---------------------------------------------------------------------------

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
}) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm text-foreground">{value}</p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export function StudentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const studentId = Number(id) || 0;
  const { data: student, isLoading, error } = useStudent(studentId);
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const deleteMutation = useMutation({
    mutationFn: () => api.deleteStudent(studentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      navigate("/students");
    },
  });

  // Loading state
  if (isLoading) {
    return (
      <Container className="py-8">
        <Skeleton className="mb-6 h-8 w-32" />
        <Card>
          <CardContent className="space-y-4 p-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-5 w-full" />
            ))}
          </CardContent>
        </Card>
      </Container>
    );
  }

  // Error / not found
  if (error || !student) {
    return (
      <Container className="py-8">
        <Link
          to="/students"
          className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to students
        </Link>
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Student not found.
          </CardContent>
        </Card>
      </Container>
    );
  }

  return (
    <Container className="py-8">
      {/* Back link */}
      <Link
        to="/students"
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to students
      </Link>

      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-heading text-2xl text-foreground">
              {student.fullname}
            </h1>
            <p className="text-sm text-muted-foreground">
              ID: {student.displayId || student.id}
              {student.year ? ` \u00b7 ${student.year}` : ""}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!editing && (
            <Button variant="outline" onClick={() => setEditing(true)}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Button>
          )}
          {!confirmDelete ? (
            <Button
              variant="ghost"
              className="text-red-500 hover:bg-red-500/10 hover:text-red-600"
              onClick={() => setConfirmDelete(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-sm text-red-500">Are you sure?</span>
              <Button
                size="sm"
                variant="ghost"
                className="text-red-600 hover:bg-red-500/10"
                disabled={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate()}
              >
                {deleteMutation.isPending ? "Deleting..." : "Yes, delete"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setConfirmDelete(false)}
              >
                Cancel
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Status badges */}
      <div className="mb-6 flex flex-wrap gap-2">
        {student.isPresent ? (
          <Badge className="gap-1">
            <Check className="h-3 w-3" />
            Present
          </Badge>
        ) : (
          <Badge variant="secondary">Absent</Badge>
        )}
        {student.isFamily && (
          <Badge variant="outline" className="gap-1">
            <Users className="h-3 w-3" />
            Family
          </Badge>
        )}
        {student.needCarSeat && (
          <Badge variant="outline" className="gap-1">
            <Baby className="h-3 w-3" />
            Car seat
          </Badge>
        )}
        {student.kosherFood && (
          <Badge variant="outline" className="gap-1">
            <UtensilsCrossed className="h-3 w-3" />
            Kosher
          </Badge>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main details card */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">
              {editing ? "Edit Student" : "Details"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {editing ? (
              <EditForm
                student={student}
                onCancel={() => setEditing(false)}
                onSaved={() => setEditing(false)}
              />
            ) : (
              <div className="grid gap-5 sm:grid-cols-2">
                <InfoRow icon={Mail} label="Email" value={student.email} />
                <InfoRow icon={Phone} label="Phone" value={student.phone} />
                <InfoRow icon={GraduationCap} label="University" value={student.university} />
                <InfoRow icon={GraduationCap} label="Major" value={student.major} />
                <InfoRow icon={MapPin} label="Country" value={student.country} />
                <InfoRow
                  icon={Users}
                  label="Family size"
                  value={String(student.familySize)}
                />
                <InfoRow
                  icon={GraduationCap}
                  label="Interests"
                  value={student.interests}
                />
                <InfoRow
                  icon={CalendarDays}
                  label="Registered on"
                  value={
                    student.registeredOn
                      ? new Date(student.registeredOn).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })
                      : undefined
                  }
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sidebar cards */}
        <div className="space-y-6">
          {/* Driver assignment */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Car className="h-4 w-4 text-primary" />
                Driver Assignment
              </CardTitle>
            </CardHeader>
            <CardContent>
              {student.driver ? (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground">
                    {student.driver.fullname}
                  </p>
                  {student.driver.email && (
                    <p className="text-xs text-muted-foreground">
                      {student.driver.email}
                    </p>
                  )}
                  {student.driver.phone && (
                    <p className="text-xs text-muted-foreground">
                      {student.driver.phone}
                    </p>
                  )}
                  <Badge variant="outline" className="mt-1">
                    Capacity: {student.driver.capacity}
                  </Badge>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Not assigned to a driver.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Events */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <CalendarDays className="h-4 w-4 text-primary" />
                Events
              </CardTitle>
            </CardHeader>
            <CardContent>
              {student.events && student.events.length > 0 ? (
                <ul className="space-y-2">
                  {student.events.map((ev) => (
                    <li
                      key={ev.id}
                      className="flex items-center gap-2 rounded-lg p-2 text-sm text-foreground transition-colors hover:bg-accent"
                    >
                      <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                      Event #{ev.eventId}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No events registered.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete error */}
      {deleteMutation.isError && (
        <p className="mt-4 text-sm text-red-500">
          Failed to delete: {(deleteMutation.error as Error).message}
        </p>
      )}
    </Container>
  );
}
