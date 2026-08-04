import type { Metadata } from "next";
import { DocPage } from "@/components/doc-page";
import { loadDoc } from "@/lib/data";

export const metadata: Metadata = { title: "Disclosure and conflicts of interest", description: "How maintainers are notified before publication, and how conflicts of interest are handled." };

export default async function Page() {
  return (
    <DocPage
      eyebrow="Policy"
      title="Disclosure and conflicts of interest"
      lede="We score libraries we also contribute to. That is a real conflict, and the answer is to state it rather than pretend it away."
      markdown={await loadDoc("DISCLOSURE.md")}
      sourcePath="docs/DISCLOSURE.md"
    />
  );
}
