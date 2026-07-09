"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
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
    return <div className="card text-sm text-fg-dim">loading…</div>;
  }

  return (
    <div className="wpage">
      <WorkoutForm
        templates={templates}
        exercises={exNames}
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
