"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { formatWeight, toKg } from "@/lib/units";
import type { Workout } from "@/lib/types";

interface WeekGroup {
  key: string;
  start: string;
  end: string;
  workouts: Workout[];
}

export default function HistoryPage() {
  const { workouts, deleteWorkout } = useStore();
  const [query, setQuery] = useState("");

  const grouped = useMemo<WeekGroup[]>(() => groupByWeek(workouts), [workouts]);
  const filtered = useMemo<WeekGroup[]>(() => {
    if (!query.trim()) return grouped;
    const q = query.toLowerCase();
    return grouped
      .map((g) => ({ ...g, workouts: g.workouts.filter((w) => matches(w, q)) }))
      .filter((g) => g.workouts.length > 0);
  }, [grouped, query]);

  return (
    <div className="space-y-3">
      <h1 className="text-lg font-semibold">history</h1>
      <input
        className="input"
        placeholder="filter by exercise, name, date…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {filtered.length === 0 && (
        <div className="card text-sm text-zinc-500">no sessions match.</div>
      )}
      {filtered.map((g) => (
        <section key={g.key} className="space-y-1.5">
          <h2 className="label sticky top-12 z-10 -mx-3 bg-zinc-950/85 px-3 py-1 backdrop-blur sm:-mx-4 sm:px-4">
            week of {g.start} → {g.end}
          </h2>
          <ul className="space-y-1.5">
            {g.workouts.map((w) => (
              <WorkoutRow key={w.id} w={w} onDelete={() => deleteWorkout(w.id)} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function WorkoutRow({ w, onDelete }: { w: Workout; onDelete: () => void }) {
  const totalSets = w.exercises.reduce((a, e) => a + e.sets.length, 0);
  const totalVol = w.exercises.reduce(
    (a, e) => a + e.sets.reduce((b, s) => b + toKg(s) * s.reps, 0),
    0
  );
  return (
    <li className="card">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-zinc-100">
            <Link href={`/workout/${w.id}`} className="hover:text-emerald-300">{w.name}</Link>
          </div>
          <div className="text-xs text-zinc-500">
            {w.date} · {w.exercises.length} ex · {totalSets} sets · {Math.round(totalVol).toLocaleString()}kg
          </div>
        </div>
        <Link href={`/workout/new?repeat=${w.id}`} className="text-xs text-zinc-500 hover:text-emerald-300">↻ repeat</Link>
      </div>
      <details className="mt-2">
        <summary className="cursor-pointer text-xs text-zinc-500 hover:text-zinc-200">show sets</summary>
        <div className="mt-2 space-y-2">
          {w.exercises.map((ex, i) => (
            <div key={i} className="text-xs">
              <div className="text-zinc-300">{ex.name}</div>
              <div className="flex flex-wrap gap-1.5 text-zinc-500">
                {ex.sets.map((s, j) => (
                  <span key={j} className="chip">
                    {formatWeight(s)} × {s.reps}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
        <button onClick={onDelete} className="mt-3 text-xs text-rose-400 hover:text-rose-300">delete</button>
      </details>
    </li>
  );
}

function matches(w: Workout, q: string) {
  if (w.name.toLowerCase().includes(q)) return true;
  if (w.date.includes(q)) return true;
  return w.exercises.some((e) => e.name.toLowerCase().includes(q));
}

function groupByWeek(workouts: Workout[]): WeekGroup[] {
  const byWeek = new Map<string, WeekGroup>();
  for (const w of workouts) {
    const dt = new Date(w.date + "T00:00:00");
    const day = (dt.getDay() + 6) % 7;
    const start = new Date(dt);
    start.setDate(dt.getDate() - day);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    const key = iso(start);
    const g = byWeek.get(key) ?? { key, start: iso(start), end: iso(end), workouts: [] };
    g.workouts.push(w);
    byWeek.set(key, g);
  }
  return [...byWeek.values()].sort((a, b) => b.start.localeCompare(a.start));
}

function iso(d: Date) {
  return d.toISOString().slice(0, 10);
}
