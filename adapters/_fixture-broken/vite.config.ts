import type { Connect, Plugin } from "vite";
import { defineConfig } from "vite";

/**
 * Serve `/harness/<component>` from `harness/<component>/index.html`.
 *
 * The React adapters lean on Vite's SPA fallback and route in the browser. This
 * one uses real files per route instead, deliberately: between them the two
 * approaches demonstrate that the protocol only specifies what must be served at
 * a URL, not how the adapter produces it.
 */
function harnessRoutes(): Plugin {
  const rewrite: Connect.NextHandleFunction = (req, _res, next) => {
    const match = req.url?.match(/^\/harness\/([a-z0-9-]+)\/?(\?.*)?$/);
    if (match) req.url = `/harness/${match[1]}/index.html`;
    next();
  };
  return {
    name: "handrail-harness-routes",
    // Called before Vite's internal middlewares, so the rewrite lands first.
    configureServer: (server) => {
      server.middlewares.use(rewrite);
    },
    configurePreviewServer: (server) => {
      server.middlewares.use(rewrite);
    },
  };
}

export default defineConfig({
  plugins: [harnessRoutes()],
  server: { port: 5199, strictPort: true },
  preview: { port: 5199, strictPort: true },
  build: {
    rollupOptions: {
      input: {
        dialog: "harness/dialog/index.html",
        combobox: "harness/combobox/index.html",
      },
    },
  },
});
