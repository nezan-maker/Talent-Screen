import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "var(--primary)",
        accent: "var(--accent)",
        "accent-hover": "var(--accent-hover)",
        success: "var(--success)",
        warning: "var(--warning)",
        danger: "var(--danger)",
        bg: "var(--bg)",
        card: "var(--card)",
        border: "var(--border)",
        "text-primary": "var(--text-primary)",
        "text-muted": "var(--text-muted)",
        sidebar: {
          DEFAULT: "var(--sidebar)",
          accent: "var(--sidebar-accent)",
          border: "var(--sidebar-border)",
          text: "var(--sidebar-text)",
          "text-muted": "var(--sidebar-text-muted)",
        },
      },
      borderRadius: {
        card: "12px",
        input: "8px",
        badge: "20px",
      },
      boxShadow: {
        card: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
        modal: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
        dropdown: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
      },
      fontFamily: {
        mono: ["var(--font-jetbrains)", "ui-monospace", "SFMono-Regular", "Monaco", "Consolas", "monospace"],
        sans: ["var(--font-gresa)","ui-sans-serif", "system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto"],
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-in-out",
        "slide-in": "slideIn 0.3s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideIn: {
          "0%": { transform: "translateY(10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};

export default config;

