'use client'

import { signOut } from 'next-auth/react'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function SignOut() {
  const router = useRouter()

  useEffect(() => {
    const handleSignOut = async () => {
      await signOut({ callbackUrl: '/' })
    }

    handleSignOut()
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Signing out...
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            You are being signed out of your account.
          </p>
        </div>
      </div>
    </div>
  )
}