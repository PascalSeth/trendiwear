export default function VerifyRequest() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Check your email
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            A sign in link has been sent to your email address.
          </p>
          <p className="mt-2 text-sm text-gray-500">
            Click the link in the email to sign in to your account.
          </p>
        </div>

        <div className="text-center">
          <a
            href="/auth/signin"
            className="font-medium text-indigo-600 hover:text-indigo-500"
          >
            ← Back to sign in
          </a>
        </div>
      </div>
    </div>
  )
}