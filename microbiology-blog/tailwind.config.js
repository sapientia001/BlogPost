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
          DEFAULT: '#2c5530',
          50: '#f6f7f6',
          100: '#e3e7e3',
          200: '#c6cfc6',
          300: '#9dae9d',
          400: '#768976',
          500: '#5a6d5a',
          600: '#475747',
          700: '#3a473a',
          800: '#2c5530',
          900: '#1a241a',
        },
        scientific: {
          blue: '#1e40af',
          green: '#2c5530',
          teal: '#0f766e',
          gray: '#374151'
        }
      },
      fontFamily: {
        'heading': ['Inter', 'system-ui', 'sans-serif'],
        'body': ['Source Sans Pro', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [
    // Remove the line-clamp plugin for now, we'll use built-in line-clamp
  ],
}