"use client";

import { useRef, useState } from "react";
import { useStore } from "@/lib/store";
import { downloadBackup, readBackupFile } from "@/lib/io";
import { BackLink } from "@/components/BackLink";

export default function SettingsPage() {
  const { cloudEnabled, user, signInGoogle, signInAnon, signOut, exportBackup, importBackup } = useStore();
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <BackLink href="/" />
        <h1 className="font-display text-2xl font-light tracking-tight text-fg">settings</h1>
        <span className="w-10" />
      </div>

      <section className="card space-y-3">
        <div className="stamp">account</div>
        {!cloudEnabled ? (
          <div className="text-sm text-fg-muted">
            Firebase is not configured. Data stays in this browser. Set <code className="text-accent-fg">NEXT_PUBLIC_FIREBASE_*</code> in <code className="text-accent-fg">.env.local</code> to enable cross-device sync.
          </div>
        ) : user ? (
          <div className="flex items-center justify-between text-sm">
            <span className="text-fg">{user.email ?? `anonymous (${user.uid.slice(0, 6)}…)`}</span>
            <button onClick={signOut} className="btn">sign out</button>
          </div>
        ) : (
          <div className="flex gap-2">
            <button className="btn" onClick={() => { console.log("[ui] continue with google clicked"); signInGoogle(); }}>continue with google</button>
            <button className="btn btn-ghost" onClick={signInAnon}>use anonymous</button>
          </div>
        )}
      </section>

      <section className="card space-y-3">
        <div className="stamp">data</div>
        <div className="flex flex-wrap gap-2">
          <button
            className="btn"
            onClick={async () => {
              const b = await exportBackup();
              downloadBackup(b);
            }}
          >
            export JSON
          </button>
          <button className="btn" onClick={() => fileRef.current?.click()}>
            import JSON
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            hidden
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              setBusy(true);
              try {
                const b = await readBackupFile(f);
                const mode = confirm("OK = merge with existing data. Cancel = replace everything.") ? "merge" : "replace";
                await importBackup(b, mode);
                alert("import complete");
              } catch (err) {
                alert("import failed: " + (err as Error).message);
              } finally {
                setBusy(false);
                if (fileRef.current) fileRef.current.value = "";
              }
            }}
          />
        </div>
        <p className="text-2xs text-fg-dim" style={{ letterSpacing: "0.06em" }}>
          export saves a full snapshot of workouts, templates, and exercises.
        </p>
        {busy && <div className="text-2xs text-fg-dim">working…</div>}
      </section>

      <section className="card text-2xs text-fg-dim">
        <div className="stamp mb-2">about</div>
        <p>gym.tracker — a small, fast workout logger. Dark, monospace, mobile-first, offline-capable PWA.</p>
      </section>
    </div>
  );
}
