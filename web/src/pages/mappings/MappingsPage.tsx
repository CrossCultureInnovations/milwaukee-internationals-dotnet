import { useState, useMemo } from "react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import {
  Users,
  Car,
  Home,
  Link2,
  Unlink,
  Mail,
  Search,
  ArrowRight,
  UtensilsCrossed,
  Baby,
} from "lucide-react";
import { api } from "../../api";
import type {
  Student,
  Driver,
  Host,
  NewStudentDriverMappingViewModel,
  NewDriverHostMappingViewModel,
} from "../../api";
import { useStudents, useDrivers, useHosts } from "../../lib/hooks/useApiQueries";
import { Container } from "../../components/layout/Container";
import { Button } from "../../components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import { Skeleton } from "../../components/ui/skeleton";
import { cn, displayNumber, seatCount } from "../../lib/utils";
import { DriverNumber } from "../../components/DriverNumber";

type Tab = "student-driver" | "driver-host";

// ---------------------------------------------------------------------------
// Student-Driver Section
// ---------------------------------------------------------------------------

function StudentDriverSection() {
  const queryClient = useQueryClient();
  const students = useStudents();
  const drivers = useDrivers();
  const hosts = useHosts();

  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [selectedDriverId, setSelectedDriverId] = useState<number | null>(null);
  const [studentSearch, setStudentSearch] = useState("");
  const [driverSearch, setDriverSearch] = useState("");

  const studentData = students.data ?? [];
  const driverData = drivers.data ?? [];
  const hostData = hosts.data ?? [];

  const hostsById = useMemo(() => {
    const map = new Map<number, string>();
    for (const h of hostData) {
      map.set(h.id, h.fullname);
    }
    return map;
  }, [hostData]);

  const getHostName = (d: Driver) =>
    d.host?.fullname || (d.hostRefId != null ? hostsById.get(d.hostRefId) : undefined);

  const unmappedStudents = studentData.filter((s) => s.driverRefId == null);
  const mappedStudents = studentData.filter((s) => s.driverRefId != null);

  const houseStudentCounts = useMemo(() => {
    return hostData.map((h) => {
      const driversForHost = driverData.filter((d) => d.hostRefId === h.id);
      const driverIds = new Set(driversForHost.map((d) => d.id));
      const students = mappedStudents.filter(
        (s) => s.driverRefId != null && driverIds.has(s.driverRefId)
      );
      return {
        id: h.id,
        fullname: h.fullname,
        studentCount: students.length,
      };
    });
  }, [hostData, driverData, mappedStudents]);

  const filteredUnmapped = unmappedStudents.filter((s) => {
    const q = studentSearch.trim().toLowerCase();
    if (!q) return true;
    const cleanQ = q.startsWith("#") ? q.slice(1).trim() : q;
    const studentNumber = (s.displayId ? s.displayId.split("-").pop() : String(s.id)) || "";
    const displayId = s.displayId || "";
    const idStr = String(s.id);

    return (
      s.fullname.toLowerCase().includes(q) ||
      (cleanQ !== "" && (
        studentNumber.toLowerCase().includes(cleanQ) ||
        displayId.toLowerCase().includes(cleanQ) ||
        idStr.includes(cleanQ)
      ))
    );
  });
  const houseStudentCountMap = useMemo(() => {
    const map = new Map<number, number>();
    for (const h of houseStudentCounts) {
      map.set(h.id, h.studentCount);
    }
    return map;
  }, [houseStudentCounts]);

  const filteredDrivers = useMemo(() => {
    const q = driverSearch.trim().toLowerCase();
    const matched = driverData.filter((d) => {
      if (!q) return true;
      const hostName = getHostName(d)?.toLowerCase() || "";
      return (
        d.fullname.toLowerCase().includes(q) ||
        hostName.includes(q)
      );
    });

    return matched.sort((a, b) => {
      // 1. Number of people in the cars (empty cars first)
      const studentsA = a.students?.length ?? 0;
      const studentsB = b.students?.length ?? 0;
      if (studentsA !== studentsB) {
        return studentsA - studentsB;
      }

      // 2. Tie breaker: Drivers going to houses with the least number of people higher
      const hostIdA = a.hostRefId ?? a.host?.id ?? null;
      const hostIdB = b.hostRefId ?? b.host?.id ?? null;
      const houseCountA =
        hostIdA != null ? (houseStudentCountMap.get(hostIdA) ?? 0) : Infinity;
      const houseCountB =
        hostIdB != null ? (houseStudentCountMap.get(hostIdB) ?? 0) : Infinity;
      if (houseCountA !== houseCountB) {
        return houseCountA - houseCountB;
      }

      // 3. Final tie breaker: Capacity remaining (highest capacity remaining first)
      const remA = a.capacity - studentsA;
      const remB = b.capacity - studentsB;
      if (remA !== remB) {
        return remB - remA;
      }

      // 4. Deterministic fallback by name
      return a.fullname.localeCompare(b.fullname);
    });
  }, [driverData, driverSearch, houseStudentCountMap, hostsById]);

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["students"] });
    queryClient.invalidateQueries({ queryKey: ["drivers"] });
    queryClient.invalidateQueries({ queryKey: ["hosts"] });
  };

  const mapMutation = useMutation({
    mutationFn: (payload: NewStudentDriverMappingViewModel) =>
      api.mapStudentToDriver(payload),
    onSuccess: () => {
      invalidateAll();
      setSelectedStudentId(null);
      setSelectedDriverId(null);
    },
  });

  const unmapMutation = useMutation({
    mutationFn: (payload: NewStudentDriverMappingViewModel) =>
      api.unmapStudentFromDriver(payload),
    onSuccess: invalidateAll,
  });

  const emailMutation = useMutation({
    mutationFn: () => api.emailStudentDriverMappings(),
  });

  const handleMap = () => {
    if (selectedStudentId != null && selectedDriverId != null) {
      mapMutation.mutate({
        studentId: selectedStudentId,
        driverId: selectedDriverId,
      });
    }
  };

  const isLoading = students.isLoading || drivers.isLoading || hosts.isLoading;

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Users className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Unmapped students</p>
              <p className="text-xl font-semibold">{unmappedStudents.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Link2 className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Mapped students</p>
              <p className="text-xl font-semibold">{mappedStudents.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Car className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total drivers</p>
              <p className="text-xl font-semibold">{driverData.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Students per house summary */}
      {hostData.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card px-3.5 py-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground mr-1">
            <Home className="h-3.5 w-3.5 text-primary" />
            <span>Students per house:</span>
          </div>
          {houseStudentCounts.map((h) => (
            <div
              key={h.id}
              className="flex items-center gap-1.5 rounded-lg border border-border bg-muted/30 px-2.5 py-1 text-xs"
              title={`${h.fullname}: ${h.studentCount} students assigned`}
            >
              <span className="font-medium text-foreground">{h.fullname}</span>
              <Badge variant="secondary" className="h-4 px-1.5 text-[11px] font-semibold leading-none">
                {h.studentCount}
              </Badge>
            </div>
          ))}
        </div>
      )}

      {/* Map controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Link2 className="h-4 w-4 text-primary" />
            Assign student to driver
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 lg:grid-cols-[1fr_auto_1fr]">
            {/* Left: Unmapped students */}
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search students..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="max-h-64 space-y-1 overflow-y-auto rounded-lg border p-2">
                {filteredUnmapped.length === 0 && (
                  <p className="py-4 text-center text-sm text-muted-foreground">
                    No unmapped students
                  </p>
                )}
                {filteredUnmapped.map((s) => {
                  const studentNumber = displayNumber(s.displayId) || (s.id ? `#${s.id}` : "");
                  return (
                    <button
                      key={s.id}
                      onClick={() => setSelectedStudentId(s.id === selectedStudentId ? null : s.id)}
                      className={cn(
                        "flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-accent",
                        s.isPresent && "bg-green-100/70 dark:bg-green-950/40",
                        s.id === selectedStudentId && "bg-primary/10 text-primary",
                      )}
                    >
                      <Users className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      <span className="truncate">{s.fullname}</span>
                      <span className="shrink-0 text-xs font-medium text-muted-foreground">
                        {studentNumber}
                      </span>
                      <div className="ml-auto flex shrink-0 items-center gap-1.5">
                        {s.kosherFood && (
                          <Badge
                            variant="outline"
                            className="text-xs gap-1 border-green-200 text-green-700 dark:border-green-800 dark:text-green-400"
                          >
                            <UtensilsCrossed className="h-3 w-3" />
                            Kosher
                          </Badge>
                        )}
                        {s.needCarSeat && (
                          <Badge
                            variant="outline"
                            className="text-xs gap-1 border-amber-200 text-amber-700 dark:border-amber-800 dark:text-amber-400"
                          >
                            <Baby className="h-3 w-3" />
                            Car seat
                          </Badge>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Center: Map button */}
            <div className="flex items-center justify-center">
              <Button
                onClick={handleMap}
                disabled={
                  selectedStudentId == null ||
                  selectedDriverId == null ||
                  mapMutation.isPending
                }
                className="gap-2"
              >
                <ArrowRight className="h-4 w-4" />
                Map
              </Button>
            </div>

            {/* Right: Drivers */}
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search drivers..."
                  value={driverSearch}
                  onChange={(e) => setDriverSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="max-h-64 space-y-1 overflow-y-auto rounded-lg border p-2">
                {filteredDrivers.length === 0 && (
                  <p className="py-4 text-center text-sm text-muted-foreground">
                    No drivers found
                  </p>
                )}
                {filteredDrivers.map((d) => {
                  const hostName = getHostName(d);
                  return (
                    <button
                      key={d.id}
                      onClick={() => setSelectedDriverId(d.id === selectedDriverId ? null : d.id)}
                      className={cn(
                        "flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-accent",
                        d.isPresent && "bg-green-100/70 dark:bg-green-950/40",
                        d.id === selectedDriverId && "bg-primary/10 text-primary",
                      )}
                    >
                      <Car className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      <span className="truncate">{d.fullname}</span>
                      <DriverNumber displayId={d.displayId} />
                      {hostName && (
                        <span className="shrink-0 text-xs text-muted-foreground">
                          ({hostName})
                        </span>
                      )}
                      <Badge
                        variant={d.students.length >= d.capacity ? "secondary" : "outline"}
                        className="ml-auto text-xs shrink-0"
                      >
                        {d.students.length}/{d.capacity}
                      </Badge>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current mappings */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
            <Users className="h-4 w-4 text-primary" />
            Current mappings
          </h2>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => emailMutation.mutate()}
            disabled={emailMutation.isPending}
          >
            <Mail className="h-4 w-4" />
            Email Mappings
          </Button>
        </div>
        {mappedStudents.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No mappings yet
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(() => {
              const grouped = new Map<number, { driver: Driver; students: Student[] }>();
              for (const s of mappedStudents) {
                const driver = driverData.find((d) => d.id === s.driverRefId);
                if (!driver) continue;
                if (!grouped.has(driver.id)) {
                  grouped.set(driver.id, { driver, students: [] });
                }
                grouped.get(driver.id)!.students.push(s);
              }
              return Array.from(grouped.values()).map(({ driver, students: driverStudents }) => (
                // Tinted by the driver's own attendance, a shade lighter than the
                // student rows nested inside so both stay readable at a glance
                <Card
                  key={driver.id}
                  className={cn(
                    driver.isPresent
                      ? "bg-green-50 dark:bg-green-950/20"
                      : "bg-red-50 dark:bg-red-950/20"
                  )}
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-sm">
                      <Car className="h-4 w-4 text-primary" />
                      <span>{driver.fullname}</span>
                      <DriverNumber displayId={driver.displayId} />
                      {getHostName(driver) && (
                        <span className="text-xs font-normal text-muted-foreground">
                          ({getHostName(driver)})
                        </span>
                      )}
                      <Badge variant="outline" className="ml-auto text-xs">
                        {seatCount(driverStudents)}/{driver.capacity}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1">
                    {driverStudents.map((s) => {
                      const studentNumber = displayNumber(s.displayId) || (s.id ? `#${s.id}` : "");
                      return (
                        <div key={s.id} className={cn(
                          "flex items-center gap-2 rounded-md px-2 py-1.5",
                          s.isPresent
                            ? "bg-green-100 dark:bg-green-950/40"
                            : "bg-red-100 dark:bg-red-950/40"
                        )}>
                          <Users className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                          <span className="text-sm truncate">{s.fullname}</span>
                          <span className="shrink-0 text-xs text-muted-foreground">
                            {studentNumber}
                          </span>
                          <div className="ml-auto flex shrink-0 items-center gap-1.5">
                            {s.kosherFood && (
                              <UtensilsCrossed
                                className="h-4 w-4 shrink-0 text-green-600 dark:text-green-400"
                                title="Kosher"
                              />
                            )}
                            {s.needCarSeat && (
                              <Baby
                                className="h-4 w-4 shrink-0 text-amber-500 dark:text-amber-400"
                                title="Car seat"
                              />
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 shrink-0"
                              onClick={() =>
                                unmapMutation.mutate({
                                  studentId: s.id,
                                  driverId: s.driverRefId!,
                                })
                              }
                              disabled={unmapMutation.isPending}
                            >
                              <Unlink className="h-3.5 w-3.5 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              ));
            })()}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Driver-Host Section
// ---------------------------------------------------------------------------

function DriverHostSection() {
  const queryClient = useQueryClient();
  const drivers = useDrivers();
  const hosts = useHosts();

  const [selectedDriverId, setSelectedDriverId] = useState<number | null>(null);
  const [selectedHostId, setSelectedHostId] = useState<number | null>(null);
  const [driverSearch, setDriverSearch] = useState("");
  const [hostSearch, setHostSearch] = useState("");

  const driverData = drivers.data ?? [];
  const hostData = hosts.data ?? [];

  const unmappedDrivers = driverData.filter((d) => d.hostRefId == null);
  const mappedDrivers = driverData.filter((d) => d.hostRefId != null);

  const filteredUnmapped = unmappedDrivers.filter((d) =>
    d.fullname.toLowerCase().includes(driverSearch.toLowerCase()),
  );
  const filteredHosts = hostData.filter((h) =>
    h.fullname.toLowerCase().includes(hostSearch.toLowerCase()),
  );

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["students"] });
    queryClient.invalidateQueries({ queryKey: ["drivers"] });
    queryClient.invalidateQueries({ queryKey: ["hosts"] });
  };

  const mapMutation = useMutation({
    mutationFn: (payload: NewDriverHostMappingViewModel) =>
      api.mapDriverToHost(payload),
    onSuccess: () => {
      invalidateAll();
      setSelectedDriverId(null);
      setSelectedHostId(null);
    },
  });

  const unmapMutation = useMutation({
    mutationFn: (payload: NewDriverHostMappingViewModel) =>
      api.unmapDriverFromHost(payload),
    onSuccess: invalidateAll,
  });

  const emailMutation = useMutation({
    mutationFn: () => api.emailDriverHostMappings(),
  });

  const handleMap = () => {
    if (selectedDriverId != null && selectedHostId != null) {
      mapMutation.mutate({
        driverId: selectedDriverId,
        hostId: selectedHostId,
      });
    }
  };

  const isLoading = drivers.isLoading || hosts.isLoading;

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Car className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Unmapped drivers</p>
              <p className="text-xl font-semibold">{unmappedDrivers.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Link2 className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Mapped drivers</p>
              <p className="text-xl font-semibold">{mappedDrivers.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Home className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total hosts</p>
              <p className="text-xl font-semibold">{hostData.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Map controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Link2 className="h-4 w-4 text-primary" />
            Assign driver to host
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 lg:grid-cols-[1fr_auto_1fr]">
            {/* Left: Unmapped drivers */}
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search drivers..."
                  value={driverSearch}
                  onChange={(e) => setDriverSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="max-h-64 space-y-1 overflow-y-auto rounded-lg border p-2">
                {filteredUnmapped.length === 0 && (
                  <p className="py-4 text-center text-sm text-muted-foreground">
                    No unmapped drivers
                  </p>
                )}
                {filteredUnmapped.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => setSelectedDriverId(d.id === selectedDriverId ? null : d.id)}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-accent",
                      d.id === selectedDriverId && "bg-primary/10 text-primary",
                    )}
                  >
                    <Car className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <span className="truncate">{d.fullname}</span>
                    <DriverNumber displayId={d.displayId} />
                    <Badge variant="outline" className="ml-auto text-xs">
                      {d.students.length} students
                    </Badge>
                  </button>
                ))}
              </div>
            </div>

            {/* Center: Map button */}
            <div className="flex items-center justify-center">
              <Button
                onClick={handleMap}
                disabled={
                  selectedDriverId == null ||
                  selectedHostId == null ||
                  mapMutation.isPending
                }
                className="gap-2"
              >
                <ArrowRight className="h-4 w-4" />
                Map
              </Button>
            </div>

            {/* Right: Hosts */}
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search hosts..."
                  value={hostSearch}
                  onChange={(e) => setHostSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="max-h-64 space-y-1 overflow-y-auto rounded-lg border p-2">
                {filteredHosts.length === 0 && (
                  <p className="py-4 text-center text-sm text-muted-foreground">
                    No hosts found
                  </p>
                )}
                {filteredHosts.map((h) => (
                  <button
                    key={h.id}
                    onClick={() => setSelectedHostId(h.id === selectedHostId ? null : h.id)}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-accent",
                      h.id === selectedHostId && "bg-primary/10 text-primary",
                    )}
                  >
                    <Home className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <span className="truncate">{h.fullname}</span>
                    <Badge variant="outline" className="ml-auto text-xs">
                      {h.drivers.length} drivers
                    </Badge>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current mappings */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
            <Car className="h-4 w-4 text-primary" />
            Current mappings
          </h2>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => emailMutation.mutate()}
            disabled={emailMutation.isPending}
          >
            <Mail className="h-4 w-4" />
            Email Mappings
          </Button>
        </div>
        {mappedDrivers.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No mappings yet
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(() => {
              const grouped = new Map<number, { host: Host; drivers: Driver[] }>();
              for (const d of mappedDrivers) {
                const host = hostData.find((h) => h.id === d.hostRefId);
                if (!host) continue;
                if (!grouped.has(host.id)) {
                  grouped.set(host.id, { host, drivers: [] });
                }
                grouped.get(host.id)!.drivers.push(d);
              }
              return Array.from(grouped.values()).map(({ host, drivers: hostDrivers }) => {
                // What the house is actually getting: people, not driver rows
                const taken = hostDrivers.reduce(
                  (sum, d) => sum + seatCount(d.students ?? []),
                  0
                );
                const capacity = hostDrivers.reduce((sum, d) => sum + d.capacity, 0);

                return (
                <Card key={host.id}>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-sm">
                      <Home className="h-4 w-4 shrink-0 text-primary" />
                      <span className="truncate">{host.fullname}</span>
                      <Badge
                        variant="outline"
                        className="ml-auto shrink-0 text-xs tabular-nums"
                        title={`${taken} of ${capacity} seats filled across ${
                          hostDrivers.length
                        } driver${hostDrivers.length === 1 ? "" : "s"}`}
                      >
                        {taken}/{capacity}
                      </Badge>
                    </CardTitle>
                    {host.address && (
                      <p className="text-xs text-muted-foreground truncate">{host.address}</p>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-1">
                    {hostDrivers.map((d) => (
                      <div key={d.id} className={cn(
                        "flex items-center gap-2 rounded-md px-2 py-1.5",
                        d.isPresent
                          ? "bg-green-100 dark:bg-green-950/40"
                          : "bg-red-100 dark:bg-red-950/40"
                      )}>
                        <Car className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        <span className="text-sm truncate">{d.fullname}</span>
                        <DriverNumber displayId={d.displayId} />
                        <Badge variant="outline" className="ml-auto text-xs shrink-0 tabular-nums">
                          {seatCount(d.students ?? [])}/{d.capacity}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 shrink-0"
                          onClick={() =>
                            unmapMutation.mutate({
                              driverId: d.id,
                              hostId: d.hostRefId!,
                            })
                          }
                          disabled={unmapMutation.isPending}
                        >
                          <Unlink className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </CardContent>
                </Card>
                );
              });
            })()}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// MappingsPage
// ---------------------------------------------------------------------------

export function MappingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("student-driver");

  return (
    <Container className="py-8">
      {/* Tabs */}
      <div className="mb-6 flex gap-1 rounded-lg border bg-muted/40 p-1">
        <button
          onClick={() => setActiveTab("student-driver")}
          className={cn(
            "flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors",
            activeTab === "student-driver"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <Users className="h-4 w-4" />
          Student
          <ArrowRight className="h-3 w-3" />
          Driver
        </button>
        <button
          onClick={() => setActiveTab("driver-host")}
          className={cn(
            "flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors",
            activeTab === "driver-host"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <Car className="h-4 w-4" />
          Driver
          <ArrowRight className="h-3 w-3" />
          Host
        </button>
      </div>

      {/* Active section */}
      {activeTab === "student-driver" ? (
        <StudentDriverSection />
      ) : (
        <DriverHostSection />
      )}
    </Container>
  );
}
