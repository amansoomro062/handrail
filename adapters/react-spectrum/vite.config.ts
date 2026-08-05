import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const here = dirname(fileURLToPath(import.meta.url));

function resolvedVersion(pkg: string): string {
  for (const base of [here, join(here, "..", ".."), process.cwd()]) {
    try {
      const path = join(base, "node_modules", ...pkg.split("/"), "package.json");
      return JSON.parse(readFileSync(path, "utf8")).version as string;
    } catch {
      continue;
    }
  }
  return "unknown";
}

/**
 * Derived from this adapter's own dependencies rather than hand-maintained.
 * See the note in adapters/radix/vite.config.ts, the hand-written list went
 * stale twice, producing results that named the wrong library's version.
 */
const EXCLUDED = new Set(["react", "react-dom"]);

function librariesUnderTest(): Record<string, string> {
  const manifest = JSON.parse(readFileSync(join(here, "package.json"), "utf8"));
  const versions: Record<string, string> = {};
  for (const name of Object.keys(manifest.dependencies ?? {})) {
    if (name.startsWith("@railing/") || EXCLUDED.has(name)) continue;
    versions[name] = resolvedVersion(name);
  }
  return versions;
}

const LIBRARY_VERSIONS = librariesUnderTest();

export default defineConfig({
  plugins: [react()],
  define: {
    __RAILING_LIBRARY_VERSIONS__: JSON.stringify(LIBRARY_VERSIONS),
  },
  server: { port: 5181, strictPort: true },
  preview: { port: 5181, strictPort: true },
});
