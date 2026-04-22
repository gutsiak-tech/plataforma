import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Open Sans", "ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "Helvetica", "Arial", "sans-serif"],
      },
      colors: {
        bg: "hsl(var(--bg))",
        panel: "hsl(var(--panel))",
        text: "hsl(var(--text))",
        muted: "hsl(var(--muted))",
        primary: "hsl(var(--primary))",
        border: "hsl(var(--border))",
        ring: "hsl(var(--ring))",
        danger: "hsl(var(--danger))",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        panel: "0 10px 30px rgba(0, 0, 0, 0.25)",
      },
    },
  },
  plugins: [],
} satisfies Config;
