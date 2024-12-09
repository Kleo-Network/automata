/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      flexGrow: {
        2: '2',
        3: '3',
      },
      colors: {
        overlay: 'rgba(52, 64, 84, 0.7)',
        grayblue: {
          25: '#FCFCFD', // AA 6.07
          50: '#F8F9FC', // AA 5.91
          100: '#EAECF5', // AA 5.29
          200: '#D5D9EB', // AA 4.43
          300: '#B3B8DB', // AA 1.94
          400: '#717BBC', // AA 4.01
          500: '#4E5BA6', // AA 6.24
          600: '#3E4784', // AA 8.59
          700: '#363F72', // AAA 9.99
          800: '#293056', // AAA 12.72
          900: '#101323', // AAA 18.43
        },
        primary: {
          25: '#FCFAFF',
          50: '#F9F5FF',
          100: '#F4EBFF',
          200: '#E9D7FE',
          300: '#D6BBFB',
          400: '#B692F6',
          500: '#9E77ED',
          600: '#7F56D9',
          700: '#7F56D9',
          800: '#53389E',
          900: '#42307D',
        },
      },
      fontFamily: {
        inter: ['inter', 'sans-serif'], // Add Inter font
      },
    },
  },
  plugins: [
    function ({ addUtilities }) {
      const newUtilities = {
        '.scrollbar-thin': {
          scrollbarWidth: 'thin',
          scrollbarColor: '#D0D5DD #F9FAFB',
        },
        '.scrollbar-webkit': {
          '&::-webkit-scrollbar': {
            width: '6px',
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: '#D0D5DD',
            marginTop: '5px',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: '#F9FAFB',
            borderRadius: '100vw',
            width: '6px',
          },
        },
      };

      addUtilities(newUtilities, ['responsive', 'hover']);
    },
  ],
};
