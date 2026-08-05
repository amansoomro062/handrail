import type { Metadata } from "next";
import { renderMarkdown } from "@railing-dev/markdown";
import { loadDoc, loadSite } from "@/lib/data";
import { parseDecisions } from "@/lib/decisions";
import { resolveLink } from "@/components/doc-page";
import { REPO } from "@/components/chrome";
import { specs } from "@railing-dev/spec";

export const metadata: Metadata = {
  title: "Decision log",
  description:
    "Every judgement behind the measurement, dated, including the ones that were wrong and what they nearly published.",
};

export default async function Decisions() {
  const { preamble, decisions } = parseDecisions(await loadDoc("DECISIONS.md"));
  const { targets } = await loadSite();
  const measured = targets.filter((t) => t.status !== "planned").length;
  const assertions = Object.values(specs).reduce((n, s) => n + s.assertions.length, 0);
  const newest = decisions[0]?.date ?? "";

  return (
    <>
      <div className="pagehead">
        <p className="eyebrow eyebrow--ink">Decision log</p>
        <h1>Every call we made, including the wrong ones</h1>
        <p className="lede">
          A measurement is only as good as the judgements behind it. These are all of ours, dated,
          with the reasoning that produced them and the consequence when the reasoning turned out to
          be faulty.
        </p>
      </div>

      <div className="decs" style={{ gridTemplateColumns: "repeat(4, 1fr)", marginTop: 28 }}>
        <div className="dec-card">
          <p className="n">Recorded</p>
          <p className="stat-n">{decisions.length} decisions</p>
        </div>
        <div className="dec-card">
          <p className="n">Measured</p>
          <p className="stat-n">{measured} libraries</p>
        </div>
        <div className="dec-card">
          <p className="n">Checks</p>
          <p className="stat-n">{assertions} assertions</p>
        </div>
        {newest ? (
          <div className="dec-card">
            <p className="n">Most recent</p>
            <p className="stat-n">{newest}</p>
          </div>
        ) : null}
      </div>

      <div className="note">
        <p className="note__t">Why this page exists</p>
        <p>
          Several entries below describe a result this project got wrong: a score far lower than the
          library deserved, a defect reported where none existed, a check that measured its own
          setup rather than its subject. Each was caught before publication by someone reading the
          output rather than by the system noticing. Publishing them is the only honest way to claim
          the rest is careful.
        </p>
      </div>

      {preamble ? (
        <div
          className="prose"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(preamble, { resolveLink }) }}
        />
      ) : null}

      <div className="declist">
        {decisions.map((d) => (
          <article className="dec" id={`decision-${d.number}`} key={d.number}>
            <div className="dec__side">
              <span className="dec__n">{d.number}</span>
              {d.date ? <span className="dec__date">{d.date}</span> : null}
            </div>
            <div className="dec__main">
              <h2 className="dec__t">
                <a href={`#decision-${d.number}`}>{d.title}</a>
              </h2>
              <div
                className="prose"
                dangerouslySetInnerHTML={{
                  __html: renderMarkdown(d.body, {
                    demote: 2,
                    tableCaption: d.title,
                    resolveLink,
                  }),
                }}
              />
            </div>
          </article>
        ))}
      </div>

      <p className="srcnote">
        Generated from{" "}
        <a href={`${REPO}/blob/main/docs/DECISIONS.md`} rel="noopener">
          <code>docs/DECISIONS.md</code>
        </a>
        . Library names are withheld from entries about unpublished results until the maintainer has
        been notified.
      </p>
    </>
  );
}
