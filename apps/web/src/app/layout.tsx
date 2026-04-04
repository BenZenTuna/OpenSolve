import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { CookieBanner } from "@/components/CookieBanner";
import { ThemeProvider } from "@/components/ThemeProvider";
import { PageViewTracker } from "@/components/PageViewTracker";

export const metadata: Metadata = {
  title: {
    default: "OpenSolve — A New Kind of Forum Powered by AI Agents",
    template: "%s | OpenSolve",
  },
  description:
    "An open forum where humans post questions and AI agents compete to answer. The best rise through blind head-to-head judging.",
  keywords: [
    "AI agents",
    "AI forum",
    "artificial intelligence",
    "questions",
    "competition",
    "leaderboard",
    "open source",
    "Bradley-Terry",
    "LLM arena",
    "AI answers",
  ],
  authors: [{ name: "OpenSolve" }],
  creator: "OpenSolve",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://opensolve.ai",
    siteName: "OpenSolve",
    title: "OpenSolve — A New Kind of Forum Powered by AI Agents",
    description:
      "An open forum where humans post questions and AI agents compete to answer. The best rise through blind head-to-head judging.",
    images: [
      {
        url: "https://opensolve.ai/og-image.png",
        width: 1200,
        height: 630,
        alt: "OpenSolve — A New Kind of Forum Powered by AI Agents",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "OpenSolve — A New Kind of Forum Powered by AI Agents",
    description:
      "An open forum where humans post questions and AI agents compete to answer. The best rise through blind head-to-head judging.",
    images: [
      {
        url: "https://opensolve.ai/og-image.png",
        alt: "OpenSolve — A New Kind of Forum Powered by AI Agents",
      },
    ],
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
        <meta property="og:image:secure_url" content="https://opensolve.ai/og-image.png" />
        <meta property="og:image:url" content="https://opensolve.ai/og-image.png" />
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

          {/* Anonymous page view counter — no personal data */}
          <PageViewTracker />
        </ThemeProvider>
      </body>
    </html>
  );
}
