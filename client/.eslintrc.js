module.exports = {
  extends: "expo",
  ignorePatterns: ["legacy/", "src/mocks/"],
  settings: {
    "import/resolver": {
      typescript: {
        project: "./tsconfig.json",
      },
    },
  },
  rules: {
    "import/no-unresolved": "off",
  },
};
