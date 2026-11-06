/**
 * ESLint `no-restricted-syntax` entries that keep tests behavior-based.
 *
 * Tests must assert what the site does, not read workflow or script source as
 * text. Both a literal path and a path the code assembles with `join`/`resolve`
 * are refused, so `readFileSync(join(root, ".github", "workflows/ci.yml"))`
 * cannot slip past the literal-only check.
 */
export const bannedWorkflowOrScriptTextRead = [
  {
    selector:
      "CallExpression:matches([callee.name=/^(readFileSync|readFile|readSiteFile)$/], [callee.property.name=/^(readFileSync|readFile)$/]) > Literal[value=/^\\.?\\/?(\\.github|scripts)\\//]",
    message:
      "Do not read .github/ or scripts/ as text in tests; assert site behavior instead.",
  },
  {
    selector:
      "CallExpression:matches([callee.name=/^(readFileSync|readFile|readSiteFile)$/], [callee.property.name=/^(readFileSync|readFile)$/]) CallExpression:matches([callee.name=/^(join|resolve)$/], [callee.property.name=/^(join|resolve)$/]) Literal[value=/^\\.?\\/?(\\.github|scripts)(\\/|$)/]",
    message:
      "Do not read .github/ or scripts/ as text in tests, including paths built with join/resolve; assert site behavior instead.",
  },
];
