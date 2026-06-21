"use client";

import dynamic from "next/dynamic";
import { useStore } from "@/lib/store";

const Heatmap = dynamic(() => import("@/components/Heatmap").then((m) => m.Heatmap), { ssr: false });

export default function HeatmapPage() {
  const { workouts } = useStore();
  return (
    <div className="space-y-3">
      <h1 className="text-lg font-semibold">heatmap</h1>
      <p className="text-xs text-zinc-500">volume per day (kg × reps) for the last 53 weeks.</p>
      <div className="card">
        <Heatmap workouts={workouts} />
      </div>
    </div>
  );
}
