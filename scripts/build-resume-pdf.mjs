import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { deflateSync } from "node:zlib";

const TITLE = "Lead, AI Enablement & Factory Strategy";

const INK = [0.0667, 0.0667, 0.0667];
const MUTED = [0.3333, 0.3333, 0.3333];
const RULE = [0.898, 0.898, 0.898];

const PAGE_W = 612;
const PAGE_H = 792;
const LEFT = 50;
const RIGHT = 50;
const TOP = 32;
const BOTTOM = 42;
const WIDTH = PAGE_W - LEFT - RIGHT;

const REGULAR = widths(
  "278 278 355 556 556 889 667 222 333 333 389 584 278 333 278 278 556 556 556 556 556 556 556 556 556 556 278 278 584 584 584 556 1015 667 667 722 722 667 611 778 722 278 500 667 556 833 722 778 667 778 722 667 611 722 667 944 667 667 611 278 278 278 469 556 222 556 556 500 556 556 278 556 556 222 222 500 222 833 556 556 556 556 333 500 278 556 500 722 500 500 500 334 260 334 584",
);
const BOLD = widths(
  "278 333 474 556 556 889 722 278 333 333 389 584 278 333 278 278 556 556 556 556 556 556 556 556 556 556 333 333 584 584 584 611 975 722 722 722 722 667 611 778 722 278 556 722 611 833 722 778 667 778 722 667 611 722 667 944 667 667 611 333 278 333 584 556 278 556 611 556 611 556 333 611 611 278 278 556 278 889 611 611 611 611 389 556 333 611 556 778 556 556 500 389 280 389 584",
);

const resume = {
  name: "Jarrod Tran",
  title: "AI Product & Strategy Leader",
  contact: [
    { text: "Houston, TX" },
    {
      text: "jarrodtran@outlook.com",
      href: "mailto:jarrodtran@outlook.com",
    },
    {
      text: "linkedin.com/in/jarrodtran",
      href: "https://www.linkedin.com/in/jarrodtran/",
    },
    { text: "jarrodtran.com", href: "https://jarrodtran.com" },
    { text: "github.com/jarrodtran", href: "https://github.com/jarrodtran" },
  ],
  summary: [
    "AI product and strategy leader who builds teams, brings AI tools into daily use, and measures their impact. Experience spans capital allocation at Tesla, engineering planning at Waymo, and market entry at Apple.",
  ],
  roles: [
    {
      heading: `Tesla | ${TITLE} | Aug 2023 - Present`,
      note: "Rejoined in 2023 after Apple and Waymo.",
      bullets: [
        "Built and lead an AI product and engineering team that serves 1,000+ active users across 20+ production AI solutions, including RAG troubleshooting, automated reporting, workflow automation, and decision support.",
        "Set the AI roadmap, adoption metrics, and leadership reporting for an enablement program covering 10,000 employees. Modeled roughly 540 hours reclaimed per week and $1.6M in annualized productivity value.",
        "Built Python and Tableau models to rank investments by return. Allocated $23M across 50+ initiatives for $156M in incremental annual profit.",
        "Led the investment roadmap across California, Texas, and Shanghai and scaled Megapack 3.2\u00d7. A separate program delivered $260M in annualized savings.",
        "Mitigated $550M in projected tariff exposure by redesigning the product and investment plan.",
      ],
    },
    {
      heading: "Waymo | Strategy & Operations Manager | Oct 2022 - May 2023",
      bullets: [
        "Led annual planning, OKRs, and quarterly business reviews for Engineering Operations. Turned leadership priorities into resource plans, targets, and milestones.",
        "Aligned six functions on commercial deployment priorities, including safety and regulatory work. Built dashboards for performance, fleet health, and program milestones.",
      ],
    },
    {
      heading:
        "Apple | Strategic Operations Program Manager | Jun 2021 - Jun 2022",
      bullets: [
        "Led the 0-to-1 iPhone launch in India, from market entry and partner qualification through launch readiness and scaled delivery.",
        "Supported 293% year-over-year growth (4.3M to 16.9M units) and a program whose reported revenue grew from $2B to $10B. Expanded exports from 6 to 40+ countries.",
      ],
    },
    {
      heading:
        "Tesla | Program Manager, Special Projects | Jun 2018 - Jun 2021",
      bullets: [
        "Advanced Project Roadrunner, Tesla's 4680 program, from pilot to launch readiness through Battery Day. Led Model 3 and Model Y planning and recovery.",
        "Launched Warehouse on Wheels, a $3.5M per month coordination platform that protected product availability during scale-up.",
      ],
    },
    {
      heading: "Amazon | Operations Area Manager | Mar 2017 - Apr 2018",
      bullets: ["Led 100+ associates in a high-volume fulfillment center."],
    },
  ],
  education:
    "University at Buffalo | B.S. Business Administration, Finance | Cum Laude",
};

