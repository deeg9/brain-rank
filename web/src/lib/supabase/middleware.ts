import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Do not run code between createServerClient and supabase.auth.getUser().
  // A simple mistake could make it very hard to debug issues with users being
  // randomly logged out.

  // IMPORTANT: Use getUser() for server-side session validation (T-17-05).
  // Do NOT use getSession() which trusts the JWT without verification.
  const { data: { user } } = await supabase.auth.getUser()

  // Define route sets for redirect logic
  const pathname = request.nextUrl.pathname
  const publicRoutes = ['/login', '/signup', '/welcome', '/privacy', '/terms', '/disclaimer', '/resources', '/use-cases', '/about', '/pricing', '/forgot-password']
  const isPublicRoute = publicRoutes.some(route =>
    pathname.startsWith(route)
  )
  const isLandingPage = pathname === '/'
  const isPublicProfile = pathname.startsWith('/u/')
  const isPublicAnalysis = pathname.startsWith('/analysis/')
  const isAuthCallback = pathname.startsWith('/auth/callback')

  // AUTH-04: Unauthenticated users on protected routes -> redirect to /login
  if (!user && !isPublicRoute && !isLandingPage && !isPublicProfile && !isPublicAnalysis && !isAuthCallback) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    return NextResponse.redirect(loginUrl)
  }

  // Authenticated users on auth pages -> redirect to /dashboard
  if (user && isPublicRoute) {
    const dashboardUrl = request.nextUrl.clone()
    dashboardUrl.pathname = '/dashboard'
    return NextResponse.redirect(dashboardUrl)
  }

  return supabaseResponse
}
