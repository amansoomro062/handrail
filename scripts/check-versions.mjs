#!/usr/bin/env node
/**
 * Verify that every version claim in this repository agrees with every other.
 *
 * A published conformance score names a version. If the repository declares a
 * range, a reader who clones it next month installs something different and
 * cannot reproduce the number — which would make "reproducible" a false claim
 * in our own README rather than a property of the project.
 *
 * This closes the loop across four places a version appears:
 *
 *   pnpm-workspace.yaml (catalog)  ->  what we say we test
 *   node_modules                   ->  what is actually installed
 *   targets.json                   ->  what the index claims to cover
 *   results/*.json                 ->  what a published score refers to
 *
 * Exits non-zero on any disagreement. Wire it into CI before publishing.
 */

import { readFileSync, existsSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const problems = [];
const notes = [];

const fail = (message) => problems.push(message);
const note = (message) => notes.push(message);

/* ------------------------------------------------------------------ *
 * Load the declarations
 * ------------------------------------------------------------------ */

const workspace = parse(readFileSync(join(root, "pnpm-workspace.yaml"), "utf8"));
const sharedCatalog = workspace.catalog ?? {};
const subjects = workspace.catalogs?.subjects ?? {};
const targets = JSON.parse(readFileSync(join(root, "targets.json"), "utf8")).targets;

const EXACT = /^\d+\.\d+\.\d+(?:-[\w.]+)?$/;

/** Versions that can change a measured result must be pinned exactly. */
const MEASUREMENT_CRITICAL = ["react", "react-dom", "playwright", "playwright-core"];

function installedVersion(fromDir, pkg) {
  for (const base of [fromDir, root]) {
    const manifest = join(base, "node_modules", ...pkg.split("/"), "package.json");
    if (existsSync(manifest)) {
      return JSON.parse(readFileSync(manifest, "utf8")).version;
    }
  }
  return null;
}

/* ------------------------------------------------------------------ *
 * 1. Every subject library is pinned exactly
 * ------------------------------------------------------------------ */

for (const [pkg, version] of Object.entries(subjects)) {
  if (!EXACT.test(version)) {
    fail(
      `subjects catalog: "${pkg}" is "${version}", which is a range.\n` +
        `      A score that names a range cannot be reproduced. Pin it exactly.`,
    );
  }
}

/* ------------------------------------------------------------------ *
 * 2. Measurement-critical shared deps are pinned exactly
 * ------------------------------------------------------------------ */

for (const pkg of MEASUREMENT_CRITICAL) {
  const version = sharedCatalog[pkg];
  if (version === undefined) {
    fail(`catalog: "${pkg}" affects measured behaviour but is not in the catalog.`);
  } else if (!EXACT.test(version)) {
    fail(
      `catalog: "${pkg}" is "${version}", which is a range.\n` +
        `      It affects measured behaviour, so every adapter must render on the same one.`,
    );
  }
}

/* ------------------------------------------------------------------ *
 * 3. No manifest re-declares a version outside the catalog
 * ------------------------------------------------------------------ */

const manifests = [
  "package.json",
  ...readdirSync(join(root, "packages")).map((d) => `packages/${d}/package.json`),
  ...readdirSync(join(root, "adapters")).map((d) => `adapters/${d}/package.json`),
].filter((p) => existsSync(join(root, p)));

const catalogued = new Set([...Object.keys(sharedCatalog), ...Object.keys(subjects)]);

for (const relative of manifests) {
  const pkg = JSON.parse(readFileSync(join(root, relative), "utf8"));
  for (const group of ["dependencies", "devDependencies"]) {
    for (const [name, spec] of Object.entries(pkg[group] ?? {})) {
      if (spec.startsWith("workspace:") || spec.startsWith("catalog:")) continue;
      if (catalogued.has(name)) {
        fail(
          `${relative}: "${name}" is "${spec}" but is catalogued.\n` +
            `      Use "catalog:" so there is one declaration, not two that can drift.`,
        );
      } else {
        note(`${relative}: "${name}" is "${spec}" and not catalogued`);
      }
    }
  }
}

/* ------------------------------------------------------------------ *
 * 4. Installed matches the pin, and every adapter shares one React
 * ------------------------------------------------------------------ */

const reactVersions = new Map();

for (const dir of readdirSync(join(root, "adapters"))) {
  const adapterDir = join(root, "adapters", dir);
  if (!existsSync(join(adapterDir, "package.json"))) continue;

  for (const [pkg, pinned] of Object.entries(subjects)) {
    const manifest = JSON.parse(readFileSync(join(adapterDir, "package.json"), "utf8"));
    const uses = manifest.dependencies?.[pkg] ?? manifest.devDependencies?.[pkg];
    if (!uses) continue;
    const actual = installedVersion(adapterDir, pkg);
    if (actual === null) {
      fail(`adapters/${dir}: "${pkg}" is declared but not installed. Run pnpm install.`);
    } else if (actual !== pinned) {
      fail(
        `adapters/${dir}: "${pkg}" is pinned to ${pinned} but ${actual} is installed.\n` +
          `      Any result produced here would name a version that was not tested.`,
      );
    }
  }

  const react = installedVersion(adapterDir, "react");
  if (react) reactVersions.set(`adapters/${dir}`, react);
}

if (new Set(reactVersions.values()).size > 1) {
  fail(
    `Adapters are running different React versions:\n` +
      [...reactVersions].map(([d, v]) => `        ${d}: ${v}`).join("\n") +
      `\n      A difference between two libraries would no longer be attributable to the libraries.`,
  );
}

/* ------------------------------------------------------------------ *
 * 5. Every covered target's packages are catalogued
 * ------------------------------------------------------------------ */

for (const target of targets) {
  if (target.status === "planned") continue;
  const adapterDir = join(root, "adapters", target.id);
  if (!existsSync(adapterDir)) {
    fail(`targets.json: "${target.id}" has status "${target.status}" but adapters/${target.id} does not exist.`);
    continue;
  }
  for (const pkg of target.packages ?? []) {
    const manifest = JSON.parse(readFileSync(join(adapterDir, "package.json"), "utf8"));
    const declared = manifest.dependencies?.[pkg] ?? manifest.devDependencies?.[pkg];
    if (!declared) continue; // Adapter may not cover every package yet.
    if (!(pkg in subjects)) {
      fail(`targets.json: "${target.id}" tests "${pkg}", which is not in the subjects catalog.`);
    }
  }
}

/* ------------------------------------------------------------------ *
 * 6. Published results name versions that are still installed
 * ------------------------------------------------------------------ */

const resultsDir = join(root, "results");
if (existsSync(resultsDir)) {
  for (const file of readdirSync(resultsDir).filter((f) => f.endsWith(".json"))) {
    const result = JSON.parse(readFileSync(join(resultsDir, file), "utf8"));
    for (const [pkg, version] of Object.entries(result.target?.versions ?? {})) {
      if (!(pkg in subjects)) continue;
      if (subjects[pkg] !== version) {
        fail(
          `results/${file}: reports ${pkg}@${version} but the catalog pins ${subjects[pkg]}.\n` +
            `      The result is stale — re-run it before publishing, or it describes a version nobody can install.`,
        );
      }
    }
  }
}

/* ------------------------------------------------------------------ *
 * 7. Results name every subject library their adapter depends on
 * ------------------------------------------------------------------ */

// The adapter reports its versions from one place, so a result that omits a
// package the adapter depends on means that reporting has gone stale. This
// happened twice with a hand-maintained list, and it is undetectable
// downstream: the result looks complete and simply names the wrong library.
if (existsSync(resultsDir)) {
  for (const file of readdirSync(resultsDir).filter((f) => f.endsWith(".json"))) {
    const result = JSON.parse(readFileSync(join(resultsDir, file), "utf8"));
    const targetId = result.target?.id;
    const adapterManifest = join(root, "adapters", targetId ?? "", "package.json");
    if (!targetId || !existsSync(adapterManifest)) continue;
    if (result.harnessError) continue;

    const manifest = JSON.parse(readFileSync(adapterManifest, "utf8"));
    const expected = Object.keys(manifest.dependencies ?? {}).filter((name) => name in subjects);
    const reported = Object.keys(result.target?.versions ?? {});
    const missing = expected.filter((name) => !reported.includes(name));

    if (missing.length > 0) {
      fail(
        `results/${file}: does not report ${missing.join(", ")}, which adapters/${targetId} depends on.\n` +
          `      Version reporting has gone stale — the result names the wrong library.`,
      );
    }
  }
}

/* ------------------------------------------------------------------ *
 * Report
 * ------------------------------------------------------------------ */

console.log("");
console.log("  Libraries under test");
for (const [pkg, version] of Object.entries(subjects)) {
  console.log(`    ${pkg.padEnd(30)} ${version}`);
}
console.log("");
console.log("  Pinned because they affect measurement");
for (const pkg of MEASUREMENT_CRITICAL) {
  console.log(`    ${pkg.padEnd(30)} ${sharedCatalog[pkg] ?? "MISSING"}`);
}
console.log("");

if (notes.length > 0 && process.env.VERBOSE) {
  console.log("  Uncatalogued (allowed):");
  for (const n of notes) console.log(`    ${n}`);
  console.log("");
}

if (problems.length === 0) {
  console.log("  Versions are consistent across catalog, node_modules, targets and results.");
  console.log("");
  process.exit(0);
}

console.error(`  ${problems.length} version problem(s):\n`);
for (const problem of problems) console.error(`    - ${problem}\n`);
process.exit(1);
