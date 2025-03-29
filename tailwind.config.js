/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./*.{html,js}",
    "./static/**/*.{html,js,css}",
    "./src/**/*.{html,js,css}"
  ],
  theme: {
    extend: {
      colors: {
        tmobile: '#E20074',
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms')
  ],
}
