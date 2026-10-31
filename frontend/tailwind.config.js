/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        pitwall: {
          dark: "#0b0c10",
          panel: "#141721",
          card: "#1a1e2b",
          border: "#262b3d",
          red: "#e10600",
          cyan: "#00f0ff",
          green: "#00e676",
          yellow: "#ffd600",
        },
        team: {
          redbull: "#3671c6",
          mclaren: "#ff8000",
          ferrari: "#e80020",
          mercedes: "#27f4d2",
          aston: "#229971",
        },
      },
      fontFamily: {
        mono: ["SF Mono", "Fira Code", "Courier New", "monospace"],
      },
    },
  },
  plugins: [],
};

