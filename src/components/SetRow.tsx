"use client";

import { ALL_UNITS, unitShort } from "@/lib/units";
import type { SetEntry, Unit } from "@/lib/types";

interface Props {
  set: SetEntry;
  index: number;
  done?: boolean;
  onChange: (s: SetEntry) => void;
  onRemove: () => void;
  onToggleDone?: () => void;
}

export function SetRow({ set, index, done, onChange, onRemove, onToggleDone }: Props) {
  return (
    <div
      className={
        "grid grid-cols-[2rem_1fr_3.5rem_2.5rem] items-center gap-1.5 rounded-lg border p-1.5 text-sm transition-colors " +
        (done
          ? "border-accent-border/40 bg-accent-bg/40"
          : "border-border bg-bg")
      }
    >
      <button
        type="button"
        onClick={onToggleDone}
        aria-pressed={done ? "true" : "false"}
        aria-label={done ? "Mark set incomplete" : "Mark set done"}
        className={
          "flex h-7 w-8 items-center justify-center rounded-md text-xs font-semibold transition-colors " +
          (done
            ? "bg-accent text-bg"
            : "bg-elev text-muted hover:text-fg")
        }
      >
        {done ? (
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12l5 5 9-9" />
          </svg>
        ) : (
          `#${index + 1}`
        )}
      </button>

      <div className="flex items-center gap-1">
        <div className="flex flex-1 items-center overflow-hidden rounded-md border border-border bg-bg">
          <button
            type="button"
            aria-label="decrease weight"
            className="flex h-8 w-7 items-center justify-center text-muted transition-colors hover:bg-elev hover:text-fg"
            onClick={() => onChange({ ...set, weight: Math.max(0, roundStep(set.weight - (set.unit === "lb" ? 5 : 2.5))) })}
          >−</button>
          <input
            inputMode="decimal"
            pattern="[0-9]*"
            aria-label="weight"
            className="num h-8 w-full bg-transparent px-1 text-center text-sm outline-none placeholder:text-fg-faint"
            value={set.weight === 0 ? "" : set.weight}
            placeholder="wt"
            onChange={(e) => onChange({ ...set, weight: parseFloat(e.target.value) || 0 })}
          />
          <button
            type="button"
            aria-label="increase weight"
            className="flex h-8 w-7 items-center justify-center text-muted transition-colors hover:bg-elev hover:text-fg"
            onClick={() => onChange({ ...set, weight: roundStep(set.weight + (set.unit === "lb" ? 5 : 2.5)) })}
          >+</button>
        </div>
        <UnitPicker unit={set.unit} onChange={(u) => onChange({ ...set, unit: u })} />
      </div>

      <div className="flex items-center overflow-hidden rounded-md border border-border bg-bg">
        <button
          type="button"
          aria-label="decrease reps"
          className="flex h-8 w-6 items-center justify-center text-muted transition-colors hover:bg-elev hover:text-fg"
          onClick={() => onChange({ ...set, reps: Math.max(0, set.reps - 1) })}
        >−</button>
        <input
          inputMode="numeric"
          pattern="[0-9]*"
          aria-label="reps"
          className="num h-8 w-full bg-transparent text-center text-sm outline-none placeholder:text-fg-faint"
          value={set.reps === 0 ? "" : set.reps}
          placeholder="reps"
          onChange={(e) => onChange({ ...set, reps: parseInt(e.target.value, 10) || 0 })}
        />
        <button
          type="button"
          aria-label="increase reps"
          className="flex h-8 w-6 items-center justify-center text-muted transition-colors hover:bg-elev hover:text-fg"
          onClick={() => onChange({ ...set, reps: set.reps + 1 })}
        >+</button>
      </div>

      <button
        type="button"
        onClick={onRemove}
        aria-label="remove set"
        className="flex h-8 w-8 items-center justify-center rounded-md text-muted hover:bg-elev hover:text-danger"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      </button>
    </div>
  );
}

function UnitPicker({ unit, onChange }: { unit: Unit; onChange: (u: Unit) => void }) {
  return (
    <div className="flex shrink-0 overflow-hidden rounded-md border border-border bg-bg text-2xs">
      {ALL_UNITS.map((u) => (
        <button
          key={u}
          type="button"
          aria-pressed={u === unit}
          aria-label={u}
          onClick={() => onChange(u)}
          className={
            "flex h-8 w-7 items-center justify-center transition-colors " +
            (u === unit
              ? "bg-accent-bg text-accent"
              : "text-muted hover:bg-elev hover:text-fg")
          }
        >
          {unitShort(u)}
        </button>
      ))}
    </div>
  );
}

function roundStep(n: number) {
  return Math.round(n * 4) / 4; // quarter increments (0.25kg) for finer control
}
