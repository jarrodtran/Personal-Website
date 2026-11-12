import { chromium, type Page } from "playwright-core";
import { expect, it } from "vitest";
import { site } from "@/content/site";
import { requireOutBuild, startOutServer } from "./browser-layout";

/**
 * Allowed paint is read from a probe on the same page, theme, and text scale.
 * An exception that matches nothing fails the run, so a deferred audit item
 * cannot disappear without the list being updated.
 */

const WIDTHS = [320, 768, 1280] as const;
const SCALES = [100, 200] as const;
const SCHEMES = ["light", "dark"] as const;
const ROUTES = [
  "/",
  ...site.selectedWork.map((item) => `/work/${item.slug}/`),
  "/404.html",
];

const SURFACE = { light: "250,250,250", dark: "18,18,18" } as const;
const BORDER_CONTROL = { light: "138,138,138", dark: "107,107,107" } as const;

type Scheme = (typeof SCHEMES)[number];
type Scale = (typeof SCALES)[number];

type Finding = {
  audit: string;
  kind: string;
  name: string;
  detail: string;
  off: string;
  ratio: number | null;
};

type SectionPad = {
  id: string;
  home: boolean;
  top: number;
  bottom: number;
};

type ControlEdge = {
  name: string;
  border: string;
  background: string;
};

type SmallControl = {
  name: string;
  font: number;
  lineRatio: number | null;
};

type PageSample = {
  css: string;
  textBody: number;
  remBody: number;
  textSmall: number;
  remSmall: number;
  smallLineRatio: number | null;
  textH1: number;
  textH2: number;
  textH3: number;
  remH3: number;
  rem2: number;
  rem225: number;
  spacing: number;
  surface: string;
  borderControl: string;
  heroFont: number | null;
  headingFonts: number[];
  sections: SectionPad[];
  controls: ControlEdge[];
  smallControls: SmallControl[];
  findings: Finding[];
};

type Exception = {
  audit: string;
  pr: string;
  match: (finding: Finding) => boolean;
};

const EXCEPTIONS: Exception[] = [
  {
    audit: "H1 bg-muted/50",
    pr: "PR 3",
    match: (finding) =>
      finding.kind === "background" &&
      /#(experience|approach|contact)\b/.test(finding.name),
  },
  {
    audit: "13 mono label",
    pr: "Spec B",
    match: (finding) =>
      finding.kind === "font-size" && finding.off === "0.75rem",
  },
];

requireOutBuild("token values test needs a production build in out/");

function near(actual: number, expected: number): boolean {
  return Math.abs(actual - expected) <= 0.75;
}

function channels(rgb: string): [number, number, number] | null {
  if (!rgb || rgb === "transparent") return null;
  const parts = rgb.split(",").map((part) => Number(part));
  if (parts.length < 3 || parts.some((part) => Number.isNaN(part))) return null;
  return [parts[0] ?? 0, parts[1] ?? 0, parts[2] ?? 0];
}

