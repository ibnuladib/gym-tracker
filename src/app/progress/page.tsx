"use client";

import Link from "next/link";
import { useStore } from "@/lib/store";
import { useMemo, useState } from "react";
import { dailyVolume } from "@/lib/prs";
import { Chart } from "@/components/Chart";

export default function ProgressPage() {
  const { workouts, exercises } = useStore();
  const [tab, setTab] = useState<"overview" | "exercises">("overview");

  const volume = useMemo(() => dailyVolume(workouts), [workouts]);
  const points = useMemo(() => {
    return [...volume.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, v], i) => ({ x: i, y: v, meta: `${date}: ${Math.round(v).toLocaleString()}kg` }));
  }, [volume]);

  const exerciseCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const w of workouts) for (const e of w.exercises) m.set(e.name, (m.get(e.name) ?? 0) + e.sets.length);
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [workouts]);

  return (
    <div className="space-y-5">
      <header className="flex items-end justify-between">
        <h1 className="font-display text-2xl font-light tracking-tight text-fg">progress</h1>
        <div className="segmented">
          <button onClick={() => setTab("overview")} data-active={tab === "overview"}>overview</button>
          <button onClick={() => setTab("exercises")} data-active={tab === "exercises"}>exercises</button>
        </div>
      </header>

      {tab === "overview" ? (
        <section className="card space-y-3">
          <div className="stamp">daily volume · kg × reps</div>
          {points.length === 0 ? (
            <div className="py-6 text-center text-sm text-fg-dim">log a session to see your chart.</div>
          ) : (
            <Chart series={[{ label: "volume", color: "#e8a33d", points }]} yLabel="kg" formatY={(n) => `${Math.round(n).toLocaleString()}`} />
          )}
        </section>
      ) : (
        <section className="card">
          {exercises.length === 0 ? (
            <div className="py-6 text-center text-sm text-fg-dim">no exercises yet.</div>
          ) : (
            <ul className="divide-y divide-border">
              {exercises.map((e) => {
                const count = exerciseCounts.find(([n]) => n === e.name)?.[1] ?? 0;
                return (
                  <li key={e.id} className="flex items-center justify-between py-2.5">
                    <div>
                      <Link href={`/exercises/${encodeURIComponent(e.name)}`} className="text-sm text-fg transition-colors hover:text-accent-fg">
                        {e.name}
                      </Link>
                      <div className="num text-2xs text-fg-faint">{count} sets logged</div>
                    </div>
                    <Link href={`/exercises/${encodeURIComponent(e.name)}`} className="text-2xs text-fg-dim transition-colors hover:text-accent-fg">
                      chart →
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
