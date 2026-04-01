import js from "@eslint/js";
import globals from "globals";
import { defineConfig } from "eslint/config";

export default defineConfig([
  {
    files: ["**/*.{js,mjs,cjs}"], plugins: { js },
    extends: ["js/recommended"],
    languageOptions: {
      globals: globals.browser,
      sourceType: "commonjs"
    },
    rules: {
      semi: ["error", "as-needed"], //geen puntkomma

      "arrow-body-style": ["error", "as-needed"], //arrow functie
      "prefer-arrow-callback": "error",

      "no-unused-vars": "error", //geen onnodige variabel
      "no-unreachable": "error",

      "padding-line-between-statements": [ //spatie tussen functies
        "error",
        { blankLine: "always", prev: "function", next: "*" }    
      ]
  }
  },
]);
