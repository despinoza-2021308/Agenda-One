/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f7ff',
          100: '#e0effe',
          200: '#bae0fd',
          300: '#7cc5fb',
          400: '#36a5f7',
          500: '#0c87eb',
          600: '#026bc9',
          700: '#0355a2',
          800: '#074885',
          900: '#0c3d6f',
        }
      },
      boxShadow: {
        'glass-sm': '0 4px 16px 0 rgba(31, 38, 135, 0.05), inset 0 1px 0 0 rgba(255, 255, 255, 0.6)',
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.07), inset 0 1px 1px 0 rgba(255, 255, 255, 0.7)',
        'glass-hover': '0 12px 40px 0 rgba(31, 38, 135, 0.12), inset 0 1px 1px 0 rgba(255, 255, 255, 0.9)',
        'glass-dark': '0 8px 32px 0 rgba(0, 0, 0, 0.4), inset 0 1px 0 0 rgba(255, 255, 255, 0.1)',
        'glass-dark-hover': '0 14px 44px 0 rgba(0, 0, 0, 0.6), inset 0 1px 0 0 rgba(255, 255, 255, 0.18)',
        'liquid-glow': '0 0 25px -3px rgba(37, 99, 235, 0.35)',
        'liquid-emerald': '0 0 25px -3px rgba(16, 185, 129, 0.35)',
        'liquid-purple': '0 0 25px -3px rgba(147, 51, 234, 0.35)',
      },
      backdropBlur: {
        'xs': '2px',
        '2xl': '40px',
        '3xl': '64px',
      }
    },
  },
  plugins: [],
}
