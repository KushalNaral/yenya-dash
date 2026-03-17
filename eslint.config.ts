import vue from "eslint-plugin-vue";
import tseslint from "@typescript-eslint/eslint-plugin";
import prettier from "eslint-plugin-prettier";
import vueParser from "vue-eslint-parser";
import tsParser from "@typescript-eslint/parser";
import { configs as eslintConfigs } from "@eslint/js";
import globals from "globals";
export default [
  {
    ignores: ["**/src/components/ui/**"],
  },
  {
    files: ["**/*.{js,ts,tsx,vue}"],
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        parser: tsParser,
        ecmaVersion: 2021,
        sourceType: "module",
      },
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    plugins: {
      vue,
      "@typescript-eslint": tseslint,
      prettier,
    },
    rules: {
      ...eslintConfigs.recommended.rules,
      ...tseslint.configs.recommended.rules,

      "@typescript-eslint/no-explicit-any": "off",

      "vue/multi-word-component-names": "off",
      "prettier/prettier": "error",
    },
  },
];
