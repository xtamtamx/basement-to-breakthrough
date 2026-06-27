/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    screens: {
      'xs': '375px',     // Small phones
      'sm': '640px',     // Large phones
      'md': '768px',     // Tablets
      'lg': '1024px',    // Desktop
      'xl': '1280px',    // Large desktop
      '2xl': '1536px',   // Extra large
    },
    extend: {
      colors: {
        'punk': {
          50: '#fdf2f8',
          100: '#fce7f3',
          200: '#fbcfe8',
          300: '#f9a8d4',
          400: '#f472b6',
          500: '#ec4899',
          600: '#db2777',
          700: '#be185d',
          800: '#9d174d',
          900: '#831843',
          950: '#500724',
        },
        'metal': {
          50: '#f5f5f5',
          100: '#e7e7e7',
          200: '#d1d1d1',
          300: '#b0b0b0',
          400: '#888888',
          500: '#6d6d6d',
          600: '#5d5d5d',
          700: '#4f4f4f',
          800: '#454545',
          900: '#3d3d3d',
          950: '#262626',
        }
      },
      fontFamily: {
        'punk': ['Helvetica', 'Arial', 'sans-serif'],
        'metal': ['Impact', 'Helvetica', 'Arial', 'sans-serif'],
      },
      spacing: {
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-left': 'env(safe-area-inset-left)',
        'safe-right': 'env(safe-area-inset-right)',
        'touch': '44px', // iOS minimum touch target
        'touch-android': '48px', // Android minimum touch target
      },
      minHeight: {
        'touch': '44px',
        'touch-android': '48px',
      },
      minWidth: {
        'touch': '44px',
        'touch-android': '48px',
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shake': 'shake 0.5s cubic-bezier(.36,.07,.19,.97) both',
        'tap': 'tap 0.3s ease-out',
        'swipe-left': 'swipe-left 0.3s ease-out',
        'swipe-right': 'swipe-right 0.3s ease-out',
      },
      keyframes: {
        shake: {
          '10%, 90%': {
            transform: 'translate3d(-1px, 0, 0)',
          },
          '20%, 80%': {
            transform: 'translate3d(2px, 0, 0)',
          },
          '30%, 50%, 70%': {
            transform: 'translate3d(-4px, 0, 0)',
          },
          '40%, 60%': {
            transform: 'translate3d(4px, 0, 0)',
          },
        },
        tap: {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(0.95)' },
          '100%': { transform: 'scale(1)' },
        },
        'swipe-left': {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-100%)' },
        },
        'swipe-right': {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(100%)' },
        },
      },
      transitionProperty: {
        'touch': 'transform, opacity, background-color',
      },
      transitionDuration: {
        '50': '50ms',
      }
    },
  },
  plugins: [],
}