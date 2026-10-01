import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, join, normalize } from "node:path";
import axe from "axe-core";
import { chromium } from "playwright-core";

const types = {
  ".css": "text/css",
  ".html": "text/html; charset=utf-8",
  ".jpg": "image/jpeg",
  ".js": "text/javascript",
  ".pdf": "application/pdf",
  ".png": "image/png",
  ".webp": "image/webp",
  ".woff2": "font/woff2",
};

const server = createServer(async (request, response) => {
  const { pathname } = new URL(request.url, "http://localhost");
  const path = pathname.endsWith("/") ? `${pathname}index.html` : pathname;
  const file = join("out", normalize(decodeURIComponent(path)));
  try {
    const body = await readFile(file);
    response.writeHead(200, { "content-type": types[extname(file)] ?? "" });
    response.end(body);
  } catch {
    response.writeHead(404).end();
  }
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const origin = `http://127.0.0.1:${server.address().port}/`;

const browser = await chromium.launch({
  channel: "chrome",
  executablePath: process.env.CHROME_PATH,
});
const failures = [];

const viewports = {
  desktop: { width: 1280, height: 800 },
  phone: { width: 390, height: 844 },
};

for (const [device, viewport] of Object.entries(viewports)) {
  for (const colorScheme of ["light", "dark"]) {
    const page = await browser.newPage({ viewport, colorScheme });
    await page.goto(origin);
    await page.addScriptTag({ content: axe.source });
    const { violations } = await page.evaluate(() =>
      window.axe.run(document, {
        runOnly: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"],
      }),
    );
    for (const violation of violations) {
      for (const node of violation.nodes) {
        failures.push(
          `${device}/${colorScheme} ${violation.id}: ${node.target.join(" ")} ${node.failureSummary.split("\n").slice(1).join(" ").trim()}`,
        );
      }
    }
    await page.close();
  }
}

const page = await browser.newPage({ viewport: viewports.phone });
await page.goto(origin);
const toggle = page.locator('button[aria-controls="mobile-nav"]');
await toggle.click();
await page.locator("#mobile-nav a").first().focus();
await page.keyboard.press("Escape");
if (await page.locator("#mobile-nav").isVisible()) {
  failures.push("phone menu: Escape does not close the menu");
}
const focusReturned = await toggle.evaluate(
  (button) => document.activeElement === button,
);
if (!focusReturned) {
  failures.push("phone menu: focus does not return to the menu button");
}

await browser.close();
server.close();

if (failures.length > 0) {
  console.error(failures.join("\n"));
  process.exit(1);
}
console.log(
  "a11y: no axe violations (desktop and phone, light and dark); phone menu closes on Escape and returns focus",
);
