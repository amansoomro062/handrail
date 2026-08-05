/**
 * A page generated from a file in docs/.
 *
 * Nothing here restates a document in different words: two copies of the
 * scoring rules would eventually disagree, and the site would be the one that
 * was wrong. What this adds is framing and a link to the source so a reader
 * can check it.
 */

import { renderMarkdown, slug, escapeHtml } from "@railing/markdown";
import { REPO } from "@/components/chrome";

/** Repo-relative doc paths that have a page of their own here. */
const PAGES: Record<string, string> = {
  "ARCHITECTURE.md": "/method",
  "SCORING.md": "/scoring",
  "ADAPTERS.md": "/contribute",
  "HARNESS-PROTOCOL.md": "/protocol",
  "DISCLOSURE.md": "/disclosure",
  "DECISIONS.md": "/decisions",
};

/**
 * The docs link to each other by repo-relative path, which resolves for a
 * reader on GitHub and 404s for a reader here. Anything without a page of its
 * own falls back to the file on GitHub rather than breaking.
 */
/**
 * next/link prefixes basePath for us. This markup is injected as raw HTML, so
 * nothing does it here and an absolute path would 404 on GitHub Pages.
 */
const BASE = process.env.RAILING_BASE_PATH ?? "";

export function resolveLink(href: string): string {
  if (/^(https?:|#|mailto:)/.test(href)) return href;
  const [pathPart, hash] = href.split("#");
  const clean = (pathPart ?? "").replace(/^\.\//, "");
  const file = clean.split("/").pop() ?? "";
  const suffix = hash ? `#${hash}` : "";

  if (PAGES[file] && !clean.startsWith("../")) return `${BASE}${PAGES[file]}${suffix}`;
  const repoPath = clean.startsWith("../") ? clean.replace(/^\.\.\//, "") : `docs/${clean}`;
  const kind = /\.\w+$/.test(repoPath) ? "blob" : "tree";
  return `${REPO}/${kind}/main/${repoPath}${suffix}`;
}

function Contents({ markdown }: { markdown: string }) {
  const items = [...markdown.matchAll(/^##\s+(.+)$/gm)].map((m) => (m[1] as string).trim());
  if (items.length < 3) return null;
  return (
    <nav className="toc" aria-labelledby="toc-h">
      <p className="toc__h" id="toc-h">
        On this page
      </p>
      <ol>
        {items.map((t) => (
          <li key={t}>
            <a href={`#${slug(t)}`}>{t}</a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

export interface DocPageProps {
  eyebrow: string;
  title: string;
  lede: string;
  markdown: string;
  sourcePath: string;
  children?: React.ReactNode;
}

export function DocPage({ eyebrow, title, lede, markdown, sourcePath, children }: DocPageProps) {
  const html = renderMarkdown(markdown, { dropTitle: true, resolveLink });
  return (
    <>
      <div className="pagehead">
        <p className="eyebrow eyebrow--ink">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="lede">{lede}</p>
      </div>
      {children}
      <Contents markdown={markdown} />
      <div className="prose" dangerouslySetInnerHTML={{ __html: html }} />
      <p className="srcnote">
        This page is generated from{" "}
        <a href={`${REPO}/blob/main/${sourcePath}`} rel="noopener">
          <code>{escapeHtml(sourcePath)}</code>
        </a>{" "}
        in the repository. If the two ever disagree, the repository is right.
      </p>
    </>
  );
}
