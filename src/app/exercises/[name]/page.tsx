"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo } from "react";
import { useStore } from "@/lib/store";
import { computePrs, exerciseSeries } from "@/lib/prs";
import { BackLink } from "@/components/BackLink";
import { formatWeight } from "@/lib/units";

const Chart = dynamic(() => import("@/components/Chart").then((m) => m.Chart), { ssr: false });

export default function ExercisePage() {
  const params = useParams<{ name: string }>();
  const name = decodeURIComponent(params.name);
  const { workouts } = useStore();
  const prs = useMemo(() => computePrs(workouts, name), [workouts, name]);
  const series = useMemo(() => exerciseSeries(workouts, name), [workouts, name]);

  if (!prs || prs.bestE1RM.value === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <BackLink href="/progress" />
          <h1 className="font-display text-2xl font-light tracking-tight text-fg">{name}</h1>
          <span className="w-10" />
        </div>
        <div className="card text-sm text-fg-dim">no data for this exercise yet.</div>
      </div>
    );
  }

  const volPts = series.byDate.map((p, i) => ({ x: i, y: p.volume, meta: `${p.date}: ${Math.round(p.volume).toLocaleString()}kg` }));
  const e1Pts = series.byDate.map((p, i) => ({ x: i, y: p.e1rm, meta: `${p.date}: ${p.e1rm.toFixed(1)}kg e1RM` }));
  const wtPts = series.byDate.map((p, i) => ({ x: i, y: p.topWeight, meta: `${p.date}: ${p.topWeight.toFixed(1)}kg top` }));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <BackLink href="/progress" />
        <h1 className="font-display text-2xl font-light tracking-tight text-fg">{name}</h1>
        <span className="w-10" />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Pr label="est. 1RM" value={`${prs.bestE1RM.value.toFixed(1)}kg`} sub={prs.bestE1RM.date} />
        <Pr label="heaviest set" value={`${prs.heaviestSet.value.toFixed(1)}kg`} sub={`${prs.heaviestSet.date} · ${formatWeight(prs.heaviestSet.set)} × ${prs.heaviestSet.set.reps}`} />
        <Pr label="best reps" value={`${prs.bestReps.reps} reps`} sub={`${prs.bestReps.date} · ${formatWeight(prs.bestReps.set)}`} />
        <Pr label="best volume" value={`${Math.round(prs.bestVolume.value).toLocaleString()}kg`} sub={prs.bestVolume.date} />
      </div>

      <div className="card space-y-3">
        <div className="stamp">volume over time</div>
        {volPts.length > 1 ? <Chart series={[{ label: "volume", color: "#e8a33d", points: volPts }]} yLabel="kg" formatY={(n) => `${Math.round(n).toLocaleString()}`} /> : <Empty />}
      </div>

      <div className="card space-y-3">
        <div className="stamp">estimated 1RM</div>
        {e1Pts.length > 1 ? <Chart series={[{ label: "e1RM", color: "#f0d267", points: e1Pts }]} yLabel="kg" formatY={(n) => n.toFixed(0)} /> : <Empty />}
      </div>

      <div className="card space-y-3">
        <div className="stamp">top weight</div>
        {wtPts.length > 1 ? <Chart series={[{ label: "top", color: "#d14b2f", points: wtPts }]} yLabel="kg" formatY={(n) => n.toFixed(0)} /> : <Empty />}
      </div>

      <div className="text-2xs text-fg-faint" style={{ letterSpacing: "0.08em" }}>
        <Link href="/progress" className="text-fg-dim transition-colors hover:text-accent-fg">
          ← back to progress
        </Link>
      </div>
    </div>
  );
}

function Pr({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="card p-3">
      <div className="stamp">{label}</div>
      <div className="readout-sm mt-1 text-accent">{value}</div>
      {sub && <div className="num mt-1 text-2xs text-fg-faint">{sub}</div>}
    </div>
  );
}

function Empty() {
  return <div className="py-6 text-center text-sm text-fg-dim">log more sessions to see a trend.</div>;
}
