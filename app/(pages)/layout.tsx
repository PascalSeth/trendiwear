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
    default: "TrendiZip | Buy African Fashion, Dresses & Tailoring in Ghana",
    template: "%s | TrendiZip"
  },
  description: "Ghana's #1 fashion marketplace. Buy Ankara dresses, Kente styles & African print fashion online. Connect with top tailors and designers in Accra, Kumasi & nationwide. Fast delivery across Ghana.",
  keywords: [
    // Ghana geo-specific
    "fashion Ghana", "dresses in Ghana", "buy dresses online Ghana",
    "Ankara dresses Ghana", "Kente dresses Ghana", "African print dresses Ghana",
    "church dresses Accra", "church dresses Ghana", "ladies dresses Ghana",
    "wedding guest dresses Ghana", "graduation dresses Kente",
    "African fashion online Ghana", "buy African fashion online Ghana",
    // Designers & services
    "tailors in Accra", "fashion designers Ghana", "fashion designers Accra",
    "bespoke tailoring Ghana", "bespoke tailoring Accra", "custom dresses Ghana",
    "seamstress Ghana", "seamstress in Accra", "African clothing designers Ghana",
    // Local & cultural
    "made in Ghana fashion", "Ghanaian traditional wear online",
    "Accra fashion shops", "Kumasi fashion", "online tailors Ghana",
    "buy Kente cloth online Ghana", "affordable Ankara online Accra",
    "Ghanaian designers", "African print fashion Ghana",
    // Broader/brand
    "custom tailoring", "designer clothing", "luxury fashion", "African fashion",
    "bespoke tailoring", "TrendiZip", "style inspiration"
  ],
  authors: [{ name: "TrendiZip Team" }],
  creator: "TrendiZip",
  publisher: "TrendiZip",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: 'https://trendizip.com',
    languages: {
      'en-GH': 'https://trendizip.com',
      'en': 'https://trendizip.com',
    },
  },
  openGraph: {
    type: "website",
    locale: "en_GH",
    url: "https://trendizip.com",
    siteName: "TrendiZip",
    title: "TrendiZip | Buy Ankara, Kente & African Fashion in Ghana",
    description: "Ghana's leading fashion marketplace. Discover curated Ankara, Kente & African print collections. Connect with expert designers and tailors in Accra, Kumasi & nationwide.",
    images: [
      {
        url: "/navlogo.png",
        width: 1200,
        height: 630,
        alt: "TrendiZip — Ghana's Premier Fashion Marketplace",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "TrendiZip | Ghana Fashion Marketplace — Ankara, Kente & More",
    description: "Buy Ankara, Kente & African dresses online in Ghana. Top designers & tailors in Accra.",
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
  // Geo signals for local search
  other: {
    'geo.region': 'GH',
    'geo.placename': 'Accra, Ghana',
    'geo.position': '5.6037;-0.1870',
    'ICBM': '5.6037, -0.1870',
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
          "description": "Ghana's premier fashion marketplace connecting buyers with top African designers, tailors, and artisans.",
          "areaServed": {
            "@type": "Country",
            "name": "Ghana"
          },
          "address": {
            "@type": "PostalAddress",
            "addressLocality": "Accra",
            "addressRegion": "Greater Accra",
            "addressCountry": "GH"
          },
          "contactPoint": {
            "@type": "ContactPoint",
            "contactType": "customer service",
            "availableLanguage": ["English"]
          },
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
        suppressHydrationWarning={true}
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
