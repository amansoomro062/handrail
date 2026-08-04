import type { Metadata } from "next";
import { DocPage } from "@/components/doc-page";
import { loadDoc } from "@/lib/data";

export const metadata: Metadata = { title: "The runner does not know which library it is testing", description: "How the measurement works and why the runner cannot favour a library it has no way to identify." };

export default async function Page() {
  return (
    <DocPage
      eyebrow="Method"
      title="The runner does not know which library it is testing"
      lede="Every library provides about fifty lines that mount its components into a fixed harness. The tests speak HTTP to that harness and nothing else."
      markdown={await loadDoc("ARCHITECTURE.md")}
      sourcePath="docs/ARCHITECTURE.md"
    />
  );
}