function widths(list) {
  const values = list.split(" ").map((value) => Number(value));
  if (
    values.length !== 95 ||
    values.some((value) => !Number.isInteger(value))
  ) {
    throw new Error("Helvetica width table is incomplete");
  }
  return values;
}

const EXTRA_CHARS = new Map([
  ["\u00d7", { byte: 0xd7, width: 584 }],
  ["\u2022", { byte: 0x95, width: 350 }],
]);

function charWidth(char, font) {
  const extra = EXTRA_CHARS.get(char);
  if (extra) return extra.width;
  const code = char.charCodeAt(0);
  if (code < 32 || code > 126) {
    throw new Error(`No width for ${JSON.stringify(char)}`);
  }
  return (font === "bold" ? BOLD : REGULAR)[code - 32];
}

function measure(text, font, size) {
  let units = 0;
  for (const char of text) units += charWidth(char, font);
  return (units / 1000) * size;
}

function wrap(text, font, size, maxWidth) {
  const lines = [];
  let rest = text;
  while (rest) {
    if (measure(rest, font, size) <= maxWidth) {
      lines.push(rest);
      break;
    }
    const words = rest.split(" ");
    let count = 0;
    let line = "";
    for (const word of words) {
      const next = line ? `${line} ${word}` : word;
      if (measure(next, font, size) > maxWidth) break;
      line = next;
      count += 1;
    }
    if (!line) throw new Error(`Word does not fit: ${words[0]}`);
    const sentenceAt = line.lastIndexOf(". ");
    const firstSentence =
      sentenceAt === -1 ? "" : line.slice(0, sentenceAt + 1);
    if (
      firstSentence &&
      measure(firstSentence, font, size) >= maxWidth * 0.62
    ) {
      lines.push(firstSentence);
      rest = rest.slice(firstSentence.length).trimStart();
      continue;
    }
    lines.push(line);
    rest = words.slice(count).join(" ");
  }
  return lines;
}

function pdfString(text) {
  let out = "(";
  for (const char of text) {
    const code = EXTRA_CHARS.get(char)?.byte ?? char.charCodeAt(0);
    if (code === 0x28 || code === 0x29 || code === 0x5c) {
      out += `\\${String.fromCharCode(code)}`;
      continue;
    }
    if ((code >= 32 && code <= 126) || code === 0xd7 || code === 0x95) {
      out += String.fromCharCode(code);
      continue;
    }
    throw new Error(`Cannot encode ${JSON.stringify(char)}`);
  }
  out += ")";
  return out;
}

function drawText(font, size, x, y, text, color) {
  const face = font === "bold" ? "F1" : "F2";
  const [r, g, b] = color;
  return `${r.toFixed(4)} ${g.toFixed(4)} ${b.toFixed(4)} rg\nBT /${face} ${size.toFixed(2)} Tf 1 0 0 1 ${x.toFixed(2)} ${y.toFixed(2)} Tm ${pdfString(text)} Tj ET\n`;
}

function rule(y) {
  const [r, g, b] = RULE;
  return `${r.toFixed(4)} ${g.toFixed(4)} ${b.toFixed(4)} RG\n0.70 w\n${LEFT.toFixed(2)} ${y.toFixed(2)} m ${(PAGE_W - RIGHT).toFixed(2)} ${y.toFixed(2)} l S\n`;
}

function bulletMark(x, baseline) {
  return drawText("regular", 10, x, baseline, "\u2022", INK);
}

