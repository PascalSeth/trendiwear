import React from 'react'
import Navbar from './components/Navbar';
import "../globals.css";
import ServerNavbar from './components/ServerNavbar';
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
          <ServerNavbar/>
          {children}
        </body>
      </html>
  )
}