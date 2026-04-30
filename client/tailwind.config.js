/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#17211b',
        moss: '#2f6f4e',
        mint: '#dff5e7',
        coral: '#f9735b',
        honey: '#f4b740',
        plum: '#6d5dfc'
      },
      boxShadow: {
        soft: '0 18px 40px rgba(23, 33, 27, 0.08)'
      }
    }
  },
  plugins: []
};