function documentBlocks() {
  const blocks = [
    { kind: "name", text: resume.name },
    { kind: "title", text: resume.title },
    { kind: "contact", parts: resume.contact },
    { kind: "section", text: "Summary" },
    ...resume.summary.map((text) => ({ kind: "prose", text })),
    { kind: "section", text: "Experience" },
  ];
  for (const role of resume.roles) {
    blocks.push({ kind: "role", text: role.heading });
    if (role.note) blocks.push({ kind: "note", text: role.note });
    for (const bullet of role.bullets) {
      blocks.push({ kind: "bullet", text: bullet });
    }
  }
  blocks.push({ kind: "section", text: "Education" });
  blocks.push({ kind: "role", text: resume.education });
  return blocks;
}

function assertCopy(blocks) {
  const text = blocks
    .map((block) => block.text ?? "")
    .filter(Boolean)
    .join(" ");
  if (text.includes("\u2014") || text.includes("\u2013")) {
    throw new Error("Resume copy contains an em dash or an en dash");
  }
  const stripped = text.split(TITLE).join(" ");
  for (const token of ["factory", "manufacturing", "supplier", "logistics"]) {
    if (stripped.toLowerCase().includes(token)) {
      throw new Error(`Resume copy uses ${token}`);
    }
  }
  const sentences = text.split(/(?<=\.)\s+/);
  for (const sentence of sentences) {
    if (sentence.includes("$23M") && sentence.includes("$260M")) {
      throw new Error("Annualized savings is tied to the $23M portfolio");
    }
    if (sentence.includes("$156M") && sentence.includes("$260M")) {
      throw new Error("Profit and savings share a sentence");
    }
  }
  if (
    !text.includes(
      "Allocated $23M across 50+ initiatives for $156M in incremental annual profit.",
    ) ||
    !text.includes("A separate program delivered $260M in annualized savings.")
  ) {
    throw new Error("The two money results are not both stated");
  }
}

const styles = {
  name: {
    font: "bold",
    size: 25,
    leading: 29,
    color: INK,
    gapBefore: 0,
    gapAfter: 4,
  },
  title: {
    font: "regular",
    size: 11,
    leading: 14,
    color: INK,
    gapBefore: 0,
    gapAfter: 3,
  },
  section: {
    font: "bold",
    size: 12,
    leading: 15,
    color: INK,
    gapBefore: 10,
    gapAfter: 3,
  },
  prose: {
    font: "regular",
    size: 10.5,
    leading: 14,
    color: INK,
    gapBefore: 0,
    gapAfter: 0,
  },
  role: {
    font: "bold",
    size: 10.5,
    leading: 14,
    color: INK,
    gapBefore: 7,
    gapAfter: 2,
  },
  note: {
    font: "regular",
    size: 9,
    leading: 12,
    color: MUTED,
    gapBefore: 0,
    gapAfter: 1,
  },
  bullet: {
    font: "regular",
    size: 10.5,
    leading: 13.5,
    color: INK,
    gapBefore: 0,
    gapAfter: 2,
  },
};

