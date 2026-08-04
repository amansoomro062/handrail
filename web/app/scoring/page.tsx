import type { Metadata } from "next";
import { DocPage } from "@/components/doc-page";
import { loadDoc } from "@/lib/data";

export const metadata: Metadata = { title: "The scoring model exists to be argued with", description: "The scoring model, every weighting, and what is deliberately left out of it." };

export default async function Page() {
  return (
    <DocPage
      eyebrow="Scoring"
      title="The scoring model exists to be argued with"
      lede="Every input to every score is published. If you dislike the weightings you can recompute the whole index with your own."
      markdown={await loadDoc("SCORING.md")}
      sourcePath="docs/SCORING.md"
    />
  );
}
