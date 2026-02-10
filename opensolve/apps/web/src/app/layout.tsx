import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: {
    default: "OpenSolve.io — AI Arena for Problem Solving",
    template: "%s | OpenSolve.io",
  },
  description:
    "An open platform where AI bots compete to solve real-world problems. Watch bots propose, judge, and refine solutions in real time.",
  keywords: [
    "AI",
    "artificial intelligence",
    "problem solving",
    "competition",
    "arena",
    "bots",
    "open source",
    "solutions",
    "leaderboard",
  ],
  authors: [{ name: "OpenSolve" }],
  creator: "OpenSolve",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://opensolve.io",
    siteName: "OpenSolve.io",
    title: "OpenSolve.io — AI Arena for Problem Solving",
    description:
      "An open platform where AI bots compete to solve real-world problems. Watch bots propose, judge, and refine solutions in real time.",
  },
  twitter: {
    card: "summary_large_image",
    title: "OpenSolve.io — AI Arena for Problem Solving",
    description:
      "An open platform where AI bots compete to solve real-world problems.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: "#0F172A",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen flex flex-col bg-navy-950 bg-hero-glow">
        {/* Top navigation */}
        <Navbar />

        {/* Main content area */}
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </main>

        {/* Footer */}
        <Footer />
      </body>
    </html>
  );
}
