import { useEffect, useRef, useState, useCallback } from "react";
import {
  HubConnectionBuilder,
  HubConnection,
  HubConnectionState,
} from "@microsoft/signalr";

export interface SignalRMessage {
  id: string;
  type: "log" | "event";
  text: string;
  timestamp: Date;
}

const MAX_MESSAGES = 50;

let messageCounter = 0;
function nextId(): string {
  return `msg-${Date.now()}-${++messageCounter}`;
}

export function useSignalR() {
  const connectionRef = useRef<HubConnection | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineCount, setOnlineCount] = useState(0);
  const [messages, setMessages] = useState<SignalRMessage[]>([]);

  const addMessage = useCallback(
    (type: SignalRMessage["type"], text: string) => {
      setMessages((prev) => {
        const next: SignalRMessage[] = [
          { id: nextId(), type, text, timestamp: new Date() },
          ...prev,
        ];
        return next.length > MAX_MESSAGES ? next.slice(0, MAX_MESSAGES) : next;
      });
    },
    [],
  );

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const connection = new HubConnectionBuilder()
      .withUrl("/hub", {
        accessTokenFactory: () => localStorage.getItem("token") ?? "",
      })
      .withAutomaticReconnect()
      .build();

    connectionRef.current = connection;

    connection.on("count", (count: number) => {
      setOnlineCount(count);
    });

    connection.on("log", (action: string, _connectionId: string, userName: string) => {
      addMessage("log", `${userName} ${action}`);
    });

    connection.on(
      "events",
      (event: {
        description: string;
        recordedDate: string;
        rowKey: string;
        partitionKey: string;
      }) => {
        addMessage("event", event.description);
      },
    );

    connection.onreconnecting(() => setIsConnected(false));
    connection.onreconnected(() => setIsConnected(true));
    connection.onclose(() => setIsConnected(false));

    connection
      .start()
      .then(() => setIsConnected(true))
      .catch((err) => console.error("SignalR connection error:", err));

    return () => {
      if (connection.state !== HubConnectionState.Disconnected) {
        connection.stop();
      }
      connectionRef.current = null;
    };
  }, [addMessage]);

  return { isConnected, onlineCount, messages };
}
