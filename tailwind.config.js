/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./app/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Space Grotesk', 'sans-serif'],
      },
      colors: {
        'neon-green': '#39FF14',
        'neon-yellow': '#FFFF00',
        'dark': '#0F1218',
        'darker': '#070A0E',
        'glass': 'rgba(16, 18, 27, 0.4)',
      },
      boxShadow: {
        'neon': '0 0 8px theme("colors.neon-green"), 0 0 15px theme("colors.neon-green")',
        'glass': 'inset 0 1px 1px 0 rgba(255, 255, 255, 0.1)',
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'subtleGradientShift': 'subtleGradientShift 30s ease infinite',
      },
      keyframes: {
        subtleGradientShift: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
      },
      backdropBlur: {
        'md': '12px',
      },
    },
  },
  plugins: [],
} 