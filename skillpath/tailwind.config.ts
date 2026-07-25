import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        border: "var(--color-hairline)",
        primary: {
          DEFAULT: "var(--color-primary)",
          active: "var(--color-primary-active)",
          disabled: "var(--color-primary-disabled)",
        },
        ink: "var(--color-ink)",
        body: "var(--color-body)",
        "body-strong": "var(--color-body-strong)",
        muted: {
          DEFAULT: "var(--color-muted)",
          soft: "var(--color-muted-soft)",
        },
        hairline: {
          DEFAULT: "var(--color-hairline)",
          soft: "var(--color-hairline-soft)",
        },
        canvas: "var(--color-canvas)",
        surface: {
          soft: "var(--color-surface-soft)",
          card: "var(--color-surface-card)",
          strong: "var(--color-surface-strong)",
          dark: "var(--color-surface-dark)",
          "dark-elevated": "var(--color-surface-dark-elevated)",
        },
        on: {
          primary: "var(--color-on-primary)",
          dark: "var(--color-on-dark)",
          "dark-soft": "var(--color-on-dark-soft)",
        },
        brand: {
          pink: "var(--color-brand-pink)",
          teal: "var(--color-brand-teal)",
          lavender: "var(--color-brand-lavender)",
          peach: "var(--color-brand-peach)",
          ochre: "var(--color-brand-ochre)",
          mint: "var(--color-brand-mint)",
          coral: "var(--color-brand-coral)",
        },
        black: "#0A0A0A",
        white: "#F5F4F0",
        "gray-100": "#E8E6E1",
        "gray-300": "#BDBAB3",
        "gray-500": "#7A7873",
        "gray-700": "#3D3C3A",
      },
      borderRadius: {
        xs: "6px",
        sm: "8px",
        md: "12px",
        lg: "16px",
        xl: "24px",
      },
      fontFamily: {
        display: ["var(--font-plain-black)", "Inter", "sans-serif"],
        sans: ["var(--font-inter)", "sans-serif"],
        mono: ["var(--font-geist-mono)", "JetBrains Mono", "monospace"],
        "irish-grover": ["var(--font-irish-grover)", "sans-serif"],
      },
      fontSize: {
        "display-xl": ["72px", { lineHeight: "1", letterSpacing: "-2.5px", fontWeight: "500" }],
        "display-lg": ["56px", { lineHeight: "1.05", letterSpacing: "-2px", fontWeight: "500" }],
        "display-md": ["40px", { lineHeight: "1.1", letterSpacing: "-1px", fontWeight: "500" }],
        "display-sm": ["32px", { lineHeight: "1.15", letterSpacing: "-0.5px", fontWeight: "500" }],
        "title-lg": ["24px", { lineHeight: "1.3", letterSpacing: "-0.3px", fontWeight: "600" }],
        "title-md": ["18px", { lineHeight: "1.4", letterSpacing: "0", fontWeight: "600" }],
        "title-sm": ["16px", { lineHeight: "1.4", letterSpacing: "0", fontWeight: "600" }],
        "body-md": ["16px", { lineHeight: "1.55", letterSpacing: "0", fontWeight: "400" }],
        "body-sm": ["14px", { lineHeight: "1.55", letterSpacing: "0", fontWeight: "400" }],
        caption: ["13px", { lineHeight: "1.4", letterSpacing: "0", fontWeight: "500" }],
        "caption-uppercase": ["12px", { lineHeight: "1.4", letterSpacing: "1.5px", fontWeight: "600" }],
        button: ["14px", { lineHeight: "1", letterSpacing: "0", fontWeight: "600" }],
        "nav-link": ["14px", { lineHeight: "1.4", letterSpacing: "0", fontWeight: "500" }],
      },
      spacing: {
        xxs: "4px",
        xs: "8px",
        sm: "12px",
        md: "16px",
        lg: "24px",
        xl: "32px",
        xxl: "48px",
        section: "96px",
      },
      keyframes: {
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        shimmer: "shimmer 2s infinite",
      },
    },
  },
  plugins: [],
};

export default config;
