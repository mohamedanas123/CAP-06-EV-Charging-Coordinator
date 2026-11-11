/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#245C45',
          light: '#2E7357',
          dark: '#1A4533',
          50: '#E8F0EB',
        },
        sage: '#E8F0EB',
        background: '#F7F8F6',
        surface: '#FFFFFF',
        text: {
          primary: '#252B28',
          secondary: '#747D77',
        },
        warning: {
          DEFAULT: '#D4A843',
          light: '#FFF8E7',
          dark: '#B8922E',
        },
        error: {
          DEFAULT: '#C0392B',
          light: '#FDF0EF',
          dark: '#A33025',
        },
        success: {
          DEFAULT: '#245C45',
          light: '#E8F0EB',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

