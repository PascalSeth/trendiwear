import type { Metadata } from "next";
import localFont from "next/font/local";
import "../globals.css";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import ServerNavbar from "../components/ServerNavbar";
import Footer from "../components/Footer";
import { Toaster } from "@/components/ui/sonner";
import { Providers } from "../providers";
import { BrowserNotificationPrompt } from "@/components/ui/browser-notification-prompt";
import { JsonLd } from "@/components/seo";

const geistSans = localFont({
  src: "../fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "../fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  metadataBase: new URL('https://trendizip.com'),
  title: {
    default: "TrendiZip | Wear the Trend, Set the Trend",
    template: "%s | TrendiZip"
  },
  description: "Your ultimate fashion destination for custom tailoring, designer spotlights, and curated luxury shopping. Connect with top artisans and shop the latest trends.",
  keywords: ["fashion", "custom tailoring", "designer clothing", "luxury fashion", "African fashion", "bespoke tailoring", "TrendiZip", "style inspiration"],
  authors: [{ name: "TrendiZip Team" }],
  creator: "TrendiZip",
  publisher: "TrendiZip",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://trendizip.com",
    siteName: "TrendiZip",
    title: "TrendiZip | Your Ultimate Fashion Destination",
    description: "Discover curated collections, connect with expert designers, and shop the latest global trends.",
    images: [
      {
        url: "/navlogo.png",
        width: 1200,
        height: 630,
        alt: "TrendiZip Fashion Atelier",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "TrendiZip | Fashion Atelier & Marketplace",
    description: "Wear the Trend, Set the Trend with TrendiZip.",
    images: ["/navlogo.png"],
    creator: "@trendizip",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/navlogo.png" />
        <JsonLd schema={{
          "@context": "https://schema.org",
          "@type": "Organization",
          "name": "TrendiZip",
          "url": "https://trendizip.com",
          "logo": "https://trendizip.com/navlogo.png",
          "sameAs": [
            "https://twitter.com/trendizip",
            "https://instagram.com/trendizip",
            "https://facebook.com/trendizip"
          ]
        }} />
        <JsonLd schema={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          "name": "TrendiZip",
          "url": "https://trendizip.com",
          "potentialAction": {
            "@type": "SearchAction",
            "target": "https://trendizip.com/shopping?q={search_term_string}",
            "query-input": "required name=search_term_string"
          }
        }} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          <ServerNavbar/>
          {children}
          <Footer />
          <Toaster />
          <BrowserNotificationPrompt />
        </Providers>
      </body>
    </html>
  );
}
