/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg:      '#0a0f08',
        surface: '#111a0e',
        card:    '#162012',
        card2:   '#1c2a18',
        green: { DEFAULT: '#3a7d1e', hi: '#5ab030', lt: '#a8d878' },
        krishi: { amber: '#d4900a', amberlt: '#f0b840', muted: '#7a9070', white: '#f0f4ec' },
      },
      fontFamily: { sora: ['Sora', 'sans-serif'], mono: ['DM Mono', 'monospace'] },
      borderRadius: { xl: '20px', '2xl': '28px' },
    },
  },
  plugins: [],
};
