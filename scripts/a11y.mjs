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

const narrow = await browser.newPage({ viewport: { width: 320, height: 640 } });
await narrow.goto(origin);
const reflowProblems = await narrow.evaluate(() => {
  const problems = [];
  if (document.documentElement.scrollWidth > window.innerWidth) {
    problems.push("the page scrolls sideways");
  }
  for (const control of document.querySelectorAll("a, button")) {
    if (control.getBoundingClientRect().width <= 1) continue;
    const name =
      control.textContent.trim() || control.getAttribute("aria-label");
    for (const icon of control.querySelectorAll("svg")) {
      const { width, height } = icon.getBoundingClientRect();
      if (width < height) {
        problems.push(`"${name}" squeezes its icon to ${width.toFixed(1)}px`);
      }
    }
    if (
      getComputedStyle(control).display !== "inline" &&
      control.scrollWidth > control.clientWidth
    ) {
      problems.push(`"${name}" overflows its box`);
    }
  }
  return problems;
});
failures.push(...reflowProblems.map((problem) => `320px: ${problem}`));
await narrow.close();

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
await toggle.click();
await page.setViewportSize(viewports.desktop);
const released = await page
  .waitForFunction(
    () =>
      !document.getElementById("mobile-nav") &&
      getComputedStyle(document.body).overflow !== "hidden",
    null,
    { timeout: 2000 },
  )
  .then(
    () => true,
    () => false,
  );
if (!released) {
  failures.push(
    "phone menu: widening to desktop leaves the menu open and the page locked",
  );
}

const clipboardContext = await browser.newContext({
  viewport: viewports.desktop,
  permissions: ["clipboard-read", "clipboard-write"],
});
const contact = await clipboardContext.newPage();
await contact.goto(origin);
const email = await contact
  .locator('#contact a[href^="mailto:"]')
  .textContent();
const copyButton = contact.locator("#contact button");
const announces = (text) =>
  contact
    .waitForFunction(
      (expected) =>
        document.querySelector('#contact [role="status"]').textContent ===
        expected,
      text,
      { timeout: 2000 },
    )
    .then(
      () => true,
      () => false,
    );
await copyButton.click();
if (
  !(await announces("Email address copied")) ||
  (await contact.evaluate(() => navigator.clipboard.readText())) !== email
) {
  failures.push("copy email: a successful copy is not announced");
}
await contact.evaluate(() => {
  navigator.clipboard.writeText = () =>
    Promise.reject(new DOMException("Denied", "NotAllowedError"));
});
await copyButton.click();
if (!(await announces("Couldn't copy the email address"))) {
  failures.push("copy email: a failed copy is not announced");
}
await clipboardContext.close();

await browser.close();
server.close();

if (failures.length > 0) {
  console.error(failures.join("\n"));
  process.exit(1);
}
console.log(
  "a11y: no axe violations (desktop and phone, light and dark); nothing squeezed or overflowing at 320px; phone menu closes on Escape, returns focus, and closes at desktop width; copy email announces success and failure",
);
