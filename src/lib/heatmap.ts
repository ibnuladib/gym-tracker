import { dailyVolume } from "./prs";

export interface HeatmapCell {
  date: string; // YYYY-MM-DD
  volume: number;
  level: 0 | 1 | 2 | 3 | 4;
}

export interface HeatmapData {
  cells: HeatmapCell[]; // length 371 (53 weeks * 7)
  monthLabels: Array<{ x: number; label: string }>;
  maxVolume: number;
  totalDays: number;
  activeDays: number;
}

/** Builds a GitHub-style 53-week heatmap ending today. */
export function buildHeatmap(workouts: Array<{ date: string }>, weeks = 53): HeatmapData {
  const vol = dailyVolume(workouts as never);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  // Snap to the most recent Saturday so the grid ends on a full week column
  const end = new Date(today);
  end.setDate(end.getDate() + ((6 - end.getDay() + 7) % 7));
  const start = new Date(end);
  start.setDate(start.getDate() - (weeks * 7 - 1));

  const cells: HeatmapCell[] = [];
  const maxVolume = [...vol.values()].reduce((m, v) => Math.max(m, v), 0);
  let activeDays = 0;
  const cursor = new Date(start);
  while (cursor <= end) {
    const date = isoDate(cursor);
    const v = vol.get(date) ?? 0;
    cells.push({ date, volume: v, level: intensity(v, maxVolume) });
    if (v > 0) activeDays++;
    cursor.setDate(cursor.getDate() + 1);
  }

  // Month labels (one per column where the first row of the column is a new month)
  const monthLabels: Array<{ x: number; label: string }> = [];
  let lastMonth = -1;
  for (let w = 0; w < weeks; w++) {
    const cell = cells[w * 7];
    if (!cell) continue;
    const dt = new Date(cell.date);
    const m = dt.getMonth();
    if (m !== lastMonth) {
      monthLabels.push({ x: w, label: dt.toLocaleString("en", { month: "short" }) });
      lastMonth = m;
    }
  }

  return { cells, monthLabels, maxVolume, totalDays: cells.length, activeDays };
}

export function isoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function intensity(v: number, max: number): 0 | 1 | 2 | 3 | 4 {
  if (v <= 0 || max <= 0) return 0;
  const r = v / max;
  if (r > 0.75) return 4;
  if (r > 0.5) return 3;
  if (r > 0.25) return 2;
  return 1;
}
