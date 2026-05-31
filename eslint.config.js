// Flat ESLint config (ESLint 9+). Lints the authored ES modules; vendor ignored.
import globals from "globals";

export default [
  { ignores: ["node_modules/", "dist/", "reports/", "src/assets/js/vendor/"] },
  {
    files: ["src/assets/js/**/*.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: { ...globals.browser },
    },
    rules: {
      "no-undef": "error",
      "no-unused-vars": "warn",
    },
  },
];
