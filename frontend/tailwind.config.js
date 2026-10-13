/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', 'sans-serif'],
      },
      colors: {
        primary: {
          300: '#64b5f6', // Light blue for inactive icons
          700: '#1565c0', // Active link background
          800: '#1976d2', // Primary gradient start
          900: '#0d47a1', // Primary gradient end
        },
      },
    },
  },
  plugins: [],
}
