import { useState, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Search,
  ClipboardCheck,
  GraduationCap,
  Car,
  Send,
  Users,
  Baby,
  UtensilsCrossed,
  Eye,
  MessageSquare,
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
import { cn, displayNumber, seatCount, studentSeats } from "../../lib/utils";
import { DriverNumber } from "../../components/DriverNumber";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from "../../components/ui/select";
import { useStudents, useDrivers, useHosts } from "../../lib/hooks/useApiQueries";
import {
  api,
  type AttendanceViewModel,
  type EmailPreviewKind,
  type NewStudentDriverMappingViewModel,
  type Student,
  type Driver,
} from "../../api";
import {
  EmailPreviewDialog,
  type PreviewRecipient,
} from "../../components/EmailPreviewDialog";

// ---------------------------------------------------------------------------
// Tab type
// ---------------------------------------------------------------------------

type Tab = "students" | "drivers";

// Radix Select cannot carry an empty-string value, so the clear action needs
// a sentinel that no driver id can collide with
const UNASSIGN = "unassign";

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
  const { data: hosts } = useHosts();

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

  // Assigning a driver overwrites any previous one server-side, so reassigning
  // is a single call. Both invalidate drivers too, to keep seat counts honest.
  const assignDriver = useMutation({
    mutationFn: (payload: NewStudentDriverMappingViewModel) =>
      api.mapStudentToDriver(payload),
    onMutate: (payload) => markPending(`map-${payload.studentId}`, true),
    onSettled: (_data, _error, payload) => {
      markPending(`map-${payload.studentId}`, false);
      queryClient.invalidateQueries({ queryKey: ["students"] });
      queryClient.invalidateQueries({ queryKey: ["drivers"] });
    },
  });

  const unassignDriver = useMutation({
    mutationFn: (payload: NewStudentDriverMappingViewModel) =>
      api.unmapStudentFromDriver(payload),
    onMutate: (payload) => markPending(`map-${payload.studentId}`, true),
    onSettled: (_data, _error, payload) => {
      markPending(`map-${payload.studentId}`, false);
      queryClient.invalidateQueries({ queryKey: ["students"] });
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

  // Texting is metered and goes straight to people's phones, so both of these are
  // confirmed at the click site before the mutation fires.
  const smsStudentCheckIn = useMutation({
    mutationFn: () => api.sendStudentCheckInSms(),
    onSuccess: () => setSmsStudentSuccess(true),
  });

  const smsDriverCheckIn = useMutation({
    mutationFn: () => api.sendDriverCheckInSms(),
    onSuccess: () => setSmsDriverSuccess(true),
  });

  const [sendStudentSuccess, setSendStudentSuccess] = useState(false);
  const [sendDriverSuccess, setSendDriverSuccess] = useState(false);
  const [smsStudentSuccess, setSmsStudentSuccess] = useState(false);
  const [smsDriverSuccess, setSmsDriverSuccess] = useState(false);

  // Which check-in preview dialog is open, if any
  const [preview, setPreview] = useState<EmailPreviewKind | null>(null);

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

  // Recipient pickers for the preview dialog. These are the full lists, not the
  // search-filtered ones — the preview is about the email, not the current search.
  const studentRecipients = useMemo<PreviewRecipient[]>(
    () =>
      (students ?? []).map((s) => ({
        id: s.id,
        label: displayNumber(s.displayId)
          ? `${s.fullname} (${displayNumber(s.displayId)})`
          : s.fullname,
      })),
    [students]
  );

  const driverRecipients = useMemo<PreviewRecipient[]>(
    () =>
      (drivers ?? []).map((d) => ({
        id: d.id,
        label: displayNumber(d.displayId)
          ? `${d.fullname} (${displayNumber(d.displayId)})`
          : d.fullname,
      })),
    [drivers]
  );

  // Host lookup, since a driver payload may carry only the reference
  const hostsById = useMemo(
    () => new Map((hosts ?? []).map((h) => [h.id, h.fullname])),
    [hosts]
  );

  // Seats taken per driver, counted from the student list so the number holds
  // even when the driver payload does not hydrate its students collection.
  // A student bringing family takes more than one seat.
  const assignedByDriverId = useMemo(() => {
    const counts = new Map<number, number>();
    for (const student of students ?? []) {
      if (student.driverRefId == null) continue;
      counts.set(
        student.driverRefId,
        (counts.get(student.driverRefId) ?? 0) + studentSeats(student)
      );
    }
    return counts;
  }, [students]);

  // Drivers as dropdown options, in display-number order — on tour day you are
  // hunting for one specific car, not balancing load across the fleet
  const driverOptions = useMemo(() => {
    return (drivers ?? [])
      .map((d) => {
        const hostName =
          d.host?.fullname ??
          (d.hostRefId != null ? hostsById.get(d.hostRefId) : undefined);
        const taken = assignedByDriverId.get(d.id) ?? seatCount(d.students ?? []);

        return {
          id: d.id,
          displayId: d.displayId,
          number: displayNumber(d.displayId),
          name: d.fullname,
          hostName,
          taken,
          capacity: d.capacity,
          full: taken >= d.capacity,
          // Unnumbered drivers sort last rather than jumping to the front
          sortKey: parseInt(displayNumber(d.displayId)) || Number.MAX_SAFE_INTEGER,
        };
      })
      .sort((a, b) => a.sortKey - b.sortKey || a.name.localeCompare(b.name));
  }, [drivers, hostsById, assignedByDriverId]);

  // Same options, bucketed by host home. Hosts read alphabetically; drivers with
  // no host home go last whatever their name would sort as.
  const driverGroups = useMemo(() => {
    const byHost = new Map<string, typeof driverOptions>();

    for (const d of driverOptions) {
      const key = d.hostName ?? "";
      const bucket = byHost.get(key);
      if (bucket) bucket.push(d);
      else byHost.set(key, [d]);
    }

    return Array.from(byHost.entries())
      .map(([hostName, options]) => ({ hostName, options }))
      .sort((a, b) => {
        if (!a.hostName) return 1;
        if (!b.hostName) return -1;
        return a.hostName.localeCompare(b.hostName);
      });
  }, [driverOptions]);

  // Counts
  // People, not records — a present student brings their family with them
  const presentStudents = seatCount((students ?? []).filter((s) => s.isPresent));
  const totalStudents = seatCount(students ?? []);
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

        {/* Preview and send the check-in email for whichever list is showing */}
        <div className="flex items-center gap-2">
          {tab === "students" ? (
            <>
              <Button
                variant="outline"
                onClick={() => setPreview("student-check-in")}
              >
                <Eye className="mr-2 h-4 w-4" />
                Preview
              </Button>
              <Button
                variant="outline"
                disabled={smsStudentCheckIn.isPending}
                onClick={() => {
                  if (
                    !window.confirm(
                      `Text the check-in link to all ${students?.length ?? 0} students?`
                    )
                  ) {
                    return;
                  }
                  setSmsStudentSuccess(false);
                  smsStudentCheckIn.mutate();
                }}
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                {smsStudentCheckIn.isPending
                  ? "Sending..."
                  : smsStudentSuccess
                    ? "SMS Sent!"
                    : "Send check-in SMS"}
              </Button>
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
            </>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() => setPreview("driver-check-in")}
              >
                <Eye className="mr-2 h-4 w-4" />
                Preview
              </Button>
              <Button
                variant="outline"
                disabled={smsDriverCheckIn.isPending}
                onClick={() => {
                  if (
                    !window.confirm(
                      `Text the check-in link to all ${drivers?.length ?? 0} drivers?`
                    )
                  ) {
                    return;
                  }
                  setSmsDriverSuccess(false);
                  smsDriverCheckIn.mutate();
                }}
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                {smsDriverCheckIn.isPending
                  ? "Sending..."
                  : smsDriverSuccess
                    ? "SMS Sent!"
                    : "Send check-in SMS"}
              </Button>
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
            </>
          )}
        </div>
      </div>

      <EmailPreviewDialog
        open={preview === "student-check-in"}
        onOpenChange={(o) => !o && setPreview(null)}
        kind="student-check-in"
        title="Send Student Check-in"
        recipients={studentRecipients}
        recipientNoun="student"
      />
      <EmailPreviewDialog
        open={preview === "driver-check-in"}
        onOpenChange={(o) => !o && setPreview(null)}
        kind="driver-check-in"
        title="Send Driver Check-in"
        recipients={driverRecipients}
        recipientNoun="driver"
      />

      {/* Summary cards — clicking one switches the list below */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <SummaryCard
          active={tab === "students"}
          icon={<GraduationCap className="h-5 w-5" />}
          label="Students present"
          present={presentStudents}
          total={totalStudents}
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
                    colSpan={4}
                    className="py-12 text-center text-muted-foreground"
                  >
                    {search
                      ? "No students match your search."
                      : "No students yet."}
                  </TableCell>
                </TableRow>
              ) : (
                filteredStudents.map((student) => {
                  const assignedId =
                    student.driverRefId ?? student.driver?.id ?? null;
                  const assigned =
                    assignedId != null
                      ? driverOptions.find((d) => d.id === assignedId)
                      : undefined;
                  const mapPending = pendingKeys.has(`map-${student.id}`);
                  return (
                  <TableRow key={student.id}>
                    <TableCell className="w-12 pr-0 text-sm tabular-nums text-muted-foreground">
                      {displayNumber(student.displayId) || "\u2014"}
                    </TableCell>
                    <TableCell className="font-medium text-foreground">
                      <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
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
                        {student.kosherFood && (
                          <span
                            className="inline-flex shrink-0 items-center gap-1 rounded-full bg-green-500/15 px-2 py-0.5 text-xs font-medium text-green-700 dark:text-green-400"
                            title="Needs a kosher meal"
                          >
                            <UtensilsCrossed className="h-3 w-3" aria-hidden="true" />
                            Kosher
                          </span>
                        )}
                        {student.country && (
                          <span className="font-normal text-muted-foreground">
                            ({student.country})
                          </span>
                        )}
                      </span>
                    </TableCell>
                    <TableCell className="w-64">
                      <Select
                        value={assignedId != null ? String(assignedId) : undefined}
                        disabled={mapPending}
                        onValueChange={(value) => {
                          if (value === UNASSIGN) {
                            if (assignedId == null) return;
                            unassignDriver.mutate({
                              studentId: student.id,
                              driverId: assignedId,
                            });
                            return;
                          }
                          assignDriver.mutate({
                            studentId: student.id,
                            driverId: Number(value),
                          });
                        }}
                      >
                        <SelectTrigger
                          className={cn(
                            "h-9 w-full text-sm",
                            // An empty select should read as a blank waiting to
                            // be filled, not as a value in its own right
                            !assigned &&
                              "border-dashed bg-transparent text-muted-foreground"
                          )}
                        >
                          {assigned ? (
                            <SelectValue placeholder="Assign driver">
                              <span className="flex min-w-0 items-center gap-2">
                                <DriverNumber displayId={assigned.displayId} />
                                <span className="truncate">{assigned.name}</span>
                              </span>
                            </SelectValue>
                          ) : (
                            <SelectValue placeholder="Assign driver" />
                          )}
                        </SelectTrigger>
                        <SelectContent>
                          {assignedId != null && (
                            <SelectItem value={UNASSIGN}>Unassign</SelectItem>
                          )}
                          {driverGroups.map((group) => (
                            <SelectGroup key={group.hostName || "no-host"}>
                              <SelectLabel>
                                {group.hostName || "No host assigned"}
                              </SelectLabel>
                              {group.options.map((d) => (
                                <SelectItem
                                  key={d.id}
                                  value={String(d.id)}
                                  className={cn(
                                    d.full && "text-muted-foreground"
                                  )}
                                >
                                  <span className="flex w-full items-center gap-2">
                                    {d.number && (
                                      <span className="w-6 shrink-0 tabular-nums">
                                        {d.number}
                                      </span>
                                    )}
                                    <span className="truncate">{d.name}</span>
                                    <span className="ml-auto shrink-0 pl-3 tabular-nums text-muted-foreground">
                                      {d.taken}/{d.capacity}
                                    </span>
                                  </span>
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          ))}
                        </SelectContent>
                      </Select>
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
                  );
                })
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
              filteredDrivers.map((driver) => {
                const assigned =
                  assignedByDriverId.get(driver.id) ??
                  seatCount(driver.students ?? []);
                const full = assigned >= driver.capacity;
                return (
                <TableRow key={driver.id}>
                  <TableCell className="font-medium text-foreground">
                    <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span>{driver.fullname}</span>
                      <DriverNumber displayId={driver.displayId} />
                      <span
                        className={cn(
                          "inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-medium tabular-nums",
                          full
                            ? "bg-muted text-muted-foreground"
                            : "bg-primary/10 text-primary"
                        )}
                        title={`${assigned} of ${driver.capacity} seat${
                          driver.capacity === 1 ? "" : "s"
                        } assigned`}
                      >
                        {assigned}/{driver.capacity}
                      </span>
                      {driver.navigator && (
                        <span className="font-normal text-muted-foreground">
                          &mdash; {driver.navigator}
                        </span>
                      )}
                      {driver.haveChildSeat && (
                        <span
                          className="inline-flex shrink-0 items-center rounded-full bg-primary/10 p-1 text-primary"
                          title="Has a child seat"
                        >
                          <Baby className="h-3.5 w-3.5" aria-hidden="true" />
                          <span className="sr-only">Has a child seat</span>
                        </span>
                      )}
                    </span>
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
                );
              })
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
