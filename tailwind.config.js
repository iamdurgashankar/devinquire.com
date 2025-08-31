module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      backdropFilter: {
        none: "none",
        blur: "blur(10px)",
      },
      colors: {
        glass: {
          light: "rgba(255, 255, 255, 0.7)",
          dark: "rgba(0, 0, 0, 0.7)",
        },
      },
      animation: {
        float: "float 6s ease-in-out infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-20px)" },
        },
      },
    },
  },
  plugins: [
    require("@tailwindcss/forms"),
    function ({ addUtilities }) {
      const newUtilities = {
        ".backdrop-blur": {
          "backdrop-filter": "blur(10px)",
          "-webkit-backdrop-filter": "blur(10px)",
        },
      };
      addUtilities(newUtilities);
    },
  ],
};
