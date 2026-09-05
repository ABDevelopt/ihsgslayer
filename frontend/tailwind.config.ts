import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Legacy custom colors (still used in some components)
        darkBg:      "#0b0f17",
        cardBg:      "#111827",
        cardBorder:  "#1f2937",
        sidebarBg:   "#080c14",
        // Semantic token colors referencing CSS variables
        page:     "var(--bg-page)",
        surface:  "var(--bg-surface)",
        elevated: "var(--bg-elevated)",
        muted:    "var(--bg-muted)",
        subtle:   "var(--bg-subtle)",
        sidebar:  "var(--bg-sidebar)",
        primary:  "var(--text-primary)",
        secondary:"var(--text-secondary)",
        tertiary: "var(--text-tertiary)",
        "text-muted": "var(--text-muted)",
        "text-faint": "var(--text-faint)",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
