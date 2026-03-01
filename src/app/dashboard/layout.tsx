import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { DashboardSidebar } from '@/components/DashboardSidebar'
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

    return (
        <div className="flex min-h-screen bg-background text-foreground">
            {/* Sidebar (Client Component com Active State Tracking) */}
            <DashboardSidebar email={user.email} />

            {/* Main Content */}
            <main className="flex-1 flex flex-col h-screen overflow-y-auto">
                <header className="h-16 border-b border-border bg-card flex items-center justify-center px-6 md:hidden">
                    <div className="flex items-center gap-2">
                        <div className="bg-primary/10 p-1.5 rounded-lg">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" /><path d="M12 5 9.04 7.96a2.17 2.17 0 0 0 0 3.08v0c.82.82 2.13.85 3 .07l2.07-1.9a2.82 2.82 0 0 1 3.79 0l2.96 2.66" /></svg>
                        </div>
                        <span className="text-lg font-bold tracking-tight text-foreground">
                            Nexus <span className="text-primary font-medium">Clínicas</span>
                        </span>
                    </div>
                </header>
                <div className="p-8 max-w-6xl mx-auto w-full flex-1">
                    {children}
                </div>
            </main>
        </div>
    )
}
