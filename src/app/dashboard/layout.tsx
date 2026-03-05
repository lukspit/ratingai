import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { DashboardSidebar } from '@/components/DashboardSidebar'
import { SidebarProvider } from '@/contexts/SidebarContext'
import Image from 'next/image'
import { Menu } from 'lucide-react'
import { MobileMenuButton } from '@/app/dashboard/MobileMenuButton'
export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()

    // Verify auth
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        redirect('/login')
    }

    // Check onboarding status for sidebar badge
    const { data: clinic } = await supabase
        .from('clinics')
        .select('rules')
        .eq('owner_id', user.id)
        .single()

    const hasCompletedOnboarding = !!(clinic?.rules)

    return (
        <SidebarProvider>
            <div className="flex min-h-screen bg-background text-foreground overflow-hidden">
                {/* Sidebar (Client Component com Active State Tracking) */}
                <DashboardSidebar
                    email={user.email || undefined}
                    hasCompletedOnboarding={hasCompletedOnboarding}
                />

                {/* Main Content */}
                <main className="flex-1 flex flex-col h-screen overflow-y-auto">
                    <header className="h-16 border-b border-border bg-card flex items-center justify-between px-6 md:hidden shrink-0 sticky top-0 z-30">
                        <div className="relative w-10 h-10">
                            <Image src="/logos/nexus_logo_symbol.png" alt="Nexus Clínicas Symbol" fill className="object-contain" priority />
                        </div>

                        <MobileMenuButton />
                    </header>
                    <div className="p-4 md:p-8 max-w-6xl mx-auto w-full flex-1">
                        {children}
                    </div>
                </main>
            </div>
        </SidebarProvider>
    )
}
