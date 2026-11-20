import js from "@eslint/js";
import tseslint from "typescript-eslint";
import prettier from "eslint-config-prettier";
import lit from "eslint-plugin-lit";
import globals from "globals";

// The rules every linted file shares.
const rules = {
  "@typescript-eslint/no-explicit-any": "warn",
  "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
  "prefer-const": "error",
  "no-var": "error",
  "no-nested-ternary": "error",
};

export default [
  {
    ignores: ["node_modules", "dist", "lib", "vite.lib.config.ts", "coverage", "**/*.config.js", "src/public"],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  prettier,
  {
    files: ["src/**/*.ts"],
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: "module",
    },
    rules,
  },
  {
    // The lit-html templates: the plugin's recommended checks (bindings in
    // valid positions, no duplicate attributes, well-formed template HTML).
    files: ["src/**/*.ts"],
    ...lit.configs["flat/recommended"],
  },
  {
    // Every scene actor takes its draw plane (z) from the shared table
    // (`depthPlanes.ts`), never from a number.
    files: ["src/render/excalibur/**/*.ts"],
    ignores: ["src/**/*.test.ts"],
    rules: {
      "no-restricted-syntax": [
        "error",
        ...[
          // A z with no name in it is a bare number: `z: 3`, `z: -1`, `z: 2 + 0.5`.
          "Property[key.name='z'] > .value:not(Identifier):not(:has(Identifier))",
          "AssignmentExpression[left.property.name='z'] > .right:not(Identifier):not(:has(Identifier))",
          "CallExpression[callee.name='addBoxActor'] > .arguments:nth-child(5):not(Identifier):not(:has(Identifier))",
        ].map((selector) => ({ selector, message: "Take the actor's z from the draw-plane table in depthPlanes.ts." })),
      ],
    },
  },
  {
    files: ["src/**/*.test.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
  {
    // The build, release and atlas scripts run on Node.
    files: ["scripts/**/*.{ts,mts,js,mjs}"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: globals.node,
    },
    rules,
  },
  {
    // The gallery and its Playwright check: Node for the specs, the browser for
    // the page and the callbacks the specs hand to it.
    files: ["gallery/**/*.ts", "e2e/**/*.ts"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: { ...globals.node, ...globals.browser },
    },
    rules,
  },
];
