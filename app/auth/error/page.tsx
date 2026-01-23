'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'

const errorMessages: Record<string, string> = {
  Configuration: 'There is a problem with the server configuration.',
  AccessDenied: 'You do not have permission to sign in.',
  Verification: 'The verification token has expired or has already been used.',
  Default: 'An error occurred during authentication.',
  EmailSignin: 'The email sign-in link is invalid or has expired.',
  OAuthSignin: 'Error in the OAuth sign-in process.',
  OAuthCallback: 'Error in the OAuth callback.',
  OAuthCreateAccount: 'Could not create an account with this OAuth provider.',
  EmailCreateAccount: 'Could not create an account with this email.',
  Callback: 'Error in the callback URL.',
  OAuthAccountNotLinked: 'To confirm your identity, sign in with the same account you used originally.',
  SessionRequired: 'Please sign in to access this page.',
}

function ErrorContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error') || 'Default'

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-red-600">
            Authentication Error
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {errorMessages[error] || errorMessages.Default}
          </p>
        </div>

        <div className="text-center space-y-4">
          <Link
            href="/auth/signin"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Try Again
          </Link>

          <div>
            <Link
              href="/"
              className="font-medium text-indigo-600 hover:text-indigo-500"
            >
              Go back home
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AuthError() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-50"><div>Loading...</div></div>}>
      <ErrorContent />
    </Suspense>
  )
}