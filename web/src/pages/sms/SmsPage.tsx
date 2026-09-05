import { useState, useMemo, type FormEvent } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { AlertCircle, CheckCircle2, Loader2, MessageSquareText, Send } from "lucide-react";
import { api, ApiError } from "../../api";
import { Container } from "../../components/layout/Container";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Checkbox } from "../../components/ui/checkbox";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";

const MAX_MESSAGE_LENGTH = 160;

type GroupKey = "drivers" | "hosts" | "students";

const GROUPS: { key: GroupKey; label: string; countKey: "driverCount" | "hostCount" | "studentCount" }[] = [
  { key: "drivers", label: "Drivers", countKey: "driverCount" },
  { key: "hosts", label: "Hosts", countKey: "hostCount" },
  { key: "students", label: "Students", countKey: "studentCount" },
];

export function SmsPage() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [message, setMessage] = useState("");
  const [groups, setGroups] = useState<Record<GroupKey, boolean>>({
    drivers: false,
    hosts: false,
    students: false,
  });
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  // Counts come from the server so they match exactly who a send resolves to
  const smsForm = useQuery({
    queryKey: ["sms-form"],
    queryFn: () => api.getSmsForm(),
  });

  const selected = useMemo(
    () => GROUPS.filter((g) => groups[g.key]),
    [groups]
  );

  const groupRecipients = useMemo(
    () =>
      smsForm.data
        ? selected.reduce((sum, g) => sum + smsForm.data[g.countKey], 0)
        : 0,
    [selected, smsForm.data]
  );

  const sendSms = useMutation({
    mutationFn: () =>
      api.sendBulkSms({
        drivers: groups.drivers,
        hosts: groups.hosts,
        students: groups.students,
        message: message.trim(),
        additionalRecipients: phoneNumber.trim() || undefined,
      }),
    onSuccess: (response) => {
      setResult({ success: true, message: response.message });
      setMessage("");
    },
    onError: (error) =>
      setResult({
        success: false,
        message: error instanceof ApiError ? error.message : "Failed to send SMS.",
      }),
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setResult(null);

    // Texting a whole group costs real money on real phones — say the number out loud
    if (selected.length > 0) {
      const who = selected
        .map((g) => `${smsForm.data?.[g.countKey] ?? 0} ${g.label.toLowerCase()}`)
        .join(" and ");

      if (!window.confirm(`Text ${who}?`)) {
        return;
      }
    }

    sendSms.mutate();
  };

  const hasRecipients = selected.length > 0 || phoneNumber.trim().length > 0;
  const canSend = hasRecipients && message.trim().length > 0;

  return (
    <Container className="py-8">
      <div className="mb-8">
        <h1 className="font-heading text-2xl text-foreground">Send SMS</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Text a group from this year, a single number, or both
        </p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <MessageSquareText className="h-5 w-5" />
            </div>
            <CardTitle>New message</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <fieldset className="space-y-2">
              <legend className="text-sm font-medium text-foreground">Send to</legend>
              <div className="space-y-2 pt-1">
                {GROUPS.map((group) => (
                  <label
                    key={group.key}
                    className="flex cursor-pointer items-center gap-3 text-sm"
                  >
                    <Checkbox
                      checked={groups[group.key]}
                      onCheckedChange={(checked) => {
                        setGroups((prev) => ({
                          ...prev,
                          [group.key]: checked === true,
                        }));
                        setResult(null);
                      }}
                    />
                    <span className="text-foreground">{group.label}</span>
                    <span className="tabular-nums text-muted-foreground">
                      {smsForm.isLoading ? "—" : smsForm.data?.[group.countKey] ?? 0}
                    </span>
                  </label>
                ))}
              </div>
              {smsForm.isError && (
                <p className="text-xs text-muted-foreground">
                  Could not load recipient counts. You can still text a single number.
                </p>
              )}
            </fieldset>

            <div className="space-y-2">
              <Label htmlFor="phoneNumber">
                Phone number{" "}
                <span className="font-normal text-muted-foreground">(optional)</span>
              </Label>
              <Input
                id="phoneNumber"
                type="tel"
                autoComplete="tel"
                placeholder="+1 414 555 0123"
                value={phoneNumber}
                onChange={(event) => {
                  setPhoneNumber(event.target.value);
                  setResult(null);
                }}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-4">
                <Label htmlFor="message">Message</Label>
                <span className="text-xs tabular-nums text-muted-foreground">
                  {message.length}/{MAX_MESSAGE_LENGTH}
                </span>
              </div>
              <textarea
                id="message"
                rows={5}
                maxLength={MAX_MESSAGE_LENGTH}
                placeholder="Enter your message"
                value={message}
                onChange={(event) => {
                  setMessage(event.target.value);
                  setResult(null);
                }}
                required
                className="flex w-full resize-y rounded-xl border border-input bg-background px-4 py-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
              />
            </div>

            {result && (
              <div
                role="status"
                className={`flex items-center gap-2 text-sm ${
                  result.success
                    ? "text-green-700 dark:text-green-400"
                    : "text-red-700 dark:text-red-400"
                }`}
              >
                {result.success ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                ) : (
                  <AlertCircle className="h-4 w-4 shrink-0" />
                )}
                <span>{result.message}</span>
              </div>
            )}

            <Button type="submit" disabled={!canSend || sendSms.isPending}>
              {sendSms.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  {selected.length > 0
                    ? `Send to ${groupRecipients}${
                        phoneNumber.trim() ? " + 1" : ""
                      } recipient${
                        groupRecipients + (phoneNumber.trim() ? 1 : 0) === 1 ? "" : "s"
                      }`
                    : "Send SMS"}
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </Container>
  );
}
