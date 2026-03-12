import { useState, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import {
  ArrowLeft,
  CalendarDays,
  MapPin,
  Clock,
  Users,
  UserPlus,
  UserMinus,
  Pencil,
  Trash2,
  Search,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import { Skeleton } from "../../components/ui/skeleton";
import { Container } from "../../components/layout/Container";
import { useEvent, useStudents } from "../../lib/hooks/useApiQueries";
import { api } from "../../api";

const eventSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  dateTime: z.string().min(1, "Date & time is required"),
  address: z.string().min(1, "Address is required"),
});

type EventFormValues = z.infer<typeof eventSchema>;

export function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const eventId = Number(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [studentSearch, setStudentSearch] = useState("");

  const event = useEvent(eventId);
  const students = useStudents();
  const eventData = event.data;
  const allStudents = students.data ?? [];

  // Mapped student IDs from the event
  const mappedStudentIds = useMemo(
    () => new Set((eventData?.students ?? []).map((r) => r.studentId)),
    [eventData?.students]
  );

  // Resolve mapped students to full Student objects
  const mappedStudents = useMemo(
    () => allStudents.filter((s) => mappedStudentIds.has(s.id)),
    [allStudents, mappedStudentIds]
  );

  // Unmapped students filtered by search
  const unmappedStudents = useMemo(() => {
    const unmapped = allStudents.filter((s) => !mappedStudentIds.has(s.id));
    if (!studentSearch.trim()) return unmapped;
    const q = studentSearch.toLowerCase();
    return unmapped.filter(
      (s) =>
        s.fullname.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q)
    );
  }, [allStudents, mappedStudentIds, studentSearch]);

  // Form for editing
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema),
  });

  // Start editing: populate form with current values
  function startEditing() {
    if (!eventData) return;
    reset({
      name: eventData.name,
      description: eventData.description ?? "",
      dateTime: eventData.dateTime
        ? eventData.dateTime.slice(0, 16) // format for datetime-local
        : "",
      address: eventData.address,
    });
    setEditing(true);
  }

  // Mutations
  const updateMutation = useMutation({
    mutationFn: (data: EventFormValues) => api.updateEvent(eventId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events", eventId] });
      queryClient.invalidateQueries({ queryKey: ["events"] });
      setEditing(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.deleteEvent(eventId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      navigate("/events");
    },
  });

  const mapMutation = useMutation({
    mutationFn: (studentId: number) =>
      api.mapStudentToEvent(eventId, studentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events", eventId] });
    },
  });

  const unmapMutation = useMutation({
    mutationFn: (studentId: number) =>
      api.unmapStudentFromEvent(eventId, studentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events", eventId] });
    },
  });

  function onSubmitEdit(data: EventFormValues) {
    updateMutation.mutate(data);
  }

  function formatDateTime(iso: string) {
    return new Date(iso).toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }

  // Loading state
  if (event.isLoading) {
    return (
      <Container className="py-8">
        <Skeleton className="mb-4 h-6 w-24" />
        <Skeleton className="mb-6 h-10 w-64" />
        <Card>
          <CardContent className="space-y-4 p-6">
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-5 w-1/2" />
          </CardContent>
        </Card>
      </Container>
    );
  }

  if (!eventData) {
    return (
      <Container className="py-8">
        <Link
          to="/events"
          className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to events
        </Link>
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <p className="text-sm text-muted-foreground">Event not found.</p>
          </CardContent>
        </Card>
      </Container>
    );
  }

  return (
    <Container className="py-8">
      {/* Back link */}
      <Link
        to="/events"
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to events
      </Link>

      {/* Event Info Card */}
      <Card className="mb-6">
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle className="text-xl">{eventData.name}</CardTitle>
            {eventData.description && (
              <p className="mt-1 text-sm text-muted-foreground">
                {eventData.description}
              </p>
            )}
          </div>
          <div className="flex shrink-0 gap-2">
            {!editing && (
              <Button variant="outline" size="sm" onClick={startEditing}>
                <Pencil className="mr-1 h-3.5 w-3.5" />
                Edit
              </Button>
            )}
            {!confirmDelete ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConfirmDelete(true)}
              >
                <Trash2 className="mr-1 h-3.5 w-3.5" />
                Delete
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-xs text-destructive">Are you sure?</span>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => deleteMutation.mutate()}
                  disabled={deleteMutation.isPending}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {deleteMutation.isPending ? "Deleting..." : "Confirm"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setConfirmDelete(false)}
                >
                  Cancel
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {editing ? (
            <form
              onSubmit={handleSubmit(onSubmitEdit)}
              className="space-y-4"
            >
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">
                  Name
                </label>
                <Input {...register("name")} />
                {errors.name && (
                  <p className="mt-1 text-xs text-destructive">
                    {errors.name.message}
                  </p>
                )}
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">
                  Description
                </label>
                <textarea
                  {...register("description")}
                  rows={3}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">
                  Date & Time
                </label>
                <Input type="datetime-local" {...register("dateTime")} />
                {errors.dateTime && (
                  <p className="mt-1 text-xs text-destructive">
                    {errors.dateTime.message}
                  </p>
                )}
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">
                  Address
                </label>
                <Input {...register("address")} />
                {errors.address && (
                  <p className="mt-1 text-xs text-destructive">
                    {errors.address.message}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  type="submit"
                  disabled={updateMutation.isPending}
                >
                  {updateMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditing(false)}
                >
                  Cancel
                </Button>
              </div>
              {updateMutation.isError && (
                <p className="text-xs text-destructive">
                  {(updateMutation.error as Error).message}
                </p>
              )}
            </form>
          ) : (
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CalendarDays className="h-4 w-4 text-primary" />
                {formatDateTime(eventData.dateTime)}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 text-primary" />
                {eventData.address}
              </div>
              <Badge variant="secondary">
                <Users className="mr-1 h-3 w-3" />
                {eventData.students?.length ?? 0} students
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Student Mapping Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Mapped Students */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-4 w-4 text-primary" />
              Mapped Students
              <Badge variant="outline" className="ml-auto">
                {mappedStudents.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {students.isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : mappedStudents.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No students mapped to this event yet.
              </p>
            ) : (
              <ul className="space-y-2">
                {mappedStudents.map((student) => (
                  <li
                    key={student.id}
                    className="flex items-center justify-between rounded-lg border border-border px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {student.fullname}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {student.email}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0 text-muted-foreground hover:text-destructive"
                      onClick={() => unmapMutation.mutate(student.id)}
                      disabled={unmapMutation.isPending}
                      title="Remove student"
                    >
                      <UserMinus className="h-4 w-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Add Students */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <UserPlus className="h-4 w-4 text-primary" />
              Add Students
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                placeholder="Search students..."
                className="pl-9"
              />
            </div>
            {students.isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : unmappedStudents.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {studentSearch
                  ? "No unmapped students match your search."
                  : "All students are already mapped to this event."}
              </p>
            ) : (
              <ul className="max-h-80 space-y-2 overflow-y-auto">
                {unmappedStudents.map((student) => (
                  <li
                    key={student.id}
                    className="flex items-center justify-between rounded-lg border border-border px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {student.fullname}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {student.email}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0 text-muted-foreground hover:text-primary"
                      onClick={() => mapMutation.mutate(student.id)}
                      disabled={mapMutation.isPending}
                      title="Add student"
                    >
                      <UserPlus className="h-4 w-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </Container>
  );
}
