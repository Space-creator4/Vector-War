import { UNIT_TYPES } from "../../shared/constants/game.js";
import { haversineKm } from "./geo.js";

export function filterStateForPlayer(snapshot, player) {
  const countries = new Map(snapshot.countries.map((country) => [country.country_id, country]));
  const playerCountry = player?.country_id ? countries.get(player.country_id) : null;
  const friendIds = new Set([player?.country_id, ...(playerCountry?.allies ?? [])].filter(Boolean));
  const ownUnits = snapshot.units.filter((unit) => friendIds.has(unit.country_id));

  const visibleUnits = snapshot.units.flatMap((unit) => {
    if (friendIds.has(unit.country_id)) return [decorateUnit(unit, "player")];

    const spottedBy = ownUnits.find((friendly) => {
      const friendlyStats = UNIT_TYPES[friendly.type] ?? UNIT_TYPES.infantry;
      const distance = haversineKm(
        { lat: Number(friendly.lat), lng: Number(friendly.lng) },
        { lat: Number(unit.lat), lng: Number(unit.lng) }
      );
      return distance <= Math.max(friendlyStats.sightKm, friendlyStats.radarKm);
    });

    if (!spottedBy) return [];

    const stats = UNIT_TYPES[spottedBy.type] ?? UNIT_TYPES.infantry;
    const distance = haversineKm(
      { lat: Number(spottedBy.lat), lng: Number(spottedBy.lng) },
      { lat: Number(unit.lat), lng: Number(unit.lng) }
    );
    const relation = playerCountry?.enemies?.includes(unit.country_id) ? "enemy" : "unknown";
    const precise = distance <= stats.sightKm;

    return [
      precise
        ? decorateUnit(unit, relation)
        : {
            unit_id: unit.unit_id,
            country_id: null,
            type: "unknown",
            health: null,
            lat: unit.lat,
            lng: unit.lng,
            relation: "unknown"
          }
    ];
  });

  return {
    me: player,
    countries: snapshot.countries,
    units: visibleUnits,
    orders: snapshot.orders.filter((order) => visibleUnits.some((unit) => unit.unit_id === order.unit_id))
  };
}

function decorateUnit(unit, relation) {
  return { ...unit, relation };
}
