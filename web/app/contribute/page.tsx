import type { Metadata } from "next";
import { DocPage } from "@/components/doc-page";
import { loadDoc } from "@/lib/data";

export const metadata: Metadata = { title: "Add a library", description: "An adapter is about fifty lines and needs no knowledge of the test engine. This is how to write one." };

export default async function Page() {
  return (
    <DocPage
      eyebrow="Contribute"
      title="Add a library"
      lede="An adapter is the only library-specific code in the project. About fifty lines, no knowledge of the test engine, and the best place to start."
      markdown={await loadDoc("ADAPTERS.md")}
      sourcePath="docs/ADAPTERS.md"
    />
  );
}
