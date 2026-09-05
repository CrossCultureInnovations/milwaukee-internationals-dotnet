import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, AlertCircle } from "lucide-react";
import { api, type EmailPreviewKind } from "../api";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "./ui/select";

export type PreviewRecipient = { id: number; label: string };

/**
 * Shows the email a given recipient would receive, rendered by the same
 * server-side builder that sends it.
 *
 * The body is dropped into a sandboxed iframe rather than the page: it is
 * assembled from registrant-supplied text with no escaping, so rendering it
 * inline would make a name field into stored XSS against this admin session.
 * The sandbox also stops the per-recipient check-in link from being opened by
 * accident.
 */
export function EmailPreviewDialog({
  open,
  onOpenChange,
  kind,
  title,
  recipients,
  recipientNoun,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kind: EmailPreviewKind;
  title: string;
  recipients: PreviewRecipient[];
  recipientNoun: string;
}) {
  const [recipientId, setRecipientId] = useState<number | undefined>();

  // Land on the first recipient, and follow the list if it arrives late
  useEffect(() => {
    if (recipientId == null && recipients.length > 0) {
      setRecipientId(recipients[0].id);
    }
  }, [recipients, recipientId]);

  const preview = useQuery({
    queryKey: ["email-preview", kind, recipientId],
    queryFn: () => api.previewEmail(kind, recipientId),
    enabled: open && recipientId != null,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle className="pr-8 font-heading text-lg text-foreground">
          {title}
        </DialogTitle>
        <DialogDescription className="mt-1 text-sm text-muted-foreground">
          The email as this {recipientNoun} would receive it. Nothing is sent
          from here.
        </DialogDescription>

        <div className="mt-4">
          <Select
            value={recipientId != null ? String(recipientId) : undefined}
            onValueChange={(v) => setRecipientId(Number(v))}
          >
            <SelectTrigger className="w-full sm:w-72">
              <SelectValue placeholder={`Choose a ${recipientNoun}`} />
            </SelectTrigger>
            <SelectContent>
              {recipients.map((r) => (
                <SelectItem key={r.id} value={String(r.id)}>
                  {r.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {preview.data && (
          <dl className="mt-4 space-y-1 border-t border-border pt-3 text-sm">
            <div className="flex gap-2">
              <dt className="w-16 shrink-0 text-muted-foreground">To</dt>
              <dd className="min-w-0 break-all text-foreground">
                {preview.data.to || "No email address on file"}
              </dd>
            </div>
            <div className="flex gap-2">
              <dt className="w-16 shrink-0 text-muted-foreground">Subject</dt>
              <dd className="min-w-0 text-foreground">{preview.data.subject}</dd>
            </div>
          </dl>
        )}

        <div className="mt-3 min-h-0 flex-1 overflow-hidden rounded-lg border border-border">
          {preview.isLoading ? (
            <div className="flex h-64 items-center justify-center text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : preview.isError ? (
            <div className="flex h-64 flex-col items-center justify-center gap-2 px-6 text-center">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <p className="text-sm text-muted-foreground">
                Could not render this email. Check that the {recipientNoun} still
                exists, then try again.
              </p>
            </div>
          ) : preview.data ? (
            <iframe
              // Empty sandbox: no scripts, no navigation, opaque origin
              sandbox=""
              srcDoc={preview.data.body}
              title={`Email preview for ${preview.data.recipientName}`}
              className="h-[45vh] w-full bg-white"
            />
          ) : (
            <div className="flex h-64 items-center justify-center px-6 text-center text-sm text-muted-foreground">
              No {recipientNoun}s to preview yet.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
