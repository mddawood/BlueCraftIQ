import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const url = request.nextUrl
  
  // Get hostname (e.g. org1.example.com or org1.localhost:3000)
  const hostname = request.headers.get('host') || ''
  
  // Define your base domain for production
  const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || 'localhost:3000'
  
  // Extract subdomain if it exists
  const currentHost = hostname.replace(`.${baseDomain}`, '')
  
  // If we are on a subdomain (and it's not the base domain itself)
  if (currentHost !== hostname && currentHost !== baseDomain) {
    // Rewrite the URL to the /[tenant] dynamic route
    // e.g. org1.example.com/dashboard -> /app/org1/dashboard
    return NextResponse.rewrite(new URL(`/app/${currentHost}${url.pathname}${url.search}`, request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
