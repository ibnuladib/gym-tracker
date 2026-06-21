"use client";

import Link from "next/link";
import { useStore } from "@/lib/store";
import { useMemo } from "react";
import { dailyVolume } from "@/lib/prs";

export default function Home() {
  const { ready, workouts, templates } = useStore();
  const today = new Date().toISOString().slice(0, 10);
  const last = workouts[0];
  const todays = workouts.filter((w) => w.date === today);
  const weeklyVol = useMemo(() => {
    const map = dailyVolume(workouts);
    let total = 0;
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const k = d.toISOString().slice(0, 10);
      total += map.get(k) ?? 0;
    }
    return total;
  }, [workouts]);

  return (
    <div className="space-y-4">
      <section className="card space-y-1">
        <div className="label">today</div>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-2xl font-semibold">{new Date().toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}</div>
            <div className="text-xs text-zinc-500">
              {todays.length > 0
                ? `${todays.length} session${todays.length > 1 ? "s" : ""} logged`
                : "no session yet"}
            </div>
          </div>
          <Link href="/workout/new" className="btn btn-primary">
            + log
          </Link>
        </div>
      </section>

      <section className="grid grid-cols-3 gap-2">
        <Stat label="7d vol" value={`${Math.round(weeklyVol).toLocaleString()}kg`} />
        <Stat label="sessions" value={String(workouts.length)} />
        <Stat label="templates" value={String(templates.length)} />
      </section>

      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">recent</h2>
          <Link href="/history" className="text-xs text-zinc-500 hover:text-zinc-200">view all →</Link>
        </div>
        {ready && workouts.length === 0 && (
          <div className="card text-sm text-zinc-500">
            nothing here yet. tap <span className="text-emerald-300">+ log</span> to start.
          </div>
        )}
        <ul className="space-y-1.5">
          {workouts.slice(0, 5).map((w) => (
            <li key={w.id}>
              <Link href={`/workout/${w.id}`} className="card flex items-center justify-between hover:border-emerald-500/40">
                <div>
                  <div className="text-sm font-semibold text-zinc-100">{w.name}</div>
                  <div className="text-xs text-zinc-500">{w.date} · {w.exercises.length} ex · {w.exercises.reduce((a, e) => a + e.sets.length, 0)} sets</div>
                </div>
                <span className="text-xs text-zinc-500">→</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {last && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">repeat last</h2>
          <Link href={`/workout/new?repeat=${last.id}`} className="card flex items-center justify-between hover:border-emerald-500/40">
            <div className="text-sm text-zinc-200">↻ {last.name} ({last.date})</div>
            <span className="text-xs text-zinc-500">prefill →</span>
          </Link>
        </section>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-3">
      <div className="label">{label}</div>
      <div className="mt-1 text-lg font-semibold">{value}</div>
    </div>
  );
}
