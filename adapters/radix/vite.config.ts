import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const here = dirname(fileURLToPath(import.meta.url));

/**
 * Read the *resolved* version from node_modules rather than the semver range in
 * package.json. A result that cannot name the exact version it tested is not
 * reproducible, and reproducibility is the only thing making these numbers
 * worth publishing.
 */
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
 * Derive the versions under test from this adapter's own dependencies.
 *
 * This was a hand-maintained list, and it silently went stale twice — adding a
 * component meant adding a package, and forgetting to add it here produced
 * results that named the wrong library's version. A result that misnames what
 * it tested is worse than no result, and nothing downstream can detect it.
 *
 * Everything that is not workspace tooling or the shared React runtime is, by
 * definition, a library under test.
 */
const EXCLUDED = new Set(["react", "react-dom"]);

function librariesUnderTest(): Record<string, string> {
  const manifest = JSON.parse(readFileSync(join(here, "package.json"), "utf8"));
  const versions: Record<string, string> = {};
  for (const name of Object.keys(manifest.dependencies ?? {})) {
    if (name.startsWith("@handrail/") || EXCLUDED.has(name)) continue;
    versions[name] = resolvedVersion(name);
  }
  return versions;
}

const LIBRARY_VERSIONS = librariesUnderTest();

export default defineConfig({
  plugins: [react()],
  define: {
    __HANDRAIL_LIBRARY_VERSIONS__: JSON.stringify(LIBRARY_VERSIONS),
  },
  server: { port: 5180, strictPort: true },
  preview: { port: 5180, strictPort: true },
});
