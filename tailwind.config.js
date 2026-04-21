/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html'],
  theme: {
    extend: {
      colors: {
        glow: '#22c55e',
        dark: '#020617',
        slate: '#1e293b',
      },
      animation: {
        shimmer: 'shimmer 2s infinite',
        glow: 'glow 2s ease-in-out infinite',
      },
      keyframes: {
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        glow: {
          '0%, 100%': { boxShadow: '0 0 5px #22c55e' },
          '50%': { boxShadow: '0 0 20px #22c55e' },
        },
      },
    },
  },
  plugins: [],
};
