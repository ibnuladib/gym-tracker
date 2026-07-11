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
      <div className="tpl-head">
        <div>
          <div className="stamp">history</div>
          <div className="tpl-head-h num">
            {workouts.length} {workouts.length === 1 ? "session" : "sessions"}
          </div>
        </div>
        <Link href="/workout/new" className="btn btn-primary">+ new</Link>
      </div>

      {workouts.length > 3 && (
        <input
          className="input"
          placeholder="filter by exercise, name, date…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      )}

      {filtered.length === 0 && (
        <div className="card text-sm text-fg-dim">no sessions match.</div>
      )}
      {filtered.map((g) => (
        <section key={g.key} className="space-y-2">
          <h2 className="stamp">{g.start} → {g.end}</h2>
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
      <Link href={`/workout/${w.id}`} className="block">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="truncate text-sm font-medium text-fg">{w.name}</div>
            <div className="num text-2xs text-fg-faint">
              {w.date} · {w.exercises.length} ex · {totalSets} sets · {Math.round(totalVol).toLocaleString()}kg
            </div>
          </div>
          <span className="text-2xs text-fg-dim">edit →</span>
        </div>
        <div className="mt-2 space-y-1.5">
          {w.exercises.slice(0, 3).map((ex, i) => (
            <div key={i} className="text-2xs text-fg-dim truncate">
              <span className="text-fg-muted">{ex.name}</span>{" "}
              {ex.sets.map((s) => `${formatWeight(s)}×${s.reps}`).join("  ·  ")}
            </div>
          ))}
          {w.exercises.length > 3 && (
            <div className="text-2xs text-fg-faint">+{w.exercises.length - 3} more</div>
          )}
        </div>
      </Link>
      <button
        onClick={onDelete}
        className="mt-2 text-2xs text-fg-faint transition-colors hover:text-danger"
        aria-label={`delete ${w.name}`}
      >
        delete
      </button>
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
