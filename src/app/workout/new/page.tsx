"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { WorkoutForm } from "@/components/WorkoutForm";
import { BackLink } from "@/components/BackLink";
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
  const { templates, exercises, workouts, saveWorkout } = useStore();
  const [initial, setInitial] = useState<Workout | undefined>(undefined);

  useEffect(() => {
    if (!repeatId) return;
    const w = workouts.find((x) => x.id === repeatId);
    if (w) {
      const d = new Date();
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      const today = `${y}-${m}-${day}`;
      setInitial({ ...w, id: "", date: today, createdAt: Date.now(), updatedAt: Date.now() });
    }
  }, [repeatId, workouts]);

  const exNames = useMemo(
    () => exercises.map((e) => ({ name: e.name, defaultUnit: e.defaultUnit })),
    [exercises]
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <BackLink href="/" />
        <h1 className="font-display text-2xl font-light tracking-tight text-fg">new session</h1>
        <span className="w-10" />
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
