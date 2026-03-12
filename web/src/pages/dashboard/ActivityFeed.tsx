import { User, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { cn } from "../../lib/utils";
import { useSignalR, type SignalRMessage } from "../../lib/hooks/useSignalR";

function relativeTime(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 5) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function MessageRow({ message }: { message: SignalRMessage }) {
  const Icon = message.type === "log" ? User : Zap;

  return (
    <div className="flex items-start gap-3 py-2">
      <div
        className={cn(
          "mt-0.5 rounded-md p-1.5",
          message.type === "log"
            ? "bg-blue-100 text-blue-600"
            : "bg-amber-100 text-amber-600",
        )}
      >
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm leading-snug truncate">{message.text}</p>
        <p className="text-xs text-muted-foreground">{relativeTime(message.timestamp)}</p>
      </div>
    </div>
  );
}

export function ActivityFeed() {
  const { isConnected, onlineCount, messages } = useSignalR();

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <span
            className={cn(
              "inline-block h-2 w-2 rounded-full",
              isConnected ? "bg-green-500" : "bg-gray-400",
            )}
          />
          Live Activity
        </CardTitle>
        <Badge variant="secondary">{onlineCount} online</Badge>
      </CardHeader>
      <CardContent>
        <div className="max-h-80 overflow-y-auto divide-y">
          {messages.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No activity yet
            </p>
          ) : (
            messages.map((msg) => <MessageRow key={msg.id} message={msg} />)
          )}
        </div>
      </CardContent>
    </Card>
  );
}
