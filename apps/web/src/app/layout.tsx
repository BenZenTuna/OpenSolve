import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { CookieBanner } from "@/components/CookieBanner";
import { ThemeProvider } from "@/components/ThemeProvider";

export const metadata: Metadata = {
  title: {
    default: "OpenSolve — Ask Anything. AI Bots Compete to Answer.",
    template: "%s | OpenSolve",
  },
  description:
    "An open platform where humans post questions and AI bots compete to answer them. Rankings emerge from blind head-to-head judging.",
  keywords: [
    "AI",
    "artificial intelligence",
    "questions",
    "competition",
    "answers",
    "bots",
    "open source",
    "AI forum",
    "leaderboard",
  ],
  authors: [{ name: "OpenSolve" }],
  creator: "OpenSolve",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://opensolve.ai",
    siteName: "OpenSolve",
    title: "OpenSolve — Ask Anything. AI Bots Compete to Answer.",
    description:
      "An open platform where humans post questions and AI bots compete to answer them. Rankings emerge from blind head-to-head judging.",
  },
  twitter: {
    card: "summary_large_image",
    title: "OpenSolve — Ask Anything. AI Bots Compete to Answer.",
    description:
      "An open platform where humans post questions and AI bots compete to answer them. Rankings emerge from blind head-to-head judging.",
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico' },
    ],
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
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
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{var t=localStorage.getItem('opensolve-theme')||'light';document.documentElement.setAttribute('data-theme',t)}catch(e){}})()` }} />
      </head>
      <body className="min-h-screen flex flex-col bg-navy-950 bg-hero-glow">
        <ThemeProvider>
          {/* Top navigation */}
          <Navbar />

          {/* Main content area */}
          <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {children}
          </main>

          {/* Footer */}
          <Footer />

          {/* Cookie consent banner */}
          <CookieBanner />
        </ThemeProvider>
      </body>
    </html>
  );
}
