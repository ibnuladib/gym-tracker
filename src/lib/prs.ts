import type { SetEntry, Workout } from "./types";
import { toKg } from "./units";

/** Estimated 1RM using the Epley formula. */
export function epley1RM(set: SetEntry): number {
  if (set.reps <= 0) return 0;
  if (set.reps === 1) return toKg(set);
  return toKg(set) * (1 + set.reps / 30);
}

export interface PrRecord {
  exerciseName: string;
  /** best estimated 1RM (kg) */
  bestE1RM: { value: number; workoutId: string; date: string; set: SetEntry };
  /** heaviest single set (kg) */
  heaviestSet: { value: number; workoutId: string; date: string; set: SetEntry };
  /** highest single-set reps at any weight */
  bestReps: { reps: number; weight: number; unit: string; workoutId: string; date: string; set: SetEntry };
  /** most total volume in one workout (kg × reps, weightless sets ignored) */
  bestVolume: { value: number; workoutId: string; date: string };
}

export interface ExerciseSeries {
  exerciseName: string;
  byDate: Array<{
    date: string;
    workoutId: string;
    volume: number;
    e1rm: number;
    topWeight: number;
    topReps: number;
    setCount: number;
  }>;
}

export function computePrs(workouts: Workout[], exerciseName: string): PrRecord | null {
  let best: PrRecord | null = null;
  for (const w of workouts) {
    for (const ex of w.exercises) {
      if (ex.name.trim().toLowerCase() !== exerciseName.trim().toLowerCase()) continue;
      let workoutVolume = 0;
      for (const s of ex.sets) {
        const e1 = epley1RM(s);
        const wKg = toKg(s);
        if (!best) {
          best = blankPr(ex.name);
        }
        if (e1 > best.bestE1RM.value) {
          best.bestE1RM = { value: e1, workoutId: w.id, date: w.date, set: s };
        }
        if (wKg > best.heaviestSet.value) {
          best.heaviestSet = { value: wKg, workoutId: w.id, date: w.date, set: s };
        }
        if (s.reps > best.bestReps.reps) {
          best.bestReps = {
            reps: s.reps,
            weight: s.weight,
            unit: s.unit,
            workoutId: w.id,
            date: w.date,
            set: s,
          };
        }
        if (wKg > 0) workoutVolume += wKg * s.reps;
      }
      if (workoutVolume > 0 && (!best || workoutVolume > best.bestVolume.value)) {
        if (!best) best = blankPr(ex.name);
        best.bestVolume = { value: workoutVolume, workoutId: w.id, date: w.date };
      }
    }
  }
  return best;
}

function blankPr(name: string): PrRecord {
  const zero: SetEntry = { weight: 0, unit: "kg", reps: 0 };
  return {
    exerciseName: name,
    bestE1RM: { value: 0, workoutId: "", date: "", set: zero },
    heaviestSet: { value: 0, workoutId: "", date: "", set: zero },
    bestReps: { reps: 0, weight: 0, unit: "kg", workoutId: "", date: "", set: zero },
    bestVolume: { value: 0, workoutId: "", date: "" },
  };
}

export function exerciseSeries(workouts: Workout[], exerciseName: string): ExerciseSeries {
  const key = exerciseName.trim().toLowerCase();
  const byDate = new Map<string, ExerciseSeries["byDate"][number]>();
  const sorted = [...workouts].sort((a, b) => a.date.localeCompare(b.date));
  for (const w of sorted) {
    for (const ex of w.exercises) {
      if (ex.name.trim().toLowerCase() !== key) continue;
      let volume = 0;
      let e1rm = 0;
      let topWeight = 0;
      let topReps = 0;
      for (const s of ex.sets) {
        const k = toKg(s);
        volume += k * s.reps;
        e1rm = Math.max(e1rm, epley1RM(s));
        topWeight = Math.max(topWeight, k);
        topReps = Math.max(topReps, s.reps);
      }
      const cur = byDate.get(w.date);
      if (!cur) {
        byDate.set(w.date, { date: w.date, workoutId: w.id, volume, e1rm, topWeight, topReps, setCount: ex.sets.length });
      } else {
        cur.volume += volume;
        cur.e1rm = Math.max(cur.e1rm, e1rm);
        cur.topWeight = Math.max(cur.topWeight, topWeight);
        cur.topReps = Math.max(cur.topReps, topReps);
        cur.setCount += ex.sets.length;
      }
    }
  }
  return { exerciseName, byDate: [...byDate.values()] };
}

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
