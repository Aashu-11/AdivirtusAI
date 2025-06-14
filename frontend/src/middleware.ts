import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from './utils/supabase/middleware'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { Database } from '@/types/database.types'

// List of public routes that don't require authentication
const publicRoutes = [
  '/auth/signin',
  '/auth/signup',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/api/',  // API routes have their own auth check
]

// Check if a path matches any public route
function isPublicRoute(path: string): boolean {
  return publicRoutes.some(route => {
    return path.startsWith(route) || 
           path === route || 
           path.startsWith('/_next') || 
           path.startsWith('/images') ||
           path.match(/\.(ico|png|jpg|jpeg|svg|css|js)$/)
  })
}

export async function middleware(request: NextRequest) {
  // Get the pathname of the request
  const path = request.nextUrl.pathname

  // First, update the session (this refreshes the session if needed)
  const response = await updateSession(request)

  // Skip authentication check for public routes
  if (isPublicRoute(path)) {
    return response
  }

  // For protected routes, check if the user is authenticated
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          // We don't need to set cookies here as we're only checking auth status
        },
        remove(name: string, options: CookieOptions) {
          // We don't need to remove cookies here as we're only checking auth status
        },
      },
    }
  )

  // Get the user from the session
  const { data: { user } } = await supabase.auth.getUser()

  // If no user and trying to access a protected route, redirect to sign-in
  if (!user && !isPublicRoute(path)) {
    const redirectUrl = new URL('/auth/signin', request.url)
    return NextResponse.redirect(redirectUrl)
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public/ files (public assets)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|public/).*)',
  ],
} 