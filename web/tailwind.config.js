/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'brand': {
          'red': '#FF385C',
          'blue': '#3B82F6',
          'purple': '#8B5CF6',
          'dark': '#0F172A',
        }
      },
      fontFamily: {
        'mono': ['Fira Code', 'Menlo', 'monospace'],
      }
    },
  },
  plugins: [],
}
