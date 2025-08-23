/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#171717',
        surface: '#262626',
        primary: '#9E7FFF',
        secondary: '#38bdf8',
        accent: '#f472b6',
        text: '#FFFFFF',
        'text-secondary': '#A3A3A3',
        border: '#2F2F2F',
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
      },
      fontFamily: {
        sans: ['"Noto Sans"', 'sans-serif'],
        serif: ['"Noto Serif"', 'serif'],
      },
      borderRadius: {
        DEFAULT: '8px',
        lg: '16px',
      },
      boxShadow: {
        'glow-primary': '0 0 15px 0 rgba(158, 127, 255, 0.3)',
      }
    },
  },
  plugins: [],
}
