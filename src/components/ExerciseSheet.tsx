"use client";

import { useEffect, useState } from "react";
import type { Unit } from "@/lib/types";

interface Props {
  open: boolean;
  onClose: () => void;
  // Names the user has logged before, paired with the unit last used.
  // Empty array = no suggestions, pure free-text.
  suggestions: { name: string; lastUnit: Unit }[];
  taken: string[];
  initialName?: string;
  initialUnit?: Unit;
  onPick: (name: string, unit: Unit) => void;
}

const UNITS: Unit[] = ["kg", "lb", "plate", "bw"];

export function ExerciseSheet({
  open,
  onClose,
  suggestions,
  taken,
  initialName,
  initialUnit,
  onPick,
}: Props) {
  const [q, setQ] = useState("");
  const [unit, setUnit] = useState<Unit>(initialUnit ?? "kg");
  const isRename = Boolean(initialName);

  useEffect(() => {
    if (open) {
      setQ(initialName ?? "");
      setUnit(initialUnit ?? "kg");
    }
  }, [open, initialName, initialUnit]);

  if (!open) return null;

  const takenLc = new Set(taken.map((t) => t.toLowerCase()));
  const qTrim = q.trim();
  const qLc = qTrim.toLowerCase();
  const matches = qLc
    ? suggestions.filter((s) => s.name.toLowerCase().includes(qLc))
    : suggestions;
  // Hide names already in this workout (when adding), keep when renaming.
  const visible = isRename
    ? matches
    : matches.filter((s) => !takenLc.has(s.name.toLowerCase()));
  const exact = suggestions.find((s) => s.name.toLowerCase() === qLc);

  const choose = (name: string, u: Unit) => {
    onPick(name, u);
    onClose();
  };

  return (
    <div className="sheet-backdrop" onClick={onClose} role="presentation">
      <div
        className="sheet"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label={isRename ? "Rename exercise" : "Add exercise"}
      >
        <div className="sheet-handle" aria-hidden />

        <div className="sheet-head">
          <div className="label">{isRename ? "rename" : "exercise"}</div>
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
          placeholder={isRename ? "rename to…" : "what did you do?"}
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            const m = suggestions.find((s) => s.name.toLowerCase() === e.target.value.trim().toLowerCase());
            if (m) setUnit(m.lastUnit);
          }}
        />

        <div className="sheet-units" role="radiogroup" aria-label="unit">
          {UNITS.map((u) => (
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

        {visible.length > 0 && (
          <ul className="sheet-list">
            {visible.slice(0, 8).map((s) => (
              <li key={s.name}>
                <button
                  type="button"
                  className="sheet-item"
                  onClick={() => choose(s.name, s.lastUnit)}
                >
                  <span>{s.name}</span>
                  <span className="sheet-item-unit">{s.lastUnit}</span>
                </button>
              </li>
            ))}
          </ul>
        )}

        {qTrim && (
          <button
            type="button"
            className={"sheet-cta " + (exact ? "is-existing" : "")}
            onClick={() => choose(qTrim, unit)}
          >
            {exact
              ? `use "${qTrim}"`
              : isRename
                ? `rename to "${qTrim}"`
                : `+ log "${qTrim}"`}
            <span className="sheet-cta-unit">{unit}</span>
          </button>
        )}

        {!qTrim && visible.length === 0 && (
          <div className="sheet-empty">
            {suggestions.length === 0
              ? "type a name to start — suggestions appear as you log more"
              : "type to search your past exercises"}
          </div>
        )}
      </div>
    </div>
  );
}
