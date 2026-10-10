import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// CLAUDE.md rule 1 / SR-11: feature code never calls a model provider directly.
// Only files under safety/ may import provider SDKs or reference provider API hosts.
const PROVIDER_SDKS = ["@elevenlabs/*", "elevenlabs", "together-ai", "openai", "@anthropic-ai/*", "@google/genai", "replicate"];
const PROVIDER_HOSTS = /api\.together\.(ai|xyz)|api\.elevenlabs\.io|api\.openai\.com|api\.anthropic\.com/;

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["**/*.{ts,tsx,js,jsx,mjs}"],
    ignores: ["safety/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        { patterns: [{ group: PROVIDER_SDKS, message: "Model providers may only be called from safety/ (CLAUDE.md rule 1)." }] },
      ],
      "no-restricted-syntax": [
        "error",
        {
          selector: `Literal[value=${PROVIDER_HOSTS}]`,
          message: "Provider API hosts may only appear in safety/ (CLAUDE.md rule 1).",
        },
        {
          selector: `TemplateElement[value.raw=${PROVIDER_HOSTS}]`,
          message: "Provider API hosts may only appear in safety/ (CLAUDE.md rule 1).",
        },
      ],
    },
  },
  {
    rules: {
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_", destructuredArrayIgnorePattern: "^_" }],
    },
  },
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts", "public/generated/**", "node_modules/**", ".playwright-mcp/**"]),
]);

export default eslintConfig;
