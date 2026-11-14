// Refreshes content/writing-feed.xml from the live Substack feed.
// Run `pnpm sync:writing` after publishing, then commit the file. Builds fall
// back to this snapshot when Substack refuses the CI request.
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const root = new URL("../", import.meta.url);
const source = readFileSync(new URL("content/site.ts", root), "utf8");
const base = source.match(/substack:\s*{[^}]*?url:\s*"([^"]+)"/s)?.[1];
if (!base) {
  console.error("sync:writing: could not find site.substack.url");
  process.exit(1);
}
const feedUrl = `${base.replace(/\/+$/, "")}/feed`;
const target = new URL("content/writing-feed.xml", root);

const response = await fetch(feedUrl, {
  headers: {
    "User-Agent":
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
    Accept: "application/rss+xml, application/xml;q=0.9, */*;q=0.8",
  },
  signal: AbortSignal.timeout(15_000),
}).catch((error) => {
  console.error(`sync:writing: ${error.message}`);
  process.exit(1);
});
if (!response.ok) {
  console.error(`sync:writing: HTTP ${response.status} from ${feedUrl}`);
  process.exit(1);
}
const xml = await response.text();
if (!/<(rss|feed)\b/i.test(xml)) {
  console.error("sync:writing: response is not a feed, snapshot unchanged");
  process.exit(1);
}
writeFileSync(target, xml);
const items = (xml.match(/<item\b/gi) ?? []).length;
console.log(
  `sync:writing: wrote ${fileURLToPath(target)} (${items} post${items === 1 ? "" : "s"}). Commit it.`,
);
