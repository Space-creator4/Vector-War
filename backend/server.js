import dotenv from "dotenv";
dotenv.config();

import http from "node:http";
import express from "express";
import { authRouter } from "./routes/auth.js";
import { createGameRouter } from "./routes/game.js";
import { RealtimeHub } from "./websocket/hub.js";
import { startSimulation } from "./simulation/engine.js";
import { usingMemoryStore } from "./db/index.js";

const app = express();
const server = http.createServer(app);
const hub = new RealtimeHub(server);

app.use(express.json());
app.use((_req, res, next) => {
  res.header("Access-Control-Allow-Origin", process.env.FRONTEND_URL || "http://localhost:5173");
  res.header("Access-Control-Allow-Headers", "Authorization, Content-Type");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  next();
});
app.options("*", (_req, res) => res.sendStatus(204));

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    store: usingMemoryStore ? "memory" : "postgres",
    tick_ms: Number(process.env.TICK_MS ?? 500)
  });
});

app.use("/auth", authRouter);
app.use("/", createGameRouter(hub));

startSimulation({ hub });

const port = Number(process.env.PORT || 4000);
server.listen(port, () => {
  console.log(`Vector War backend listening on ${port}`);
  if (usingMemoryStore) console.log("DATABASE_URL not set; using in-memory demo store.");
});
