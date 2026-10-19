/** Same config that used to live inline in index.html (Tailwind v3) */
module.exports = {
  darkMode: "class",
  content: ["./index.html", "./sw.js", "./js/**/*.js"],
  theme: {
    extend: {
      colors: {
        midnight: "#030712",
        cardDark: "#0d1527",
        glassBorder: "rgba(255, 255, 255, 0.08)",
        accentSky: "#38bdf8",
        accentIndigo: "#6366f1",
        accentTeal: "#2dd4bf",
      },
    },
  },
  plugins: [require("@tailwindcss/forms"), require("@tailwindcss/container-queries")],
};
