/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: "var(--brand)",
        brandMuted: "var(--brand-muted)",
        dark: "var(--dark)",
        light: "var(--light)",
        text: "var(--text)",
      },
      boxShadow: {
        card: "0 6px 20px rgba(2,6,23,0.06)",
        focus: "0 0 0 4px var(--brand-muted)",
      },
      borderRadius: {
        xl: "0.75rem",
        "2xl": "1rem",
      },
    },
  },
  plugins: [],
};
