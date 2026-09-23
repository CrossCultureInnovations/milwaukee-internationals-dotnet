import { useEffect, useRef } from "react";
import "cap-widget";

type SolveEvent = CustomEvent<{ token: string }>;

export function CapWidget({
  captchaEndpoint,
  onVerified,
}: {
  captchaEndpoint: string;
  onVerified: (token: string | null) => void;
}) {
  const widgetRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const widget = widgetRef.current;
    if (!widget) return;

    const handleSolve = (event: Event) => {
      onVerified((event as SolveEvent).detail.token);
    };
    const handleError = () => onVerified(null);

    widget.addEventListener("solve", handleSolve);
    widget.addEventListener("error", handleError);
    return () => {
      widget.removeEventListener("solve", handleSolve);
      widget.removeEventListener("error", handleError);
    };
  }, [onVerified]);

  return (
    <cap-widget
      ref={widgetRef}
      data-cap-api-endpoint={captchaEndpoint}
      style={{ width: "100%" }}
    />
  );
}