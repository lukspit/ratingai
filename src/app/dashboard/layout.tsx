import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { DashboardSidebar } from '@/components/DashboardSidebar'
import { SidebarProvider } from '@/contexts/SidebarContext'
import Image from 'next/image'
import { MobileMenuButton } from '@/app/dashboard/MobileMenuButton'
import { Activity } from 'lucide-react'

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()

    // Verify auth
    /* 
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        redirect('/login')
    }
    */
    const user = { email: 'mock@rating.ai', id: 'mock-user-id' } // Mock user for development


    return (
        <SidebarProvider>
            <div className="flex min-h-screen bg-background text-foreground overflow-hidden">
                {/* Sidebar (Client Component com Active State Tracking) */}
                <DashboardSidebar
                    email={user.email || undefined}
                    hasCompletedOnboarding={true} // Por hora assumimos true, dps faremos a verif se tem nome
                />

                {/* Main Content */}
                <main className="flex-1 flex flex-col h-screen overflow-y-auto">
                    <header className="h-16 border-b border-border bg-card flex items-center justify-between px-6 md:hidden shrink-0 sticky top-0 z-30">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20">
                                <Activity className="w-5 h-5" />
                            </div>
                            <span className="font-bold tracking-tighter text-lg">Rating<span className="text-primary">.ai</span></span>
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
