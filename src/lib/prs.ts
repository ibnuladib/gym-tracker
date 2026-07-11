import type { Workout } from "./types";
import { toKg } from "./units";

/** Total daily volume (kg × reps) across all exercises for a given date. */
export function dailyVolume(workouts: Workout[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const w of workouts) {
    let v = 0;
    for (const ex of w.exercises) {
      for (const s of ex.sets) v += toKg(s) * s.reps;
    }
    map.set(w.date, (map.get(w.date) ?? 0) + v);
  }
  return map;
}
