import { UNIT_TYPES, WS_EVENTS } from "../../shared/constants/game.js";
import {
  completeOrder,
  damageUnit,
  getActiveOrders,
  getWorldSnapshot,
  updateUnitPosition
} from "../db/index.js";
import { haversineKm, interpolateLatLng } from "./geo.js";
import { filterStateForPlayer } from "./fog.js";

const TICK_MS = Number(process.env.TICK_MS ?? 500);
let timer = null;
let lastCombatAt = 0;

export function startSimulation({ hub }) {
  if (timer) return;
  timer = setInterval(() => tick(hub).catch((error) => console.error("simulation tick failed", error)), TICK_MS);
}

async function tick(hub) {
  await updateMovement(hub);
  await resolveCombat(hub);
  await broadcastState(hub);
}

async function updateMovement(hub) {
  const orders = await getActiveOrders();
  const now = Date.now();

  await Promise.all(
    orders.map(async (order) => {
      const startMs = new Date(order.start_time).getTime();
      const endMs = new Date(order.end_time).getTime();
      const progress = Math.min(1, Math.max(0, (now - startMs) / (endMs - startMs || 1)));
      const next = interpolateLatLng(
        { lat: Number(order.start_lat), lng: Number(order.start_lng) },
        { lat: Number(order.end_lat), lng: Number(order.end_lng) },
        progress
      );

      await updateUnitPosition(order.unit_id, next.lat, next.lng);
      hub.broadcastRaw({ type: WS_EVENTS.unitMoved, unit_id: order.unit_id, lat: next.lat, lng: next.lng });

      if (progress >= 1) {
        await completeOrder(order.order_id);
        hub.broadcastRaw({ type: WS_EVENTS.orderComplete, order_id: order.order_id, unit_id: order.unit_id });
      }
    })
  );
}

async function resolveCombat(hub) {
  const now = Date.now();
  if (now - lastCombatAt < 1500) return;
  lastCombatAt = now;

  const snapshot = await getWorldSnapshot();
  const countries = new Map(snapshot.countries.map((country) => [country.country_id, country]));

  for (const attacker of snapshot.units) {
    const attackerStats = UNIT_TYPES[attacker.type] ?? UNIT_TYPES.infantry;
    const attackerCountry = countries.get(attacker.country_id);
    const enemies = new Set(attackerCountry?.enemies ?? []);

    for (const defender of snapshot.units) {
      if (attacker.unit_id === defender.unit_id || attacker.country_id === defender.country_id) continue;
      if (enemies.size > 0 && !enemies.has(defender.country_id)) continue;

      const distance = haversineKm(
        { lat: Number(attacker.lat), lng: Number(attacker.lng) },
        { lat: Number(defender.lat), lng: Number(defender.lng) }
      );
      if (distance > attackerStats.rangeKm) continue;

      const defenderStats = UNIT_TYPES[defender.type] ?? UNIT_TYPES.infantry;
      const hitChance = Math.min(0.82, Math.max(0.12, attackerStats.attack / (attackerStats.attack + defenderStats.defense)));
      if (Math.random() > hitChance) continue;

      const damage = Math.max(4, Math.round(attackerStats.attack * (0.35 + Math.random() * 0.65)));
      const updated = await damageUnit(defender.unit_id, damage);
      hub.broadcastRaw({
        type: WS_EVENTS.combatEvent,
        attacker_id: attacker.unit_id,
        defender_id: defender.unit_id,
        damage,
        hitChance,
        distanceKm: Number(distance.toFixed(2))
      });

      if (updated && updated.health <= 0) {
        hub.broadcastRaw({ type: WS_EVENTS.unitDestroyed, unit_id: defender.unit_id });
      }
      break;
    }
  }
}

async function broadcastState(hub) {
  const snapshot = await getWorldSnapshot();
  for (const client of hub.clients()) {
    if (!client.player) continue;
    const player = snapshot.players.find((candidate) => candidate.discord_id === client.player.discord_id) ?? client.player;
    hub.send(client, { type: WS_EVENTS.stateUpdate, payload: filterStateForPlayer(snapshot, player) });
  }
}
