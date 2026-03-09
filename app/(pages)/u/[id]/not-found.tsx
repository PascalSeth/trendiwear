import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { UserX, Home } from 'lucide-react'

export default function CustomerProfileNotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 mb-6">
          <UserX className="w-10 h-10 text-gray-400" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">User Not Found</h1>
        <p className="text-gray-600 mb-6 max-w-md">
          The profile you&apos;re looking for doesn&apos;t exist or may have been removed.
        </p>
        <Link href="/">
          <Button>
            <Home className="w-4 h-4 mr-2" />
            Go Home
          </Button>
        </Link>
      </div>
    </div>
  )
}
