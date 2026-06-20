/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef4ff',
          100: '#d9e6ff',
          200: '#bcd3ff',
          300: '#8eb5ff',
          400: '#598dff',
          500: '#3b6cf6',
          600: '#2450eb',
          700: '#1d3fd8',
          800: '#1e36af',
          900: '#1e338a',
          950: '#172054',
        },
        // Surface shades are remapped to deliver two distinct themes without
        // touching every component:
        //   light theme  -> white cards on a light-blue page (slate-50/100/200)
        //   dark theme   -> full black page + near-black cards (slate-800/900/950)
        // The mid text shades (300-700) keep Tailwind's defaults so contrast holds.
        slate: {
          50: '#eff5ff', // light page background (light blue)
          100: '#e4edfb', // light subtle fills / secondary buttons
          200: '#dbe6f5', // light borders (soft blue-grey)
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1a1a1a', // dark borders / fills on black
          900: '#0b0b0c', // dark cards (near black) + light primary text
          950: '#000000', // dark page background (full black)
        },
      },
      fontFamily: {
        sans: [
          '"Plus Jakarta Sans Variable"',
          'Inter',
          'system-ui',
          '-apple-system',
          'sans-serif',
        ],
      },
      keyframes: {
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'slide-in': {
          from: { transform: 'translateX(100%)' },
          to: { transform: 'translateX(0)' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'translateY(8px) scale(0.97)' },
          to: { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.15s ease-out',
        'slide-in': 'slide-in 0.2s ease-out',
        'scale-in': 'scale-in 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [],
}
