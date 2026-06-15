import express from "express";
import { discordConfigured, discordLoginUrl, exchangeCodeForUser } from "../auth/discord.js";
import { signPlayer } from "../auth/jwt.js";
import { getPlayer, upsertPlayer } from "../db/index.js";

export const authRouter = express.Router();

authRouter.get("/discord", async (_req, res) => {
  if (!discordConfigured()) {
    const demo = await upsertPlayer({ discord_id: "demo-player", username: "Demo Commander" });
    const token = signPlayer(demo);
    return res.redirect(`${frontendUrl()}/?token=${token}`);
  }
  res.redirect(discordLoginUrl());
});

authRouter.get("/callback", async (req, res) => {
  try {
    if (!discordConfigured()) return res.redirect("/auth/discord");
    const profile = await exchangeCodeForUser(req.query.code);
    const player = await upsertPlayer(profile);
    const token = signPlayer(player);
    res.redirect(`${frontendUrl()}/?token=${token}`);
  } catch (error) {
    res.status(400).json({ error: "Discord auth failed", detail: error.message });
  }
});

authRouter.get("/me", async (req, res) => {
  const token = req.headers.authorization?.replace("Bearer ", "") || req.query.token;
  if (!token) return res.json({ player: null });
  try {
    const { verifyToken } = await import("../auth/jwt.js");
    const decoded = verifyToken(token);
    res.json({ player: await getPlayer(decoded.discord_id) });
  } catch {
    res.json({ player: null });
  }
});

function frontendUrl() {
  return process.env.FRONTEND_URL || "http://localhost:5173";
}
