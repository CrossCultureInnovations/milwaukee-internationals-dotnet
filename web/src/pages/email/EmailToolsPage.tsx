import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Mail, Send, Users, Car, Home, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { api, ApiError } from "../../api";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Container } from "../../components/layout/Container";
import { useStudents, useDrivers } from "../../lib/hooks/useApiQueries";

function EmailAction({
  title,
  description,
  icon: Icon,
  onSend,
  isPending,
  result,
}: {
  title: string;
  description: string;
  icon: React.ElementType;
  onSend: () => void;
  isPending: boolean;
  result: { success: boolean; message: string } | null;
}) {
  return (
    <Card>
      <CardContent className="flex items-start gap-4 p-6">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-medium text-foreground">{title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          {result && (
            <div className="mt-3 flex items-center gap-2 text-sm">
              {result.success ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span className="text-green-700 dark:text-green-400">{result.message}</span>
                </>
              ) : (
                <>
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <span className="text-red-700 dark:text-red-400">{result.message}</span>
                </>
              )}
            </div>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onSend}
          disabled={isPending}
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Send className="mr-1 h-3 w-3" /> Send
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

export function EmailToolsPage() {
  const students = useStudents();
  const drivers = useDrivers();

  const [sdResult, setSdResult] = useState<{ success: boolean; message: string } | null>(null);
  const [dhResult, setDhResult] = useState<{ success: boolean; message: string } | null>(null);
  const [scResult, setScResult] = useState<{ success: boolean; message: string } | null>(null);
  const [dcResult, setDcResult] = useState<{ success: boolean; message: string } | null>(null);

  const sdEmail = useMutation({
    mutationFn: () => api.emailStudentDriverMappings(),
    onSuccess: () => setSdResult({ success: true, message: "Mapping emails sent to drivers" }),
    onError: (err) =>
      setSdResult({ success: false, message: err instanceof ApiError ? err.message : "Failed" }),
  });

  const dhEmail = useMutation({
    mutationFn: () => api.emailDriverHostMappings(),
    onSuccess: () => setDhResult({ success: true, message: "Mapping emails sent to hosts" }),
    onError: (err) =>
      setDhResult({ success: false, message: err instanceof ApiError ? err.message : "Failed" }),
  });

  const studentCheckIn = useMutation({
    mutationFn: () => api.sendStudentCheckIn(),
    onSuccess: () => setScResult({ success: true, message: "Check-in emails sent to students" }),
    onError: (err) =>
      setScResult({ success: false, message: err instanceof ApiError ? err.message : "Failed" }),
  });

  const driverCheckIn = useMutation({
    mutationFn: () => api.sendDriverCheckIn(),
    onSuccess: () => setDcResult({ success: true, message: "Check-in emails sent to drivers" }),
    onError: (err) =>
      setDcResult({ success: false, message: err instanceof ApiError ? err.message : "Failed" }),
  });

  const studentCount = students.data?.length ?? 0;
  const driverCount = drivers.data?.length ?? 0;
  const mappedStudents = students.data?.filter((s) => s.driverRefId != null).length ?? 0;
  const mappedDrivers = drivers.data?.filter((d) => d.hostRefId != null).length ?? 0;

  return (
    <Container className="py-8">
      <div className="mb-8">
        <h1 className="font-heading text-2xl text-foreground">Email & Notifications</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Send bulk emails and notifications
        </p>
      </div>

      {/* Quick stats */}
      <div className="mb-6 flex flex-wrap gap-2">
        <Badge variant="outline">
          <Users className="mr-1 h-3 w-3" />
          {studentCount} students
        </Badge>
        <Badge variant="outline">
          <Car className="mr-1 h-3 w-3" />
          {driverCount} drivers
        </Badge>
        <Badge variant="outline">{mappedStudents} students mapped</Badge>
        <Badge variant="outline">{mappedDrivers} drivers mapped to hosts</Badge>
      </div>

      <div className="space-y-4">
        <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
          Mapping Notifications
        </h2>

        <EmailAction
          title="Email Student-Driver Mappings"
          description="Send each driver an email with their assigned student list, pickup details, and contact info."
          icon={Car}
          onSend={() => {
            setSdResult(null);
            sdEmail.mutate();
          }}
          isPending={sdEmail.isPending}
          result={sdResult}
        />

        <EmailAction
          title="Email Driver-Host Mappings"
          description="Send each host an email with their assigned driver list and arrival details."
          icon={Home}
          onSend={() => {
            setDhResult(null);
            dhEmail.mutate();
          }}
          isPending={dhEmail.isPending}
          result={dhResult}
        />

        <h2 className="mt-8 text-sm font-medium uppercase tracking-wider text-muted-foreground">
          Check-in Notifications
        </h2>

        <EmailAction
          title="Send Student Check-in"
          description="Send check-in notification to all registered students."
          icon={Mail}
          onSend={() => {
            setScResult(null);
            studentCheckIn.mutate();
          }}
          isPending={studentCheckIn.isPending}
          result={scResult}
        />

        <EmailAction
          title="Send Driver Check-in"
          description="Send check-in notification to all registered drivers."
          icon={Mail}
          onSend={() => {
            setDcResult(null);
            driverCheckIn.mutate();
          }}
          isPending={driverCheckIn.isPending}
          result={dcResult}
        />
      </div>
    </Container>
  );
}
