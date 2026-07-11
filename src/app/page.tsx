"use client";

import Link from "next/link";
import { useStore } from "@/lib/store";
import { useMemo } from "react";
import { dailyVolume } from "@/lib/prs";

function dayKey(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function Home() {
  const { ready, workouts, templates } = useStore();
  const today = useMemo(() => dayKey(new Date()), []);
  const todays = workouts.filter((w) => w.date === today);

  const metrics = useMemo(() => {
    const map = dailyVolume(workouts);
    const series: { day: string; vol: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const k = dayKey(d);
      series.push({ day: k, vol: map.get(k) ?? 0 });
    }
    const weekVol = series.slice(-7).reduce((a, s) => a + s.vol, 0);
    const maxVol = Math.max(1, ...series.map((s) => s.vol));
    let streak = 0;
    for (let i = series.length - 1; i >= 0; i--) {
      if (series[i].vol > 0) streak++;
      else break;
    }
    return { series, maxVol, weekVol, streak };
  }, [workouts]);

  return (
    <div className="space-y-6">
      <section className="relative border border-border bg-bg px-5 py-6 sm:px-7 sm:py-8">
        <div className="mb-4 flex items-center justify-between">
          <span className="stamp">7-day volume · kg × reps</span>
        </div>
        <div className="readout">
          {Math.round(metrics.weekVol).toLocaleString()}
          <span className="ml-1 text-fg-faint text-2xl font-normal align-top sm:text-3xl">kg</span>
        </div>
        <div className="mt-5 grid grid-cols-3 gap-x-4">
          <Cell label="sessions" value={String(workouts.length)} />
          <Cell label="streak" value={metrics.streak > 0 ? `${metrics.streak} d` : "—"} accent={metrics.streak > 0} />
          <Cell label="today" value={todays.length > 0 ? `${todays.length}` : "rest"} accent={todays.length > 0} />
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-end justify-between">
          <h2 className="stamp">last 14 days</h2>
        </div>
        <div className="border border-border bg-bg p-3">
          <Sparkline series={metrics.series} max={metrics.maxVol} />
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-end justify-between">
          <h2 className="stamp">recent</h2>
          <Link href="/history" className="text-2xs text-fg-dim transition-colors hover:text-accent-fg">
            all →
          </Link>
        </div>
        {!ready && <div className="skeleton h-14 w-full" />}
        {ready && workouts.length === 0 && (
          <div className="border border-dashed border-border p-6 text-center">
            <div className="text-sm text-fg-muted">no workouts yet</div>
            <div className="mt-1 text-2xs text-fg-faint">tap log below to start</div>
          </div>
        )}
        <ul className="border border-border divide-y divide-border">
          {workouts.slice(0, 5).map((w) => {
            const sets = w.exercises.reduce((a, e) => a + e.sets.length, 0);
            return (
              <li key={w.id}>
                <Link
                  href={`/workout/${w.id}`}
                  className="group flex items-center justify-between gap-3 px-3 py-2.5 transition-colors hover:bg-elev"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-fg">{w.name}</div>
                    <div className="num mt-0.5 text-2xs text-fg-faint">
                      {w.date} · {w.exercises.length} ex · {sets} sets
                    </div>
                  </div>
                  <span className="text-2xs text-fg-dim transition-colors group-hover:text-accent-fg">view →</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      {templates.length > 0 && (
        <section>
          <Link
            href="/templates"
            className="flex items-center justify-between border border-border px-3 py-2 text-xs text-fg-muted transition-colors hover:bg-elev hover:text-fg"
          >
            <span>{templates.length} routine{templates.length !== 1 ? "s" : ""} saved</span>
            <span>open →</span>
          </Link>
        </section>
      )}
    </div>
  );
}

function Cell({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <div className="stamp">{label}</div>
      <div className={"readout-sm mt-1 " + (accent ? "text-accent" : "")}>{value}</div>
    </div>
  );
}

function Sparkline({ series, max }: { series: { day: string; vol: number }[]; max: number }) {
  const w = 320;
  const h = 56;
  const padX = 2;
  const stepX = (w - padX * 2) / Math.max(1, series.length - 1);
  const points = series.map((s, i) => {
    const x = padX + i * stepX;
    const y = h - 2 - (s.vol / max) * (h - 6);
    return { x, y, vol: s.vol, day: s.day };
  });
  const path = points.map((p, i) => (i === 0 ? `M${p.x},${p.y}` : `L${p.x},${p.y}`)).join(" ");
  const area = `${path} L${points[points.length - 1].x},${h} L${points[0].x},${h} Z`;
  const today = points[points.length - 1];
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-14 w-full text-accent" preserveAspectRatio="none">
      <path d={area} fill="url(#spark-grad)" />
      <defs>
        <linearGradient id="spark-grad" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.28" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d={path}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.95"
      />
      <circle cx={today.x} cy={today.y} r="2" fill="currentColor" />
    </svg>
  );
}
