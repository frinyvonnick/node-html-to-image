const js = require("@eslint/js");
const babelParser = require("@babel/eslint-parser");
const globals = require("globals");

// typescript-eslint does not yet support the TypeScript 7 native compiler
// (its peer range is `<6.1.0` and it crashes at load time on tsgo), so we lint
// TypeScript sources through @babel/eslint-parser + eslint core rules instead.
module.exports = [
  { ignores: ["dist/**", "coverage/**"] },
  js.configs.recommended,
  {
    files: ["src/**/*.ts"],
    languageOptions: {
      parser: babelParser,
      parserOptions: {
        requireConfigFile: false,
        babelOptions: {
          presets: ["@babel/preset-typescript"],
        },
      },
      globals: {
        ...globals.node,
        // Vitest globals (enabled via `globals: true` in vitest.config.ts).
        vi: "readonly",
        describe: "readonly",
        it: "readonly",
        expect: "readonly",
        beforeEach: "readonly",
        afterEach: "readonly",
        beforeAll: "readonly",
        afterAll: "readonly",
      },
    },
    rules: {
      // The TypeScript compiler already reports undefined identifiers and unused
      // bindings, and eslint core rules misfire on type-only syntax when parsed
      // without a type-aware parser.
      "no-undef": "off",
      "no-unused-vars": "off",
    },
  },
];
