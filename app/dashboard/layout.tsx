import React from 'react'
import "../globals.css";
import ServerDashboardShell from './components/ServerDashboardShell';
import { Metadata } from 'next';
import { Providers } from '../providers';

export const metadata: Metadata = {
  title: "TrendiWear Dashboard",
  description: "Manage your fashion business",
};

export default function DashboardLayout({
    children,
  }: Readonly<{
    children: React.ReactNode;
  }>) {
    return (
        <html lang="en">
          <head>
            <link rel="icon" href="/navlogo.png" />
          </head>
          <body className="w-full h-full antialiased">
            <Providers>
              <ServerDashboardShell>
                {children}
              </ServerDashboardShell>
            </Providers>
          </body>
        </html>
  )
}