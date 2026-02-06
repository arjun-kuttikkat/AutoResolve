import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        surface: "rgb(var(--surface) / <alpha-value>)",
        panel: "rgb(var(--panel) / <alpha-value>)",
        panelBorder: "rgb(var(--panel-border) / <alpha-value>)",
        text: "rgb(var(--text) / <alpha-value>)",
        muted: "rgb(var(--muted) / <alpha-value>)",
        brand: "rgb(var(--brand) / <alpha-value>)",
        brandSoft: "rgb(var(--brand-soft) / <alpha-value>)",
        accent: "rgb(var(--accent) / <alpha-value>)",
        glow: "rgb(var(--glow) / <alpha-value>)"
      },
      boxShadow: {
        soft: "0 12px 30px -18px rgb(15 23 42 / 0.35)",
        glow: "0 0 0 1px rgb(255 255 255 / 0.6), 0 20px 50px -30px rgb(30 41 59 / 0.45)",
        insetGlow: "inset 0 1px 0 rgb(255 255 255 / 0.7)"
      },
      backgroundImage: {
        "hero-radial": "radial-gradient(1200px circle at 15% -20%, rgba(130, 196, 255, 0.45), transparent 50%), radial-gradient(900px circle at 80% -10%, rgba(181, 131, 255, 0.38), transparent 60%), radial-gradient(700px circle at 70% 80%, rgba(126, 247, 214, 0.22), transparent 55%)",
        "glass": "linear-gradient(135deg, rgba(255, 255, 255, 0.85), rgba(255, 255, 255, 0.55))"
      },
      fontFamily: {
        // Geist Sans: UI + headings (clean, premium, ElevenLabs-style)
        sans: ["var(--font-geist-sans)", "ui-sans-serif", "system-ui"],
        display: ["var(--font-geist-sans)", "ui-sans-serif", "system-ui"],
        // Mono: numbers, technical labels, code (system monospace; add Geist Mono via CSS if desired)
        mono: ["ui-monospace", "SF Mono", "Consolas", "monospace"]
      }
    }
  },
  plugins: []
};

export default config;
