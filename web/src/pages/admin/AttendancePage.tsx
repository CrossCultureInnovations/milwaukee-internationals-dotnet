import { useState, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Search,
  ClipboardCheck,
  GraduationCap,
  Car,
  Send,
  Users,
} from "lucide-react";
import { Container } from "../../components/layout/Container";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Skeleton } from "../../components/ui/skeleton";
import {
  Table,
  TableBody,
  TableRow,
  TableCell,
} from "../../components/ui/table";
import { Card, CardContent } from "../../components/ui/card";
import { cn } from "../../lib/utils";
import { useStudents, useDrivers } from "../../lib/hooks/useApiQueries";
import {
  api,
  type AttendanceViewModel,
  type Student,
  type Driver,
} from "../../api";

// ---------------------------------------------------------------------------
// Tab type
// ---------------------------------------------------------------------------

type Tab = "students" | "drivers";

// ---------------------------------------------------------------------------
// Attendance toggle
// ---------------------------------------------------------------------------

function AttendanceToggle({
  present,
  disabled,
  onToggle,
}: {
  present: boolean;
  disabled: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={present}
      disabled={disabled}
      onClick={onToggle}
      className={cn(
        "inline-flex min-h-11 w-32 items-center justify-center rounded-full border text-sm font-medium transition-colors disabled:opacity-60",
        present
          ? "border-green-500/30 bg-green-500/10 text-green-600 hover:bg-green-500/20 dark:text-green-400"
          : "border-border bg-muted text-muted-foreground hover:bg-muted/60 hover:text-foreground"
      )}
    >
      {present ? "Present" : "Absent"}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Summary card — doubles as the students / drivers switcher
// ---------------------------------------------------------------------------

function SummaryCard({
  active,
  icon,
  label,
  present,
  total,
  loading,
  onSelect,
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  present: number;
  total: number;
  loading: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onSelect}
      className="rounded-2xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <Card
        className={cn(
          "h-full",
          active && "border-primary/30 ring-2 ring-primary/40"
        )}
      >
        <CardContent className="flex items-center gap-4 p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            {icon}
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            {loading ? (
              <Skeleton className="mt-1 h-6 w-16" />
            ) : (
              <p className="text-xl font-semibold text-foreground">
                {present}{" "}
                <span className="text-sm font-normal text-muted-foreground">
                  / {total}
                </span>
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Table skeleton
// ---------------------------------------------------------------------------

function TableSkeleton() {
  return (
    <>
      {Array.from({ length: 6 }).map((_, i) => (
        <TableRow key={i}>
          <TableCell>
            <Skeleton className="h-4 w-48" />
          </TableCell>
          <TableCell className="text-right">
            <Skeleton className="ml-auto h-11 w-32 rounded-full" />
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export function AttendancePage() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>("students");
  const [search, setSearch] = useState("");
  // Keyed "student-<id>" / "driver-<id>" so the two lists cannot collide on id
  const [pendingKeys, setPendingKeys] = useState<ReadonlySet<string>>(new Set());

  const { data: students, isLoading: studentsLoading } = useStudents();
  const { data: drivers, isLoading: driversLoading } = useDrivers();

  const markPending = (key: string, pending: boolean) =>
    setPendingKeys((prev) => {
      const next = new Set(prev);
      if (pending) next.add(key);
      else next.delete(key);
      return next;
    });

  // Mutations — optimistic so the toggle flips instantly, rolled back on error
  const studentAttendance = useMutation({
    mutationFn: (payload: AttendanceViewModel) =>
      api.setStudentAttendance(payload),
    onMutate: async (payload) => {
      markPending(`student-${payload.id}`, true);
      await queryClient.cancelQueries({ queryKey: ["students"] });
      const previous = queryClient.getQueryData<Student[]>(["students"]);
      queryClient.setQueryData<Student[]>(["students"], (old) =>
        old?.map((s) =>
          s.id === payload.id ? { ...s, isPresent: payload.attendance } : s
        )
      );
      return { previous };
    },
    onError: (_error, _payload, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["students"], context.previous);
      }
    },
    onSettled: (_data, _error, payload) => {
      markPending(`student-${payload.id}`, false);
      queryClient.invalidateQueries({ queryKey: ["students"] });
    },
  });

  const driverAttendance = useMutation({
    mutationFn: (payload: AttendanceViewModel) =>
      api.setDriverAttendance(payload),
    onMutate: async (payload) => {
      markPending(`driver-${payload.id}`, true);
      await queryClient.cancelQueries({ queryKey: ["drivers"] });
      const previous = queryClient.getQueryData<Driver[]>(["drivers"]);
      queryClient.setQueryData<Driver[]>(["drivers"], (old) =>
        old?.map((d) =>
          d.id === payload.id ? { ...d, isPresent: payload.attendance } : d
        )
      );
      return { previous };
    },
    onError: (_error, _payload, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["drivers"], context.previous);
      }
    },
    onSettled: (_data, _error, payload) => {
      markPending(`driver-${payload.id}`, false);
      queryClient.invalidateQueries({ queryKey: ["drivers"] });
    },
  });

  const sendStudentCheckIn = useMutation({
    mutationFn: () => api.sendStudentCheckIn(),
    onSuccess: () => setSendStudentSuccess(true),
  });

  const sendDriverCheckIn = useMutation({
    mutationFn: () => api.sendDriverCheckIn(),
    onSuccess: () => setSendDriverSuccess(true),
  });

  const [sendStudentSuccess, setSendStudentSuccess] = useState(false);
  const [sendDriverSuccess, setSendDriverSuccess] = useState(false);

  // Filtered lists — email is still searchable even though it is no longer shown
  const filteredStudents = useMemo(() => {
    if (!students) return [];
    if (!search.trim()) return students;
    const q = search.toLowerCase();
    return students.filter(
      (s) =>
        s.fullname.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q)
    );
  }, [students, search]);

  const filteredDrivers = useMemo(() => {
    if (!drivers) return [];
    if (!search.trim()) return drivers;
    const q = search.toLowerCase();
    return drivers.filter(
      (d) =>
        d.fullname.toLowerCase().includes(q) ||
        d.email.toLowerCase().includes(q)
    );
  }, [drivers, search]);

  // Counts
  const presentStudents = students?.filter((s) => s.isPresent).length ?? 0;
  const presentDrivers = drivers?.filter((d) => d.isPresent).length ?? 0;

  const isLoading = tab === "students" ? studentsLoading : driversLoading;

  return (
    <Container className="py-8">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <ClipboardCheck className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-heading text-2xl text-foreground">Attendance</h1>
            <p className="text-sm text-muted-foreground">
              Track check-ins for students and drivers
            </p>
          </div>
        </div>

        {/* Send check-in button */}
        {tab === "students" ? (
          <Button
            variant="outline"
            disabled={sendStudentCheckIn.isPending}
            onClick={() => {
              setSendStudentSuccess(false);
              sendStudentCheckIn.mutate();
            }}
          >
            <Send className="mr-2 h-4 w-4" />
            {sendStudentCheckIn.isPending
              ? "Sending..."
              : sendStudentSuccess
                ? "Check-in Sent!"
                : "Send Student Check-in"}
          </Button>
        ) : (
          <Button
            variant="outline"
            disabled={sendDriverCheckIn.isPending}
            onClick={() => {
              setSendDriverSuccess(false);
              sendDriverCheckIn.mutate();
            }}
          >
            <Send className="mr-2 h-4 w-4" />
            {sendDriverCheckIn.isPending
              ? "Sending..."
              : sendDriverSuccess
                ? "Check-in Sent!"
                : "Send Driver Check-in"}
          </Button>
        )}
      </div>

      {/* Summary cards — clicking one switches the list below */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <SummaryCard
          active={tab === "students"}
          icon={<GraduationCap className="h-5 w-5" />}
          label="Students present"
          present={presentStudents}
          total={students?.length ?? 0}
          loading={studentsLoading}
          onSelect={() => {
            setTab("students");
            setSearch("");
            setSendStudentSuccess(false);
          }}
        />
        <SummaryCard
          active={tab === "drivers"}
          icon={<Car className="h-5 w-5" />}
          label="Drivers present"
          present={presentDrivers}
          total={drivers?.length ?? 0}
          loading={driversLoading}
          onSelect={() => {
            setTab("drivers");
            setSearch("");
            setSendDriverSuccess(false);
          }}
        />
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={`Search ${tab} by name or email...`}
          className="pl-9"
        />
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-border bg-card">
        <Table>
          <TableBody>
            {isLoading ? (
              <TableSkeleton />
            ) : tab === "students" ? (
              filteredStudents.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={2}
                    className="py-12 text-center text-muted-foreground"
                  >
                    {search
                      ? "No students match your search."
                      : "No students yet."}
                  </TableCell>
                </TableRow>
              ) : (
                filteredStudents.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell className="font-medium text-foreground">
                      <span className="flex items-center gap-2">
                        <span>{student.fullname}</span>
                        {student.isFamily && student.familySize > 0 && (
                          <span
                            className="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
                            title={`${student.familySize} family member${
                              student.familySize === 1 ? "" : "s"
                            } joining`}
                          >
                            <Users className="h-3 w-3" />+{student.familySize}
                          </span>
                        )}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <AttendanceToggle
                        present={student.isPresent}
                        disabled={pendingKeys.has(`student-${student.id}`)}
                        onToggle={() =>
                          studentAttendance.mutate({
                            id: student.id,
                            attendance: !student.isPresent,
                          })
                        }
                      />
                    </TableCell>
                  </TableRow>
                ))
              )
            ) : filteredDrivers.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={2}
                  className="py-12 text-center text-muted-foreground"
                >
                  {search
                    ? "No drivers match your search."
                    : "No drivers yet."}
                </TableCell>
              </TableRow>
            ) : (
              filteredDrivers.map((driver) => (
                <TableRow key={driver.id}>
                  <TableCell className="font-medium text-foreground">
                    {driver.fullname}
                  </TableCell>
                  <TableCell className="text-right">
                    <AttendanceToggle
                      present={driver.isPresent}
                      disabled={pendingKeys.has(`driver-${driver.id}`)}
                      onToggle={() =>
                        driverAttendance.mutate({
                          id: driver.id,
                          attendance: !driver.isPresent,
                        })
                      }
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Error feedback */}
      {(studentAttendance.isError || driverAttendance.isError) && (
        <p className="mt-3 text-sm text-red-500">
          Failed to update attendance. Please try again.
        </p>
      )}
      {(sendStudentCheckIn.isError || sendDriverCheckIn.isError) && (
        <p className="mt-3 text-sm text-red-500">
          Failed to send check-in notification. Please try again.
        </p>
      )}
    </Container>
  );
}
