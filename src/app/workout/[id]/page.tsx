"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { WorkoutForm } from "@/components/WorkoutForm";
import { useStore } from "@/lib/store";
import type { Workout } from "@/lib/types";

export default function EditWorkoutPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const { workouts, templates, saveWorkout, deleteWorkout } = useStore();
  const [initial, setInitial] = useState<Workout | undefined>(undefined);

  useEffect(() => {
    const w = workouts.find((x) => x.id === params.id);
    setInitial(w);
  }, [params.id, workouts]);

  const suggestions = useMemo(() => buildSuggestions(workouts), [workouts]);

  if (!initial) {
    return <div className="card text-sm text-fg-dim">loading…</div>;
  }

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
        onCancel={() => router.push("/history")}
      />
      <button
        onClick={async () => {
          if (confirm("Delete this workout?")) {
            await deleteWorkout(initial.id);
            router.push("/history");
          }
        }}
        className="wform-delete"
      >
        delete workout
      </button>
    </div>
  );
}

function buildSuggestions(workouts: { exercises: { name: string; sets: { unit: "kg" | "lb" | "plate" | "bw" }[] }[] }[]) {
  const m = new Map<string, { name: string; lastUnit: "kg" | "lb" | "plate" | "bw"; rank: number }>();
  let rank = 0;
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
