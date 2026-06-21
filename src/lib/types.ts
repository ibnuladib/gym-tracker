// Domain types shared by the data layer and UI.

export type Unit = "kg" | "lb" | "plate" | "bw";

/** A single set inside an exercise log. */
export interface SetEntry {
  weight: number;
  unit: Unit;
  reps: number;
  toFailure?: boolean;
  rpe?: number;
}

/** All sets performed for a given exercise name on a given workout. */
export interface ExerciseLog {
  name: string;
  /** Optional muscle tags, free-form. */
  muscles?: string[];
  sets: SetEntry[];
  notes?: string;
}

/** A finished workout. */
export interface Workout {
  id: string;
  /** User-defined name like "Push day", "Pull", etc. */
  name: string;
  /** YYYY-MM-DD (local date) the user trained. */
  date: string;
  /** Duration in minutes (optional). */
  durationMin?: number;
  exercises: ExerciseLog[];
  notes?: string;
  /** ms epoch when first written. */
  createdAt: number;
  /** ms epoch when last updated. */
  updatedAt: number;
}

export interface TemplateItem {
  exerciseName: string;
  defaultSets: number;
  defaultReps: number;
  defaultWeight?: number;
  defaultUnit?: Unit;
}

export interface Template {
  id: string;
  name: string;
  items: TemplateItem[];
  createdAt: number;
  updatedAt: number;
}

export interface Exercise {
  id: string;
  name: string;
  defaultUnit: Unit;
  category?: string;
}

export interface UserBackup {
  version: 1;
  exportedAt: number;
  workouts: Workout[];
  templates: Template[];
  exercises: Exercise[];
}
