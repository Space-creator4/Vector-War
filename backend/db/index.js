import pg from "pg";
import crypto from "node:crypto";

const { Pool } = pg;

const state = {
  players: new Map(),
  countries: new Map(),
  units: new Map(),
  orders: new Map(),
  joinRequests: new Map()
};

const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_URL.includes("localhost") ? false : { rejectUnauthorized: false }
    })
  : null;

export const usingMemoryStore = !pool;

function id() {
  return crypto.randomUUID();
}

function rows(map) {
  return Array.from(map.values());
}

export async function query(text, params = []) {
  if (!pool) throw new Error("Postgres is not configured. Set DATABASE_URL to enable SQL queries.");
  return pool.query(text, params);
}

export async function upsertPlayer({ discord_id, username }) {
  if (pool) {
    const result = await query(
      `insert into players (discord_id, username)
       values ($1, $2)
       on conflict (discord_id) do update set username = excluded.username
       returning *`,
      [discord_id, username]
    );
    return result.rows[0];
  }

  const existing = state.players.get(discord_id);
  const player = existing ? { ...existing, username } : { discord_id, username, country_id: null, role: "soldier" };
  state.players.set(discord_id, player);
  return player;
}

export async function getPlayer(discordId) {
  if (pool) {
    const result = await query("select * from players where discord_id = $1", [discordId]);
    return result.rows[0] ?? null;
  }
  return state.players.get(discordId) ?? null;
}

export async function createCountry({ name, leaderDiscordId }) {
  if (pool) {
    const result = await query(
      `with c as (
        insert into countries (name, leader_discord_id)
        values ($1, $2)
        returning *
      )
      update players set country_id = (select country_id from c), role = 'leader'
      where discord_id = $2
      returning (select row_to_json(c) from c) as country`,
      [name, leaderDiscordId]
    );
    return result.rows[0].country;
  }

  const country = { country_id: id(), name, leader_discord_id: leaderDiscordId, allies: [], enemies: [] };
  state.countries.set(country.country_id, country);
  const player = state.players.get(leaderDiscordId);
  if (player) state.players.set(leaderDiscordId, { ...player, country_id: country.country_id, role: "leader" });
  return country;
}

export async function listCountries() {
  if (pool) return (await query("select * from countries order by name")).rows;
  return rows(state.countries);
}

export async function joinCountry({ discordId, countryId }) {
  if (pool) {
    const country = (await query("select * from countries where country_id = $1", [countryId])).rows[0];
    if (!country) return null;
    const request = await query(
      `insert into join_requests (discord_id, country_id, status)
       values ($1, $2, 'approved')
       returning *`,
      [discordId, countryId]
    );
    await query("update players set country_id = $1, role = 'soldier' where discord_id = $2", [countryId, discordId]);
    return request.rows[0];
  }

  if (!state.countries.has(countryId)) return null;
  const request = { request_id: id(), discord_id: discordId, country_id: countryId, status: "approved" };
  state.joinRequests.set(request.request_id, request);
  const player = state.players.get(discordId);
  if (player) state.players.set(discordId, { ...player, country_id: countryId, role: "soldier" });
  return request;
}

export async function createUnit({ countryId, type, assignedPlayer, lat, lng }) {
  if (pool) {
    const result = await query(
      `insert into units (country_id, type, assigned_player, health, lat, lng)
       values ($1, $2, $3, 100, $4, $5)
       returning *`,
      [countryId, type, assignedPlayer, lat, lng]
    );
    return result.rows[0];
  }

  const unit = { unit_id: id(), country_id: countryId, type, assigned_player: assignedPlayer, health: 100, lat, lng };
  state.units.set(unit.unit_id, unit);
  return unit;
}

export async function listUnits() {
  if (pool) return (await query("select * from units where health > 0")).rows;
  return rows(state.units).filter((unit) => unit.health > 0);
}

export async function getActiveOrders() {
  if (pool) return (await query("select * from movement_orders where status = 'active'")).rows;
  return rows(state.orders).filter((order) => order.status === "active");
}

export async function createMovementOrder(order) {
  if (pool) {
    const result = await query(
      `insert into movement_orders
       (unit_id, start_lat, start_lng, end_lat, end_lng, start_time, end_time, status)
       values ($1, $2, $3, $4, $5, $6, $7, 'active')
       returning *`,
      [order.unit_id, order.start_lat, order.start_lng, order.end_lat, order.end_lng, order.start_time, order.end_time]
    );
    return result.rows[0];
  }

  const stored = { order_id: id(), ...order, status: "active" };
  state.orders.set(stored.order_id, stored);
  return stored;
}

export async function updateUnitPosition(unitId, lat, lng) {
  if (pool) {
    await query("update units set lat = $1, lng = $2 where unit_id = $3", [lat, lng, unitId]);
    return;
  }
  const unit = state.units.get(unitId);
  if (unit) state.units.set(unitId, { ...unit, lat, lng });
}

export async function damageUnit(unitId, damage) {
  if (pool) {
    const result = await query(
      "update units set health = greatest(0, health - $1) where unit_id = $2 returning *",
      [damage, unitId]
    );
    return result.rows[0] ?? null;
  }
  const unit = state.units.get(unitId);
  if (!unit) return null;
  const updated = { ...unit, health: Math.max(0, unit.health - damage) };
  state.units.set(unitId, updated);
  return updated;
}

export async function completeOrder(orderId) {
  if (pool) {
    await query("update movement_orders set status = 'complete' where order_id = $1", [orderId]);
    return;
  }
  const order = state.orders.get(orderId);
  if (order) state.orders.set(orderId, { ...order, status: "complete" });
}

export async function getWorldSnapshot() {
  const [players, countries, units, orders] = pool
    ? await Promise.all([
        query("select * from players"),
        query("select * from countries"),
        query("select * from units where health > 0"),
        query("select * from movement_orders where status = 'active'")
      ])
    : [{ rows: rows(state.players) }, { rows: rows(state.countries) }, { rows: rows(state.units).filter((u) => u.health > 0) }, { rows: rows(state.orders).filter((o) => o.status === "active") }];

  return {
    players: players.rows,
    countries: countries.rows,
    units: units.rows,
    orders: orders.rows
  };
}
