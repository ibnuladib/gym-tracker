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
    <div className="space-y-3">
      <h1 className="text-lg font-semibold">progress</h1>
      <div className="flex gap-2">
        <button onClick={() => setTab("overview")} className={`chip ${tab === "overview" ? "border-emerald-500/40 text-emerald-300" : ""}`}>overview</button>
        <button onClick={() => setTab("exercises")} className={`chip ${tab === "exercises" ? "border-emerald-500/40 text-emerald-300" : ""}`}>exercises</button>
      </div>

      {tab === "overview" ? (
        <div className="card space-y-2">
          <div className="label">daily volume (kg × reps)</div>
          {points.length === 0 ? (
            <div className="py-6 text-center text-sm text-zinc-500">log a session to see your chart.</div>
          ) : (
            <Chart series={[{ label: "volume", color: "#10b981", points }]} yLabel="kg" formatY={(n) => `${Math.round(n).toLocaleString()}`} />
          )}
        </div>
      ) : (
        <div className="card">
          {exercises.length === 0 ? (
            <div className="py-6 text-center text-sm text-zinc-500">no exercises yet.</div>
          ) : (
            <ul className="divide-y divide-zinc-900">
              {exercises.map((e) => {
                const count = exerciseCounts.find(([n]) => n === e.name)?.[1] ?? 0;
                return (
                  <li key={e.id} className="flex items-center justify-between py-2">
                    <div>
                      <Link href={`/exercises/${encodeURIComponent(e.name)}`} className="text-sm text-zinc-100 hover:text-emerald-300">{e.name}</Link>
                      <div className="text-xs text-zinc-500">{count} sets logged</div>
                    </div>
                    <Link href={`/exercises/${encodeURIComponent(e.name)}`} className="text-xs text-zinc-500 hover:text-emerald-300">chart →</Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
