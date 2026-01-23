import type { Metadata } from "next";
import localFont from "next/font/local";
import "../globals.css";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import ServerNavbar from "../components/ServerNavbar";
import { Toaster } from "@/components/ui/sonner";
import { CartProvider } from "@/lib/cart-context";
import { Providers } from "../providers";

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
  title: "TrendiZip",
  description: "Wear the Trend, Set the Trend with TrendiZip - Your Ultimate Fashion Destination!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/navlogo.png" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          <CartProvider>
            <ServerNavbar/>
            {children}
            <Toaster />
          </CartProvider>
        </Providers>
      </body>
    </html>
  );
}
