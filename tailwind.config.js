/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all files that contain Nativewind classes.
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./App.tsx", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        background: '#0E1D2D',      // Main app background
        section: '#1A2B3C',         // Cards and section backgrounds
        modal: '#243447',           // Modals and bottom sheets
        divider: '#2A3B55',         // Borders and dividers

        accent: '#D4AF37',          // Buttons, active states, highlights
        success: '#22C55E',         // Positive balances, completed actions
        danger: '#EF4444',          // Errors, negative balances, overspend
        warning: '#F59E0B',         // Low balance alerts, due date warnings
        mint: '#E6F7EF',            // Subtle success background tint

        text_main: '#F7FDFD',       // Primary text
        inactive_text: '#A0B3D3',   // Secondary text, labels, inactive states
      },
      fontFamily: {
        sans: ['Poppins_400Regular'],       // Default body text
        semibold: ['Poppins_600SemiBold'],  // Subheadings, labels
        bold: ['Poppins_700Bold'],          // Headings, emphasis
      },
    },
  },
  plugins: [],
}