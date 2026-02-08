import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import "./globals.css";

export const metadata: Metadata = {
  title: "AutoResolve Dashboard",
  description:
    "Autonomous email negotiation agent for resolving refunds, cancellations, and disputes."
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={GeistSans.variable}>
      <body className="font-sans bg-surface text-text antialiased">
        {children}
      </body>
    </html>
  );
}
