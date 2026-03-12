import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { BarChart3, Globe, Users, GraduationCap, Car, Home } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Skeleton } from "../../components/ui/skeleton";
import { Badge } from "../../components/ui/badge";
import { Container } from "../../components/layout/Container";
import { useStudents, useDrivers, useHosts, useConfig } from "../../lib/hooks/useApiQueries";

const COLORS = [
  "hsl(213, 72%, 37%)",
  "hsl(170, 60%, 40%)",
  "hsl(340, 65%, 47%)",
  "hsl(45, 80%, 50%)",
  "hsl(260, 55%, 50%)",
  "hsl(25, 75%, 47%)",
  "hsl(190, 65%, 42%)",
  "hsl(310, 50%, 45%)",
  "hsl(100, 50%, 40%)",
  "hsl(0, 60%, 50%)",
];

export function ReportsPage() {
  const students = useStudents();
  const drivers = useDrivers();
  const hosts = useHosts();
  const config = useConfig();

  const studentData = students.data ?? [];
  const driverData = drivers.data ?? [];
  const hostData = hosts.data ?? [];

  const countryData = useMemo(() => {
    const map: Record<string, number> = {};
    for (const s of studentData) {
      if (s.country) map[s.country] = (map[s.country] || 0) + 1;
    }
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => ({ name, value }));
  }, [studentData]);

  const universityData = useMemo(() => {
    const map: Record<string, number> = {};
    for (const s of studentData) {
      if (s.university) map[s.university] = (map[s.university] || 0) + 1;
    }
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, value]) => ({ name, value }));
  }, [studentData]);

  const capacityData = useMemo(() => {
    const totalCapacity = driverData.reduce((sum, d) => sum + d.capacity, 0);
    const assignedStudents = studentData.filter((s) => s.driverRefId != null).length;
    return [
      { name: "Assigned", value: assignedStudents },
      { name: "Available", value: Math.max(0, totalCapacity - assignedStudents) },
    ];
  }, [studentData, driverData]);

  const summaryStats = useMemo(() => {
    const presentStudents = studentData.filter((s) => s.isPresent).length;
    const presentDrivers = driverData.filter((d) => d.isPresent).length;
    const mappedStudents = studentData.filter((s) => s.driverRefId != null).length;
    const mappedDrivers = driverData.filter((d) => d.hostRefId != null).length;
    const familyStudents = studentData.filter((s) => s.isFamily).length;
    const totalDependents = studentData.reduce((s, st) => s + st.familySize, 0);
    const needCarSeat = studentData.filter((s) => s.needCarSeat).length;
    const kosher = studentData.filter((s) => s.kosherFood).length;

    return {
      presentStudents,
      presentDrivers,
      mappedStudents,
      mappedDrivers,
      familyStudents,
      totalDependents,
      needCarSeat,
      kosher,
    };
  }, [studentData, driverData]);

  const isLoading = students.isLoading || drivers.isLoading || hosts.isLoading;

  return (
    <Container className="py-8">
      <div className="mb-8">
        <h1 className="font-heading text-2xl text-foreground">Reports & Stats</h1>
        {config.data && (
          <p className="mt-1 text-sm text-muted-foreground">
            Year {config.data.yearValue} overview
          </p>
        )}
      </div>

      {/* Summary row */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: "Students",
            value: studentData.length,
            sub: `${summaryStats.presentStudents} present`,
            icon: GraduationCap,
          },
          {
            label: "Drivers",
            value: driverData.length,
            sub: `${summaryStats.presentDrivers} present`,
            icon: Car,
          },
          {
            label: "Hosts",
            value: hostData.length,
            sub: `${summaryStats.mappedDrivers} drivers mapped`,
            icon: Home,
          },
          {
            label: "Countries",
            value: countryData.length,
            sub: `${summaryStats.totalDependents} dependents`,
            icon: Globe,
          },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <stat.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                {isLoading ? (
                  <Skeleton className="mt-1 h-7 w-12" />
                ) : (
                  <>
                    <p className="text-2xl font-semibold text-foreground">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.sub}</p>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Detail badges */}
      {!isLoading && (
        <div className="mb-8 flex flex-wrap gap-2">
          <Badge variant="outline">
            <Users className="mr-1 h-3 w-3" />
            {summaryStats.familyStudents} families
          </Badge>
          <Badge variant="outline">{summaryStats.mappedStudents} students mapped</Badge>
          <Badge variant="outline">{summaryStats.needCarSeat} need car seat</Badge>
          <Badge variant="outline">{summaryStats.kosher} kosher</Badge>
        </div>
      )}

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Country distribution bar chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Globe className="h-4 w-4 text-primary" />
              Students by Country
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : countryData.length === 0 ? (
              <p className="py-12 text-center text-sm text-muted-foreground">No data</p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={countryData.slice(0, 12)}
                  margin={{ top: 4, right: 4, bottom: 4, left: 4 }}
                >
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11 }}
                    angle={-35}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="hsl(213, 72%, 37%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* University distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <GraduationCap className="h-4 w-4 text-primary" />
              Top Universities
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : universityData.length === 0 ? (
              <p className="py-12 text-center text-sm text-muted-foreground">No data</p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={universityData}
                  layout="vertical"
                  margin={{ top: 4, right: 4, bottom: 4, left: 80 }}
                >
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                  <YAxis
                    dataKey="name"
                    type="category"
                    tick={{ fontSize: 11 }}
                    width={76}
                  />
                  <Tooltip />
                  <Bar dataKey="value" fill="hsl(170, 60%, 40%)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Driver capacity pie */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Car className="h-4 w-4 text-primary" />
              Driver Capacity Usage
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[280px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={capacityData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {capacityData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Country pie chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="h-4 w-4 text-primary" />
              Country Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[280px] w-full" />
            ) : countryData.length === 0 ? (
              <p className="py-12 text-center text-sm text-muted-foreground">No data</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={countryData.slice(0, 8)}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    dataKey="value"
                    label={({ name, percent }: { name?: string; percent?: number }) =>
                      `${name ?? ""} ${((percent ?? 0) * 100).toFixed(0)}%`
                    }
                  >
                    {countryData.slice(0, 8).map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </Container>
  );
}
