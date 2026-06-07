import type { Config } from "tailwindcss";
import forms from "@tailwindcss/forms";
import scrollbar from "tailwind-scrollbar";

const colorVar = (name: string) => `hsl(var(${name}) / <alpha-value>)`;

export default {
  content: ["./src/**/*.tsx"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-plus-jakarta-sans), Plus Jakarta Sans"],
      },
      fontSize: {
        sm: "0.8rem",
      },
      boxShadow: {
        "3xl-dark": "0px 16px 70px rgba(0, 0, 0, 0.5)",
        "3xl-light":
          "rgba(0, 0, 0, 0.12) 0px 4px 30px, rgba(0, 0, 0, 0.04) 0px 3px 17px, rgba(0, 0, 0, 0.04) 0px 2px 8px, rgba(0, 0, 0, 0.04) 0px 1px 1px",
      },
      animation: {
        "border-spin": "border-spin 4s linear infinite",
        "fade-down": "fade-down 0.5s ease-out",
        "fade-in": "fade-in 0.5s ease-out",
        scroll: "scroll 40s linear infinite",
      },

      keyframes: {
        "border-spin": {
          from: { transform: "rotate(0deg)" },
          to: { transform: "rotate(360deg)" },
        },
        "fade-down": {
          "0%": {
            opacity: "0",
            transform: "translateY(-20px)",
          },
          "100%": {
            opacity: "1",
            transform: "translateY(0)",
          },
        },
        "fade-in": {
          "0%": {
            opacity: "0",
          },
          "100%": {
            opacity: "1",
          },
        },
        scroll: {
          "0%": {
            transform: "translateX(0)",
          },
          "100%": {
            transform: "translateX(calc(-50% - 1.5rem))",
          },
        },
      },
      colors: {
        "dark-50": colorVar("--dark-50"),
        "dark-100": colorVar("--dark-100"),
        "dark-200": colorVar("--dark-200"),
        "dark-300": colorVar("--dark-300"),
        "dark-400": colorVar("--dark-400"),
        "dark-500": colorVar("--dark-500"),
        "dark-600": colorVar("--dark-600"),
        "dark-700": colorVar("--dark-700"),
        "dark-800": colorVar("--dark-800"),
        "dark-900": colorVar("--dark-900"),
        "dark-950": colorVar("--dark-950"),
        "dark-1000": colorVar("--dark-1000"),
        "light-50": colorVar("--light-50"),
        "light-100": colorVar("--light-100"),
        "light-200": colorVar("--light-200"),
        "light-300": colorVar("--light-300"),
        "light-400": colorVar("--light-400"),
        "light-500": colorVar("--light-500"),
        "light-600": colorVar("--light-600"),
        "light-700": colorVar("--light-700"),
        "light-800": colorVar("--light-800"),
        "light-900": colorVar("--light-900"),
        "light-950": colorVar("--light-950"),
        "light-1000": colorVar("--light-1000"),
      },
      screens: {
        "2xl": "1600px",
      },
    },
  },
  plugins: [forms, scrollbar],
} satisfies Config;
