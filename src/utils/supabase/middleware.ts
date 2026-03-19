import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { createAdminClient } from '@/utils/supabase/admin'

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
    const {
        data: { user },
    } = await supabase.auth.getUser()

    // 1. Verificar se a rota é protegida
    const isProtectedRoute = request.nextUrl.pathname.startsWith('/dashboard')

    // 2. Se for rota protegida e não estiver logado, redirect login
    if (isProtectedRoute && !user) {
        return NextResponse.redirect(new URL('/login', request.url))
    }

    // 3. Se estiver logado em rota protegida, verificar assinatura e perfil
    if (isProtectedRoute && user) {
        // Verificar assinatura pelo email usando admin client (bypassa RLS)
        const supabaseAdmin = createAdminClient()
        const { data: subscription } = await supabaseAdmin
            .from('subscriptions')
            .select('status')
            .eq('customer_email', user.email)
            .order('created_at', { ascending: false })
            .limit(1)
            .single()

        const activeStatuses = ['active', 'trialing']

        if (!subscription || !activeStatuses.includes(subscription.status)) {
            // Redireciona para a página beta para assinar
            return NextResponse.redirect(new URL('/beta', request.url))
        }

        // Verificar se tem perfil tributário
        const { data: profile } = await supabase
            .from('tributario_profiles')
            .select('id')
            .eq('id', user.id)
            .single()

        if (!profile && request.nextUrl.pathname !== '/register') {
            // Se não tem perfil, deveria estar no registro (pós-pagamento)
            // return NextResponse.redirect(new URL('/register', request.url))
        }
    }

    return supabaseResponse
}
