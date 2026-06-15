import { UNIT_TYPES } from "../../../shared/constants/game.js";

export function unitSymbol(type) {
  return UNIT_TYPES[type]?.icon || "●";
}

export function relationClass(relation) {
  if (relation === "player") return "unit-player";
  if (relation === "ally") return "unit-ally";
  if (relation === "enemy") return "unit-enemy";
  return "unit-unknown";
}
