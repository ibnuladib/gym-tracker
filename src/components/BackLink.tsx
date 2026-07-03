"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

function Arrow() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-3 w-3"
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
      className="inline-flex h-6 items-center gap-1 px-1 text-2xs text-fg-dim transition-colors hover:text-fg"
      style={{ letterSpacing: "0.18em" }}
    >
      <Arrow />
      <span className="uppercase">{label ?? "back"}</span>
    </button>
  );
}

export function HeaderLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="text-xs text-fg-dim transition-colors hover:text-fg">
      {children}
    </Link>
  );
}
