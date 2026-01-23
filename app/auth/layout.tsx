import '../globals.css'
import { Providers } from '../providers'

export const metadata = {
  title: 'Login - Trendizip',
  description: 'Sign in to your Trendizip account',
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
          <head>
        <link rel="icon" href="/navlogo.png" />
      </head>
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
