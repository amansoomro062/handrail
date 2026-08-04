import type { Metadata } from "next";
import { DocPage } from "@/components/doc-page";
import { loadDoc } from "@/lib/data";

export const metadata: Metadata = { title: "The harness protocol", description: "The contract between an adapter and the runner: HTTP and HTML, with no reference to any framework." };

export default async function Page() {
  return (
    <DocPage
      eyebrow="Reference"
      title="The harness protocol"
      lede="The contract between an adapter and the runner. Deliberately minimal, transport level, and free of any reference to a framework."
      markdown={await loadDoc("HARNESS-PROTOCOL.md")}
      sourcePath="docs/HARNESS-PROTOCOL.md"
    />
  );
}
