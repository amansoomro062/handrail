/**
 * The chrome every page wears: mark, nav, footer.
 *
 * Kept in one file because the three share the logo and the link list, and a
 * second copy of either is how a nav ends up disagreeing with a footer.
 */

import Link from "next/link";

export const REPO = "https://github.com/amansoomro062/railing";

/**
 * A railing: top rail, three posts, matching the favicon glyph.
 *
 * The amber middle post is the one your hand would find first; it is also
 * what stops three strokes reading as a generic list icon.
 */
export function Logo({ id }: { id: string }) {
  return (
    <svg className="logo" viewBox="0 0 28 26" aria-hidden="true" focusable="false">
      <defs>
        {/* userSpaceOnUse because a vertical line has a zero-width bounding
            box, and objectBoundingBox gradients do not render on those. */}
        <linearGradient id={id} gradientUnits="userSpaceOnUse" x1="14" y1="5.5" x2="14" y2="22">
          <stop offset="0" stopColor="#FFC24D" />
          <stop offset="1" stopColor="#D65630" />
        </linearGradient>
      </defs>
      <g stroke="currentColor" strokeWidth="3" strokeLinecap="round" fill="none">
        <path d="M4 5.5h20" />
        <path d="M6 5.5V22" />
        <path d="M22 5.5V22" />
      </g>
      <path d="M14 5.5V22" stroke={`url(#${id})`} strokeWidth="3" strokeLinecap="round" fill="none" />
    </svg>
  );
}

const NAV = [
  { href: "/method", label: "Method" },
  { href: "/results", label: "Results" },
  { href: "/decisions", label: "Decisions" },
  { href: "/contribute", label: "Contribute" },
];

export function Nav() {
  return (
    <nav className="nav" aria-label="Primary">
      <Link className="mark" href="/" aria-label="Railing, home">
        <Logo id="mark-nav" />
        <span>Railing</span>
      </Link>
      <ul>
        {NAV.map((item) => (
          <li key={item.href}>
            <Link href={item.href}>{item.label}</Link>
          </li>
        ))}
      </ul>
      <a className="pill" href={REPO} rel="noopener">
        GitHub
      </a>
    </nav>
  );
}

const FOOT: Array<{ heading: string; links: Array<{ href: string; label: string; external?: boolean }> }> = [
  {
    heading: "Method",
    links: [
      { href: "/method", label: "How it works" },
      { href: "/scoring", label: "Scoring" },
      { href: "/decisions", label: "Decision log" },
      { href: "/protocol", label: "Harness protocol" },
    ],
  },
  {
    heading: "Results",
    links: [
      { href: "/results", label: "Every library" },
      { href: "/api/index.json", label: "Machine-readable index" },
    ],
  },
  {
    heading: "Contribute",
    links: [
      { href: "/contribute", label: "Add a library" },
      { href: "/disclosure", label: "Disclosure policy" },
      { href: REPO, label: "Source on GitHub", external: true },
    ],
  },
];

export function Footer() {
  return (
    <footer className="foot field">
      <div className="foot__cta">
        <h2>Add the library you maintain.</h2>
        <p>
          An adapter is about fifty lines and needs no knowledge of the test engine. If you would
          rather measure yourself than be measured, start there.
        </p>
        <div className="btns">
          <Link className="pill pill--paper" href="/contribute">
            Write an adapter
          </Link>
          <Link className="pill pill--glass" href="/protocol">
            Read the protocol
          </Link>
        </div>
      </div>

      <div className="foot__top">
        <div className="foot__brand">
          <Link className="mark" href="/" aria-label="Railing, home">
            <Logo id="mark-foot" />
            <span>Railing</span>
          </Link>
          <p>
            Accessibility conformance testing for React component libraries, measured against the
            W3C&rsquo;s own specification.
          </p>
        </div>
        {FOOT.map((group) => (
          <nav key={group.heading} aria-labelledby={`foot-${group.heading}`}>
            <h2 className="foot__h" id={`foot-${group.heading}`}>
              {group.heading}
            </h2>
            <ul>
              {group.links.map((link) => (
                <li key={link.href}>
                  {link.external ? (
                    <a href={link.href} rel="noopener">
                      {link.label}
                    </a>
                  ) : (
                    <Link href={link.href}>{link.label}</Link>
                  )}
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      <div className="foot__base">
        <span>
          <b>MIT licensed</b>
        </span>
        <span className="sep">&middot;</span>
        <span>Every result published as JSON</span>
        <span className="sep">&middot;</span>
        <span>Reproducible from a clone</span>
        <span className="sep">&middot;</span>
        <span>Built to be argued with</span>
      </div>
    </footer>
  );
}
