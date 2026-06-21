"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type IconProps = React.SVGProps<SVGSVGElement>;

const items = [
  { href: "/", label: "Today", icon: IconToday },
  { href: "/history", label: "History", icon: IconList },
  { href: "/heatmap", label: "Heat", icon: IconGrid },
  { href: "/progress", label: "Progress", icon: IconChart },
] as const;

export function Nav() {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <>
      {/* Floating primary CTA */}
      <Link
        href="/workout/new"
        aria-label="Log a workout"
        className="fixed bottom-[68px] left-1/2 z-40 flex h-14 w-14 -translate-x-1/2 items-center justify-center rounded-full border border-accent-border bg-bg text-accent shadow-glow transition-transform hover:scale-105 active:scale-95"
      >
        <svg
          viewBox="0 0 24 24"
          width="22"
          height="22"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 5v14M5 12h14" />
        </svg>
      </Link>

      <nav
        className="fixed inset-x-0 bottom-0 z-30 safe-bottom border-t border-border bg-bg/85 backdrop-blur supports-[backdrop-filter]:bg-bg/65"
        aria-label="Primary"
      >
        <ul className="mx-auto flex max-w-2xl items-stretch justify-around px-1">
          {items.map(({ href, label, icon: Icon }) => {
            const active = isActive(href);
            return (
              <li key={href} className="flex-1">
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className="group relative flex min-h-[56px] flex-col items-center justify-center gap-0.5 rounded-md text-[10px] font-medium uppercase tracking-[0.1em] text-muted transition-colors hover:text-fg"
                >
                  <span
                    className={
                      "flex h-7 items-center justify-center transition-colors " +
                      (active ? "text-accent" : "")
                    }
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className={active ? "text-fg" : ""}>{label}</span>
                  {active && (
                    <span
                      aria-hidden
                      className="absolute -top-px h-0.5 w-6 rounded-full bg-accent shadow-glow"
                    />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}

function IconToday(p: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 3v1.5M12 19.5V21M3 12h1.5M19.5 12H21M5.6 5.6l1.05 1.05M17.35 17.35l1.05 1.05M5.6 18.4l1.05-1.05M17.35 6.65l1.05-1.05" />
    </svg>
  );
}
function IconList(p: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M8 6h13M8 12h13M8 18h13" />
      <circle cx="4" cy="6" r="0.8" fill="currentColor" />
      <circle cx="4" cy="12" r="0.8" fill="currentColor" />
      <circle cx="4" cy="18" r="0.8" fill="currentColor" />
    </svg>
  );
}
function IconGrid(p: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" {...p}>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  );
}
function IconChart(p: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M3 4v17h17" />
      <path d="M7 15l4-6 4 4 5-7" />
    </svg>
  );
}
