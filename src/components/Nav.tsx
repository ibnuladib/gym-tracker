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
  const onWorkoutForm = pathname.startsWith("/workout/new") || /^\/workout\/[^/]+$/.test(pathname);

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 safe-bottom border-t border-border bg-bg/95 backdrop-blur supports-[backdrop-filter]:bg-bg/80"
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
                className="group relative flex min-h-[56px] flex-col items-center justify-center gap-0.5 text-[10px] font-medium uppercase text-fg-dim transition-colors hover:text-fg"
                style={{ letterSpacing: "0.18em" }}
              >
                <span
                  className={
                    "flex h-6 items-center justify-center transition-colors " +
                    (active ? "text-accent" : "")
                  }
                >
                  <Icon className="h-4 w-4" />
                </span>
                <span className={active ? "text-fg" : ""}>{label}</span>
                {active && (
                  <span
                    aria-hidden
                    className="absolute -top-px h-px w-5 bg-accent"
                  />
                )}
              </Link>
            </li>
          );
        })}
        <li className="flex-1">
          {onWorkoutForm ? (
            <button
              type="button"
              onClick={() => window.dispatchEvent(new Event("gym:finish"))}
              className="nav-finish"
              aria-label="Finish workout"
            >
              <span className="nav-finish-check" aria-hidden>
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12l5 5 9-9" />
                </svg>
              </span>
              <span>finish</span>
            </button>
          ) : (
            <Link
              href="/workout/new"
              aria-label="Log a workout"
              className="nav-add"
            >
              <span className="nav-add-plus" aria-hidden>
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </span>
              <span>log</span>
            </Link>
          )}
        </li>
      </ul>
    </nav>
  );
}

function IconToday(p: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 3v1.5M12 19.5V21M3 12h1.5M19.5 12H21M5.6 5.6l1.05 1.05M17.35 17.35l1.05 1.05M5.6 18.4l1.05-1.05M17.35 6.65l1.05-1.05" />
    </svg>
  );
}
function IconList(p: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M8 6h13M8 12h13M8 18h13" />
      <circle cx="4" cy="6" r="0.8" fill="currentColor" />
      <circle cx="4" cy="12" r="0.8" fill="currentColor" />
      <circle cx="4" cy="18" r="0.8" fill="currentColor" />
    </svg>
  );
}
function IconGrid(p: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" {...p}>
      <rect x="3" y="3" width="7" height="7" rx="0.5" />
      <rect x="14" y="3" width="7" height="7" rx="0.5" />
      <rect x="3" y="14" width="7" height="7" rx="0.5" />
      <rect x="14" y="14" width="7" height="7" rx="0.5" />
    </svg>
  );
}
function IconChart(p: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M3 4v17h17" />
      <path d="M7 15l4-6 4 4 5-7" />
    </svg>
  );
}
