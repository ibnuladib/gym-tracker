"use client";

import { unitShort } from "@/lib/units";
import type { SetEntry } from "@/lib/types";

interface Props {
  set: SetEntry;
  index: number;
  done?: boolean;
  onChange: (s: SetEntry) => void;
  onRemove: () => void;
  onCommit?: () => void;
}

// One row per set. Big tappable, weight and reps dominate visually.
// Tap the row body to "log & next" (the most common move).
// The +/- flank the number; long-press or remove via the trailing menu.
export function SetRow({ set, index, done, onChange, onRemove, onCommit }: Props) {
  return (
    <div
      className={
        "bigset " + (done ? "is-done" : "")
      }
      role={onCommit ? "button" : undefined}
      tabIndex={onCommit ? 0 : undefined}
      onClick={onCommit}
      onKeyDown={
        onCommit
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onCommit();
              }
            }
          : undefined
      }
      aria-label={done ? `set ${index + 1} logged` : `log set ${index + 1}`}
    >
      <div className="bigset-num" aria-hidden>
        {index + 1}
      </div>

      <button
        type="button"
        aria-label="decrease weight"
        className="bigset-step"
        onClick={(e) => {
          e.stopPropagation();
          onChange({ ...set, weight: roundStep(Math.max(0, set.weight - stepFor(set.unit))) });
        }}
      >
        −
      </button>

      <div className="bigset-cell" onClick={(e) => e.stopPropagation()}>
        <input
          inputMode="decimal"
          pattern="[0-9]*"
          aria-label="weight"
          className="bigset-input num"
          value={set.weight === 0 ? "" : set.weight}
          placeholder="0"
          onChange={(e) => onChange({ ...set, weight: parseFloat(e.target.value) || 0 })}
        />
        <div className="bigset-unit">{unitShort(set.unit)}</div>
      </div>

      <button
        type="button"
        aria-label="increase weight"
        className="bigset-step"
        onClick={(e) => {
          e.stopPropagation();
          onChange({ ...set, weight: roundStep(set.weight + stepFor(set.unit)) });
        }}
      >
        +
      </button>

      <div className="bigset-x" aria-hidden />

      <button
        type="button"
        aria-label="decrease reps"
        className="bigset-step"
        onClick={(e) => {
          e.stopPropagation();
          onChange({ ...set, reps: Math.max(0, set.reps - 1) });
        }}
      >
        −
      </button>

      <div className="bigset-cell" onClick={(e) => e.stopPropagation()}>
        <input
          inputMode="numeric"
          pattern="[0-9]*"
          aria-label="reps"
          className="bigset-input num"
          value={set.reps === 0 ? "" : set.reps}
          placeholder="0"
          onChange={(e) => onChange({ ...set, reps: parseInt(e.target.value, 10) || 0 })}
        />
        <div className="bigset-unit">reps</div>
      </div>

      <button
        type="button"
        aria-label="increase reps"
        className="bigset-step"
        onClick={(e) => {
          e.stopPropagation();
          onChange({ ...set, reps: set.reps + 1 });
        }}
      >
        +
      </button>

      <button
        type="button"
        aria-label="remove set"
        className="bigset-remove"
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
      >
        ×
      </button>
    </div>
  );
}

function stepFor(unit: SetEntry["unit"]): number {
  if (unit === "lb") return 5;
  if (unit === "plate") return 1.25; // a plate side
  if (unit === "bw") return 0;
  return 2.5; // kg default
}

function roundStep(n: number) {
  return Math.round(n * 4) / 4;
}
