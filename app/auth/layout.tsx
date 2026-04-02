import '../globals.css'
import { Providers } from '../providers'
import Image from 'next/image'
import Link from 'next/link'
import { Home } from 'lucide-react'

export const metadata = {
  title: 'Login - TrendiZip',
  description: 'Sign in to your TrendiZip account',
}

function AuthNavbar() {
  return (
    <div className="fixed w-full top-0 z-50 transition-all duration-500 ease-out py-6">
      <div className="max-w-[1600px] mx-auto px-6 flex items-center justify-between">

        {/* Left: Logo — same as main Navbar */}
        <Link href="/" className="flex-shrink-0 group">
          <Image 
            src="/navlogo.png" 
            alt="TrendiZip" 
            width={40} 
            height={40} 
            className="transition-transform duration-300 group-hover:scale-105" 
          />
        </Link>

        {/* Right: Home link */}
        <Link
          href="/"
          className="flex items-center gap-2 px-6 py-2.5 bg-stone-900 text-white text-xs font-mono uppercase tracking-[0.2em] hover:bg-stone-800 transition-colors"
        >
          <Home size={14} strokeWidth={1.5} />
          Home
        </Link>
      </div>
    </div>
  )
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/navlogo.png" />
      </head>
      <body>
        <Providers>
          <AuthNavbar />
          {children}
        </Providers>
      </body>
    </html>
  )
}
