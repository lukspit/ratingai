import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { DashboardSidebar } from '@/components/DashboardSidebar'
import Image from 'next/image'

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
                <header className="h-20 border-b border-border bg-card flex items-center justify-center px-6 md:hidden">
                    <div className="relative w-12 h-12">
                        <Image src="/logos/nexus_logo_symbol.png" alt="Nexus Clínicas Symbol" fill className="object-contain" priority />
                    </div>
                </header>
                <div className="p-8 max-w-6xl mx-auto w-full flex-1">
                    {children}
                </div>
            </main>
        </div>
    )
}
