"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { BackLink } from "@/components/BackLink";
import { WorkoutForm } from "@/components/WorkoutForm";
import { useStore } from "@/lib/store";
import type { Workout } from "@/lib/types";

export default function EditWorkoutPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const { workouts, templates, exercises, saveWorkout, deleteWorkout } = useStore();
  const [initial, setInitial] = useState<Workout | undefined>(undefined);

  useEffect(() => {
    const w = workouts.find((x) => x.id === params.id);
    setInitial(w);
  }, [params.id, workouts]);

  const exNames = useMemo(
    () => exercises.map((e) => ({ name: e.name, defaultUnit: e.defaultUnit })),
    [exercises]
  );

  if (!initial) {
    return (
      <div className="card text-sm text-fg-dim">
        <BackLink href="/history" /> loading…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <BackLink href="/history" />
        <h1 className="font-display text-2xl font-light tracking-tight text-fg">
          {initial.name}
        </h1>
        <button
          onClick={async () => {
            if (confirm("Delete this workout?")) {
              await deleteWorkout(initial.id);
              router.push("/history");
            }
          }}
          className="text-2xs text-danger transition-colors hover:text-danger-fg"
        >
          delete
        </button>
      </div>
      <WorkoutForm
        templates={templates}
        exercises={exNames}
        initial={initial}
        onSubmit={async (w) => {
          await saveWorkout(w);
          router.push("/history");
        }}
      />
    </div>
  );
}
