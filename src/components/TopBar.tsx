"use client";

import Link from "next/link";
import { useStore } from "@/lib/store";

export function TopBar() {
  const { cloudEnabled, user, signInGoogle, signInAnon, signOut } = useStore();
  return (
    <header className="sticky top-0 z-30 safe-top border-b border-zinc-900 bg-zinc-950/85 backdrop-blur supports-[backdrop-filter]:bg-zinc-950/60">
      <div className="mx-auto flex max-w-2xl items-center justify-between px-3 py-2 sm:px-4">
        <Link href="/" className="flex items-center gap-2 text-sm font-semibold tracking-tight">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-emerald-400" />
          gym<span className="text-zinc-500">.tracker</span>
        </Link>
        <div className="flex items-center gap-2 text-xs">
          {cloudEnabled ? (
            user ? (
              <>
                <span className="hidden text-zinc-500 sm:inline">{user.email ?? "anonymous"}</span>
                <button onClick={() => signOut()} className="btn btn-ghost px-2 py-1 text-xs">
                  sign out
                </button>
              </>
            ) : (
              <>
                <button onClick={() => signInGoogle()} className="btn btn-ghost px-2 py-1 text-xs">
                  google
                </button>
                <button onClick={() => signInAnon()} className="btn btn-ghost px-2 py-1 text-xs">
                  anon
                </button>
              </>
            )
          ) : (
            <span className="chip" title="No Firebase config; data is stored locally">
              local-only
            </span>
          )}
        </div>
      </div>
    </header>
  );
}
