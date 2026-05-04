/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all files that contain Nativewind classes.
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./App.tsx", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
         colors: {
            primary: "#091C3C", // Main color for the app, corresponds to the background
            section: "#162C53", // Color for sections and cards, such as card in profile page
            active_icon: "#3377F4", // Color for active tab, some headers, as well as buttons
            inactive_icon: "#FFFFFF", // Color for inactive tab icons as well as user text box in chat tab
            outages: "#19376D", // Color of the card used in the outages page that shows legend
            text_main: "#F7FDFD", // Main color of text
            inactive_text: "#A0B3D3", // This is the color of inactive text, such as hidden info, or preferences in the profile page
            energi: "#294068", // This is the color of the text box for the chatbot Energi
         },
         fontFamily: {
            sans: ['Inter_400Regular'], // This is the font family for the app, we use Inter as our main font
            semibold: ['Inter_600SemiBold'], // This is the font family for semi bold text
            bold: ['Inter_700Bold'], // This is the font family for bold text
         },
    },
  },
  plugins: [],
}