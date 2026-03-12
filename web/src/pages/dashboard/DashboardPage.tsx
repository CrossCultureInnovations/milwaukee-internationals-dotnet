import { Link } from "react-router-dom";
import {
  GraduationCap,
  Car,
  Home,
  CalendarDays,
  Globe,
  Users,
  MapPin,
  Clock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Skeleton } from "../../components/ui/skeleton";
import { Badge } from "../../components/ui/badge";
import { Container } from "../../components/layout/Container";
import { useStudents, useDrivers, useHosts, useEvents, useConfig } from "../../lib/hooks/useApiQueries";
import { useAuth } from "../../lib/auth/AuthContext";
import { ActivityFeed } from "./ActivityFeed";

function StatCard({
  title,
  value,
  icon: Icon,
  href,
  loading,
  subtitle,
}: {
  title: string;
  value: number | string;
  icon: React.ElementType;
  href: string;
  loading: boolean;
  subtitle?: string;
}) {
  return (
    <Link to={href}>
      <Card className="group cursor-pointer">
        <CardContent className="flex items-center gap-4 p-6">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-sm text-muted-foreground">{title}</p>
            {loading ? (
              <Skeleton className="mt-1 h-7 w-16" />
            ) : (
              <p className="text-2xl font-semibold tracking-tight text-foreground">
                {value}
              </p>
            )}
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function CountryList({ students }: { students: { country: string }[] }) {
  const countryMap: Record<string, number> = {};
  for (const s of students) {
    if (s.country) {
      countryMap[s.country] = (countryMap[s.country] || 0) + 1;
    }
  }
  const sorted = Object.entries(countryMap).sort((a, b) => b[1] - a[1]);

  if (sorted.length === 0) {
    return <p className="text-sm text-muted-foreground">No data yet</p>;
  }

  const max = sorted[0][1];

  return (
    <div className="space-y-3">
      {sorted.slice(0, 10).map(([country, count]) => (
        <div key={country} className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className="text-foreground">{country}</span>
            <span className="text-muted-foreground">{count}</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-primary/70 transition-all"
              style={{ width: `${(count / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
      {sorted.length > 10 && (
        <p className="text-xs text-muted-foreground">
          +{sorted.length - 10} more countries
        </p>
      )}
    </div>
  );
}

function UpcomingEvents({ events }: { events: { id: number; name: string; dateTime: string; address: string }[] }) {
  const now = new Date();
  const upcoming = events
    .filter((e) => new Date(e.dateTime) >= now)
    .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime())
    .slice(0, 5);

  if (upcoming.length === 0) {
    return <p className="text-sm text-muted-foreground">No upcoming events</p>;
  }

  return (
    <div className="space-y-3">
      {upcoming.map((event) => (
        <Link
          key={event.id}
          to={`/events/${event.id}`}
          className="flex items-start gap-3 rounded-lg p-2 transition-colors hover:bg-accent"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <CalendarDays className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground">{event.name}</p>
            <p className="text-xs text-muted-foreground">
              {new Date(event.dateTime).toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })}
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
}

export function DashboardPage() {
  const { session } = useAuth();
  const students = useStudents();
  const drivers = useDrivers();
  const hosts = useHosts();
  const events = useEvents();
  const config = useConfig();

  const studentData = students.data ?? [];
  const driverData = drivers.data ?? [];
  const hostData = hosts.data ?? [];
  const eventData = events.data ?? [];
  const configData = config.data;

  const presentStudents = studentData.filter((s) => s.isPresent).length;
  const presentDrivers = driverData.filter((d) => d.isPresent).length;
  const mappedStudents = studentData.filter((s) => s.driverRefId != null).length;
  const mappedDrivers = driverData.filter((d) => d.hostRefId != null).length;

  return (
    <Container className="py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-heading text-2xl text-foreground">
          Welcome back{session?.user?.fullname ? `, ${session.user.fullname}` : ""}
        </h1>
        {configData && (
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <Badge variant="outline">
              <CalendarDays className="mr-1 h-3 w-3" />
              {configData.yearValue}
            </Badge>
            {configData.tourDate && (
              <Badge variant="outline">
                <Clock className="mr-1 h-3 w-3" />
                Tour: {new Date(configData.tourDate).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </Badge>
            )}
            {configData.tourLocation && (
              <Badge variant="outline">
                <MapPin className="mr-1 h-3 w-3" />
                {configData.tourLocation}
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Stat cards */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Students"
          value={studentData.length}
          icon={GraduationCap}
          href="/students"
          loading={students.isLoading}
          subtitle={
            studentData.length > 0
              ? `${presentStudents} present · ${mappedStudents} mapped`
              : undefined
          }
        />
        <StatCard
          title="Drivers"
          value={driverData.length}
          icon={Car}
          href="/drivers"
          loading={drivers.isLoading}
          subtitle={
            driverData.length > 0
              ? `${presentDrivers} present · ${mappedDrivers} mapped`
              : undefined
          }
        />
        <StatCard
          title="Hosts"
          value={hostData.length}
          icon={Home}
          href="/hosts"
          loading={hosts.isLoading}
        />
        <StatCard
          title="Events"
          value={eventData.length}
          icon={CalendarDays}
          href="/events"
          loading={events.isLoading}
        />
      </div>

      {/* Capacity progress */}
      {configData && (
        <div className="mb-8 grid gap-4 sm:grid-cols-2">
          <Card>
            <CardContent className="p-6">
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Student capacity</span>
                <span className="font-medium text-foreground">
                  {studentData.length} / {configData.maxLimitStudentSeats}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{
                    width: `${Math.min(
                      (studentData.length / configData.maxLimitStudentSeats) * 100,
                      100
                    )}%`,
                  }}
                />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Driver capacity</span>
                <span className="font-medium text-foreground">
                  {driverData.length} / {configData.maxLimitDrivers}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{
                    width: `${Math.min(
                      (driverData.length / configData.maxLimitDrivers) * 100,
                      100
                    )}%`,
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Bottom panels */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-primary" />
              Countries represented
            </CardTitle>
          </CardHeader>
          <CardContent>
            {students.isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-6 w-full" />
                ))}
              </div>
            ) : (
              <CountryList students={studentData} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-primary" />
              Upcoming events
            </CardTitle>
          </CardHeader>
          <CardContent>
            {events.isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <UpcomingEvents events={eventData} />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Live activity feed */}
      <div className="mt-6">
        <ActivityFeed />
      </div>
    </Container>
  );
}
