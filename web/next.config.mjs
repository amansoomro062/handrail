/**
 * Static export. The site is a build artefact with no server behind it, which
 * is what lets anyone reproduce it from a clone and get the same pages.
 *
 * The site is served from the apex of railing.dev, so there is no path
 * prefix. Set RAILING_BASE_PATH to "/railing" to build for the bare
 * github.io address instead, which is what the URLs fall back to if the domain
 * ever lapses.
 */
const basePath = process.env.RAILING_BASE_PATH ?? "";

/** @type {import('next').NextConfig} */
export default {
  output: "export",
  /* The workspace packages ship TypeScript source and import each other with
     explicit .js extensions, which is correct for node's ESM resolver and
     meaningless to a bundler. Both settings below are needed: one to compile
     them at all, one to map the extension back to the file that exists. */
  transpilePackages: ["@railing/spec", "@railing/report", "@railing/markdown"],
  webpack: (config) => {
    // Turbopack has no equivalent of this, which is why the build runs on
    // webpack: it is the only resolver that will follow a ".js" specifier to
    // the ".ts" file that actually exists.
    config.resolve.extensionAlias = { ".js": [".ts", ".tsx", ".js"] };
    return config;
  },
  basePath,
  trailingSlash: true,
  images: { unoptimized: true },
  env: { RAILING_BASE_PATH: basePath },
};
