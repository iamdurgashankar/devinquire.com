module.exports = {
  darkMode: "class",
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          '"SF Pro Display"',
          '"SF Pro Text"',
          '"Helvetica Neue"',
          "Inter",
          "sans-serif",
        ],
        mono: [
          '"SF Mono"',
          "ui-monospace",
          '"JetBrains Mono"',
          "Menlo",
          "Monaco",
          "Consolas",
          "monospace",
        ],
      },
      backdropFilter: {
        none: "none",
        blur: "blur(24px)",
      },
      colors: {
        glass: {
          light: "rgba(255, 255, 255, 0.82)",
          dark: "rgba(28, 28, 30, 0.72)",
        },
        apple: {
          bg: "var(--apple-bg)",
          blue: "var(--apple-blue)",
          indigo: "var(--apple-indigo)",
          green: "var(--apple-green)",
          orange: "var(--apple-orange)",
          red: "var(--apple-red)",
          purple: "var(--apple-purple)",
          text: "var(--apple-text-primary)",
          secondary: "var(--apple-text-secondary)",
          tertiary: "var(--apple-text-tertiary)",
          border: "var(--apple-border)",
        },
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        "infinite-scroll": "infinite-scroll 40s linear infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-14px)" },
        },
        "infinite-scroll": {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(-50%)" },
        },
      },
    },
  },
  plugins: [
    require("@tailwindcss/forms"),
    function ({ addUtilities }) {
      const newUtilities = {
        ".backdrop-blur": {
          "backdrop-filter": "blur(20px) saturate(180%)",
          "-webkit-backdrop-filter": "blur(20px) saturate(180%)",
        },
      };
      addUtilities(newUtilities);
    },
  ],
};
