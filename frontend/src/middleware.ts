import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const url = request.nextUrl
  
  // Bypass if path already starts with /app (avoids double prefixing)
  if (url.pathname.startsWith('/app')) {
    return NextResponse.next()
  }
  
  // Rewrite global /admin to /app/admin to load the super admin dashboard
  if (url.pathname.startsWith('/admin')) {
    return NextResponse.rewrite(new URL(`/app/admin${url.pathname.slice(6)}${url.search}`, request.url))
  }
  
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
  } else {
    // Default to 'msmc' tenant if accessing the base domain directly (like localhost:3000)
    return NextResponse.rewrite(new URL(`/app/msmc${url.pathname}${url.search}`, request.url))
  }
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
