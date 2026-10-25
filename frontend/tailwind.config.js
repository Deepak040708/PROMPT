/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        craft: {
          bg: '#0A1424',
          surface: '#132239',
          surfaceHover: '#182B47',
          surfaceActive: '#1D3354',
          primary: '#648BCB',
          primaryHover: '#5377B4',
          primaryActive: '#4768A0',
          accent: '#D6B77A',
          accentHover: '#C7A663',
          mainText: '#F4F0E8',
          mutedText: '#A9B9D0',
          card: '#1C3150',
          cardHover: '#223B60',
          promptText: '#F0F5FC',
          'prompt-text': '#F0F5FC',
          highlight: '#9FC5FF',
          cardBorder: '#365477',
          input: '#132239',
          inputBorder: '#314966',
          inputBorderFocus: '#648BCB',
          borderSubtle: '#223854',
        }
      },
      fontFamily: {
        serif: ['"DM Serif Display"', 'Georgia', 'serif'],
        display: ['"DM Serif Display"', 'Georgia', 'serif'],
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'Fira Code', 'monospace'],
      }
    },
  },
  plugins: [],
}
