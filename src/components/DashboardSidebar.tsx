'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { Activity, MessageCircle, SquareKanban, Smartphone, Network, Building2, LogOut, ChevronLeft, PanelLeftClose, PanelLeftOpen, Settings } from 'lucide-react'
import { useSidebar } from '@/contexts/SidebarContext'

interface DashboardSidebarProps {
    email?: string;
    hasCompletedOnboarding?: boolean;
}

export function DashboardSidebar({ email, hasCompletedOnboarding = true }: DashboardSidebarProps) {
    const pathname = usePathname()
    const { isCollapsed, toggleSidebar } = useSidebar()

    const navItems = [
        {
            name: 'Dashboard',
            href: '/dashboard',
            icon: Activity,
            exact: true
        },
        {
            name: 'Conversas',
            href: '/dashboard/conversations',
            icon: MessageCircle,
            exact: false
        },
        {
            name: 'Kanban',
            href: '/dashboard/kanban',
            icon: SquareKanban,
            exact: false
        },
        {
            name: 'Conexão WhatsApp',
            href: '/dashboard/whatsapp',
            icon: Smartphone,
            exact: false
        },
        {
            name: 'Integrações',
            href: '/dashboard/integrations',
            icon: Network,
            exact: false
        },
        {
            name: 'Minha Clínica',
            href: '/dashboard/settings',
            icon: Building2,
            exact: false,
            requiresOnboarding: true
        },
        {
            name: 'Configurações',
            href: '/dashboard/account',
            icon: Settings,
            exact: false
        }
    ]

    return (
        <aside
            className={`border-r border-border bg-card hidden md:flex flex-col transition-all duration-300 ease-in-out relative ${isCollapsed ? 'w-20' : 'w-64'
                }`}
        >
            {/* Toggle Button */}
            <button
                onClick={toggleSidebar}
                className="absolute -right-3 top-10 z-20 bg-card border border-border rounded-full p-1.5 hover:bg-secondary transition-colors text-muted-foreground shadow-sm"
                title={isCollapsed ? "Expandir" : "Recolher"}
            >
                {isCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
            </button>

            <div className={`p-6 flex items-center justify-center min-h-[6rem] transition-all duration-300 ${isCollapsed ? 'px-2' : 'px-6'}`}>
                <div className="relative w-full h-10 flex items-center justify-center">
                    {isCollapsed ? (
                        <div className="relative w-10 h-10">
                            <Image src="/logos/nexus_logo_symbol.png" alt="Nexus Clínicas Symbol" fill className="object-contain" priority />
                        </div>
                    ) : (
                        <div className="relative w-48 h-10">
                            <Image src="/logos/nexus_logo_equalized.png" alt="Nexus Clínicas Logo" fill className="object-contain" priority />
                        </div>
                    )}
                </div>
            </div>

            <nav className={`flex-1 space-y-2 mt-4 transition-all duration-300 ${isCollapsed ? 'px-2' : 'px-4'}`}>
                {navItems.map((item) => {
                    const isActive = item.exact ? pathname === item.href : pathname?.startsWith(item.href)
                    const needsBadge = item.requiresOnboarding && !hasCompletedOnboarding

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-3 px-3 py-2 rounded-md font-medium transition-all relative ${isActive
                                ? 'bg-primary/10 text-primary border border-primary/20'
                                : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
                                } ${isCollapsed ? 'justify-center px-0' : ''}`}
                            title={isCollapsed ? item.name : ""}
                        >
                            <item.icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-primary' : ''}`} />
                            {!isCollapsed && <span className="truncate">{item.name}</span>}

                            {needsBadge && (
                                <span className={`${isCollapsed ? 'absolute top-1 right-1' : 'ml-auto'} flex items-center gap-1`}>
                                    <span className="relative flex h-2.5 w-2.5">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" />
                                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-orange-500" />
                                    </span>
                                </span>
                            )}
                        </Link>
                    )
                })}
            </nav>

            {/* Aviso de setup pendente no rodapé da sidebar */}
            {!hasCompletedOnboarding && (
                <div className={`mx-4 mb-4 p-3 rounded-lg bg-orange-500/10 border border-orange-500/20 transition-all duration-300 ${isCollapsed ? 'mx-2 p-2' : 'mx-4'}`}>
                    {isCollapsed ? (
                        <div className="flex justify-center text-orange-500" title="Setup pendente">
                            <div className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" />
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500" />
                            </div>
                        </div>
                    ) : (
                        <>
                            <p className="text-xs text-orange-400 font-medium leading-relaxed">
                                ⚡ Configure sua clínica para a IA começar a atender seus pacientes.
                            </p>
                            <Link
                                href="/dashboard/settings"
                                className="mt-2 text-xs text-orange-400 underline underline-offset-2 hover:text-orange-300 transition-colors block"
                            >
                                Configurar agora →
                            </Link>
                        </>
                    )}
                </div>
            )}

            <div className={`p-4 border-t border-border/40 transition-all duration-300 ${isCollapsed ? 'p-2' : 'p-4'}`}>
                {!isCollapsed && (
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-border/20">
                        <div className="text-sm truncate pr-2 text-muted-foreground">
                            {email}
                        </div>
                    </div>
                )}
                <form action="/auth/signout" method="post" className={isCollapsed ? 'flex justify-center' : ''}>
                    <button
                        className={`flex items-center gap-3 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 rounded-md transition-colors ${isCollapsed ? 'justify-center px-2' : 'w-full'}`}
                        title={isCollapsed ? "Sair" : ""}
                    >
                        <LogOut className="w-4 h-4 shrink-0" />
                        {!isCollapsed && <span>Sair</span>}
                    </button>
                </form>
                {!isCollapsed && (
                    <div className="flex items-center justify-between px-3 mt-4 text-[10px] text-muted-foreground/60">
                        <Link href="/termos" target="_blank" className="hover:text-primary hover:underline transition-colors">Termos</Link>
                        <Link href="/privacidade" target="_blank" className="hover:text-primary hover:underline transition-colors">Privacidade</Link>
                    </div>
                )}
            </div>
        </aside>
    )
}
