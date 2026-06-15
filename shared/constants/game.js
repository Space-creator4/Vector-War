export const UNIT_TYPES = {
  infantry: {
    label: "Infantry",
    icon: "●",
    speedKph: 5,
    attack: 10,
    defense: 8,
    rangeKm: 2.5,
    sightKm: 8,
    radarKm: 0
  },
  tank: {
    label: "Tank",
    icon: "■",
    speedKph: 42,
    attack: 26,
    defense: 22,
    rangeKm: 5,
    sightKm: 10,
    radarKm: 0
  },
  artillery: {
    label: "Artillery",
    icon: "▭",
    speedKph: 28,
    attack: 22,
    defense: 10,
    rangeKm: 18,
    sightKm: 8,
    radarKm: 0
  },
  jet: {
    label: "Jet",
    icon: "▲",
    speedKph: 850,
    attack: 34,
    defense: 18,
    rangeKm: 32,
    sightKm: 28,
    radarKm: 55
  },
  heli: {
    label: "Helicopter",
    icon: "✦",
    speedKph: 240,
    attack: 24,
    defense: 14,
    rangeKm: 12,
    sightKm: 20,
    radarKm: 22
  },
  ship: {
    label: "Ship",
    icon: "▬",
    speedKph: 55,
    attack: 30,
    defense: 26,
    rangeKm: 28,
    sightKm: 24,
    radarKm: 45
  },
  aa: {
    label: "Radar / AA",
    icon: "⊕",
    speedKph: 30,
    attack: 28,
    defense: 16,
    rangeKm: 26,
    sightKm: 14,
    radarKm: 60
  }
};

export const PLAYER_ROLES = ["leader", "officer", "soldier"];

export const WS_EVENTS = {
  stateUpdate: "state_update",
  unitMoved: "unit_moved",
  unitDestroyed: "unit_destroyed",
  combatEvent: "combat_event",
  orderStarted: "order_started",
  orderComplete: "order_complete"
};

export const DEFAULT_CENTER = {
  lat: 51.5072,
  lng: -0.1276
};
