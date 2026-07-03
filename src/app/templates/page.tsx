"use client";

import { nanoid } from "nanoid";
import { useState } from "react";
import { useStore } from "@/lib/store";
import type { Template, TemplateItem, Unit } from "@/lib/types";
import { ALL_UNITS, unitShort } from "@/lib/units";
import { BackLink } from "@/components/BackLink";

export default function TemplatesPage() {
  const { templates, exercises, saveTemplate, deleteTemplate } = useStore();
  const [editing, setEditing] = useState<Template | null>(null);

  const newTemplate = () => {
    setEditing({
      id: nanoid(8),
      name: "",
      items: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <BackLink href="/" />
        <h1 className="font-display text-2xl font-light tracking-tight text-fg">templates</h1>
        <button onClick={newTemplate} className="btn btn-primary btn-sm">+ new</button>
      </div>

      {editing ? (
        <TemplateEditor
          initial={editing}
          exerciseNames={exercises.map((e) => e.name)}
          onCancel={() => setEditing(null)}
          onSave={async (t) => {
            await saveTemplate(t);
            setEditing(null);
          }}
        />
      ) : templates.length === 0 ? (
        <div className="card text-sm text-fg-dim">no templates yet — add one to get started.</div>
      ) : (
        <ul className="space-y-1.5">
          {templates.map((t) => (
            <li key={t.id} className="card">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium text-fg">{t.name}</div>
                <div className="flex gap-3 text-2xs">
                  <button className="text-fg-dim transition-colors hover:text-accent-fg" onClick={() => setEditing(t)}>
                    edit
                  </button>
                  <button
                    className="text-danger transition-colors hover:text-danger-fg"
                    onClick={() => {
                      if (confirm(`Delete template "${t.name}"?`)) deleteTemplate(t.id);
                    }}
                  >
                    delete
                  </button>
                </div>
              </div>
              <div className="num mt-2 flex flex-wrap gap-1.5 text-2xs text-fg-faint">
                {t.items.map((it, i) => (
                  <span key={i} className="chip">
                    {it.exerciseName} {it.defaultSets}×{it.defaultReps}
                  </span>
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function TemplateEditor({
  initial,
  exerciseNames,
  onSave,
  onCancel,
}: {
  initial: Template;
  exerciseNames: string[];
  onSave: (t: Template) => Promise<void>;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial.name);
  const [items, setItems] = useState<TemplateItem[]>(initial.items);

  const update = (i: number, patch: Partial<TemplateItem>) =>
    setItems(items.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));
  const remove = (i: number) => setItems(items.filter((_, idx) => idx !== i));
  const add = () =>
    setItems([
      ...items,
      {
        exerciseName: exerciseNames[0] ?? "",
        defaultSets: 3,
        defaultReps: 8,
        defaultWeight: 0,
        defaultUnit: "kg",
      },
    ]);

  return (
    <div className="card space-y-3">
      <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="template name" />
      <div className="space-y-2">
        {items.map((it, i) => (
          <div key={i} className="grid grid-cols-[1fr_3rem_3rem_4.5rem_3rem_2rem] items-center gap-1.5 text-xs">
            <select
              className="input h-8 text-xs"
              value={it.exerciseName}
              onChange={(e) => update(i, { exerciseName: e.target.value })}
            >
              {exerciseNames.map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
              {!exerciseNames.includes(it.exerciseName) && <option value={it.exerciseName}>{it.exerciseName}</option>}
            </select>
            <input
              className="input h-8 text-center text-xs"
              inputMode="numeric"
              value={it.defaultSets}
              onChange={(e) => update(i, { defaultSets: parseInt(e.target.value, 10) || 0 })}
            />
            <input
              className="input h-8 text-center text-xs"
              inputMode="numeric"
              value={it.defaultReps}
              onChange={(e) => update(i, { defaultReps: parseInt(e.target.value, 10) || 0 })}
            />
            <input
              className="input h-8 text-xs"
              inputMode="decimal"
              value={it.defaultWeight ?? 0}
              onChange={(e) => update(i, { defaultWeight: parseFloat(e.target.value) || 0 })}
            />
            <select className="input h-8 text-xs" value={it.defaultUnit ?? "kg"} onChange={(e) => update(i, { defaultUnit: e.target.value as Unit })}>
              {ALL_UNITS.map((u) => (
                <option key={u} value={u}>{unitShort(u)}</option>
              ))}
            </select>
            <button onClick={() => remove(i)} className="flex h-8 w-8 items-center justify-center text-fg-dim transition-colors hover:text-danger">×</button>
          </div>
        ))}
      </div>
      <div className="flex gap-2 text-2xs text-fg-faint" style={{ letterSpacing: "0.08em" }}>
        <span className="flex-1">ex · sets · reps · wt · unit</span>
      </div>
      <div className="flex justify-between">
        <button onClick={add} className="btn">+ add exercise</button>
        <div className="flex gap-2">
          <button onClick={onCancel} className="btn">cancel</button>
          <button
            onClick={async () => {
              if (!name.trim()) return;
              await onSave({ ...initial, name: name.trim(), items, updatedAt: Date.now() });
            }}
            className="btn btn-primary"
          >
            save
          </button>
        </div>
      </div>
    </div>
  );
}
