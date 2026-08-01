import { useEffect, useRef } from "react";
import "altcha";
import type {} from "altcha/types/react";

const CHALLENGE_URL =
  import.meta.env.VITE_ALTCHA_CHALLENGE_URL ??
  "https://altcha.coolify.hesamian.com/v1/challenge?apiKey=key_1jutkartq00f34k9kb4";

type VerifiedEvent = CustomEvent<{ payload: string }>;

export function AltchaWidget({
  onVerified,
}: {
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
      challenge={CHALLENGE_URL}
      type="checkbox"
      style={{ width: "100%" }}
    />
  );
}