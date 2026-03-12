import {
  Settings,
  Calendar,
  MapPin,
  Clock,
  Users,
  Car,
  Mail,
  Palette,
  ToggleRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Skeleton } from "../../components/ui/skeleton";
import { Container } from "../../components/layout/Container";
import { useConfig } from "../../lib/hooks/useApiQueries";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function FeatureBadge({ enabled, label }: { enabled: boolean; label: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border p-3">
      <span className="text-sm text-foreground">{label}</span>
      {enabled ? (
        <Badge className="border-green-500/30 text-green-600" variant="outline">
          Enabled
        </Badge>
      ) : (
        <Badge className="border-red-500/30 text-red-500" variant="outline">
          Disabled
        </Badge>
      )}
    </div>
  );
}

function ConfigItem({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border p-3">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground">{value || "\u2014"}</span>
    </div>
  );
}

function CardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-32" />
      </CardHeader>
      <CardContent className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export function ConfigPage() {
  const { data: config, isLoading } = useConfig();

  if (isLoading) {
    return (
      <Container className="py-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Settings className="h-5 w-5" />
          </div>
          <h1 className="font-heading text-2xl text-foreground">Configuration</h1>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </Container>
    );
  }

  if (!config) {
    return (
      <Container className="py-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Settings className="h-5 w-5" />
          </div>
          <h1 className="font-heading text-2xl text-foreground">Configuration</h1>
        </div>
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Unable to load configuration.
          </CardContent>
        </Card>
      </Container>
    );
  }

  return (
    <Container className="py-8">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Settings className="h-5 w-5" />
        </div>
        <div>
          <h1 className="font-heading text-2xl text-foreground">Configuration</h1>
          <p className="text-sm text-muted-foreground">
            Global application settings (read-only)
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* General */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Palette className="h-4 w-4 text-primary" />
              General
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <ConfigItem label="Year" value={config.yearValue} />
            <ConfigItem label="Theme" value={config.theme} />
          </CardContent>
        </Card>

        {/* Tour Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <MapPin className="h-4 w-4 text-primary" />
              Tour Info
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <ConfigItem
              label="Tour Date"
              value={
                config.tourDate
                  ? new Date(config.tourDate).toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  : "\u2014"
              }
            />
            <ConfigItem label="Tour Address" value={config.tourAddress} />
            <ConfigItem label="Tour Location" value={config.tourLocation} />
            <ConfigItem
              label="Host Arrival Time"
              value={config.arrivalTimeForHost}
            />
          </CardContent>
        </Card>

        {/* Limits */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-4 w-4 text-primary" />
              Limits
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <ConfigItem
              label="Max Student Seats"
              value={config.maxLimitStudentSeats}
            />
            <ConfigItem label="Max Drivers" value={config.maxLimitDrivers} />
          </CardContent>
        </Card>

        {/* Email */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Mail className="h-4 w-4 text-primary" />
              Email
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <FeatureBadge
              enabled={config.emailTestMode}
              label="Email Test Mode"
            />
            <ConfigItem
              label="Sender (On Behalf)"
              value={config.emailSenderOnBehalf}
            />
            <FeatureBadge
              enabled={config.qrInStudentEmail}
              label="QR in Student Email"
            />
          </CardContent>
        </Card>

        {/* Features */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ToggleRight className="h-4 w-4 text-primary" />
              Features
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <FeatureBadge
                enabled={config.eventFeature}
                label="Events"
              />
              <FeatureBadge
                enabled={config.smsTestMode}
                label="SMS Test Mode"
              />
              <FeatureBadge
                enabled={config.disallowDuplicateStudents}
                label="Disallow Duplicate Students"
              />
              <FeatureBadge
                enabled={config.recordApiEvents}
                label="Record API Events"
              />
              <FeatureBadge
                enabled={config.locationWizardFeature}
                label="Location Wizard"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </Container>
  );
}