function luminance(rgb: [number, number, number]): number {
  const linear = rgb.map((value) => {
    const channel = value / 255;
    return channel <= 0.03928
      ? channel / 12.92
      : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return (
    0.2126 * (linear[0] ?? 0) +
    0.7152 * (linear[1] ?? 0) +
    0.0722 * (linear[2] ?? 0)
  );
}

function contrast(foreground: string, background: string): number | null {
  const left = channels(foreground);
  const right = channels(background);
  if (!left || !right) return null;
  const first = luminance(left);
  const second = luminance(right);
  const [hi, lo] = first > second ? [first, second] : [second, first];
  return (hi + 0.05) / (lo + 0.05);
}

function collectPage(): PageSample {
  const root = document.documentElement;
  const rootStyle = getComputedStyle(root);
  const homeSections = new Set([
    "top",
    "writing",
    "about",
    "experience",
    "work",
    "approach",
    "contact",
  ]);
  const host = document.createElement("div");
  host.setAttribute("data-token-probe", "");
  host.style.cssText =
    "position:absolute;width:0;height:0;overflow:hidden;visibility:hidden";
  document.body.append(host);

  const made = new Map<string, HTMLElement>();
  const probe = (decl: string) => {
    const cached = made.get(decl);
    if (cached) return cached;
    const el = document.createElement("div");
    el.style.cssText = decl;
    host.append(el);
    made.set(decl, el);
    return el;
  };

  const px = (el: Element, prop: "fontSize" | "paddingTop" | "paddingBottom") =>
    parseFloat(getComputedStyle(el)[prop]);

  const fontOf = (decl: string) => px(probe(decl), "fontSize");

  const paint = (decl: string, prop: "backgroundColor" | "borderTopColor") => {
    const value = getComputedStyle(probe(decl))[prop];
    return normalizeColor(value);
  };

  function normalizeColor(value: string): string {
    if (!value || value === "transparent") return "transparent";
    const match = value.match(/rgba?\(([^)]+)\)/);
    if (match?.[1]) {
      const parts = match[1]
        .split(/[,\s/]+/)
        .filter(Boolean)
        .map((part) => Number(part));
      const alpha = parts[3] ?? 1;
      if (alpha < 0.01) return "transparent";
      if (parts.length >= 3 && alpha > 0.99) {
        return `${Math.round(parts[0] ?? 0)},${Math.round(parts[1] ?? 0)},${Math.round(parts[2] ?? 0)}`;
      }
    }
    const canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = 1;
    const context = canvas.getContext("2d");
    if (!context) return value;
    context.clearRect(0, 0, 1, 1);
    context.fillStyle = value;
    context.fillRect(0, 0, 1, 1);
    const [r, g, b, a] = context.getImageData(0, 0, 1, 1).data;
    if ((a ?? 0) < 3) return "transparent";
    return `${r},${g},${b}`;
  }

  const tokenColor = (name: string) => {
    if (!rootStyle.getPropertyValue(name).trim()) return "";
    return paint(`background-color: var(${name})`, "backgroundColor");
  };

  const allowedFont = [
    "--text-body",
    "--text-small",
    "--text-h1",
    "--text-h2",
    "--text-h3",
    "--text-title-step",
    "--text-404",
    "--text-figure",
    "--text-figure-lg",
  ].map((name) => fontOf(`font-size: var(${name})`));
  // Audit item 13. Figures keep min(token, 30cqi), so the probe has to
  // resolve that expression inside the same container as the figure.
  for (const container of document.querySelectorAll("*")) {
    if (getComputedStyle(container).containerType === "normal") continue;
    for (const name of ["--text-figure", "--text-figure-lg"]) {
      const el = document.createElement("div");
      el.setAttribute("data-token-probe", "");
      el.style.cssText = `position:absolute;font-size:min(var(${name}), 30cqi)`;
      container.append(el);
      allowedFont.push(parseFloat(getComputedStyle(el).fontSize));
      el.remove();
    }
  }
  const allowedRatios = [
    "--leading-body",
    "--text-small--line-height",
    "--leading-title",
    "--leading-copy",
    "--leading-meta",
    "--leading-hero",
    "--leading-figure",
    "--leading-404",
  ].map((name) => {
    const el = probe(`font-size: 16px; line-height: var(${name})`);
    return parseFloat(getComputedStyle(el).lineHeight) / 16;
  });
  const smallType = probe(
    "font-size: var(--text-small); line-height: var(--text-small--line-height)",
  );
  const smallTypeStyle = getComputedStyle(smallType);
  const smallFont = parseFloat(smallTypeStyle.fontSize);
  const smallLine = parseFloat(smallTypeStyle.lineHeight);
  const smallLineRatio =
    Number.isFinite(smallLine) && smallFont ? smallLine / smallFont : null;
  const allowedColors = new Set<string>(["transparent"]);
  for (const name of [
    "--background",
    "--foreground",
    "--muted",
    "--muted-foreground",
    "--border",
    "--card",
    "--accent",
    "--accent-hover",
    "--accent-foreground",
    "--ring",
    "--surface",
    "--border-control",
  ]) {
    const color = tokenColor(name);
    if (color) allowedColors.add(color);
  }

  const offSizes: Array<[string, number]> = [
    ["0.75rem", fontOf("font-size: 0.75rem")],
    ["1.75rem", fontOf("font-size: 1.75rem")],
    ["2.25rem", fontOf("font-size: 2.25rem")],
    ["3rem", fontOf("font-size: 3rem")],
    ["3.75rem", fontOf("font-size: 3.75rem")],
  ];

  const hidden = (el: Element) => {
    if (el.closest(".sr-only, [data-token-probe]")) return true;
    const style = getComputedStyle(el);
    if (style.display === "none" || style.visibility === "hidden") return true;
    if (parseFloat(style.opacity) === 0) return true;
    const box = el.getBoundingClientRect();
    return box.width <= 1 && box.height <= 1;
  };

  const nameOf = (el: Element) => {
    const id = el.id ? `#${el.id}` : "";
    const classes = (el.getAttribute("class") ?? "")
      .split(/\s+/)
      .filter((part) =>
        /^(text-|leading|bg-|border|font-mono|font-display|py-|pt-|pb-|sm:|reveal)/.test(
          part,
        ),
      )
      .slice(0, 5);
    return `${el.tagName}${id}${classes.length ? `.${classes.join(".")}` : ""}`;
  };

  const closeTo = (actual: number, expected: number) =>
    Math.abs(actual - expected) <= 0.75;

  const findings: Finding[] = [];
  const seen = new Set<string>();
  const add = (finding: Finding) => {
    const key = `${finding.kind}|${finding.off}|${finding.name}|${finding.detail}`;
    if (seen.has(key)) return;
    seen.add(key);
    findings.push(finding);
  };

  for (const el of document.querySelectorAll("body *")) {
    if (hidden(el)) continue;
    const style = getComputedStyle(el);
    const font = parseFloat(style.fontSize);
    const line = parseFloat(style.lineHeight);
    const ratio = Number.isFinite(line) && font ? line / font : null;
    const name = nameOf(el);
    if (!allowedFont.some((size) => closeTo(font, size))) {
      const off = offSizes.find(([, size]) => closeTo(font, size))?.[0] ?? "";
      const heroTitle = el.tagName === "H1" && Boolean(el.closest("#top"));
      add({
        audit: heroTitle ? "T1" : "T3",
        kind: "font-size",
        name,
        detail: `${name} font-size ${font.toFixed(1)}px`,
        off,
        ratio: null,
      });
    }
    if (
      ratio != null &&
      !allowedRatios.some((allowed) => Math.abs(ratio - allowed) < 0.02)
    ) {
      add({
        audit: "T3",
        kind: "line-height",
        name,
        detail: `${name} line-height ${ratio.toFixed(3)}`,
        off: "",
        ratio,
      });
    }
    // Panel labels stay on --leading-meta, and .font-mono-label stays the
    // Spec B exception. Every other element at --text-small uses its line height.
    const panelLabel = (el.getAttribute("class") ?? "").includes(
      "--leading-meta",
    );
    const monoLabel = Boolean(el.closest(".font-mono-label"));
    if (
      closeTo(font, smallFont) &&
      !panelLabel &&
      !monoLabel &&
      (smallLineRatio == null ||
        ratio == null ||
        Math.abs(ratio - smallLineRatio) >= 0.02)
    ) {
      add({
        audit: "T3",
        kind: "line-height",
        name,
        detail: `${name} at --text-small line-height ${ratio == null ? "missing" : ratio.toFixed(3)}`,
        off: "text-small",
        ratio,
      });
    }
    const color = normalizeColor(style.color);
    if (!allowedColors.has(color)) {
      add({
        audit: "T5",
        kind: "color",
        name,
        detail: `${name} color ${style.color}`,
        off: "",
        ratio: null,
      });
    }
    const background = normalizeColor(style.backgroundColor);
    if (!allowedColors.has(background)) {
      add({
        audit: "T5",
        kind: "background",
        name,
        detail: `${name} background ${style.backgroundColor}`,
        off: "",
        ratio: null,
      });
    }
    for (const side of ["Top", "Right", "Bottom", "Left"] as const) {
      const width = parseFloat(style[`border${side}Width`]);
      if (width < 1) continue;
      const raw = style[`border${side}Color`];
      const border = normalizeColor(raw);
      if (border === "transparent" || allowedColors.has(border)) continue;
      add({
        audit: "T4",
        kind: "border",
        name,
        detail: `${name} border-${side.toLowerCase()} ${raw}`,
        off: "",
        ratio: null,
      });
    }
  }

  const backdrop = (el: Element) => {
    let node: Element | null = el;
    while (node) {
      const color = normalizeColor(getComputedStyle(node).backgroundColor);
      if (color !== "transparent") return color;
      node = node.parentElement;
    }
    return normalizeColor(getComputedStyle(document.body).backgroundColor);
  };

  const controls: ControlEdge[] = [];
  for (const el of document.querySelectorAll(
    "a, button, input, textarea, select",
  )) {
    if (hidden(el)) continue;
    const style = getComputedStyle(el);
    const width = Math.max(
      parseFloat(style.borderTopWidth),
      parseFloat(style.borderRightWidth),
      parseFloat(style.borderBottomWidth),
      parseFloat(style.borderLeftWidth),
    );
    const border = normalizeColor(style.borderTopColor);
    if (width < 1 || border === "transparent") continue;
    controls.push({
      name:
        el.getAttribute("aria-label") ||
        (el.textContent ?? "").replace(/\s+/g, " ").trim().slice(0, 40),
      border,
      background: backdrop(el),
    });
  }

  const smallControls: SmallControl[] = [];
  for (const el of document.querySelectorAll("a, button")) {
    if (hidden(el)) continue;
    const classes = el.classList;
    const usesSmall =
      classes.contains("text-small") ||
      [...classes].some((part) => part.includes("0.9375rem"));
    if (!usesSmall || !classes.contains("font-medium")) continue;
    const style = getComputedStyle(el);
    const font = parseFloat(style.fontSize);
    const line = parseFloat(style.lineHeight);
    smallControls.push({
      name: (el.textContent ?? "").replace(/\s+/g, " ").trim().slice(0, 40),
      font,
      lineRatio: Number.isFinite(line) && font ? line / font : null,
    });
  }

  const sections: SectionPad[] = [...document.querySelectorAll("section")].map(
    (el) => {
      const style = getComputedStyle(el);
      return {
        id:
          el.id ||
          (el.querySelector("h2")?.textContent ?? "").trim() ||
          "section",
        home: homeSections.has(el.id),
        top: parseFloat(style.paddingTop),
        bottom: parseFloat(style.paddingBottom),
      };
    },
  );

  const measured = {
    textBody: fontOf("font-size: var(--text-body)"),
    remBody: fontOf("font-size: 1.125rem"),
    remSmall: fontOf("font-size: 0.9375rem"),
    textH1: fontOf("font-size: var(--text-h1)"),
    textH2: fontOf("font-size: var(--text-h2)"),
    textH3: fontOf("font-size: var(--text-h3)"),
    remH3: fontOf("font-size: 1.5rem"),
    rem2: fontOf("font-size: 2rem"),
    rem225: fontOf("font-size: 2.25rem"),
    spacing: px(probe("padding-top: var(--spacing-section)"), "paddingTop"),
    surface: tokenColor("--surface"),
    borderControl: tokenColor("--border-control"),
  };
  let css = "";
  for (const sheet of document.styleSheets) {
    try {
      for (const rule of sheet.cssRules) css += rule.cssText;
    } catch {
      continue;
    }
  }
  host.remove();

  const hero = document.querySelector("#top h1");
  return {
    css,
    ...measured,
    textSmall: smallFont,
    smallLineRatio:
      Number.isFinite(smallLine) && smallFont ? smallLine / smallFont : null,
    heroFont: hero ? parseFloat(getComputedStyle(hero).fontSize) : null,
    headingFonts: [...document.querySelectorAll("main h2")]
      .filter((el) => !hidden(el))
      .map((el) => parseFloat(getComputedStyle(el).fontSize)),
    sections,
    controls,
    smallControls,
    findings,
  };
}

function place(
  width: number,
  scale: Scale,
  scheme: Scheme,
  route: string,
): string {
  return `${route} ${width} ${scale}% ${scheme}`;
}

it("keeps built pages on the shared token scale", async () => {
  expect(ROUTES).toHaveLength(6);
  const { origin, close } = await startOutServer();
  const browser = await chromium.launch();
  const lines: string[] = [];
  const rawFindings: Finding[] = [];
  let pages = 0;
  let sawCss = false;

  try {
    const page = await browser.newPage();
    for (const scheme of SCHEMES) {
      for (const width of WIDTHS) {
        for (const scale of SCALES) {
          for (const route of ROUTES) {
            await openSample(page, origin, route, width, scale, scheme);
            const sample = await page.evaluate(collectPage);
            pages += 1;
            lines.push(
              ...contractLines(sample, route, width, scale, scheme, sawCss),
            );
            sawCss = true;
            rawFindings.push(...sample.findings);
          }
        }
      }
    }
  } finally {
    await browser.close();
    await close();
  }

  const hits = new Map(EXCEPTIONS.map((exception) => [exception, 0]));
  for (const finding of rawFindings) {
    const exception = EXCEPTIONS.find((candidate) => candidate.match(finding));
    if (exception) {
      hits.set(exception, (hits.get(exception) ?? 0) + 1);
      continue;
    }
    lines.push(`${finding.audit} ${finding.detail}`);
  }

  const unused = EXCEPTIONS.filter(
    (exception) => (hits.get(exception) ?? 0) === 0,
  ).map((exception) => `${exception.audit} -> ${exception.pr} matched nothing`);
  const unique = new Map<string, number>();
  for (const line of lines) unique.set(line, (unique.get(line) ?? 0) + 1);
  const summary = [...unique.entries()]
    .map(([line, count]) => (count > 1 ? `${line} x${count}` : line))
    .sort()
    .join("\n");
  const report = [
    `checked ${pages} pages`,
    summary ? `failures\n${summary}` : "",
    unused.length ? `unused exceptions\n${unused.join("\n")}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");
  expect(report).toBe(`checked ${pages} pages`);
}, 300_000);

async function openSample(
  page: Page,
  origin: string,
  route: string,
  width: number,
  scale: Scale,
  scheme: Scheme,
) {
  await page.setViewportSize({ width, height: 900 });
  await page.emulateMedia({ colorScheme: scheme, reducedMotion: "reduce" });
  await page.goto(`${origin}${route}`, { waitUntil: "load" });
  await page.waitForFunction((expected) => {
    return document.documentElement.classList.contains(expected);
  }, scheme);
  // Set this after the theme class. next-themes writes colorScheme onto
  // html.style during hydration and drops a font-size set before that.
  await page.evaluate(
    (percent) => {
      document.documentElement.style.fontSize = percent;
    },
    scale === 200 ? "200%" : "",
  );
  // Root percentage font-size updates a frame before inherited font:inherit
  // controls. Wait until body type and the menu button have both caught up.
  const expectedFont =
    scale === 200
      ? { root: "32px", body: "36px" }
      : { root: "16px", body: "18px" };
  await page.waitForFunction((expected) => {
    const rootSize = getComputedStyle(document.documentElement).fontSize;
    const bodySize = getComputedStyle(document.body).fontSize;
    if (rootSize !== expected.root || bodySize !== expected.body) return false;
    const button = document.querySelector(
      'button[aria-label="Open menu"], button[aria-label="Close menu"]',
    );
    if (!button) return true;
    const box = button.getBoundingClientRect();
    if (box.width <= 1 || box.height <= 1) return true;
    return getComputedStyle(button).fontSize === expected.body;
  }, expectedFont);
  await page.evaluate(
    () =>
      new Promise<void>((resolve) => {
        const done = () => requestAnimationFrame(() => resolve());
        if (document.fonts.status === "loaded") {
          done();
          return;
        }
        document.fonts.ready.then(done).catch(done);
      }),
  );
}

function contractLines(
  sample: PageSample,
  route: string,
  width: number,
  scale: Scale,
  scheme: Scheme,
  sawCss: boolean,
): string[] {
  const where = place(width, scale, scheme, route);
  const lines: string[] = [];
  if (!sawCss) {
    if (!sample.css.includes("light-dark(")) {
      lines.push("T6 shipped CSS has no light-dark()");
    }
    if (sample.css.includes("prefers-color-scheme")) {
      lines.push("T6 shipped CSS still has a prefers-color-scheme fallback");
    }
    if (!/color-scheme:\s*light dark/.test(sample.css)) {
      lines.push("T6 shipped CSS does not set color-scheme: light dark");
    }
  }
  for (const control of sample.controls) {
    const ratio = contrast(control.border, control.background);
    if (ratio == null || ratio < 3) {
      lines.push(
        `T4 ${where}: ${control.name} outline ${ratio?.toFixed(2) ?? "n/a"}:1 against ${control.background}`,
      );
    }
  }
  if (route === "/" || route === "/404.html") {
    if (sample.smallControls.length === 0) {
      lines.push(`T3 ${where}: no button uses the small text token`);
    }
    for (const control of sample.smallControls) {
      if (!near(control.font, sample.textSmall)) {
        lines.push(
          `T3 ${where}: ${control.name} is ${control.font}px, not --text-small ${sample.textSmall}px`,
        );
      }
      if (
        sample.smallLineRatio == null ||
        control.lineRatio == null ||
        Math.abs(control.lineRatio - sample.smallLineRatio) > 0.02
      ) {
        lines.push(
          `T3 ${where}: ${control.name} line-height is ${control.lineRatio ?? "missing"}, not --text-small ${sample.smallLineRatio ?? "missing"}`,
        );
      }
    }
  }
  if (route !== "/") return lines.concat(sectionLines(sample, where));

  if (!near(sample.textBody, sample.remBody)) {
    lines.push(
      `T3 ${where}: --text-body ${sample.textBody}px is not 1.125rem ${sample.remBody}px`,
    );
  }
  if (!near(sample.textSmall, sample.remSmall)) {
    lines.push(
      `T3 ${where}: --text-small ${sample.textSmall}px is not 0.9375rem ${sample.remSmall}px`,
    );
  }
  if (sample.smallLineRatio == null) {
    lines.push(`T3 ${where}: --text-small line-height is missing`);
  }
  if (!near(sample.textH3, sample.remH3)) {
    lines.push(
      `T3 ${where}: --text-h3 ${sample.textH3}px is not 1.5rem ${sample.remH3}px`,
    );
  }
  const headingTarget = width < 640 ? sample.rem2 : sample.rem225;
  const headingLabel = width < 640 ? "2rem" : "2.25rem";
  for (const heading of sample.headingFonts) {
    if (!near(heading, headingTarget)) {
      lines.push(
        `T3 ${where}: section heading ${heading}px is not ${headingLabel} ${headingTarget}px`,
      );
    }
    if (!near(sample.textH2, heading)) {
      lines.push(
        `T3 ${where}: --text-h2 ${sample.textH2}px is not the section heading ${heading}px`,
      );
    }
  }
  if (sample.heroFont == null) {
    lines.push(`T1 ${where}: home h1 is missing`);
  } else {
    if (!near(sample.heroFont, sample.textH1)) {
      lines.push(
        `T1 ${where}: hero h1 ${sample.heroFont}px is not --text-h1 ${sample.textH1}px`,
      );
    }
    for (const heading of sample.headingFonts) {
      if (sample.heroFont < heading * 1.25 - 0.75) {
        lines.push(
          `T1 ${where}: hero h1 ${sample.heroFont}px is below 1.25x section heading ${heading}px`,
        );
      }
    }
  }
  if (sample.surface !== SURFACE[scheme]) {
    lines.push(
      `T5 ${where}: --surface ${sample.surface || "missing"} is not ${SURFACE[scheme]}`,
    );
  }
  if (sample.borderControl !== BORDER_CONTROL[scheme]) {
    lines.push(
      `T4 ${where}: --border-control ${sample.borderControl || "missing"} is not ${BORDER_CONTROL[scheme]}`,
    );
  }
  return lines.concat(sectionLines(sample, where));
}

function sectionLines(sample: PageSample, where: string): string[] {
  const lines: string[] = [];
  for (const section of sample.sections) {
    const equal = near(section.top, section.bottom);
    const topToken = near(section.top, sample.spacing);
    const bottomToken = near(section.bottom, sample.spacing);
    const topZero = near(section.top, 0);
    const bottomZero = near(section.bottom, 0);
    if (section.home) {
      if (!topToken || !bottomToken) {
        lines.push(
          `T2 ${where}: #${section.id} padding ${section.top}/${section.bottom} is not --spacing-section ${sample.spacing}`,
        );
      }
      continue;
    }
    const allowed =
      equal && ((topToken && bottomToken) || (topZero && bottomZero));
    if (!allowed) {
      lines.push(
        `T2 ${where}: section ${section.id} padding ${section.top}/${section.bottom} is not --spacing-section ${sample.spacing} or 0`,
      );
    }
  }
  return lines;
}
