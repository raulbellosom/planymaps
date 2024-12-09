const flowbite = require('flowbite-react/tailwind');

/** @type {import('tailwindcss').Config} \*/
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}', flowbite.content()],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Jaldi', 'sans-serif'],
      },
      colors: {
        'planymaps-danger': '#EF476F',
        'planymaps-warning': '#FFD166',
        'planymaps-success': '#06D6A0',
        'planymaps-info': '#118AB2',
        'planymaps-dark': '#141010',
        'planymaps-light': '#FFFFFE',
        'planymaps-gray': '#e7e5e4',
        'planymaps-gray-dark': '#44403c',
        'planymaps-primary': '#64ee85',
        'planymaps-secondary': '#0a3042',
        'planymaps-primary-light': '#92f3a9',
        'planymaps-primary-dark': '#36e961',
        'planymaps-secondary-light': '#11506e',
      },
      fontSize: {
        xxs: '0.5rem', // Nuevo estilo para texto muy pequeño
      },
      animation: {
        shake: 'shake 0.82s cubic-bezier(.36,.07,.19,.97) both',
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
      },
    },
  },
  plugins: [flowbite.plugin()],
};
