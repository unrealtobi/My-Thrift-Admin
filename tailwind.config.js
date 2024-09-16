/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        customOrange: '#f9531e',
        customCream: '#FCECD3',
        customGreen: '#def2eb',
        textGreen: '#388f6e',
        dotGreen: '#9cd8c2',
      },
      fontFamily: {
        roboto: ['Roboto', 'sans-serif'],
        ubuntu: ['Ubuntu', 'sans-serif'],
        bodoni: ['Bodoni Moda SC', 'serif'],
        lato: ['Lato', 'sans-serif'],
        poppins: ['Poppins', 'sans-serif'],
        playwrite: ['playwrite CU', 'cursive'],
        opensans: ['Open Sans', 'sans-serif'],

      },
    },
  },
  plugins: [],
}

