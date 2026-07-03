"use client";

import { useState } from "react";
import { SetRow } from "./SetRow";
import { nanoid } from "nanoid";
import type { ExerciseLog, SetEntry, Template, Unit, Workout } from "@/lib/types";
import { ALL_UNITS, formatWeight, unitLabel, toKg } from "@/lib/units";

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
  const [name, setName] = useState(initial?.name ?? "");
  const [date, setDate] = useState(initial?.date ?? today());
  const [durationMin, setDurationMin] = useState<number | undefined>(initial?.durationMin);
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [logs, setLogs] = useState<ExerciseLog[]>(initial?.exercises ?? []);
  const [customName, setCustomName] = useState("");
  const [saving, setSaving] = useState(false);

  const applyTemplate = (tplId: string) => {
    const t = templates.find((x) => x.id === tplId);
    if (!t) return;
    setName(t.name);
    setLogs(
      t.items.map((it) => {
        const ex = exercises.find((e) => e.name.toLowerCase() === it.exerciseName.toLowerCase());
        const unit = it.defaultUnit ?? ex?.defaultUnit ?? "kg";
        return {
          name: it.exerciseName,
          sets: Array.from({ length: it.defaultSets }, () =>
            blankSet(unit, it.defaultWeight ?? 0, it.defaultReps)
          ),
        };
      })
    );
  };

  const addExercise = (exerciseName: string) => {
    if (!exerciseName) return;
    if (logs.some((l) => l.name.toLowerCase() === exerciseName.toLowerCase())) return;
    const ex = exercises.find((e) => e.name.toLowerCase() === exerciseName.toLowerCase());
    const unit = ex?.defaultUnit ?? "kg";
    setLogs([...logs, { name: exerciseName, sets: [blankSet(unit, 0, 0), blankSet(unit, 0, 0), blankSet(unit, 0, 0)] }]);
  };

  const removeExercise = (i: number) => setLogs(logs.filter((_, idx) => idx !== i));

  const updateSet = (i: number, s: number, next: SetEntry) => {
    setLogs(
      logs.map((l, idx) => (idx === i ? { ...l, sets: l.sets.map((x, j) => (j === s ? next : x)) } : l))
    );
  };

  const addSet = (i: number) => {
    setLogs(
      logs.map((l, idx) => (idx === i ? { ...l, sets: [...l.sets, blankSet(l.sets.at(-1)?.unit ?? "kg", 0, 0)] } : l))
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

  const submit = async () => {
    if (saving) return;
    if (!name) return;
    setSaving(true);
    try {
      const w: Workout = {
        id: initial?.id ?? nanoid(10),
        name,
        date,
        durationMin,
        notes: notes || undefined,
        exercises: logs.filter((l) => l.sets.length > 0),
        createdAt: initial?.createdAt ?? Date.now(),
        updatedAt: Date.now(),
      };
      await onSubmit(w);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="card space-y-3">
        <div className="flex flex-wrap items-end gap-2">
          <div className="flex-1 min-w-[10rem]">
            <div className="label mb-1">name</div>
            <input className="input" value={name} placeholder="e.g. Push" onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="w-32">
            <div className="label mb-1">date</div>
            <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="w-20">
            <div className="label mb-1">min</div>
            <input
              className="input"
              inputMode="numeric"
              value={durationMin ?? ""}
              onChange={(e) => setDurationMin(e.target.value ? parseInt(e.target.value, 10) : undefined)}
            />
          </div>
        </div>
        {templates.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="label">template:</span>
            {templates.map((t) => (
              <button key={t.id} className="chip transition-colors hover:border-accent-border hover:text-accent-fg" onClick={() => applyTemplate(t.id)}>
                {t.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {logs.map((log, i) => (
        <div key={i} className="card space-y-2 animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="font-display text-lg font-light tracking-tight text-fg">{log.name}</div>
            <button onClick={() => removeExercise(i)} className="text-2xs text-fg-dim transition-colors hover:text-danger">
              remove
            </button>
          </div>
          <div className="space-y-1.5">
            {log.sets.map((s, sIdx) => (
              <SetRow key={sIdx} set={s} index={sIdx} onChange={(next) => updateSet(i, sIdx, next)} onRemove={() => removeSet(i, sIdx)} />
            ))}
          </div>
          <div className="num flex items-center justify-between text-2xs text-fg-dim">
            <button onClick={() => addSet(i)} className="btn btn-ghost h-7 px-2 text-2xs">
              + add set
            </button>
            <span>
              vol {Math.round(log.sets.reduce((a, s) => {
                if (s.unit === "bw") return a + s.reps;
                return a + toKg(s) * s.reps;
              }, 0))}kg
            </span>
          </div>
        </div>
      ))}

      <div className="card space-y-3">
        <div className="label">add exercise</div>
        <div className="flex flex-wrap gap-1.5">
          {exercises
            .filter((e) => !logs.some((l) => l.name.toLowerCase() === e.name.toLowerCase()))
            .slice(0, 24)
            .map((e) => (
              <button key={e.name} className="chip transition-colors hover:border-accent-border hover:text-accent-fg" onClick={() => addExercise(e.name)}>
                + {e.name}
              </button>
            ))}
        </div>
        <div className="flex gap-2">
          <input
            className="input"
            placeholder="custom exercise name"
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
          />
          <button
            className="btn"
            onClick={() => {
              if (customName.trim()) {
                addExercise(customName.trim());
                setCustomName("");
              }
            }}
          >
            add
          </button>
        </div>
      </div>

      <div className="card space-y-2">
        <div className="label">notes</div>
        <textarea
          className="input min-h-[60px] py-2"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="optional"
        />
      </div>

      <div className="sticky bottom-16 z-20 -mx-4 border-t border-border bg-bg/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-2">
          <div className="num text-2xs text-fg-dim">
            <span className="stamp mr-2">total vol</span>
            {Math.round(totalVolume).toLocaleString()}kg
          </div>
          <div className="flex gap-2">
            {onCancel && (
              <button className="btn" onClick={onCancel}>
                cancel
              </button>
            )}
            <button className="btn btn-primary" onClick={submit} disabled={saving || !name}>
              {saving ? "saving…" : initial ? "update" : "finish"}
            </button>
          </div>
        </div>
      </div>
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
