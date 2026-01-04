import type { Config } from "tailwindcss";

const withOpacity = (variable: string) => {
  return ({ opacityValue }: { opacityValue?: string }) => {
    if (opacityValue === undefined) {
      return `rgb(var(${variable}))`;
    }
    return `rgb(var(${variable}) / ${opacityValue})`;
  };
};

export default {
  content: ["./index.html", "./src/**/*.{vue,ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        display: ["Zain", "sans-serif"],
        body: ["Space Grotesk", "sans-serif"],
      },
      colors: {
        base: withOpacity("--color-base"),
        surface: withOpacity("--color-surface"),
        muted: withOpacity("--color-muted"),
        text: withOpacity("--color-text"),
        accent: withOpacity("--color-accent"),
        "accent-2": withOpacity("--color-accent-2"),
        ring: withOpacity("--color-ring"),
      },
      boxShadow: {
        glow: "0 0 0 1px rgb(var(--color-ring) / 0.2), 0 20px 50px -30px rgb(var(--color-accent) / 0.5)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "0% 50%" },
          "100%": { backgroundPosition: "100% 50%" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.6s ease-out both",
        float: "float 6s ease-in-out infinite",
        shimmer: "shimmer 6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
} satisfies Config;
