import type { Metadata } from "next";
import "./globals.css";
import { Who } from "./who";

export const metadata: Metadata = {
  title: "Oratoriu",
  description: "Pontaj și rapoarte",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ro">
      <body>
        <div className="shell">
          <aside className="side">
            <div className="brand">Oratoriu</div>
            <Who />
          </aside>
          <div className="content">{children}</div>
        </div>
      </body>
    </html>
  );
}
