import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, join, normalize } from "node:path";
import axe from "axe-core";
import { chromium } from "playwright-core";

const basePath = (process.env.BASE_PATH ?? "").replace(/\/$/, "");

const types = {
  ".css": "text/css",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".pdf": "application/pdf",
  ".png": "image/png",
  ".webp": "image/webp",
  ".woff2": "font/woff2",
};

function withoutBasePath(pathname) {
  if (!basePath) return pathname;
  if (pathname === basePath) return "/";
  if (pathname.startsWith(`${basePath}/`)) {
    return pathname.slice(basePath.length);
  }
  return pathname;
}

const server = createServer(async (request, response) => {
  const { pathname } = new URL(request.url, "http://localhost");
  const stripped = withoutBasePath(pathname);
  const path = stripped.endsWith("/") ? `${stripped}index.html` : stripped;
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
const origin = `http://127.0.0.1:${server.address().port}${basePath}/`;

const browser = await chromium.launch();
console.log(`a11y: Chromium ${browser.version()}`);
const failures = [];

const viewports = {
  desktop: { width: 1280, height: 800 },
  phone: { width: 390, height: 844 },
};

// Home keeps the full suite below. Case studies get axe + reflow coverage.
const caseStudyPath = "work/tesla-energy-ai-product/";
const axeRoutes = ["", caseStudyPath];

for (const route of axeRoutes) {
  for (const [device, viewport] of Object.entries(viewports)) {
    for (const colorScheme of ["light", "dark"]) {
      const page = await browser.newPage({ viewport, colorScheme });
      await page.goto(`${origin}${route}`);
      await page.addScriptTag({ content: axe.source });
      const { violations } = await page.evaluate(() =>
        window.axe.run(document, {
          runOnly: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"],
        }),
      );
      for (const violation of violations) {
        for (const node of violation.nodes) {
          failures.push(
            `${route || "/"} ${device}/${colorScheme} ${violation.id}: ${node.target.join(" ")} ${node.failureSummary.split("\n").slice(1).join(" ").trim()}`,
          );
        }
      }
      await page.close();
    }
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

const phone = await browser.newPage({ viewport: viewports.phone });
await phone.goto(origin);
const phoneProblems = await phone.evaluate(() => {
  const problems = [];
  if (document.documentElement.scrollWidth > window.innerWidth) {
    problems.push("the page scrolls sideways");
  }
  for (const control of document.querySelectorAll("a, button")) {
    const box = control.getBoundingClientRect();
    const style = getComputedStyle(control);
    if (
      style.display === "none" ||
      style.visibility === "hidden" ||
      box.width <= 1 ||
      box.height <= 1
    ) {
      continue;
    }
    if (box.height < 44) {
      const name =
        control.getAttribute("aria-label") ||
        control.textContent.trim() ||
        control.getAttribute("href");
      problems.push(`"${name}" is ${box.height.toFixed(1)}px tall`);
    }
  }
  return problems;
});
failures.push(...phoneProblems.map((problem) => `390px: ${problem}`));
await phone.close();

// Text resize: at 200% text the header must fall back or wrap instead of
// pushing its controls off screen.
for (const [width, height] of [
  [320, 640],
  [900, 800],
]) {
  const large = await browser.newPage({ viewport: { width, height } });
  await large.goto(origin);
  await large.evaluate(() => {
    document.documentElement.style.fontSize = "32px";
  });
  await large.waitForTimeout(200);
  const clipped = await large.evaluate(() => {
    const problems = [];
    for (const control of document.querySelectorAll("header a, header button")) {
      const style = getComputedStyle(control);
      if (
        style.display === "none" ||
        style.visibility === "hidden" ||
        style.opacity === "0"
      ) {
        continue;
      }
      const box = control.getBoundingClientRect();
      if (box.width <= 1 || box.height <= 1) continue;
      if (box.left < -1 || box.right > window.innerWidth + 1) {
        const name =
          control.textContent.trim() || control.getAttribute("aria-label");
        problems.push(
          `"${name}" spans ${Math.round(box.left)}-${Math.round(box.right)}`,
        );
      }
    }
    return problems;
  });
  failures.push(
    ...clipped.map(
      (control) => `${width}px at 200% text: header control ${control}`,
    ),
  );
  await large.close();
}

// A short viewport plus the scroll lock must not put the last menu link
// out of reach.
const shortMenu = await browser.newPage({
  viewport: { width: 320, height: 256 },
});
await shortMenu.goto(origin);
await shortMenu.locator('button[aria-controls="mobile-nav"]').click();
const reachable = await shortMenu.evaluate(() => {
  const panel = document.querySelector("#mobile-nav");
  panel.scrollTop = panel.scrollHeight;
  const links = [...document.querySelectorAll("#mobile-nav a")];
  const last = links[links.length - 1];
  last.focus();
  const box = last.getBoundingClientRect();
  const hit = document.elementFromPoint(
    box.left + box.width / 2,
    box.top + box.height / 2,
  );
  return {
    top: box.top,
    bottom: box.bottom,
    viewport: window.innerHeight,
    clickable: hit === last || last.contains(hit),
  };
});
if (
  reachable.top < 0 ||
  reachable.bottom > reachable.viewport + 1 ||
  !reachable.clickable
) {
  failures.push(
    `phone menu: at 320x256 the last link is not reachable (top ${Math.round(reachable.top)}, bottom ${Math.round(reachable.bottom)}, viewport ${reachable.viewport})`,
  );
}
await shortMenu.close();

const hiddenReveals = (page) =>
  page.$$eval(
    ".reveal",
    (elements) =>
      elements.filter((element) => {
        const style = getComputedStyle(element);
        return (
          style.opacity !== "1" ||
          style.visibility !== "visible" ||
          style.clipPath !== "none"
        );
      }).length,
  );
const animatedReveals = (page) =>
  page.$$eval(
    ".reveal",
    (elements) =>
      elements.filter((element) => element.getAnimations().length > 0).length,
  );

const motion = await browser.newPage({ viewport: viewports.desktop });
await motion.goto(origin);
const title = await motion.title();
if (title.length === 0 || title.length > 60) {
  failures.push(`page title: ${title.length} characters, not 1 to 60`);
}
if ((await animatedReveals(motion)) === 0) {
  failures.push("reveal: nothing animates when motion is allowed");
}
if ((await hiddenReveals(motion)) > 0) {
  failures.push("reveal: content starts hidden");
}
await motion.evaluate(() =>
  window.scrollTo({ top: document.body.scrollHeight, behavior: "instant" }),
);
await motion.evaluate(
  () =>
    new Promise((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(resolve)),
    ),
);
const offset = await motion.$$eval(
  ".reveal",
  (elements) =>
    elements.filter((element) => getComputedStyle(element).translate !== "none")
      .length,
);
if (offset > 0) {
  failures.push(`reveal: ${offset} elements stay offset after scrolling past`);
}
if ((await hiddenReveals(motion)) > 0) {
  failures.push("reveal: content is hidden after scrolling");
}
await motion.close();

const still = await browser.newPage({
  viewport: viewports.desktop,
  reducedMotion: "reduce",
});
await still.goto(origin);
const moving = await animatedReveals(still);
if (moving > 0) {
  failures.push(`reveal: ${moving} elements animate under reduced motion`);
}
await still.close();

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
  .locator('#contact a[href^="mailto:"]:not([href*="?"])')
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
  [
    "a11y: all checks pass",
    "no axe violations at desktop and phone widths, light and dark",
    "nothing squeezed or overflowing at 320px",
    "every visible link and button is at least 44px tall at 390px",
    "nothing scrolls sideways at 390px",
    "page title within 60 characters",
    "reveals never hide content and stay still under reduced motion",
    "phone menu closes on Escape, returns focus, and closes at desktop width",
    "header controls stay on screen at 200% text",
    "phone menu stays reachable on a short viewport",
    "copy email announces success and failure",
  ].join("\n  "),
);
