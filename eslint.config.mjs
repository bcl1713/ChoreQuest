import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

// Temporary max-line waivers for legacy and generated files; see docs/frontend-architecture.md.
const legacyMaxLineWaivers = [
  "lib/types/database-generated.ts",
  "lib/types/database.ts",
];

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      "lib/generated/**",
      "jest.config.js",
      "*.config.js",
      "coverage/**",
      "dist/**",
      "playwright-report/**",
      "test-results/**",
      ".playwright-mcp/**",
    ],
  },
  {
    files: ["**/*.ts", "**/*.tsx"],
    ignores: ["**/*.d.ts"],
    rules: {
      "max-lines": [
        "error",
        {
          max: 300,
          skipBlankLines: false,
          skipComments: false,
        },
      ],
    },
  },
  {
    files: legacyMaxLineWaivers,
    rules: {
      "max-lines": "off",
    },
  },
  // Test files: allow any and display-name for mocked components and fixtures
  {
    files: ["**/*.test.ts", "**/*.test.tsx", "**/__tests__/**/*.ts", "**/__tests__/**/*.tsx"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "react/display-name": "off",
    },
  },
];

export default eslintConfig;
