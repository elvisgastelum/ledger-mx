/**
 * Tailwind CSS configuration.
 * Defines content paths and theme customizations.
 */
import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#000000",
        "primary-foreground": "#ffffff",
        destructive: "#ef4444",
        "destructive-foreground": "#ffffff",
        background: "#ffffff",
        foreground: "#0f172a",
        card: "#ffffff",
        "card-foreground": "#0f172a",
        popover: "#ffffff",
        "popover-foreground": "#0f172a",
        secondary: "#f1f5f9",
        "secondary-foreground": "#1e293b",
        muted: "#f1f5f9",
        "muted-foreground": "#64748b",
        accent: "#f1f5f9",
        "accent-foreground": "#1e293b",
        border: "#e2e8f0",
        input: "#e2e8f0",
        ring: "#0f172a",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [],
};

export default config;
