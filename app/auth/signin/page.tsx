import React, { Suspense } from 'react'
import { prisma } from '@/lib/prisma'
import AuthPageClient from '@/app/auth/signin/AuthPageClient'

export default async function AuthPage() {
  // Fetch real-time stats from Prisma
  const [productCount, proCount] = await Promise.all([
    prisma.product.count({ where: { isActive: true } }),
    prisma.user.count({ where: { role: 'PROFESSIONAL' } })
  ])

  return (
    <Suspense fallback={
      <div className="h-screen w-full bg-[#fafaf9] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-stone-200 border-t-stone-900 rounded-full animate-spin" />
      </div>
    }>
      <AuthPageClient 
        productCount={productCount} 
        proCount={proCount} 
      />
    </Suspense>
  )
}