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
      <div className="space-y-3">
        <BackLink href="/progress" />
        <h1 className="text-lg font-semibold">{name}</h1>
        <div className="card text-sm text-zinc-500">no data for this exercise yet.</div>
      </div>
    );
  }

  const volPts = series.byDate.map((p, i) => ({ x: i, y: p.volume, meta: `${p.date}: ${Math.round(p.volume).toLocaleString()}kg` }));
  const e1Pts = series.byDate.map((p, i) => ({ x: i, y: p.e1rm, meta: `${p.date}: ${p.e1rm.toFixed(1)}kg e1RM` }));
  const wtPts = series.byDate.map((p, i) => ({ x: i, y: p.topWeight, meta: `${p.date}: ${p.topWeight.toFixed(1)}kg top` }));

  return (
    <div className="space-y-3">
      <BackLink href="/progress" />
      <h1 className="text-lg font-semibold">{name}</h1>

      <div className="grid grid-cols-2 gap-2">
        <Pr label="est. 1RM" value={`${prs.bestE1RM.value.toFixed(1)}kg`} sub={prs.bestE1RM.date} />
        <Pr label="heaviest set" value={`${prs.heaviestSet.value.toFixed(1)}kg`} sub={`${prs.heaviestSet.date} · ${formatWeight(prs.heaviestSet.set)} × ${prs.heaviestSet.set.reps}`} />
        <Pr label="best reps" value={`${prs.bestReps.reps} reps`} sub={`${prs.bestReps.date} · ${formatWeight(prs.bestReps.set)}`} />
        <Pr label="best volume" value={`${Math.round(prs.bestVolume.value).toLocaleString()}kg`} sub={prs.bestVolume.date} />
      </div>

      <div className="card space-y-2">
        <div className="label">volume over time</div>
        {volPts.length > 1 ? <Chart series={[{ label: "volume", color: "#10b981", points: volPts }]} yLabel="kg" formatY={(n) => `${Math.round(n).toLocaleString()}`} /> : <Empty />}
      </div>

      <div className="card space-y-2">
        <div className="label">estimated 1RM</div>
        {e1Pts.length > 1 ? <Chart series={[{ label: "e1RM", color: "#22d3ee", points: e1Pts }]} yLabel="kg" formatY={(n) => n.toFixed(0)} /> : <Empty />}
      </div>

      <div className="card space-y-2">
        <div className="label">top weight</div>
        {wtPts.length > 1 ? <Chart series={[{ label: "top", color: "#f59e0b", points: wtPts }]} yLabel="kg" formatY={(n) => n.toFixed(0)} /> : <Empty />}
      </div>

      <div className="text-xs text-zinc-500">
        PR list <Link href="/progress" className="text-zinc-300 hover:text-emerald-300">back to progress</Link>
      </div>
    </div>
  );
}

function Pr({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="card p-3">
      <div className="label">{label}</div>
      <div className="mt-1 text-lg font-semibold text-emerald-300">{value}</div>
      {sub && <div className="text-[10px] text-zinc-500">{sub}</div>}
    </div>
  );
}

function Empty() {
  return <div className="py-6 text-center text-sm text-zinc-500">log more sessions to see a trend.</div>;
}
