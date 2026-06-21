import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        elev: "var(--bg-elev)",
        elev2: "var(--bg-elev-2)",
        border: "var(--border)",
        fg: "var(--fg)",
        muted: "var(--fg-muted)",
        dim: "var(--fg-dim)",
        faint: "var(--fg-faint)",
        accent: "var(--accent)",
        "accent-fg": "var(--accent-fg)",
        "accent-bg": "var(--accent-bg)",
        "accent-border": "var(--accent-border)",
        danger: "var(--danger)",
        warn: "var(--warn)",
        info: "var(--info)",
      },
      borderRadius: {
        xl: "0.75rem",
      },
      fontSize: {
        "2xs": ["0.6875rem", { lineHeight: "1rem" }],
      },
      boxShadow: {
        soft: "0 1px 2px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.02) inset",
        glow: "0 0 0 1px rgba(16,185,129,0.35), 0 8px 24px -12px rgba(16,185,129,0.45)",
      },
      transitionTimingFunction: {
        smooth: "cubic-bezier(0.22, 0.61, 0.36, 1)",
      },
    },
  },
  plugins: [],
};
export default config;
