import { WebSocketServer } from "ws";
import { getPlayer } from "../db/index.js";
import { verifyToken } from "../auth/jwt.js";

export class RealtimeHub {
  constructor(server) {
    this.wss = new WebSocketServer({ server });
    this.wss.on("connection", (socket, request) => this.handleConnection(socket, request));
  }

  clients() {
    return Array.from(this.wss.clients).filter((socket) => socket.readyState === socket.OPEN);
  }

  send(socket, message) {
    if (socket.readyState === socket.OPEN) socket.send(JSON.stringify(message));
  }

  broadcastRaw(message) {
    for (const socket of this.clients()) this.send(socket, message);
  }

  async handleConnection(socket, request) {
    try {
      const url = new URL(request.url, "http://localhost");
      const token = url.searchParams.get("token");
      if (token) {
        const decoded = verifyToken(token);
        socket.player = await getPlayer(decoded.discord_id);
      }

      socket.on("message", (raw) => {
        const message = safeJson(raw.toString());
        if (message?.type === "ping") this.send(socket, { type: "pong", ts: Date.now() });
      });
    } catch {
      this.send(socket, { type: "auth_error", error: "WebSocket token rejected" });
      socket.close();
    }
  }
}

function safeJson(value) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}
