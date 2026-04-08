import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    const requestHeaders = new Headers(req.headers)
    const { pathname } = req.nextUrl;
    requestHeaders.set('x-pathname', pathname)

    const token = req.nextauth.token;
    const role = token?.role as string;
    
    // Dashboard routes require specific roles
    if (pathname.startsWith('/dashboard')) {
      // 1. Minimum dashboard access (not a regular customer)
      if (!(role === 'ADMIN' || role === 'SUPER_ADMIN' || role === 'PROFESSIONAL')) {
        return NextResponse.rewrite(new URL('/404', req.url));
      }

      // 2. Super Admin Only: Management tools
      if (pathname.startsWith('/dashboard/management') && role !== 'SUPER_ADMIN') {
        return NextResponse.rewrite(new URL('/404', req.url));
      }

      // 3. Admin/Super Admin Only: User management, collections, categories, and trends
      const adminOnlyPaths = [
        '/dashboard/customers',
        '/dashboard/professionals',
        '/dashboard/trends',
        '/dashboard/catalogue/category',
        '/dashboard/catalogue/collections'
      ];
      if (adminOnlyPaths.some(p => pathname.startsWith(p)) && !(role === 'ADMIN' || role === 'SUPER_ADMIN')) {
        return NextResponse.rewrite(new URL('/404', req.url));
      }
    }

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      }
    })
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
