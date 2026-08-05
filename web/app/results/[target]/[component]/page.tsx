import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { loadSite, scoreRun, releasable, CEILING } from "@/lib/data";
import { displayScore } from "@railing-dev/report";

/**
 * One page per released library and component, one anchor per assertion.
 *
 * This is the page the three-click rule lands on: index, component, assertion.
 * Every finding carries the exact command that reproduces it in isolation and
 * a replayable trace of the run that produced it, so "check our working" is a
 * paste rather than a project.
 *
 * generateStaticParams applies the publication gate: an unreleased library has
 * no page here, not a hidden one.
 */

export async function generateStaticParams() {
  const { released, results } = await loadSite();
  const params = released.flatMap((t) =>
    [...(results.get(t.id)?.keys() ?? [])].map((component) => ({
      target: t.id,
      component,
    })),
  );
  // Static export refuses a dynamic route that generates nothing, and while
  // every library is withheld that is exactly what this route does. The
  // sentinel renders an explanation of the withholding; nothing links to it,
  // and it is replaced by real pages the moment the first library releases.
  return params.length > 0 ? params : [{ target: "withheld", component: "withheld" }];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ target: string; component: string }>;
}): Promise<Metadata> {
  const { target, component } = await params;
  return {
    title: `${target} ${component}`,
    description: `Accessibility conformance results for the ${target} ${component}, with the specification clause behind every check.`,
  };
}

const STATUS_CHIP: Record<string, string> = {
  pass: "chip--pass",
  fail: "chip--fail",
  error: "chip--warn",
  "not-applicable": "chip--na",
};

export default async function ComponentPage({
  params,
}: {
  params: Promise<{ target: string; component: string }>;
}) {
  const { target: targetId, component } = await params;

  if (targetId === "withheld") {
    return (
      <div className="pagehead">
        <p className="eyebrow eyebrow--ink">Results</p>
        <h1>Nothing is published yet</h1>
        <p className="lede">
          Every measured library is inside its notice period: its maintainer has
          the findings, the adapter that produced them, and fourteen days before
          anything appears here. The per-component pages replace this one the
          moment the first library releases.
        </p>
        <p>
          <Link className="pill" href="/results">
            Back to the index
          </Link>
        </p>
      </div>
    );
  }

  const { targets, results } = await loadSite();
  const target = targets.find((t) => t.id === targetId);
  const run = results.get(targetId)?.get(component);

  // The gate, applied again at render. generateStaticParams already filters,
  // but a second check costs nothing and a leak here is the one mistake this
  // project cannot recover from.
  if (!target || !run || !releasable(target).ok || target.status !== "published") {
    notFound();
  }

  const s = scoreRun(run);
  const versions = Object.entries(run.target.versions).map(([n, v]) => `${n}@${v}`);
  const repro = (assertionId?: string) =>
    [
      `npx @railing-dev/runner run --target ${targetId} --component ${component}`,
      assertionId ? `  --only ${assertionId}` : "  --repeat 3",
      `  --base-url http://localhost:5180`,
    ].join(" \\\n");

  return (
    <>
      <div className="pagehead">
        <p className="eyebrow eyebrow--ink">
          <Link href="/results" style={{ textDecoration: "none" }}>
            Results
          </Link>{" "}
          / {target.name}
        </p>
        <h1>
          {target.name} {component}
        </h1>
        <p className="lede">
          {displayScore(s.value)} against {versions.join(", ")}. Every check below cites the clause
          it measures, and every failure carries the command that reproduces it.
        </p>
      </div>

      <div className="note">
        <p className="note__t">Reproduce this whole run</p>
        <p>
          Serve the adapter from a clone of the repository, then:
        </p>
        <pre>
          <code>{repro()}</code>
        </pre>
        {run.trace ? (
          <p>
            Or replay it without running anything:{" "}
            <a href={`/api/traces/${targetId}.${component}.zip`}>download the Playwright trace</a>{" "}
            and open it with <code>npx playwright show-trace</code>.
          </p>
        ) : null}
      </div>

      <section aria-label="Assertions">
        {run.assertions.map((a) => (
          <article
            className="finding"
            id={a.id}
            key={a.id}
            style={
              a.status === "pass"
                ? { borderLeftColor: "var(--pass)" }
                : a.status === "not-applicable"
                  ? { borderLeftColor: "var(--line)" }
                  : undefined
            }
          >
            <h2 style={{ fontSize: 18, marginBottom: 14, lineHeight: 1.3 }}>
              <a href={`#${a.id}`} style={{ textDecoration: "none", color: "inherit" }}>
                {a.status === "fail" && a.detail ? a.detail : a.title}
              </a>
            </h2>
            <dl>
              <dt>Check</dt>
              <dd>
                <code>{a.id}</code>
              </dd>
              <dt>Status</dt>
              <dd>
                <span className={`chip ${STATUS_CHIP[a.status] ?? "chip--na"}`}>
                  <span className="chip__dot" />
                  {a.status}
                </span>
              </dd>
              <dt>Severity</dt>
              <dd>{a.severity}</dd>
              {a.rationale ? (
                <>
                  <dt>Why it matters</dt>
                  <dd>{a.rationale}</dd>
                </>
              ) : null}
              {a.status === "fail" ? (
                <>
                  <dt>Expected</dt>
                  <dd>{a.expected ?? "not recorded"}</dd>
                  <dt>Measured</dt>
                  <dd>{a.actual ?? "not recorded"}</dd>
                </>
              ) : null}
              {a.refs.apg || a.refs.wcag ? (
                <>
                  <dt>Measured against</dt>
                  <dd>
                    {a.refs.apg ? (
                      <a href={a.refs.apg} rel="noopener">
                        APG pattern
                      </a>
                    ) : null}
                    {a.refs.apg && a.refs.wcag ? " · " : null}
                    {a.refs.wcag ? (
                      a.refs.wcagUrl ? (
                        <a href={a.refs.wcagUrl} rel="noopener">
                          WCAG {a.refs.wcag}
                        </a>
                      ) : (
                        `WCAG ${a.refs.wcag}`
                      )
                    ) : null}
                  </dd>
                </>
              ) : null}
              {a.status === "fail" ? (
                <>
                  <dt>Reproduce</dt>
                  <dd>
                    <pre style={{ margin: 0 }}>
                      <code>{repro(a.id)}</code>
                    </pre>
                  </dd>
                </>
              ) : null}
            </dl>
          </article>
        ))}
      </section>

      <div className="note">
        <p className="note__t">What this cannot tell you</p>
        <p>{CEILING}</p>
      </div>
    </>
  );
}
