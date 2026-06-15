import { getPlayer } from "../db/index.js";
import { verifyToken } from "../auth/jwt.js";

export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : req.query.token;
    if (!token) return res.status(401).json({ error: "Missing bearer token" });
    const decoded = verifyToken(token);
    const player = await getPlayer(decoded.discord_id);
    if (!player) return res.status(401).json({ error: "Unknown player" });
    req.player = player;
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}
