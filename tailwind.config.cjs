module.exports = {
  content: ["./src/**/*.{js,jsx}"],
  theme: { extend: {
    colors: { ink: "#1b2733", mist: "#f2f5f7", jade: { DEFAULT: "rgb(var(--jade) / <alpha-value>)", soft: "rgb(var(--jade-soft) / <alpha-value>)" } },
    fontFamily: { sans: ["var(--font-thai)", "system-ui", "sans-serif"] },
    borderRadius: { card: "1.25rem" }
  } },
  plugins: []
};
