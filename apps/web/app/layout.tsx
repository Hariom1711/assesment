import "./globals.css";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "WasteOps Admin",
  description: "Operations and super admin dashboard for the waste collection marketplace"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Suspense fallback={<div style={{ padding: 40, color: "var(--text-muted)" }}>Loading Workspace...</div>}>
          {children}
        </Suspense>
      </body>
    </html>
  );
}
