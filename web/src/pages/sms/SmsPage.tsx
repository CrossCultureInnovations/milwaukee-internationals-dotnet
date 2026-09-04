import { useState, type FormEvent } from "react";
import { useMutation } from "@tanstack/react-query";
import { AlertCircle, CheckCircle2, Loader2, MessageSquareText, Send } from "lucide-react";
import { api, ApiError } from "../../api";
import { Container } from "../../components/layout/Container";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";

const MAX_MESSAGE_LENGTH = 160;

export function SmsPage() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [message, setMessage] = useState("");
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const sendSms = useMutation({
    mutationFn: () => api.sendSms({
      phoneNumber: phoneNumber.trim(),
      message: message.trim(),
    }),
    onSuccess: (response) => {
      setResult({ success: true, message: response.message });
      setMessage("");
    },
    onError: (error) => setResult({
      success: false,
      message: error instanceof ApiError ? error.message : "Failed to send SMS.",
    }),
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setResult(null);
    sendSms.mutate();
  };

  const canSend = phoneNumber.trim().length > 0 && message.trim().length > 0;

  return (
    <Container className="py-8">
      <div className="mb-8">
        <h1 className="font-heading text-2xl text-foreground">Send SMS</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Send an ad hoc text message to a phone number
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
            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Phone number</Label>
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
                required
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
                  Send SMS
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </Container>
  );
}