'use client'

import { SessionProvider } from 'next-auth/react'
import { StoreInitializer } from '@/lib/stores'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <StoreInitializer />
      {children}
    </SessionProvider>
  )
}