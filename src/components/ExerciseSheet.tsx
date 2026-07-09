"use client";

import { useEffect, useState } from "react";
import type { Unit } from "@/lib/types";

interface Props {
  open: boolean;
  onClose: () => void;
  exercises: { name: string; defaultUnit: Unit }[];
  taken: string[];
  onPick: (name: string, unit: Unit) => void;
}

// One screen for choosing the next exercise. The current row of chips
// at the bottom of the form was eating vertical space; this bottom sheet
// opens on demand, full-width, with the keyboard already focused.
export function ExerciseSheet({ open, onClose, exercises, taken, onPick }: Props) {
  const [q, setQ] = useState("");
  const [unit, setUnit] = useState<Unit>("kg");

  useEffect(() => {
    if (open) {
      setQ("");
      setUnit("kg");
    }
  }, [open]);

  if (!open) return null;

  const takenLc = new Set(taken.map((t) => t.toLowerCase()));
  const qLc = q.trim().toLowerCase();
  const matches = qLc
    ? exercises.filter((e) => e.name.toLowerCase().includes(qLc))
    : exercises;
  const available = matches.filter((e) => !takenLc.has(e.name.toLowerCase()));
  const exact = exercises.find((e) => e.name.toLowerCase() === qLc);

  const choose = (name: string, u: Unit) => {
    onPick(name, u);
    onClose();
  };

  return (
    <div
      className="sheet-backdrop"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="sheet"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Pick an exercise"
      >
        <div className="sheet-handle" aria-hidden />

        <div className="sheet-head">
          <div className="label">exercise</div>
          <button
            type="button"
            onClick={onClose}
            className="sheet-close"
            aria-label="close"
          >
            ×
          </button>
        </div>

        <input
          autoFocus
          inputMode="text"
          className="input sheet-input"
          placeholder="search or type a new one"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            const m = exercises.find((x) => x.name.toLowerCase() === e.target.value.trim().toLowerCase());
            if (m) setUnit(m.defaultUnit);
          }}
        />

        <div className="sheet-units" role="radiogroup" aria-label="unit">
          {(["kg", "lb", "plate", "bw"] as Unit[]).map((u) => (
            <button
              key={u}
              type="button"
              role="radio"
              aria-checked={u === unit}
              onClick={() => setUnit(u)}
              className={"sheet-unit " + (u === unit ? "is-on" : "")}
            >
              {u}
            </button>
          ))}
        </div>

        <ul className="sheet-list">
          {available.slice(0, 14).map((e) => (
            <li key={e.name}>
              <button
                type="button"
                className="sheet-item"
                onClick={() => choose(e.name, e.defaultUnit)}
              >
                <span>{e.name}</span>
                <span className="sheet-item-unit">{e.defaultUnit}</span>
              </button>
            </li>
          ))}
          {q.trim() && !exact && (
            <li>
              <button
                type="button"
                className="sheet-item is-custom"
                onClick={() => choose(q.trim(), unit)}
              >
                <span>+ add &ldquo;{q.trim()}&rdquo;</span>
                <span className="sheet-item-unit">{unit}</span>
              </button>
            </li>
          )}
          {available.length === 0 && !q.trim() && (
            <li className="sheet-empty">no exercises left — type a name above</li>
          )}
        </ul>
      </div>
    </div>
  );
}
