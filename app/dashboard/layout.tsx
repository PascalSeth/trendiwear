import React from 'react'
import "../globals.css";
import { Metadata } from 'next';
import { Providers } from '../providers';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: "TrendiWear Dashboard",
  description: "Manage your fashion business",
};

export default async function DashboardLayout({
    children,
  }: Readonly<{
    children: React.ReactNode;
  }>) {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      redirect('/auth/signin');
    }

    return (
        <html lang="en" suppressHydrationWarning>
          <head>
            <link rel="icon" href="/navlogo.png" />
          </head>
          <body 
            className="w-full h-full antialiased bg-slate-50"
            suppressHydrationWarning={true}
          >

            <Providers>
              {children}
            </Providers>
          </body>
        </html>
  )
}