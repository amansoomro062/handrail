import type { Metadata } from "next";
import "./globals.css";
import { Nav, Footer } from "@/components/chrome";

export const metadata: Metadata = {
  title: {
    default: "Railing: accessibility conformance for component libraries",
    template: "%s | Railing",
  },
  description:
    "Railing measures React component libraries against the W3C ARIA Authoring Practices Guide. " +
    "Every check cites a clause, every score names an exact version, and maintainers see their " +
    "findings before anyone else.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <a className="skip" href="#main">
          Skip to content
        </a>
        <div className="shell">
          <Nav />
          <main id="main">{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
