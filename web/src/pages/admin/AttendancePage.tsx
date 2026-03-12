import { useState, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Search,
  ClipboardCheck,
  GraduationCap,
  Car,
  Send,
} from "lucide-react";
import { Container } from "../../components/layout/Container";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import { Skeleton } from "../../components/ui/skeleton";
import { Checkbox } from "../../components/ui/checkbox";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "../../components/ui/table";
import { Card, CardContent } from "../../components/ui/card";
import { cn } from "../../lib/utils";
import { useStudents, useDrivers } from "../../lib/hooks/useApiQueries";
import { api, type AttendanceViewModel } from "../../api";

// ---------------------------------------------------------------------------
// Tab type
// ---------------------------------------------------------------------------

type Tab = "students" | "drivers";

// ---------------------------------------------------------------------------
// Table skeleton
// ---------------------------------------------------------------------------

function TableSkeleton() {
  return (
    <>
      {Array.from({ length: 6 }).map((_, i) => (
        <TableRow key={i}>
          {Array.from({ length: 3 }).map((_, j) => (
            <TableCell key={j}>
              <Skeleton className="h-4 w-full" />
            </TableCell>
          ))}
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

  const { data: students, isLoading: studentsLoading } = useStudents();
  const { data: drivers, isLoading: driversLoading } = useDrivers();

  // Mutations
  const studentAttendance = useMutation({
    mutationFn: (payload: AttendanceViewModel) =>
      api.setStudentAttendance(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
    },
  });

  const driverAttendance = useMutation({
    mutationFn: (payload: AttendanceViewModel) =>
      api.setDriverAttendance(payload),
    onSuccess: () => {
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

  // Filtered lists
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

      {/* Summary cards */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Students present</p>
              {studentsLoading ? (
                <Skeleton className="mt-1 h-6 w-16" />
              ) : (
                <p className="text-xl font-semibold text-foreground">
                  {presentStudents}{" "}
                  <span className="text-sm font-normal text-muted-foreground">
                    / {students?.length ?? 0}
                  </span>
                </p>
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Car className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Drivers present</p>
              {driversLoading ? (
                <Skeleton className="mt-1 h-6 w-16" />
              ) : (
                <p className="text-xl font-semibold text-foreground">
                  {presentDrivers}{" "}
                  <span className="text-sm font-normal text-muted-foreground">
                    / {drivers?.length ?? 0}
                  </span>
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="mb-4 flex gap-1 rounded-lg border border-border bg-muted p-1">
        <button
          type="button"
          className={cn(
            "flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
            tab === "students"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
          onClick={() => {
            setTab("students");
            setSearch("");
            setSendStudentSuccess(false);
          }}
        >
          <GraduationCap className="h-4 w-4" />
          Students
        </button>
        <button
          type="button"
          className={cn(
            "flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
            tab === "drivers"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
          onClick={() => {
            setTab("drivers");
            setSearch("");
            setSendDriverSuccess(false);
          }}
        >
          <Car className="h-4 w-4" />
          Drivers
        </button>
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
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">Present</TableHead>
              <TableHead>Name</TableHead>
              <TableHead className="hidden sm:table-cell">Email</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableSkeleton />
            ) : tab === "students" ? (
              filteredStudents.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
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
                    <TableCell>
                      <Checkbox
                        checked={student.isPresent}
                        disabled={studentAttendance.isPending}
                        onCheckedChange={(checked) => {
                          studentAttendance.mutate({
                            id: student.id,
                            attendance: !!checked,
                          });
                        }}
                      />
                    </TableCell>
                    <TableCell className="font-medium text-foreground">
                      {student.fullname}
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground sm:table-cell">
                      {student.email}
                    </TableCell>
                    <TableCell>
                      {student.isPresent ? (
                        <Badge className="border-green-500/30 text-green-600" variant="outline">
                          Present
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Absent</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )
            ) : filteredDrivers.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
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
                  <TableCell>
                    <Checkbox
                      checked={driver.isPresent}
                      disabled={driverAttendance.isPending}
                      onCheckedChange={(checked) => {
                        driverAttendance.mutate({
                          id: driver.id,
                          attendance: !!checked,
                        });
                      }}
                    />
                  </TableCell>
                  <TableCell className="font-medium text-foreground">
                    {driver.fullname}
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground sm:table-cell">
                    {driver.email}
                  </TableCell>
                  <TableCell>
                    {driver.isPresent ? (
                      <Badge className="border-green-500/30 text-green-600" variant="outline">
                        Present
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Absent</Badge>
                    )}
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
