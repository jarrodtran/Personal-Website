/**
 * Lighthouse CI against the Next.js static export (`out/`).
 * Keep thresholds practical: accessibility/SEO are hard floors; performance is warn-only (CI Chrome is noisy).
 */
module.exports = {
  ci: {
    collect: {
      staticDistDir: "./out",
      numberOfRuns: 1,
      url: [
        "http://localhost/",
        "http://localhost/work/waymo-engineering-ops/",
        "http://localhost/work/tesla-energy-ai-product/",
      ],
      settings: {
        chromeFlags: "--no-sandbox --disable-dev-shm-usage",
      },
    },
    assert: {
      assertions: {
        "categories:performance": ["warn", { minScore: 0.7 }],
        "categories:accessibility": ["error", { minScore: 0.9 }],
        "categories:best-practices": ["warn", { minScore: 0.85 }],
        "categories:seo": ["error", { minScore: 0.9 }],
      },
    },
    upload: {
      target: "filesystem",
      outputDir: ".lighthouseci",
    },
  },
};
