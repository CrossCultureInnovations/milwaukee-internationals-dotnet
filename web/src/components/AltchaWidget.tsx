import { useEffect, useRef } from "react";
import "altcha";
import type {} from "altcha/types/react";

type VerifiedEvent = CustomEvent<{ payload: string }>;

export function AltchaWidget({
  challengeUrl,
  onVerified,
}: {
  challengeUrl: string;
  onVerified: (payload: string | null) => void;
}) {
  const widgetRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const widget = widgetRef.current;
    if (!widget) return;

    const handleVerified = (event: Event) => {
      onVerified((event as VerifiedEvent).detail.payload);
    };
    const handleExpired = () => onVerified(null);

    widget.addEventListener("verified", handleVerified);
    widget.addEventListener("expired", handleExpired);
    return () => {
      widget.removeEventListener("verified", handleVerified);
      widget.removeEventListener("expired", handleExpired);
    };
  }, [onVerified]);

  return (
    <altcha-widget
      ref={widgetRef}
      challenge={challengeUrl}
      type="checkbox"
      style={{ width: "100%" }}
    />
  );
}