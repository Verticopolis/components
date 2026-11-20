import js from "@eslint/js";
import tseslint from "typescript-eslint";
import prettier from "eslint-config-prettier";

export default [
  {
    ignores: [
      "node_modules",
      "dist",
      "lib",
      "vite.lib.config.ts",
      "coverage",
      "scripts",
      "**/*.config.js",
      "src/public",
      "src/engineBinding/engine.d.ts",
    ],
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
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      "prefer-const": "error",
      "no-var": "error",
      "no-nested-ternary": "error",
    },
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
    // The same-origin analytics relay: a Node.js-runtime Vercel Function plus its
    // env-read entry. Same rule set as src, module source.
    files: ["api/**/*.ts"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      "prefer-const": "error",
      "no-var": "error",
      "no-nested-ternary": "error",
    },
  },
];
