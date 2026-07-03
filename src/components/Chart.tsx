"use client";

import { useMemo } from "react";

interface Series {
  label: string;
  color?: string;
  points: Array<{ x: number; y: number; meta?: string }>;
}

interface Props {
  series: Series[];
  height?: number;
  yLabel?: string;
  formatY?: (n: number) => string;
}

export function Chart({ series, height = 180, yLabel, formatY }: Props) {
  const { width, paddedH, padL, padR, padT, padB, xMax, yMin, yMax, paths, dots, ticks } = useMemo(() => {
    const allPts = series.flatMap((s) => s.points);
    const xs = allPts.map((p) => p.x);
    const ys = allPts.map((p) => p.y);
    const xMax = xs.length ? Math.max(...xs) : 1;
    const yMin = 0;
    const yMax = ys.length ? Math.max(...ys, 1) : 1;
    const width = 600;
    const padL = 36;
    const padR = 12;
    const padT = 10;
    const padB = 22;
    const paddedH = height - padT - padB;
    const x = (n: number) => padL + (n / xMax) * (width - padL - padR);
    const y = (n: number) => padT + paddedH - ((n - yMin) / (yMax - yMin || 1)) * paddedH;
    const paths = series.map((s) => {
      if (s.points.length === 0) return "";
      const sorted = [...s.points].sort((a, b) => a.x - b.x);
      return sorted
        .map((p, i) => `${i === 0 ? "M" : "L"} ${x(p.x).toFixed(1)} ${y(p.y).toFixed(1)}`)
        .join(" ");
    });
    const dots = series.flatMap((s, si) =>
      [...s.points].sort((a, b) => a.x - b.x).map((p) => ({
        cx: x(p.x),
        cy: y(p.y),
        color: s.color ?? "#e8a33d",
        meta: p.meta ?? "",
      }))
    );
    const tickCount = 4;
    const ticks = Array.from({ length: tickCount + 1 }, (_, i) => {
      const v = yMin + ((yMax - yMin) * i) / tickCount;
      return { v, y: y(v) };
    });
    return { width, paddedH, padL, padR, padT, padB, xMax, yMin, yMax, paths, dots, ticks };
  }, [series, height]);

  return (
    <div className="overflow-x-auto">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="block min-w-full"
        role="img"
        aria-label={yLabel ?? "chart"}
      >
        {ticks.map((t, i) => (
          <g key={i}>
            <line x1={padL} x2={width - padR} y1={t.y} y2={t.y} stroke="#2a2620" strokeDasharray="2 4" />
            <text x={4} y={t.y + 3} fontSize="10" fill="#6b6457" fontFamily="ui-monospace, monospace">
              {formatY ? formatY(t.v) : Math.round(t.v)}
            </text>
          </g>
        ))}
        {paths.map((d, i) => (
          <path key={i} d={d} fill="none" stroke={series[i].color ?? "#e8a33d"} strokeWidth="1.4" />
        ))}
        {dots.map((d, i) => (
          <circle key={i} cx={d.cx} cy={d.cy} r={2.2} fill={d.color}>
            <title>{d.meta}</title>
          </circle>
        ))}
        {series.length > 1 && (
          <g fontSize="10" fontFamily="ui-monospace, monospace" fill="#9b9384">
            {series.map((s, i) => (
              <g key={i} transform={`translate(${padL + i * 80}, ${height - 4})`}>
                <rect width="10" height="10" fill={s.color ?? "#e8a33d"} />
                <text x="14" y="9">{s.label}</text>
              </g>
            ))}
          </g>
        )}
      </svg>
    </div>
  );
}
