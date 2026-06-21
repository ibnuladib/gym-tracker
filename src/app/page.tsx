"use client";

import Link from "next/link";
import { useStore } from "@/lib/store";
import { useMemo } from "react";
import { dailyVolume } from "@/lib/prs";
import { toKg } from "@/lib/units";

function fmtDate(d: Date) {
  return d.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" });
}
function dayKey(d: Date) {
  return d.toISOString().slice(0, 10);
}
function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export default function Home() {
  const { ready, workouts, templates } = useStore();
  const today = useMemo(() => dayKey(new Date()), []);
  const todays = workouts.filter((w) => w.date === today);
  const last = workouts[0];

  // 14-day sparkline + streak + this-week volume
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
    // streak: consecutive days with a workout, ending today
    let streak = 0;
    for (let i = series.length - 1; i >= 0; i--) {
      if (series[i].vol > 0) streak++;
      else break;
    }
    return { series, maxVol, weekVol, streak };
  }, [workouts]);

  // derived from unit-aware totals
  const lastVolumeKg = useMemo(() => {
    if (!last) return 0;
    return last.exercises.reduce(
      (a, e) => a + e.sets.reduce((b, s) => b + toKg(s) * s.reps, 0),
      0
    );
  }, [last]);

  return (
    <div className="space-y-4">
      <section className="card relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-accent/10 blur-3xl"
        />
        <div className="relative">
          <div className="label">today</div>
          <div className="mt-1 flex items-end justify-between gap-3">
            <div>
              <div className="text-xl font-semibold leading-tight text-fg">
                {fmtDate(new Date())}
              </div>
              <div className="mt-0.5 text-xs text-muted">
                {todays.length > 0
                  ? `${todays.length} session${todays.length > 1 ? "s" : ""} today`
                  : "rest day — or start one below"}
              </div>
            </div>
            <Link
              href="/workout/new"
              className="btn btn-primary btn-lg"
              aria-label="Log a workout"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden>
                <path d="M12 5v14M5 12h14" />
              </svg>
              <span>log</span>
            </Link>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-3 gap-2">
        <Stat label="7d vol" value={`${Math.round(metrics.weekVol).toLocaleString()}kg`} />
        <Stat label="sessions" value={String(workouts.length)} />
        <Stat label="streak" value={metrics.streak > 0 ? `${metrics.streak}d` : "—"} accent={metrics.streak > 0} />
      </section>

      <section className="card">
        <div className="mb-2 flex items-center justify-between">
          <div className="label">last 14 days</div>
          <Link href="/heatmap" className="text-2xs text-muted hover:text-fg">
            full heatmap →
          </Link>
        </div>
        <Sparkline series={metrics.series} max={metrics.maxVol} />
      </section>

      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-fg">recent</h2>
          <Link href="/history" className="text-2xs text-muted hover:text-fg">
            all →
          </Link>
        </div>
        {!ready && <div className="skeleton h-14 w-full" />}
        {ready && workouts.length === 0 && (
          <div className="card flex flex-col items-center gap-1 py-8 text-center text-sm text-muted">
            <div>no workouts yet</div>
            <div className="text-2xs text-fg-faint">tap the + button to log your first session</div>
          </div>
        )}
        <ul className="space-y-1.5">
          {workouts.slice(0, 5).map((w) => {
            const sets = w.exercises.reduce((a, e) => a + e.sets.length, 0);
            return (
              <li key={w.id}>
                <Link
                  href={`/workout/${w.id}`}
                  className="card flex items-center justify-between gap-3 transition-colors hover:border-border-strong"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-fg">{w.name}</div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-1 text-2xs text-fg-faint">
                      <span>{w.date}</span>
                      <span>·</span>
                      <span>{w.exercises.length} ex</span>
                      <span>·</span>
                      <span>{sets} sets</span>
                    </div>
                  </div>
                  <span className="chip text-2xs">view</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      {last && (
        <section>
          <Link
            href={`/workout/new?repeat=${last.id}`}
            className="card flex items-center justify-between gap-3 transition-colors hover:border-accent-border"
          >
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-accent-border bg-accent-bg text-accent">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M3 12a9 9 0 0 1 15.5-6.3L21 8" />
                  <path d="M21 3v5h-5" />
                  <path d="M21 12a9 9 0 0 1-15.5 6.3L3 16" />
                  <path d="M3 21v-5h5" />
                </svg>
              </div>
              <div className="min-w-0">
                <div className="truncate text-sm font-medium text-fg">{last.name}</div>
                <div className="text-2xs text-fg-faint">
                  {last.date} · {Math.round(lastVolumeKg).toLocaleString()}kg
                </div>
              </div>
            </div>
            <span className="text-2xs text-accent">repeat →</span>
          </Link>
        </section>
      )}

      {templates.length > 0 && (
        <section>
          <Link
            href="/templates"
            className="card-sm flex items-center justify-between text-xs text-muted hover:text-fg"
          >
            <span>{templates.length} template{templates.length !== 1 ? "s" : ""} saved</span>
            <span>manage →</span>
          </Link>
        </section>
      )}
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="card-sm">
      <div className="label">{label}</div>
      <div className={"mt-1 text-base font-semibold num " + (accent ? "text-accent" : "text-fg")}>
        {value}
      </div>
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
    <svg viewBox={`0 0 ${w} ${h}`} className="h-14 w-full" preserveAspectRatio="none">
      <path d={area} fill="url(#spark-grad)" />
      <defs>
        <linearGradient id="spark-grad" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.35" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d={path}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.9"
      />
      <circle cx={today.x} cy={today.y} r="2.5" fill="currentColor" />
    </svg>
  );
}
