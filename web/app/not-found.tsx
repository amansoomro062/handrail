import Link from "next/link";

/**
 * Next's default 404 is an unstyled page with none of the site chrome. This
 * one keeps the visitor inside the design and points them somewhere useful.
 */
export default function NotFound() {
  return (
    <div className="pagehead" style={{ paddingBottom: 96 }}>
      <p className="eyebrow eyebrow--ink">404</p>
      <h1>This page does not exist.</h1>
      <p className="lede">
        It may have moved, or the link was wrong to begin with. The{" "}
        <Link href="/results">results index</Link> and the{" "}
        <Link href="/method">method</Link> are the two places most visits are
        looking for.
      </p>
    </div>
  );
}
