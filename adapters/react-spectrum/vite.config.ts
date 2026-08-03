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

const LIBRARY_VERSIONS = {
  "@adobe/react-spectrum": resolvedVersion("@adobe/react-spectrum"),
};

export default defineConfig({
  plugins: [react()],
  define: {
    __HANDRAIL_LIBRARY_VERSIONS__: JSON.stringify(LIBRARY_VERSIONS),
  },
  server: { port: 5181, strictPort: true },
  preview: { port: 5181, strictPort: true },
});