function render(blocks) {
  assertCopy(blocks);
  let y = PAGE_H - TOP;
  const ops = [];
  const links = [];

  function place(lines, style, x) {
    for (const line of lines) {
      y -= style.leading;
      if (y < BOTTOM)
        throw new Error(`Resume overflows the page near: ${line}`);
      ops.push(drawText(style.font, style.size, x, y, line, style.color));
    }
  }

  for (const block of blocks) {
    switch (block.kind) {
      case "name":
      case "title":
      case "section":
      case "prose":
      case "role":
      case "note": {
        const style = styles[block.kind];
        y -= style.gapBefore;
        const lines = wrap(block.text, style.font, style.size, WIDTH);
        if (block.kind !== "prose" && lines.length !== 1) {
          throw new Error(
            `${block.kind} does not fit on one line: ${block.text}`,
          );
        }
        place(lines, style, LEFT);
        y -= style.gapAfter;
        break;
      }
      case "contact": {
        const size = 9;
        const sep = "  |  ";
        const full = block.parts.map((part) => part.text).join(sep);
        if (measure(full, "regular", size) > WIDTH) {
          throw new Error("Contact line does not fit");
        }
        y -= 12;
        if (y < BOTTOM)
          throw new Error("Resume overflows the page on the contact line");
        let x = LEFT;
        block.parts.forEach((part, index) => {
          if (index > 0) {
            ops.push(drawText("regular", size, x, y, sep, MUTED));
            x += measure(sep, "regular", size);
          }
          const partWidth = measure(part.text, "regular", size);
          ops.push(drawText("regular", size, x, y, part.text, MUTED));
          if (part.href) {
            links.push({
              href: part.href,
              rect: [x, y - 1.5, x + partWidth, y + size * 0.8],
            });
          }
          x += partWidth;
        });
        y -= 7;
        ops.push(rule(y));
        y -= 2;
        break;
      }
      case "bullet": {
        const style = styles.bullet;
        const indent = 13;
        const lines = wrap(block.text, style.font, style.size, WIDTH - indent);
        lines.forEach((line, index) => {
          y -= style.leading;
          if (y < BOTTOM)
            throw new Error(`Resume overflows the page near: ${line}`);
          if (index === 0) ops.push(bulletMark(LEFT, y));
          ops.push(
            drawText(
              style.font,
              style.size,
              LEFT + indent,
              y,
              line,
              style.color,
            ),
          );
        });
        y -= style.gapAfter;
        break;
      }
      default: {
        const unreachable = block.kind;
        throw new Error(`Unhandled block ${unreachable}`);
      }
    }
  }

  return { stream: ops.join(""), links, bottom: y };
}

function annot(link) {
  const [x1, y1, x2, y2] = link.rect.map((value) => value.toFixed(2));
  return `<< /Type /Annot /Subtype /Link /Rect [${x1} ${y1} ${x2} ${y2}] /Border [0 0 0] /A << /Type /Action /S /URI /URI ${pdfString(link.href)} >> >>`;
}

function assemble(stream, links) {
  // Store the short stream in a zlib wrapper without compression so the bytes
  // remain stable across Node runtimes that bundle different deflate encoders.
  const compressed = deflateSync(Buffer.from(stream, "latin1"), { level: 0 });
  const font = (base) =>
    `<< /Type /Font /Subtype /Type1 /BaseFont /${base} /Encoding /WinAnsiEncoding >>`;
  const annots = links.length ? ` /Annots [${links.map(annot).join(" ")}]` : "";
  const objects = [
    null,
    "<< /Type /Catalog /Pages 2 0 R /OpenAction [3 0 R /FitH null] >>",
    "<< /Type /Pages /Count 1 /Kids [3 0 R] >>",
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources 5 0 R${annots} >>`,
    `<< /Filter /FlateDecode /Length ${compressed.length} >>\nstream\n`,
    "<< /Font << /F1 6 0 R /F2 7 0 R >> >>",
    font("Helvetica-Bold"),
    font("Helvetica"),
    "<< /Title (Jarrod Tran) /Author (Jarrod Tran) >>",
  ];

  let body = "%PDF-1.3\n";
  const offsets = [0];
  for (let id = 1; id < objects.length; id += 1) {
    offsets.push(Buffer.byteLength(body, "latin1"));
    if (id === 4) {
      body += `4 0 obj\n${objects[4]}`;
      body += compressed.toString("latin1");
      body += "\nendstream\nendobj\n";
      continue;
    }
    body += `${id} 0 obj\n${objects[id]}\nendobj\n`;
  }

  const xrefAt = Buffer.byteLength(body, "latin1");
  let xref = `xref\n0 ${objects.length}\n0000000000 65535 f \n`;
  for (let id = 1; id < objects.length; id += 1) {
    xref += `${String(offsets[id]).padStart(10, "0")} 00000 n \n`;
  }
  xref += `trailer\n<< /Size ${objects.length} /Root 1 0 R /Info 8 0 R >>\nstartxref\n${xrefAt}\n%%EOF\n`;
  return Buffer.from(body + xref, "latin1");
}

export function buildResumePdf() {
  const { stream, links } = render(documentBlocks());
  return assemble(stream, links);
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const target = process.argv[2] ?? "public/resume.pdf";
  const blocks = documentBlocks();
  const { bottom } = render(blocks);
  const pdf = buildResumePdf();
  writeFileSync(target, pdf);
  console.error(
    `wrote ${target} (${pdf.length} bytes), bottom ${bottom.toFixed(1)}`,
  );
}
