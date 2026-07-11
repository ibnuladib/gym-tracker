"use client";

import { useEffect, useState } from "react";
import { SetRow } from "./SetRow";
import { ExerciseSheet } from "./ExerciseSheet";
import { nanoid } from "nanoid";
import type { ExerciseLog, SetEntry, Template, Unit, Workout } from "@/lib/types";
import { toKg } from "@/lib/units";

interface Props {
  templates: Template[];
  suggestions: { name: string; lastUnit: Unit }[];
  initial?: Workout;
  onSubmit: (w: Workout) => Promise<void> | void;
  onCancel?: () => void;
}

function blankSet(unit: Unit, weight = 0, reps = 0): SetEntry {
  return { weight, unit, reps };
}

export function WorkoutForm({ templates, suggestions, initial, onSubmit, onCancel }: Props) {
  const [date, setDate] = useState(initial?.date ?? today());
  const [durationMin, setDurationMin] = useState<number | undefined>(initial?.durationMin);
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [showNotes, setShowNotes] = useState(Boolean(initial?.notes));
  const [showMeta, setShowMeta] = useState(false);
  const [logs, setLogs] = useState<ExerciseLog[]>(() => initial?.exercises ?? []);
  const [sheetFor, setSheetFor] = useState<"add" | { index: number } | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Open the sheet on a fresh workout so the user picks the first exercise.
  useEffect(() => {
    if (!initial) setSheetFor("add");
  }, [initial]);

  // The nav's "finish" button dispatches this event.
  useEffect(() => {
    const onFinish = () => {
      void finish();
    };
    window.addEventListener("gym:finish", onFinish);
    return () => window.removeEventListener("gym:finish", onFinish);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [logs, date, durationMin, notes, initial]);

  const applyTemplate = (tplId: string) => {
    const t = templates.find((x) => x.id === tplId);
    if (!t) return;
    setLogs(
      t.items.map((it) => ({
        name: it.exerciseName,
        sets: [blankSet(it.defaultUnit ?? "kg", it.defaultWeight ?? 0, it.defaultReps ?? 0)],
      }))
    );
  };

  const addExercise = (name: string, unit: Unit) => {
    if (logs.some((l) => l.name.toLowerCase() === name.toLowerCase())) {
      const idx = logs.findIndex((l) => l.name.toLowerCase() === name.toLowerCase());
      setLogs((prev) => prev.map((l, i) => (i === idx ? { ...l, sets: [...l.sets, blankSet(l.sets.at(-1)?.unit ?? unit, 0, 0)] } : l)));
      return;
    }
    setLogs([...logs, { name, sets: [blankSet(unit, 0, 0)] }]);
  };

  const renameExercise = (i: number, name: string, unit: Unit) => {
    setLogs(logs.map((l, idx) => (idx === i ? { ...l, name, sets: l.sets.map((s) => ({ ...s, unit })) } : l)));
  };

  const removeExercise = (i: number) => {
    setLogs(logs.filter((_, idx) => idx !== i));
  };

  const updateSet = (i: number, s: number, next: SetEntry) => {
    setLogs(
      logs.map((l, idx) => (idx === i ? { ...l, sets: l.sets.map((x, j) => (j === s ? next : x)) } : l))
    );
  };

  const addSet = (i: number) => {
    setLogs(
      logs.map((l, idx) =>
        idx === i
          ? { ...l, sets: [...l.sets, blankSet(l.sets.at(-1)?.unit ?? "kg", 0, 0)] }
          : l
      )
    );
  };

  // "Log & next" — the dominant gesture. Copies the current set and
  // queues the next one with the same weight/reps.
  const commitSet = (i: number, s: number) => {
    setLogs((prev) =>
      prev.map((l, idx) => {
        if (idx !== i) return l;
        const cur = l.sets[s];
        if (!cur || (cur.weight === 0 && cur.reps === 0)) return l;
        const next: SetEntry = { ...cur };
        return { ...l, sets: [...l.sets, next] };
      })
    );
  };

  const removeSet = (i: number, s: number) => {
    setLogs(logs.map((l, idx) => (idx === i ? { ...l, sets: l.sets.filter((_, j) => j !== s) } : l)));
  };

  const totalVolume = logs.reduce(
    (acc, l) =>
      acc +
      l.sets.reduce((a, s) => {
        if (s.unit === "bw") return a + s.reps;
        return a + toKg(s) * s.reps;
      }, 0),
    0
  );
  const totalSets = logs.reduce((a, l) => a + l.sets.length, 0);

  const finish = async () => {
    if (saving) return;
    const realLogs = logs.filter((l) => l.sets.some((s) => s.weight > 0 || s.reps > 0));
    if (realLogs.length === 0) {
      setError("log at least one set");
      return;
    }
    setError(null);
    setSaving(true);
    try {
      const w: Workout = {
        id: initial?.id ?? nanoid(10),
        name: initial?.name || realLogs[0].name,
        date,
        durationMin,
        notes: notes || undefined,
        exercises: realLogs,
        createdAt: initial?.createdAt ?? Date.now(),
        updatedAt: Date.now(),
      };
      await onSubmit(w);
    } catch (e) {
      setError(e instanceof Error ? e.message : "could not save — try again");
    } finally {
      setSaving(false);
    }
  };

  const sheetName =
    sheetFor === "add"
      ? undefined
      : sheetFor
        ? logs[sheetFor.index]?.name
        : undefined;
  const sheetUnit =
    sheetFor === "add"
      ? "kg"
      : sheetFor
        ? logs[sheetFor.index]?.sets.at(-1)?.unit ?? "kg"
        : "kg";

  return (
    <div className="wform">
      {templates.length > 0 && (
        <div className="wform-tpl">
          {templates.map((t) => (
            <button key={t.id} className="chip" onClick={() => applyTemplate(t.id)}>
              {t.name}
            </button>
          ))}
        </div>
      )}

      {logs.map((log, i) => (
        <section key={i} className="exercise">
          <header className="exercise-head">
            <button
              type="button"
              className="exercise-name"
              onClick={() => setSheetFor({ index: i })}
              aria-label={`rename ${log.name}`}
            >
              {log.name}
            </button>
            <div className="exercise-meta num">
              {log.sets.length} {log.sets.length === 1 ? "set" : "sets"}
            </div>
            <button
              type="button"
              onClick={() => removeExercise(i)}
              className="exercise-rm"
              aria-label={`remove ${log.name}`}
            >
              ×
            </button>
          </header>

          <div className="exercise-sets">
            {log.sets.map((s, sIdx) => (
              <SetRow
                key={sIdx}
                set={s}
                index={sIdx}
                done={sIdx < log.sets.length - 1}
                onChange={(next) => updateSet(i, sIdx, next)}
                onRemove={() => removeSet(i, sIdx)}
                onCommit={sIdx === log.sets.length - 1 ? () => commitSet(i, sIdx) : undefined}
              />
            ))}
          </div>

          <button
            type="button"
            className="exercise-add"
            onClick={() => addSet(i)}
          >
            + add set
          </button>
        </section>
      ))}

      <button
        type="button"
        className="wform-addex"
        onClick={() => setSheetFor("add")}
      >
        <span className="wform-addex-plus">+</span>
        <span>add exercise</span>
      </button>

      {showNotes ? (
        <textarea
          className="input wform-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="notes"
          rows={2}
        />
      ) : (
        <button
          type="button"
          className="wform-notes-toggle"
          onClick={() => setShowNotes(true)}
        >
          + notes
        </button>
      )}

      {showMeta ? (
        <div className="wform-meta">
          <div className="wform-meta-row">
            <div className="label">date</div>
            <input
              className="input"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div className="wform-meta-row">
            <div className="label">minutes</div>
            <input
              className="input"
              inputMode="numeric"
              value={durationMin ?? ""}
              onChange={(e) =>
                setDurationMin(e.target.value ? parseInt(e.target.value, 10) : undefined)
              }
            />
          </div>
        </div>
      ) : (
        <button
          type="button"
          className="wform-meta-toggle num"
          onClick={() => setShowMeta(true)}
        >
          {date} · {durationMin ? `${durationMin}m` : "—"}
        </button>
      )}

      {error && <div className="wform-error">{error}</div>}

      <div className="wform-foot num">
        <span>
          <span className="stamp">vol</span>{" "}
          {Math.round(totalVolume).toLocaleString()}kg
        </span>
        <span>
          <span className="stamp">sets</span> {totalSets}
        </span>
      </div>

      {onCancel && (
        <button className="btn wform-cancel" onClick={onCancel}>
          cancel
        </button>
      )}

      <ExerciseSheet
        open={sheetFor !== null}
        onClose={() => setSheetFor(null)}
        suggestions={suggestions}
        taken={logs.map((l) => l.name)}
        initialName={sheetName}
        initialUnit={sheetUnit}
        onPick={(name, unit) => {
          if (sheetFor === "add") {
            addExercise(name, unit);
          } else if (sheetFor) {
            renameExercise(sheetFor.index, name, unit);
          }
        }}
      />
    </div>
  );
}

function today(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
