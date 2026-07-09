"use client";

import { useEffect, useState } from "react";
import { SetRow } from "./SetRow";
import { ExerciseSheet } from "./ExerciseSheet";
import { nanoid } from "nanoid";
import type { ExerciseLog, SetEntry, Template, Unit, Workout } from "@/lib/types";
import { toKg } from "@/lib/units";

interface Props {
  templates: Template[];
  exercises: { name: string; defaultUnit: Unit }[];
  initial?: Workout;
  onSubmit: (w: Workout) => Promise<void> | void;
  onCancel?: () => void;
}

function blankSet(unit: Unit, weight = 0, reps = 0): SetEntry {
  return { weight, unit, reps };
}

export function WorkoutForm({ templates, exercises, initial, onSubmit, onCancel }: Props) {
  const [date, setDate] = useState(initial?.date ?? today());
  const [durationMin, setDurationMin] = useState<number | undefined>(initial?.durationMin);
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [logs, setLogs] = useState<ExerciseLog[]>(() =>
    initial?.exercises ?? [{ name: "Press isolateral", sets: [blankSet("kg", 0, 0)] }]
  );
  const [showNotes, setShowNotes] = useState(Boolean(initial?.notes));
  const [showMeta, setShowMeta] = useState(false);
  const [activeEx, setActiveEx] = useState<number | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Open the sheet on a fresh workout so the user picks the first exercise.
  // On edit, leave the existing logs alone.
  useEffect(() => {
    if (!initial) setSheetOpen(true);
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
      t.items.map((it) => {
        const ex = exercises.find((e) => e.name.toLowerCase() === it.exerciseName.toLowerCase());
        const unit = it.defaultUnit ?? ex?.defaultUnit ?? "kg";
        return {
          name: it.exerciseName,
          sets: [blankSet(unit, it.defaultWeight ?? 0, it.defaultReps ?? 0)],
        };
      })
    );
  };

  const addExercise = (name: string, unit: Unit) => {
    if (logs.some((l) => l.name.toLowerCase() === name.toLowerCase())) {
      const idx = logs.findIndex((l) => l.name.toLowerCase() === name.toLowerCase());
      setActiveEx(idx);
      return;
    }
    setLogs([...logs, { name, sets: [blankSet(unit, 0, 0)] }]);
    setActiveEx(logs.length);
  };

  const removeExercise = (i: number) => {
    setLogs(logs.filter((_, idx) => idx !== i));
    if (activeEx === i) setActiveEx(null);
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

  // "Log & next" — the dominant gesture. Marks the current set done
  // and immediately queues the next one with the same weight/reps.
  const commitSet = (i: number, s: number) => {
    setLogs((prev) =>
      prev.map((l, idx) => {
        if (idx !== i) return l;
        const cur = l.sets[s];
        if (!cur || (cur.weight === 0 && cur.reps === 0)) return l; // empty
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
        // Default the name to the first exercise — easy to rename later.
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

  return (
    <div className="wform">
      {templates.length > 0 && (
        <div className="wform-tpl">
          {templates.map((t) => (
            <button
              key={t.id}
              className="chip"
              onClick={() => applyTemplate(t.id)}
            >
              {t.name}
            </button>
          ))}
        </div>
      )}

      {logs.map((log, i) => {
        const isActive = activeEx === i || (activeEx === null && i === 0);
        return (
          <section
            key={i}
            className={"exercise " + (isActive ? "is-active" : "")}
            onClick={() => setActiveEx(i)}
          >
            <header className="exercise-head">
              <div className="exercise-name">{log.name}</div>
              <div className="exercise-meta num">
                {log.sets.length} {log.sets.length === 1 ? "set" : "sets"}
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeExercise(i);
                }}
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
              onClick={(e) => {
                e.stopPropagation();
                addSet(i);
              }}
            >
              + add set
            </button>
          </section>
        );
      })}

      <button
        type="button"
        className="wform-addex"
        onClick={() => setSheetOpen(true)}
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
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        exercises={exercises}
        taken={logs.map((l) => l.name)}
        onPick={addExercise}
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
