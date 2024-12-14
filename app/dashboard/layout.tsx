import React from 'react'
import Navbar from './components/Navbar';
import "../globals.css";
export default function DashboardLayout({
    children,
  }: Readonly<{
    children: React.ReactNode;
  }>) {
    return (
        <html lang="en">
        <body
          className={`w-full h-full antialiased`}
        >
          <Navbar/>
          {children}
        </body>
      </html>
  )
}