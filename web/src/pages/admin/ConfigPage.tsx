import { useState, useEffect } from "react";
import {
  Settings,
  MapPin,
  Mail,
  ToggleRight,
  Save,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Skeleton } from "../../components/ui/skeleton";
import { Container } from "../../components/layout/Container";
import { useConfig } from "../../lib/hooks/useApiQueries";
import { api, type GlobalConfigs } from "../../api";
import { useQueryClient } from "@tanstack/react-query";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function FeatureToggle({
  enabled,
  label,
  onToggle,
}: {
  enabled: boolean;
  label: string;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border p-3">
      <span className="text-sm text-foreground">{label}</span>
      <Button
        size="sm"
        variant={enabled ? "default" : "outline"}
        className={
          enabled
            ? "bg-green-600 hover:bg-green-700 text-white"
            : "text-muted-foreground"
        }
        onClick={onToggle}
      >
        {enabled ? "Enabled" : "Disabled"}
      </Button>
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
  const queryClient = useQueryClient();
  const [form, setForm] = useState<GlobalConfigs | null>(null);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (config && !form) {
      setForm({ ...config });
    }
  }, [config, form]);

  function update<K extends keyof GlobalConfigs>(key: K, value: GlobalConfigs[K]) {
    if (!form) return;
    setForm({ ...form, [key]: value });
    setDirty(true);
  }

  async function handleSave() {
    if (!form) return;
    setSaving(true);
    try {
      await api.updateConfig(form);
      await queryClient.invalidateQueries({ queryKey: ["config"] });
      setDirty(false);
    } catch (e) {
      console.error("Failed to save config", e);
    } finally {
      setSaving(false);
    }
  }

  if (isLoading || !form) {
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

  // Generate year options: current year context ± a few years
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 7 }, (_, i) => currentYear - 3 + i);

  return (
    <Container className="py-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Settings className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-heading text-2xl text-foreground">Configuration</h1>
            <p className="text-sm text-muted-foreground">
              Global application settings
            </p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={!dirty || saving}>
          {saving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Save Changes
        </Button>
      </div>

      {/* Year & Limits */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <Label htmlFor="yearSelect" className="text-sm font-medium whitespace-nowrap">
                Year
              </Label>
              <select
                id="yearSelect"
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={form.yearValue}
                onChange={(e) => update("yearValue", Number(e.target.value))}
              >
                {yearOptions.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="maxStudents" className="text-sm whitespace-nowrap">
                Max students
              </Label>
              <Input
                id="maxStudents"
                type="number"
                value={form.maxLimitStudentSeats}
                onChange={(e) => update("maxLimitStudentSeats", Number(e.target.value))}
              />
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="maxDrivers" className="text-sm whitespace-nowrap">
                Max drivers
              </Label>
              <Input
                id="maxDrivers"
                type="number"
                value={form.maxLimitDrivers}
                onChange={(e) => update("maxLimitDrivers", Number(e.target.value))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
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
              <FeatureToggle
                enabled={form.locationWizardFeature}
                label="Location Wizard Feature"
                onToggle={() => update("locationWizardFeature", !form.locationWizardFeature)}
              />
              <FeatureToggle
                enabled={form.emailTestMode}
                label="Email Test Mode"
                onToggle={() => update("emailTestMode", !form.emailTestMode)}
              />
              <FeatureToggle
                enabled={form.smsTestMode}
                label="SMS Test Mode"
                onToggle={() => update("smsTestMode", !form.smsTestMode)}
              />
              <FeatureToggle
                enabled={form.eventFeature}
                label="Ad-Hoc Event Feature"
                onToggle={() => update("eventFeature", !form.eventFeature)}
              />
              <FeatureToggle
                enabled={form.disallowDuplicateStudents}
                label="Disallow registration of duplicate students"
                onToggle={() => update("disallowDuplicateStudents", !form.disallowDuplicateStudents)}
              />
              <FeatureToggle
                enabled={form.recordApiEvents}
                label="Record API events"
                onToggle={() => update("recordApiEvents", !form.recordApiEvents)}
              />
              <FeatureToggle
                enabled={form.qrInStudentEmail}
                label="Display QR code in student email"
                onToggle={() => update("qrInStudentEmail", !form.qrInStudentEmail)}
              />
            </div>
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
            <div className="flex items-center gap-3">
              <Label htmlFor="tourDate" className="text-sm whitespace-nowrap shrink-0">
                Tour time (CST)
              </Label>
              <Input
                id="tourDate"
                type="datetime-local"
                value={form.tourDate ? form.tourDate.slice(0, 16) : ""}
                onChange={(e) => update("tourDate", e.target.value)}
              />
            </div>
            <div className="flex items-center gap-3">
              <Label htmlFor="arrivalTime" className="text-sm whitespace-nowrap shrink-0">
                Arrival time (CST)
              </Label>
              <Input
                id="arrivalTime"
                type="datetime-local"
                value={form.arrivalTimeForHost ? form.arrivalTimeForHost.slice(0, 16) : ""}
                onChange={(e) => update("arrivalTimeForHost", e.target.value)}
              />
            </div>
            <div className="flex items-center gap-3">
              <Label htmlFor="tourAddress" className="text-sm whitespace-nowrap shrink-0">Address</Label>
              <Input
                id="tourAddress"
                value={form.tourAddress || ""}
                onChange={(e) => update("tourAddress", e.target.value)}
              />
            </div>
            <div className="flex items-center gap-3">
              <Label htmlFor="tourLocation" className="text-sm whitespace-nowrap shrink-0">Location</Label>
              <Input
                id="tourLocation"
                value={form.tourLocation || ""}
                onChange={(e) => update("tourLocation", e.target.value)}
              />
            </div>
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
            <div className="flex items-center gap-3">
              <Label htmlFor="emailSender" className="text-sm whitespace-nowrap shrink-0">Sender</Label>
              <Input
                id="emailSender"
                value={form.emailSenderOnBehalf || ""}
                onChange={(e) => update("emailSenderOnBehalf", e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

      </div>
    </Container>
  );
}
