import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import { bannedWorkflowOrScriptTextRead } from "./lib/eslint-restricted.mjs";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([".next/**", "out/**", "node_modules/**"]),
  {
    files: ["tests/**"],
    rules: {
      "no-restricted-syntax": ["error", ...bannedWorkflowOrScriptTextRead],
    },
  },
]);

export default eslintConfig;
