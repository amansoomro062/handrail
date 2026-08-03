import type { RunResult } from "./types.js";
import { formatScore, scoreRun } from "./score.js";

const GLYPH = {
  pass: "PASS",
  fail: "FAIL",
  "not-applicable": "N/A ",
  error: "ERR ",
} as const;

/**
 * Terminal summary.
 *
 * Failures print expected and actual, because "assertion failed" tells a
 * maintainer nothing and a result they cannot act on is a result they will
 * dismiss.
 */
export function renderTerminal(result: RunResult): string {
  const lines: string[] = [];
  const s = scoreRun(result);
  const versions = Object.entries(result.target.versions)
    .map(([name, version]) => `${name}@${version}`)
    .join(", ");

  lines.push("");
  lines.push(`  ${result.target.id} · ${result.component}`);
  lines.push(`  ${versions || "no versions reported"}`);
  lines.push("");

  if (result.harnessError) {
    lines.push(`  HARNESS ERROR — not scored`);
    lines.push(`  ${result.harnessError}`);
    lines.push("");
    return lines.join("\n");
  }

  for (const a of result.assertions) {
    lines.push(`  ${GLYPH[a.status]}  ${a.id}  (${a.severity})`);
    if (a.status === "fail") {
      if (a.detail) lines.push(`        ${a.detail}`);
      if (a.expected) lines.push(`        expected: ${a.expected}`);
      if (a.actual) lines.push(`        actual:   ${a.actual}`);
      if (a.refs.wcag) lines.push(`        wcag:     ${a.refs.wcag}`);
    }
    if (a.status === "error") lines.push(`        ${a.error}`);
    if (a.status === "not-applicable") lines.push(`        ${a.reason}`);
  }

  lines.push("");
  lines.push(
    `  ${formatScore(s)}  ·  ${s.counts.pass} passed, ${s.counts.fail} failed` +
      (s.counts["not-applicable"] ? `, ${s.counts["not-applicable"]} n/a` : "") +
      (s.counts.error ? `, ${s.counts.error} errored` : ""),
  );
  if (s.blockersFailed > 0) {
    lines.push(`  ${s.blockersFailed} blocker(s) failed — the score alone understates this.`);
  }
  lines.push("");
  lines.push("  A high score means no violations were detected by automated testing.");
  lines.push("  It does not mean the component is accessible. See docs/SCORING.md.");
  lines.push("");

  return lines.join("\n");
}

/** Markdown summary, for PR comments and the site. */
export function renderMarkdown(result: RunResult): string {
  const s = scoreRun(result);
  const lines: string[] = [];

  lines.push(`### ${result.target.id} — ${result.component}`);
  lines.push("");
  lines.push(`**${formatScore(s)}** · ${s.counts.pass} passed, ${s.counts.fail} failed` +
    (s.blockersFailed ? ` · **${s.blockersFailed} blocker(s)**` : ""));
  lines.push("");

  const failures = result.assertions.filter((a) => a.status === "fail");
  if (failures.length === 0) {
    lines.push("No violations detected.");
  } else {
    lines.push("| Assertion | Severity | Expected | Actual | Reference |");
    lines.push("| --- | --- | --- | --- | --- |");
    for (const a of failures) {
      const ref = a.refs.wcag ? `[${a.refs.wcag}](${a.refs.wcagUrl ?? a.refs.apg ?? ""})` : "APG";
      lines.push(
        `| \`${a.id}\` | ${a.severity} | ${a.expected ?? "—"} | ${a.actual ?? "—"} | ${ref} |`,
      );
    }
  }

  lines.push("");
  lines.push(
    "_A high score means no violations were detected by automated testing. It does not mean the component is accessible._",
  );
  return lines.join("\n");
}

/** shields.io endpoint payload. This is the growth loop — see docs/LAUNCH.md. */
export function renderBadge(result: RunResult): Record<string, unknown> {
  const s = scoreRun(result);
  const value = s.value;
  const colour =
    value === null ? "lightgrey" : s.blockersFailed > 0 ? "red" : value >= 95 ? "brightgreen" : value >= 80 ? "yellow" : "orange";

  return {
    schemaVersion: 1,
    label: `a11y: ${result.component}`,
    message: value === null ? "n/a" : `${value.toFixed(0)}%`,
    color: colour,
  };
}
