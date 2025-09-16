/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: "var(--brand)",
        brandMuted: "var(--brand-muted)",
        dark: "var(--dark)",
        light: "var(--light)",
      },
      boxShadow: {
        card: "0 6px 20px rgba(2,6,23,0.06)",
      },
      borderRadius: {
        xl: "0.75rem",
        "2xl": "1rem",
      },
    },
  },
  plugins: [],
};
