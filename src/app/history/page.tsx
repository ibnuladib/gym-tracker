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
    <div className="space-y-5">
      <header>
        <h1 className="font-display text-2xl font-light tracking-tight text-fg">history</h1>
      </header>
      <input
        className="input"
        placeholder="filter by exercise, name, date…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {filtered.length === 0 && (
        <div className="card text-sm text-fg-dim">no sessions match.</div>
      )}
      {filtered.map((g) => (
        <section key={g.key} className="space-y-2">
          <h2 className="stamp sticky top-12 z-10 -mx-4 bg-bg/85 px-4 py-1 backdrop-blur sm:-mx-6 sm:px-6">
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
          <div className="truncate text-sm font-medium text-fg">
            <Link href={`/workout/${w.id}`} className="transition-colors hover:text-accent-fg">
              {w.name}
            </Link>
          </div>
          <div className="num text-2xs text-fg-faint">
            {w.date} · {w.exercises.length} ex · {totalSets} sets · {Math.round(totalVol).toLocaleString()}kg
          </div>
        </div>
        <Link href={`/workout/new?repeat=${w.id}`} className="text-2xs text-fg-dim transition-colors hover:text-accent-fg">
          ↻ repeat
        </Link>
      </div>
      <details className="mt-2">
        <summary className="cursor-pointer text-2xs text-fg-dim transition-colors hover:text-fg" style={{ letterSpacing: "0.14em" }}>
          show sets
        </summary>
        <div className="mt-2 space-y-2">
          {w.exercises.map((ex, i) => (
            <div key={i} className="text-xs">
              <div className="text-fg">{ex.name}</div>
              <div className="mt-1 flex flex-wrap gap-1.5 text-fg-dim">
                {ex.sets.map((s, j) => (
                  <span key={j} className="chip">
                    {formatWeight(s)} × {s.reps}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
        <button onClick={onDelete} className="mt-3 text-2xs text-danger transition-colors hover:text-danger-fg">
          delete
        </button>
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
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
