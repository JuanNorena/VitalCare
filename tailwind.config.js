/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  // Tema solo claro por defecto. Eliminado soporte para darkMode.
  theme: {
    extend: {},
  },
  plugins: [],
}
