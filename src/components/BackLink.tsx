"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export function BackLink({ href, label }: { href?: string; label?: string }) {
  const router = useRouter();
  return (
    <button
      onClick={() => (href ? router.push(href) : router.back())}
      className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-200"
    >
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M15 18l-6-6 6-6" />
      </svg>
      <span>{label ?? "back"}</span>
    </button>
  );
}

export function HeaderLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="text-xs text-zinc-500 hover:text-zinc-200">
      {children}
    </Link>
  );
}
