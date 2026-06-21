"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { WorkoutForm } from "@/components/WorkoutForm";
import { BackLink } from "@/components/BackLink";
import { useStore } from "@/lib/store";
import type { Workout } from "@/lib/types";

export default function NewWorkoutPage() {
  return (
    <Suspense fallback={<div className="card text-sm text-zinc-500">loading…</div>}>
      <NewWorkoutInner />
    </Suspense>
  );
}

function NewWorkoutInner() {
  const router = useRouter();
  const params = useSearchParams();
  const repeatId = params.get("repeat");
  const { templates, exercises, workouts, saveWorkout } = useStore();
  const [initial, setInitial] = useState<Workout | undefined>(undefined);

  useEffect(() => {
    if (!repeatId) return;
    const w = workouts.find((x) => x.id === repeatId);
    if (w) {
      const today = new Date().toISOString().slice(0, 10);
      setInitial({ ...w, id: "", date: today, createdAt: Date.now(), updatedAt: Date.now() });
    }
  }, [repeatId, workouts]);

  const exNames = useMemo(
    () => exercises.map((e) => ({ name: e.name, defaultUnit: e.defaultUnit })),
    [exercises]
  );

  return (
    <div className="space-y-3">
      <BackLink href="/" />
      <h1 className="text-lg font-semibold">new session</h1>
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