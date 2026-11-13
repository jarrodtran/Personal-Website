import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";

const { scripts } = JSON.parse(
  readFileSync(new URL("../package.json", import.meta.url), "utf8"),
);
const exportChecks = Object.keys(scripts).filter((name) =>
  name.startsWith("test:"),
);
const steps = [
  ["audit", "--prod", "--audit-level", "high"],
  ["lint"],
  ["check"],
  ["test"],
  ["build"],
  ...exportChecks.map((name) => [name]),
  ["a11y"],
  ["size"],
];

const env = { ...process.env, BASE_PATH: "" };
delete env.WRITING_FIXTURE_EXPORT;
delete env.WRITING_FEED_PATH;

for (const args of steps) {
  const { error, status } = spawnSync("pnpm", args, { env, stdio: "inherit" });
  if (error) throw error;
  if (status !== 0) process.exit(status ?? 1);
}
