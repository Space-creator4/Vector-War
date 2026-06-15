import { useEffect, useState } from "react";
import { wsUrl } from "../api/client.js";

export function useGameSocket(token) {
  const [connected, setConnected] = useState(false);
  const [events, setEvents] = useState([]);
  const [state, setState] = useState(null);

  useEffect(() => {
    if (!token) return;
    const socket = new WebSocket(wsUrl(token));

    socket.addEventListener("open", () => setConnected(true));
    socket.addEventListener("close", () => setConnected(false));
    socket.addEventListener("message", (event) => {
      const message = JSON.parse(event.data);
      if (message.type === "state_update") {
        setState(message.payload);
        return;
      }

      if (["combat_event", "unit_destroyed", "order_started", "order_complete"].includes(message.type)) {
        setEvents((current) => [message, ...current].slice(0, 8));
      }
    });

    return () => socket.close();
  }, [token]);

  return { connected, events, state };
}
