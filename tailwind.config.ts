import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        bg: {
          primary: "#0A0A0F",
          secondary: "#12121A",
          tertiary: "#1A1A25",
          elevated: "#252535",
        },
        accent: {
          primary: "#6366F1",
          secondary: "#8B5CF6",
          success: "#10B981",
          warning: "#F59E0B",
          error: "#EF4444",
          info: "#3B82F6",
        },
        text: {
          primary: "#F0F0F5",
          secondary: "#A0A0B0",
          muted: "#606070",
        },
        border: {
          default: "#2A2A3A",
          subtle: "#1F1F2A",
        },
        status: {
          online: "#10B981",
          busy: "#F59E0B",
          offline: "#6B7280",
        },
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
