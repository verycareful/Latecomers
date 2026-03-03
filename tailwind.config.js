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
        primary: {
          50: '#f0f5fd',
          100: '#e0ebfc',
          200: '#c1d7f8',
          300: '#a2c3f5',
          400: '#83aff1',
          500: '#641bed',
          600: '#1e3b8a',
          700: '#1e3b8a',
          800: '#172a66',
          900: '#0f1a42',
          950: '#080d21',
        },
        secondary: {
          50: '#f7fee7',
          100: '#efffcf',
          200: '#dfffb3',
          300: '#c9fa80',
          400: '#b3f64d',
          500: '#9df21a',
          600: '#85ce00',
          dark: '#8a1313',
        },
        accent: {
          50: '#f0fdf7',
          100: '#dcfcee',
          200: '#b9f8dd',
          300: '#4ef99e',
          400: '#24f578',
          500: '#06b156',
          600: '#059652',
          700: '#047c46',
          800: '#03623a',
        },
        // Override gray for pitch black dark mode
        gray: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#1a1a1a',  // Darker for cards/elements
          800: '#0d0d0d',  // Near black for secondary bg
          900: '#000000',  // Pitch black for main bg
          950: '#000000',
        },
      },
      animation: {
        'spin-slow': 'spin 3s linear infinite',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
