import '../globals.css'
import { Providers } from '../providers'

export const metadata = {
  title: 'Authentication - Trendizip',
  description: 'Sign in to your Trendizip account',
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
