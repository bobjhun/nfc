import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Ascend Media Works",
    template: "%s | Ascend Media Works",
  },
  description: "Ascend Media Works social media management dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const dateLabel = new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <AppShell dateLabel={dateLabel}>{children}</AppShell>
      </body>
    </html>
  );
}
