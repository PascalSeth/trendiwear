import '../globals.css'
import { Providers } from '../providers'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata = {
  title: 'Login - TrendiZip',
  description: 'Sign in to your TrendiZip account',
}

function AuthNavbar() {
  return (
    <div className="fixed w-full top-0 z-50 py-4 px-6 md:px-8 pointer-events-none">
      <div className="w-full flex items-center justify-between pointer-events-auto">
        <Link href="/" className="flex-shrink-0 group">
          <Image 
            src="/navlogo.png" 
            alt="TrendiZip" 
            width={34} 
            height={34} 
            className="transition-opacity duration-200 group-hover:opacity-80 h-7 md:h-8 w-auto object-contain drop-shadow-sm" 
          />
        </Link>

        <Link
          href="/"
          className="flex items-center gap-1.5 text-xs font-medium text-stone-600 hover:text-stone-900 transition-all bg-white/90 hover:bg-white backdrop-blur-md px-3.5 py-1.5 rounded-full border border-stone-200/80 shadow-xs hover:shadow-sm"
        >
          <ArrowLeft size={13} strokeWidth={1.75} />
          Back to home
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
