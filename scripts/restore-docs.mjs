#!/usr/bin/env node
/**
 * Puts the unredacted documentation back.
 *
 * Named findings are withheld from DECISIONS.md, PLAN.md, README.md and
 * targets.json until every maintainer has had the notice period that decision
 * 004 gives them. The full text is kept untracked in docs/.unredacted and
 * restored by this script once that is done.
 *
 * Run it only when every subject library in targets.json has a notifiedOn date
 * at least 14 days old. It checks, and refuses otherwise.
 */
import { copyFileSync, existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const held = join(root, "docs", ".unredacted");

if (!existsSync(held)) {
  console.error("  Nothing held back at docs/.unredacted");
  process.exit(1);
}

const targets = JSON.parse(readFileSync(join(root, "targets.json"), "utf8")).targets;
const pending = targets
  .filter((t) => t.status !== "planned")
  .filter((t) => {
    if (!t.notifiedOn) return true;
    return (Date.now() - Date.parse(t.notifiedOn)) / 86_400_000 < 14;
  })
  .map((t) => t.name);

if (pending.length > 0) {
  console.error("  Still inside the notice period, or not yet notified:");
  for (const name of pending) console.error(`    ${name}`);
  console.error("\n  Refusing to restore. See docs/DECISIONS.md 004.");
  process.exit(1);
}

for (const file of readdirSync(held)) {
  const to = file === "DECISIONS.md" || file === "PLAN.md" ? join(root, "docs", file) : join(root, file);
  copyFileSync(join(held, file), to);
  console.log(`  restored ${file}`);
}
console.log("\n  Re-run pnpm site:build to publish the results too.");
