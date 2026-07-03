"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useStore } from "@/lib/store";

function CloudIcon({ ok }: { ok: boolean }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M17.5 19a4.5 4.5 0 0 0 0-9 6 6 0 0 0-11.6 1.4A4 4 0 0 0 6.5 19Z" />
      {ok ? <path d="M9 14l2 2 4-4" /> : <path d="M10 14l-2-2m6 2l2-2" />}
    </svg>
  );
}

export function TopBar() {
  const { cloudEnabled, user, ready } = useStore();
  const pathname = usePathname();
  const onHome = pathname === "/";

  const showStatus = ready && cloudEnabled && !user;
  const showSignedIn = ready && cloudEnabled && user;

  return (
    <header className="sticky top-0 z-30 -mx-4 mb-6 border-b border-border bg-bg/90 px-4 backdrop-blur supports-[backdrop-filter]:bg-bg/70 safe-top sm:-mx-6 sm:px-6">
      <div className="flex h-12 items-center justify-between">
        <Link
          href="/"
          className="flex items-baseline gap-2 text-fg"
          aria-label="Go to home"
        >
          <span className="inline-block h-2 w-2 translate-y-[2px] bg-accent" />
          <span className="font-display text-sm font-medium tracking-tight">
            gym<span className="text-fg-faint">.tracker</span>
          </span>
        </Link>

        <div className="flex items-center gap-2">
          {showStatus && (
            <Link
              href="/settings"
              className="chip chip-accent animate-[pop_180ms_ease-out]"
              title="Tap to sign in"
            >
              <CloudIcon ok={false} />
              <span>sign in</span>
            </Link>
          )}
          {showSignedIn && (
            <Link
              href="/settings"
              className="chip chip-accent"
              title={user?.email ?? "Signed in"}
            >
              <CloudIcon ok />
              <span className="hidden max-w-[140px] truncate sm:inline">
                {user?.email ?? "signed in"}
              </span>
              <span className="sm:hidden">on</span>
            </Link>
          )}
          {onHome && (
            <span aria-hidden className="hidden text-2xs text-fg-faint sm:inline">
              {new Date().toLocaleDateString(undefined, {
                weekday: "short",
                month: "short",
                day: "numeric",
              })}
            </span>
          )}
        </div>
      </div>
    </header>
  );
}
