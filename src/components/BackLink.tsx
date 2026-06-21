"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

function Arrow() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-3.5 w-3.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}

export function BackLink({ href, label }: { href?: string; label?: string }) {
  const router = useRouter();
  return (
    <button
      onClick={() => (href ? router.push(href) : router.back())}
      className="inline-flex h-7 items-center gap-1 rounded-md px-1 text-xs text-muted transition-colors hover:bg-elev hover:text-fg"
    >
      <Arrow />
      <span>{label ?? "back"}</span>
    </button>
  );
}

export function HeaderLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="text-xs text-muted transition-colors hover:text-fg">
      {children}
    </Link>
  );
}
