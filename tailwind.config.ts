import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    container: { center: true, padding: "1rem", screens: { "2xl": "1280px" } },
    extend: {
      colors: {
        // Brand: driven by CSS accent variables — changes with theme
        brand: {
          50:  "rgb(var(--acc-50) / <alpha-value>)",
          100: "rgb(var(--acc-100) / <alpha-value>)",
          200: "rgb(var(--acc-200) / <alpha-value>)",
          300: "rgb(var(--acc-300) / <alpha-value>)",
          400: "rgb(var(--acc-400) / <alpha-value>)",
          500: "rgb(var(--acc-500) / <alpha-value>)",
          600: "rgb(var(--acc-600) / <alpha-value>)",
          700: "rgb(var(--acc-700) / <alpha-value>)",
          800: "rgb(var(--acc-800) / <alpha-value>)",
          900: "rgb(var(--acc-900) / <alpha-value>)",
        },
        // Lavender stays fixed as secondary accent
        lavender: {
          50: "#f6f3ff",
          100: "#ede8ff",
          200: "#dcd3ff",
          300: "#c2b1ff",
          400: "#a386ff",
          500: "#8a5cff",
          600: "#7a3df0",
          700: "#682cd1",
          800: "#5526a8",
          900: "#472285",
        },
        cream: "#fff8f3",
        ink: { DEFAULT: "#1b1023", soft: "#3a2a44" },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "ui-sans-serif", "system-ui"],
        display: ["var(--font-display)", "ui-serif", "Georgia"],
      },
      backgroundImage: {
        // Dynamic gradient — driven by CSS vars
        "brand-gradient":
          "linear-gradient(135deg, var(--gstart) 0%, var(--gmid) 50%, var(--gend) 100%)",
        "soft-gradient":
          "radial-gradient(ellipse at 15% 5%, rgba(236,28,108,0.09) 0, transparent 45%), radial-gradient(ellipse at 85% 0%, rgba(139,92,246,0.10) 0, transparent 45%), radial-gradient(ellipse at 50% 100%, rgba(236,28,108,0.05) 0, transparent 55%)",
        "dark-gradient":
          "radial-gradient(ellipse at 15% 5%, rgba(236,28,108,0.20) 0, transparent 50%), radial-gradient(ellipse at 85% 0%, rgba(139,92,246,0.22) 0, transparent 50%), radial-gradient(ellipse at 50% 100%, rgba(80,10,80,0.32) 0, transparent 60%)",
      },
      boxShadow: {
        glow:  "0 10px 40px -10px var(--acc-glow)",
        glass: "0 8px 32px 0 rgba(31,38,135,0.15)",
      },
      borderRadius: { xl: "1rem", "2xl": "1.25rem", "3xl": "1.75rem" },
      keyframes: {
        float: {
          "0%,100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-12px)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "slide-up": {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        shimmer: "shimmer 3s linear infinite",
        "slide-up": "slide-up 0.4s ease-out",
        "fade-in": "fade-in 0.3s ease-out",
      },
    },
  },
  plugins: [],
};
export default config;
