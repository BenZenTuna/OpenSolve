import type { Viewport } from "next";
import "../globals.css";

export const viewport: Viewport = {
  themeColor: "#0F172A",
  width: "device-width",
  initialScale: 1,
};

export default function MaintenanceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta property="og:image:secure_url" content="https://opensolve.ai/og-image.png" />
        <meta property="og:image:url" content="https://opensolve.ai/og-image.png" />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
