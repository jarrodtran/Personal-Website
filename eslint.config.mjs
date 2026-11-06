import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const bannedWorkflowOrScriptTextRead = {
  selector:
    "CallExpression:matches([callee.name=/^(readFileSync|readFile|readSiteFile)$/], [callee.property.name=/^(readFileSync|readFile)$/]) > Literal[value=/^\\.?\\/?(\\.github|scripts)\\//]",
  message:
    "Do not read .github/ or scripts/ as text in tests; assert site behavior instead.",
};

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([".next/**", "out/**", "node_modules/**"]),
  {
    files: ["tests/**"],
    rules: {
      "no-restricted-syntax": ["error", bannedWorkflowOrScriptTextRead],
    },
  },
]);

export default eslintConfig;
