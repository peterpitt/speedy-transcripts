import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Video Speed Reader",
  description: "Upload your video, get a clean transcript in three minutes.",
  authors: [{ name: "Video Speed Reader" }],
  openGraph: {
    title: "Video Speed Reader",
    description: "Upload your video, get a clean transcript in three minutes.",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Spectral:wght@400;500;600;700;800&family=Noto+Serif+TC:wght@400;500;600;700&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
