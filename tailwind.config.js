/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#eef2f7',
          100: '#d7e0ec',
          200: '#b0c1d9',
          300: '#88a2c6',
          400: '#5c7fac',
          500: '#3d6091',
          600: '#2b4a75',
          700: '#1f3a5f',
          800: '#152c48',
          900: '#0d1e33'
        }
      },
      fontFamily: {
        sans: ['Inter', 'Arial', 'sans-serif']
      }
    }
  },
  plugins: []
}
