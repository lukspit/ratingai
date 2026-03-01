'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Settings, MessageSquare, LogOut, MessageCircle, Blocks } from 'lucide-react'

interface DashboardSidebarProps {
    email?: string;
}

export function DashboardSidebar({ email }: DashboardSidebarProps) {
    const pathname = usePathname()

    const navItems = [
        {
            name: 'Dashboard',
            href: '/dashboard',
            icon: LayoutDashboard,
            exact: true
        },
        {
            name: 'Conversas',
            href: '/dashboard/conversations',
            icon: MessageCircle,
            exact: false
        },
        {
            name: 'Conexão WhatsApp',
            href: '/dashboard/whatsapp',
            icon: MessageSquare,
            exact: false
        },
        {
            name: 'Integrações',
            href: '/dashboard/integrations',
            icon: Blocks,
            exact: false
        },
        {
            name: 'Minha Clínica',
            href: '/dashboard/settings',
            icon: Settings,
            exact: false
        }
    ]

    return (
        <aside className="w-64 border-r border-border bg-card hidden md:flex flex-col">
            <div className="p-6 flex items-center justify-start h-20 gap-2">
                <div className="bg-primary/10 p-1.5 rounded-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" /><path d="M12 5 9.04 7.96a2.17 2.17 0 0 0 0 3.08v0c.82.82 2.13.85 3 .07l2.07-1.9a2.82 2.82 0 0 1 3.79 0l2.96 2.66" /></svg>
                </div>
                <span className="text-xl font-bold tracking-tight text-foreground">
                    Nexus <span className="text-primary font-medium">Clínicas</span>
                </span>
            </div>

            <nav className="flex-1 px-4 space-y-2">
                {navItems.map((item) => {
                    const isActive = item.exact ? pathname === item.href : pathname?.startsWith(item.href)

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-3 px-3 py-2 rounded-md font-medium transition-colors ${isActive
                                ? 'bg-primary/20 text-primary border border-primary/30 shadow-[0_0_15px_rgba(124,127,242,0.15)]'
                                : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
                                }`}
                        >
                            <item.icon className={`w-5 h-5 ${isActive ? 'text-primary' : ''}`} />
                            {item.name}
                        </Link>
                    )
                })}
            </nav>

            <div className="p-4 border-t border-border/40">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-border/20">
                    <div className="text-sm truncate pr-2 text-muted-foreground">
                        {email}
                    </div>
                </div>
                <form action="/auth/signout" method="post">
                    <button className="flex w-full items-center gap-3 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 rounded-md transition-colors">
                        <LogOut className="w-4 h-4" />
                        Sair
                    </button>
                </form>
            </div>
        </aside>
    )
}
