import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          '"Google Sans Flex"',
          "-apple-system",
          "BlinkMacSystemFont",
          "system-ui",
          "sans-serif",
        ],
        mono: [
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          "monospace",
        ],
      },
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        // Official SRGC Collegiate Reddish Palette
        primary: {
          DEFAULT: "#831825", // Rich SRGC Collegiate Red / Deep Crimson
          50: "#fdf3f4",
          100: "#fbe6e8",
          200: "#f7d0d4",
          300: "#f0abb3",
          400: "#e47a86",
          500: "#d34b5a",
          600: "#ba2a3b",
          700: "#9c1d2d",
          800: "#831825", // Main Brand Red
          900: "#6d1521",
          950: "#3d070e",
          foreground: "#ffffff",
        },
        // Warm collegiate dark tone (replaces all blueish/navy dark chrome)
        branddark: {
          DEFAULT: "#180d10",
          50: "#2d161c",
          100: "#221115",
          200: "#180d10",
          border: "#331a20",
        },
        secondary: {
          DEFAULT: "#f7f7f8",
          foreground: "#18181b",
        },
        accent: {
          DEFAULT: "#b45309", // Warm Brass / Gold Accent
          50: "#fffbeb",
          100: "#fef3c7",
          200: "#fde68a",
          300: "#fcd34d",
          400: "#fbbf24",
          500: "#f59e0b",
          600: "#d97706",
          700: "#b45309",
          800: "#92400e",
          900: "#78350f",
          foreground: "#ffffff",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        destructive: {
          DEFAULT: "#b91c1c",
          foreground: "#ffffff",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
