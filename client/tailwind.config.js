const tokens = require("../../agents/ux_design/design_tokens.json");

// Extract categories from flat tokens
const colors = {};
const spacing = {};
const borderRadius = {};

// Colors: keys that map to hex or rgba strings
const colorKeys = ["starbucksGreen","greenAccent","houseGreen","greenUplift","greenLight","gold","goldLight","goldLightest","neutralWarm","ceramic","neutralCool","white","black","error","warning","inputBorder","rewardsGreen"];
colorKeys.forEach(k => { colors[k] = tokens[k]; });

// Spacing: keys that are numbers (pixels)
["space1","space2","space3","space4","space5","space6","space7","space8","space9","outerGutter","outerGutterMd","outerGutterLg"].forEach(k => {
  spacing[k] = `${tokens[k]}px`;
});

// Border radius
["radiusCard","radiusButton","radiusInput","radiusCircle"].forEach(k => {
  borderRadius[k] = `${tokens[k]}px`;
});

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors,
      spacing,
      borderRadius,
      fontFamily: {
        sans: ["Inter_400Regular"],
        semibold: ["Inter_600SemiBold"],
      },
    },
  },
  plugins: [],
};
