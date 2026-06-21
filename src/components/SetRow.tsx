"use client";

import { ALL_UNITS, unitShort } from "@/lib/units";
import type { SetEntry, Unit } from "@/lib/types";

interface Props {
  set: SetEntry;
  index: number;
  onChange: (s: SetEntry) => void;
  onRemove: () => void;
}

export function SetRow({ set, index, onChange, onRemove }: Props) {
  return (
    <div className="grid grid-cols-[2.25rem_1fr_3.25rem_2.25rem] items-center gap-1.5 rounded-md border border-zinc-900 bg-zinc-950/60 p-1.5 text-sm">
      <div className="text-center text-xs text-zinc-500">#{index + 1}</div>
      <div className="flex items-center gap-1">
        <input
          inputMode="decimal"
          pattern="[0-9]*"
          aria-label="weight"
          className="input h-8 px-2 py-1 text-sm"
          value={set.weight === 0 ? "" : set.weight}
          placeholder="wt"
          onChange={(e) => onChange({ ...set, weight: parseFloat(e.target.value) || 0 })}
        />
        <select
          aria-label="unit"
          className="input h-8 w-14 px-1 py-1 text-xs"
          value={set.unit}
          onChange={(e) => onChange({ ...set, unit: e.target.value as Unit })}
        >
          {ALL_UNITS.map((u) => (
            <option key={u} value={u}>
              {unitShort(u)}
            </option>
          ))}
        </select>
      </div>
      <input
        inputMode="numeric"
        pattern="[0-9]*"
        aria-label="reps"
        className="input h-8 px-2 py-1 text-center text-sm"
        value={set.reps === 0 ? "" : set.reps}
        placeholder="reps"
        onChange={(e) => onChange({ ...set, reps: parseInt(e.target.value, 10) || 0 })}
      />
      <button
        onClick={onRemove}
        aria-label="remove set"
        className="flex h-8 w-8 items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-900 hover:text-rose-400"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      </button>
    </div>
  );
}
