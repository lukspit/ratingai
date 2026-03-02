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
                    cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
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

    // refresh session if expired - required for Server Components
    // https://supabase.com/docs/guides/auth/server-side/nextjs
    const {
        data: { user },
    } = await supabase.auth.getUser()

    // 1. Check if the user is trying to access a protected route (e.g., /dashboard)
    const isProtectedRoute = request.nextUrl.pathname.startsWith('/dashboard')

    // 2. If it's a protected route and the user is not logged in, redirect to login
    if (isProtectedRoute && !user) {
        return NextResponse.redirect(new URL('/login', request.url))
    }

    // 3. If the user is logged in and trying to access a protected route, check their subscription
    if (isProtectedRoute && user) {
        // Find if the user has a clinic
        const { data: clinic } = await supabase
            .from('clinics')
            .select('id')
            .eq('owner_id', user.id)
            .single()

        if (clinic) {
            // Check the subscription status for this clinic
            const { data: subscription } = await supabase
                .from('subscriptions')
                .select('status')
                .eq('clinic_id', clinic.id)
                .single()

            // Define which statuses allow access to the application
            const activeStatuses = ['active', 'trialing']

            // If there's no subscription or the status isn't active/trialing, redirect to pricing
            if (!subscription || !activeStatuses.includes(subscription.status)) {
                return NextResponse.redirect(new URL('/pricing', request.url))
            }
        } else {
            // If they don't have a clinic yet, you might want to redirect them to a setup page
            // For now, let's redirect to pricing as a fallback or keep them going
            // return NextResponse.redirect(new URL('/onboarding', request.url))
        }
    }

    return supabaseResponse
}
