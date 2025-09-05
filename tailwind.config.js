/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  // Activar soporte para dark mode mediante la clase `dark`.
  darkMode: 'class',
  theme: {
    extend: {},
  },
  plugins: [],
}
