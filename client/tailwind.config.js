/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        'brand-dark':     '#063214',
        'brand-vibrant':  '#00E676',
        'route-active':   '#4CAF50',
        'action-skip':    '#549A9C',
        'action-pick':    '#8BC34A',
        'bg-light':       '#F5F5F7',
        'user-dot':       '#3B82F6',
        'waypoint-target':'#EF4444',
        'loading-yellow': '#FFEB3B',
      },
      fontFamily: {
        sans:     ['Inter_400Regular'],
        semibold: ['Inter_600SemiBold'],
      },
      borderRadius: {
        pill: '50px',
        card: '12px',
      },
    },
  },
  plugins: [],
};
