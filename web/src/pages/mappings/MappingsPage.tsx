import { useState } from "react";
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
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "../../components/ui/table";
import { cn } from "../../lib/utils";

type Tab = "student-driver" | "driver-host";

// ---------------------------------------------------------------------------
// Student-Driver Section
// ---------------------------------------------------------------------------

function StudentDriverSection() {
  const queryClient = useQueryClient();
  const students = useStudents();
  const drivers = useDrivers();

  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [selectedDriverId, setSelectedDriverId] = useState<number | null>(null);
  const [studentSearch, setStudentSearch] = useState("");
  const [driverSearch, setDriverSearch] = useState("");

  const studentData = students.data ?? [];
  const driverData = drivers.data ?? [];

  const unmappedStudents = studentData.filter((s) => s.driverRefId == null);
  const mappedStudents = studentData.filter((s) => s.driverRefId != null);

  const filteredUnmapped = unmappedStudents.filter((s) =>
    s.fullname.toLowerCase().includes(studentSearch.toLowerCase()),
  );
  const filteredDrivers = driverData.filter((d) =>
    d.fullname.toLowerCase().includes(driverSearch.toLowerCase()),
  );

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

  const isLoading = students.isLoading || drivers.isLoading;

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
                {filteredUnmapped.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSelectedStudentId(s.id === selectedStudentId ? null : s.id)}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-accent",
                      s.id === selectedStudentId && "bg-primary/10 text-primary",
                    )}
                  >
                    <Users className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <span className="truncate">{s.fullname}</span>
                    {s.needCarSeat && (
                      <Badge variant="outline" className="ml-auto text-xs">
                        Car seat
                      </Badge>
                    )}
                  </button>
                ))}
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
                {filteredDrivers.map((d) => (
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
                    <Badge
                      variant={d.students.length >= d.capacity ? "secondary" : "outline"}
                      className="ml-auto text-xs"
                    >
                      {d.students.length}/{d.capacity}
                    </Badge>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mapped pairs table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-4 w-4 text-primary" />
            Current mappings
          </CardTitle>
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
        </CardHeader>
        <CardContent>
          {mappedStudents.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No mappings yet
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Driver</TableHead>
                    <TableHead>Capacity</TableHead>
                    <TableHead className="w-[80px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mappedStudents.map((s) => {
                    const driver = driverData.find((d) => d.id === s.driverRefId);
                    return (
                      <TableRow key={s.id}>
                        <TableCell className="font-medium">{s.fullname}</TableCell>
                        <TableCell>{driver?.fullname ?? "Unknown"}</TableCell>
                        <TableCell>
                          {driver && (
                            <Badge variant="outline">
                              {driver.students.length}/{driver.capacity}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              unmapMutation.mutate({
                                studentId: s.id,
                                driverId: s.driverRefId!,
                              })
                            }
                            disabled={unmapMutation.isPending}
                          >
                            <Unlink className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
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

      {/* Mapped pairs table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="flex items-center gap-2 text-base">
            <Car className="h-4 w-4 text-primary" />
            Current mappings
          </CardTitle>
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
        </CardHeader>
        <CardContent>
          {mappedDrivers.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No mappings yet
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Driver</TableHead>
                    <TableHead>Students</TableHead>
                    <TableHead>Host</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead className="w-[80px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mappedDrivers.map((d) => {
                    const host = hostData.find((h) => h.id === d.hostRefId);
                    return (
                      <TableRow key={d.id}>
                        <TableCell className="font-medium">{d.fullname}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {d.students.length}/{d.capacity}
                          </Badge>
                        </TableCell>
                        <TableCell>{host?.fullname ?? "Unknown"}</TableCell>
                        <TableCell className="max-w-[200px] truncate text-muted-foreground">
                          {host?.address}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              unmapMutation.mutate({
                                driverId: d.id,
                                hostId: d.hostRefId!,
                              })
                            }
                            disabled={unmapMutation.isPending}
                          >
                            <Unlink className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
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
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-heading text-2xl text-foreground">Mappings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage student-driver and driver-host assignments
        </p>
      </div>

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
