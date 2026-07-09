"use client";

import { nanoid } from "nanoid";
import { useState } from "react";
import { useStore } from "@/lib/store";
import type { Template, TemplateItem, Unit } from "@/lib/types";
import { ALL_UNITS, unitShort } from "@/lib/units";
import Link from "next/link";

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
    <div className="wpage">
      <div className="tpl-head">
        <div>
          <div className="stamp">templates</div>
          <div className="tpl-head-h num">
            {templates.length} saved
          </div>
        </div>
        <button onClick={newTemplate} className="btn btn-primary">
          + new
        </button>
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
        <div className="tpl-empty">
          <div className="tpl-empty-title">no templates yet</div>
          <div className="tpl-empty-sub">
            a template is a saved set of exercises with default sets, reps,
            and weight — tap it on a new session to start fast.
          </div>
          <button onClick={newTemplate} className="btn btn-primary tpl-empty-cta">
            build your first one
          </button>
        </div>
      ) : (
        <ul className="tpl-list">
          {templates.map((t) => (
            <li key={t.id} className="tpl-card">
              <button
                type="button"
                className="tpl-card-body"
                onClick={() => setEditing(t)}
              >
                <div className="tpl-card-name">{t.name || "untitled"}</div>
                <div className="tpl-card-items num">
                  {t.items.length} {t.items.length === 1 ? "exercise" : "exercises"}
                </div>
                <div className="tpl-card-chips">
                  {t.items.slice(0, 3).map((it, i) => (
                    <span key={i} className="chip">
                      {it.exerciseName}
                    </span>
                  ))}
                  {t.items.length > 3 && (
                    <span className="chip">+{t.items.length - 3}</span>
                  )}
                  {t.items.length === 0 && (
                    <span className="tpl-card-empty">empty — tap to add</span>
                  )}
                </div>
              </button>
              <div className="tpl-card-actions">
                <Link href={`/workout/new?from=tpl_${t.id}`} className="tpl-card-run">
                  start →
                </Link>
                <button
                  className="tpl-card-del"
                  onClick={() => {
                    if (confirm(`Delete template "${t.name}"?`)) deleteTemplate(t.id);
                  }}
                  aria-label={`delete ${t.name}`}
                >
                  ×
                </button>
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
    <div className="tpl-edit">
      <div className="label">name</div>
      <input
        className="input tpl-edit-name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="e.g. push day"
        autoFocus
      />

      {items.length === 0 && (
        <div className="tpl-edit-empty">add an exercise below to begin</div>
      )}

      <ul className="tpl-edit-list">
        {items.map((it, i) => (
          <li key={i} className="tpl-edit-row">
            <select
              className="input tpl-edit-ex"
              value={it.exerciseName}
              onChange={(e) => update(i, { exerciseName: e.target.value })}
            >
              {exerciseNames.map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
              {!exerciseNames.includes(it.exerciseName) && it.exerciseName && (
                <option value={it.exerciseName}>{it.exerciseName}</option>
              )}
            </select>
            <div className="tpl-edit-grid">
              <div>
                <div className="label">sets</div>
                <input
                  className="input tpl-edit-num num"
                  inputMode="numeric"
                  value={it.defaultSets}
                  onChange={(e) => update(i, { defaultSets: parseInt(e.target.value, 10) || 0 })}
                />
              </div>
              <div>
                <div className="label">reps</div>
                <input
                  className="input tpl-edit-num num"
                  inputMode="numeric"
                  value={it.defaultReps}
                  onChange={(e) => update(i, { defaultReps: parseInt(e.target.value, 10) || 0 })}
                />
              </div>
              <div>
                <div className="label">weight</div>
                <input
                  className="input tpl-edit-num num"
                  inputMode="decimal"
                  value={it.defaultWeight ?? 0}
                  onChange={(e) => update(i, { defaultWeight: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <div className="label">unit</div>
                <select
                  className="input tpl-edit-num"
                  value={it.defaultUnit ?? "kg"}
                  onChange={(e) => update(i, { defaultUnit: e.target.value as Unit })}
                >
                  {ALL_UNITS.map((u) => (
                    <option key={u} value={u}>{unitShort(u)}</option>
                  ))}
                </select>
              </div>
            </div>
            <button
              onClick={() => remove(i)}
              className="tpl-edit-rm"
              aria-label="remove exercise"
            >
              remove
            </button>
          </li>
        ))}
      </ul>

      <button onClick={add} className="tpl-edit-add">+ add exercise</button>

      <div className="tpl-edit-foot">
        <button onClick={onCancel} className="btn">cancel</button>
        <button
          onClick={async () => {
            if (!name.trim()) return;
            await onSave({ ...initial, name: name.trim(), items, updatedAt: Date.now() });
          }}
          className="btn btn-primary"
          disabled={!name.trim() || items.length === 0}
        >
          save
        </button>
      </div>
    </div>
  );
}
