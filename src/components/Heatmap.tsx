"use client";

import { useMemo, useState } from "react";
import clsx from "clsx";
import { buildHeatmap } from "@/lib/heatmap";
import type { Workout } from "@/lib/types";

const CELL = 12;
const GAP = 3;
const LEFT = 28;

const LEVEL_BG: Record<0 | 1 | 2 | 3 | 4, string> = {
  0: "var(--heat-0, #161b22)",
  1: "var(--heat-1, #0e4429)",
  2: "var(--heat-2, #006d32)",
  3: "var(--heat-3, #26a641)",
  4: "var(--heat-4, #39d353)",
};

export function Heatmap({ workouts }: { workouts: Workout[] }) {
  const [hover, setHover] = useState<{ i: number; x: number; y: number } | null>(null);
  const data = useMemo(() => buildHeatmap(workouts, 53), [workouts]);
  const width = LEFT + 53 * (CELL + GAP);
  const height = 18 + 7 * (CELL + GAP);

  return (
    <div className="space-y-2">
      <div className="relative overflow-x-auto">
        <svg
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          className="block min-w-full"
          role="img"
          aria-label="Training heatmap"
        >
          {data.monthLabels.map((m, i) => (
            <text
              key={i}
              x={LEFT + m.x * (CELL + GAP)}
              y={10}
              className="fill-zinc-500"
              fontSize="10"
              fontFamily="ui-monospace, monospace"
            >
              {m.label}
            </text>
          ))}
          {["Mon", "Wed", "Fri"].map((d, i) => (
            <text
              key={d}
              x={0}
              y={20 + (i * 2 + 1) * (CELL + GAP)}
              className="fill-zinc-500"
              fontSize="9"
              fontFamily="ui-monospace, monospace"
            >
              {d}
            </text>
          ))}
          {data.cells.map((c, i) => {
            const col = Math.floor(i / 7);
            const row = i % 7;
            const x = LEFT + col * (CELL + GAP);
            const y = 18 + row * (CELL + GAP);
            return (
              <rect
                key={c.date}
                x={x}
                y={y}
                width={CELL}
                height={CELL}
                rx={2}
                fill={LEVEL_BG[c.level]}
                onMouseEnter={() => setHover({ i, x, y })}
                onMouseLeave={() => setHover(null)}
                onTouchStart={() => setHover({ i, x, y })}
                onTouchEnd={() => setHover(null)}
              />
            );
          })}
        </svg>
        {hover && data.cells[hover.i] && (
          <div
            className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-md border border-zinc-800 bg-zinc-950/95 px-2 py-1 text-xs text-zinc-200 shadow-lg"
            style={{ left: hover.x + CELL / 2, top: hover.y - 4 }}
          >
            <div className="font-semibold">{data.cells[hover.i].date}</div>
            <div className="text-zinc-400">{data.cells[hover.i].volume > 0 ? `${Math.round(data.cells[hover.i].volume).toLocaleString()}kg vol` : "rest day"}</div>
          </div>
        )}
      </div>
      <div className="flex items-center gap-2 text-xs text-zinc-500">
        <span>less</span>
        {([0, 1, 2, 3, 4] as const).map((l) => (
          <span key={l} className={clsx("h-3 w-3 rounded-sm")} style={{ background: LEVEL_BG[l] }} />
        ))}
        <span>more</span>
        <span className="ml-auto">{data.activeDays} active / {data.totalDays} days</span>
      </div>
    </div>
  );
}
