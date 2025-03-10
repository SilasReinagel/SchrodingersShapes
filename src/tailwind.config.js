/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'shape-square': 'var(--shape-square)',
        'shape-circle': 'var(--shape-circle)',
        'shape-triangle': 'var(--shape-triangle)',
        'cell-bg': 'var(--cell-bg)',
        'cell-hover': 'var(--cell-hover)',
        'cell-border': 'var(--cell-border)',
        'panel-bg': 'var(--panel-bg)',
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
    },
  },
  plugins: [],
} 