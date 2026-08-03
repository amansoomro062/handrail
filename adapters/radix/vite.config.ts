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

const LIBRARY_VERSIONS = {
  "@radix-ui/react-dialog": resolvedVersion("@radix-ui/react-dialog"),
};

export default defineConfig({
  plugins: [react()],
  define: {
    __CURBCUT_LIBRARY_VERSIONS__: JSON.stringify(LIBRARY_VERSIONS),
  },
  server: { port: 5180, strictPort: true },
  preview: { port: 5180, strictPort: true },
});
