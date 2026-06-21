import type { SetEntry, Unit } from "./types";

/** Convert a set to a normalized weight in kilograms for math. */
export function toKg(set: SetEntry): number {
  if (set.unit === "kg") return set.weight;
  if (set.unit === "lb") return set.weight * 0.45359237;
  if (set.unit === "plate") return set.weight * 20; // 1 plate ≈ 20 kg barbell side
  if (set.unit === "bw") return 0; // bodyweight is tracked via reps, not volume
  return set.weight;
}

export function formatWeight(set: SetEntry): string {
  const w = set.weight;
  const wStr = Number.isInteger(w) ? `${w}` : w.toFixed(1);
  if (set.unit === "plate") return `${wStr}pl`;
  if (set.unit === "bw") return `BW`;
  return `${wStr}${set.unit}`;
}

export function unitLabel(u: Unit): string {
  if (u === "kg") return "kg";
  if (u === "lb") return "lb";
  if (u === "plate") return "plate(s)";
  if (u === "bw") return "bodyweight";
  return u;
}

export const ALL_UNITS: Unit[] = ["kg", "lb", "plate", "bw"];

export function unitShort(u: Unit): string {
  if (u === "plate") return "pl";
  if (u === "bw") return "bw";
  return u;
}
