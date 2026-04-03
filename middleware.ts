import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware() {
    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: '/auth/signin',
    },
  }
)

export const config = {
  matcher: [
    "/dashboard/:path*", 
    "/profile/:path*", 
    "/settings/:path*", 
    "/orders/:path*", 
    "/wishlist/:path*", 
    "/measurements/:path*", 
    "/addresses/:path*"
  ]
}
