"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { WorkoutForm } from "@/components/WorkoutForm";
import { useStore } from "@/lib/store";
import type { Workout } from "@/lib/types";

export default function NewWorkoutPage() {
  return (
    <Suspense fallback={<div className="card text-sm text-fg-dim">loading…</div>}>
      <NewWorkoutInner />
    </Suspense>
  );
}

function NewWorkoutInner() {
  const router = useRouter();
  const params = useSearchParams();
  const repeatId = params.get("repeat");
  const templateId = params.get("tpl");
  const { templates, workouts, saveWorkout } = useStore();
  const [initial, setInitial] = useState<Workout | undefined>(undefined);

  useEffect(() => {
    if (repeatId) {
      const w = workouts.find((x) => x.id === repeatId);
      if (w) {
        const today = isoToday();
        setInitial({ ...w, id: "", date: today, createdAt: Date.now(), updatedAt: Date.now() });
      }
    } else if (templateId) {
      const t = templates.find((x) => x.id === templateId);
      if (t) {
        setInitial({
          id: "",
          name: t.name,
          date: isoToday(),
          exercises: t.items.map((it) => ({
            name: it.exerciseName,
            sets: [{ weight: it.defaultWeight ?? 0, unit: it.defaultUnit ?? "kg", reps: it.defaultReps ?? 0 }],
          })),
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
      }
    }
  }, [repeatId, templateId, workouts, templates]);

  const suggestions = useMemo(() => buildSuggestions(workouts), [workouts]);

  return (
    <div className="wpage">
      <WorkoutForm
        templates={templates}
        suggestions={suggestions}
        initial={initial}
        onSubmit={async (w) => {
          await saveWorkout(w);
          router.push("/history");
        }}
        onCancel={() => router.push("/")}
      />
    </div>
  );
}

function buildSuggestions(workouts: { exercises: { name: string; sets: { unit: "kg" | "lb" | "plate" | "bw" }[] }[] }[]) {
  const m = new Map<string, { name: string; lastUnit: "kg" | "lb" | "plate" | "bw"; rank: number }>();
  let rank = 0;
  // Walk backwards through workouts (most recent first) so the latest unit wins.
  for (let i = workouts.length - 1; i >= 0; i--) {
    const w = workouts[i];
    for (const e of w.exercises) {
      const key = e.name.toLowerCase();
      if (!m.has(key)) {
        m.set(key, { name: e.name, lastUnit: e.sets.at(-1)?.unit ?? "kg", rank: rank++ });
      }
    }
  }
  return [...m.values()].sort((a, b) => a.rank - b.rank).map(({ name, lastUnit }) => ({ name, lastUnit }));
}

function isoToday() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
