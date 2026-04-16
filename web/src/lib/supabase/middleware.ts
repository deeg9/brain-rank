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
  // Auth-entry pages: logged-in users should be bounced to /dashboard so they
  // can't re-enter the signup/login flow. Content pages like /resources,
  // /pricing, /about are public but viewable by authed users too.
  const authEntryRoutes = ['/login', '/signup', '/forgot-password']
  const isAuthEntryRoute = authEntryRoutes.some(route =>
    pathname.startsWith(route)
  )
  const isLandingPage = pathname === '/'
  const isPublicProfile = pathname.startsWith('/u/')
  const isPublicAnalysis = pathname.startsWith('/analysis/')
  const isAuthCallback = pathname.startsWith('/auth/callback') || pathname.startsWith('/auth/confirm')
  const isWebhook = pathname.startsWith('/api/runpod/webhook')
  const isOnboarding = pathname === '/onboarding'
  const isApiRoute = pathname.startsWith('/api/')

  // AUTH-04: Unauthenticated users on protected routes -> redirect to /login
  if (!user && !isPublicRoute && !isLandingPage && !isPublicProfile && !isPublicAnalysis && !isAuthCallback && !isWebhook && !isOnboarding) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    return NextResponse.redirect(loginUrl)
  }

  // Authenticated users on auth-entry pages -> redirect to /dashboard
  if (user && isAuthEntryRoute) {
    const dashboardUrl = request.nextUrl.clone()
    dashboardUrl.pathname = '/dashboard'
    return NextResponse.redirect(dashboardUrl)
  }

  // Gate onboarding on username presence
  if (user && !isApiRoute && !isAuthCallback && !isWebhook && !isPublicRoute && !isLandingPage && !isPublicProfile && !isPublicAnalysis) {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', user.id)
      .maybeSingle()

    if (!profileError) {
      // No username → force onboarding (unless already there)
      if (!profile?.username && !isOnboarding) {
        const onboardingUrl = request.nextUrl.clone()
        onboardingUrl.pathname = '/onboarding'
        return NextResponse.redirect(onboardingUrl)
      }
      // Has username but still on /onboarding → send to dashboard
      if (profile?.username && isOnboarding) {
        const dashboardUrl = request.nextUrl.clone()
        dashboardUrl.pathname = '/dashboard'
        return NextResponse.redirect(dashboardUrl)
      }
    }
  }

  return supabaseResponse
}
