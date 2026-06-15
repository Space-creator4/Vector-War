import express from "express";
import { UNIT_TYPES, WS_EVENTS } from "../../shared/constants/game.js";
import {
  createCountry,
  createMovementOrder,
  createUnit,
  getWorldSnapshot,
  joinCountry,
  listCountries,
  listUnits
} from "../db/index.js";
import { requireAuth } from "../middleware/auth.js";
import { filterStateForPlayer } from "../simulation/fog.js";
import { haversineKm, terrainModifier } from "../simulation/geo.js";

export function createGameRouter(hub) {
  const router = express.Router();

  router.get("/state", requireAuth, async (req, res) => {
    const snapshot = await getWorldSnapshot();
    res.json(filterStateForPlayer(snapshot, req.player));
  });

  router.get("/countries", requireAuth, async (_req, res) => {
    res.json({ countries: await listCountries() });
  });

  router.post("/create-platoon", requireAuth, async (req, res) => {
    const name = String(req.body.name || `${req.player.username}'s Country`).slice(0, 80);
    const country = await createCountry({ name, leaderDiscordId: req.player.discord_id });
    const lat = Number(req.body.lat ?? 51.5072);
    const lng = Number(req.body.lng ?? -0.1276);
    const types = ["infantry", "tank", "aa"];
    const units = [];

    for (const [index, type] of types.entries()) {
      units.push(
        await createUnit({
          countryId: country.country_id,
          type,
          assignedPlayer: req.player.discord_id,
          lat: lat + index * 0.015,
          lng: lng + index * 0.015
        })
      );
    }

    res.json({ country, units });
  });

  router.post("/join-country", requireAuth, async (req, res) => {
    const request = await joinCountry({ discordId: req.player.discord_id, countryId: req.body.country_id });
    if (!request) return res.status(404).json({ error: "Country not found" });
    res.json({ request });
  });

  router.post("/command", requireAuth, async (req, res) => {
    const units = await listUnits();
    const unit = units.find((candidate) => candidate.unit_id === req.body.unit_id);
    if (!unit) return res.status(404).json({ error: "Unit not found" });

    if (!canCommand(req.player, unit)) {
      return res.status(403).json({ error: "You do not have permission to command this unit" });
    }

    const end = {
      lat: clamp(Number(req.body.end_lat), -85, 85),
      lng: clamp(Number(req.body.end_lng), -180, 180)
    };
    const start = { lat: Number(unit.lat), lng: Number(unit.lng) };
    const stats = UNIT_TYPES[unit.type] ?? UNIT_TYPES.infantry;
    const distanceKm = haversineKm(start, end);
    const hours = distanceKm / Math.max(1, stats.speedKph * terrainModifier(unit.type));
    const now = new Date();
    const endTime = new Date(now.getTime() + hours * 60 * 60 * 1000);

    const order = await createMovementOrder({
      unit_id: unit.unit_id,
      start_lat: start.lat,
      start_lng: start.lng,
      end_lat: end.lat,
      end_lng: end.lng,
      start_time: now.toISOString(),
      end_time: endTime.toISOString()
    });

    hub.broadcastRaw({ type: WS_EVENTS.orderStarted, order });
    res.json({ order, eta_seconds: Math.round((endTime.getTime() - now.getTime()) / 1000), distance_km: distanceKm });
  });

  return router;
}

function canCommand(player, unit) {
  if (!player.country_id || player.country_id !== unit.country_id) return false;
  if (player.role === "leader" || player.role === "officer") return true;
  return unit.assigned_player === player.discord_id;
}

function clamp(value, min, max) {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, value));
}
