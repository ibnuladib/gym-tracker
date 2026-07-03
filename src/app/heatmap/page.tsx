"use client";

import dynamic from "next/dynamic";
import { useStore } from "@/lib/store";

const Heatmap = dynamic(() => import("@/components/Heatmap").then((m) => m.Heatmap), { ssr: false });

export default function HeatmapPage() {
  const { workouts } = useStore();
  return (
    <div className="space-y-5">
      <header>
        <h1 className="font-display text-2xl font-light tracking-tight text-fg">heatmap</h1>
        <p className="mt-1 text-2xs text-fg-dim" style={{ letterSpacing: "0.12em" }}>
          volume per day · kg × reps · last 53 weeks
        </p>
      </header>
      <section className="card">
        <Heatmap workouts={workouts} />
      </section>
    </div>
  );
}
