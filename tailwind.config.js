/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        cream: '#F1EFE9',
        dark: '#3a3a3a',
        room_red: '#D85A5A',
        room_blue: '#4A90E2',
        room_green: '#4B7E5B',
        room_orange: '#E8935C',
      },
    },
  },
  plugins: [],
}
