'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
    BarChart,
    FileText,
    Settings,
    LogOut,
    PanelLeftClose,
    PanelLeftOpen,
    LayoutDashboard,
    ShieldCheck,
    Activity
} from 'lucide-react'
import { useSidebar } from '@/contexts/SidebarContext'

interface DashboardSidebarProps {
    email?: string;
    hasCompletedOnboarding?: boolean;
}

export function DashboardSidebar({ email, hasCompletedOnboarding = true }: DashboardSidebarProps) {
    const pathname = usePathname()
    const { isCollapsed, toggleSidebar, isMobileMenuOpen, toggleMobileMenu } = useSidebar()

    const navItems = [
        {
            name: 'Dashboard',
            href: '/dashboard',
            icon: LayoutDashboard,
            exact: true
        },
        {
            name: 'Simular CAPAG',
            href: '/dashboard/analyses/new',
            icon: Activity,
            exact: false
        },
        {
            name: 'Meus Relatórios',
            href: '/dashboard/analyses',
            icon: BarChart,
            exact: false
        },
        {
            name: 'Base de Documentos',
            href: '/dashboard/documents',
            icon: FileText,
            exact: false
        },
        {
            name: 'Minha Conta',
            href: '/dashboard/account',
            icon: Settings,
            exact: false
        }
    ]

    const SidebarContent = (
        <>
            <div className={`p-6 flex items-center justify-center min-h-[6rem] transition-all duration-300 ${isCollapsed ? 'px-2' : 'px-6'}`}>
                <div className="relative w-full flex items-center justify-center">
                    {!isCollapsed ? (
                        <div className="text-2xl font-black tracking-tighter text-primary flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20">
                                <Activity className="w-5 h-5" />
                            </div>
                            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Rating<span className="text-primary/50">.ai</span></span>
                        </div>
                    ) : (
                        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20">
                            <Activity className="w-6 h-6" />
                        </div>
                    )}
                </div>
            </div>

            <nav className={`flex-1 space-y-2 mt-4 transition-all duration-300 ${isCollapsed ? 'px-2' : 'px-4'}`}>
                {navItems.map((item) => {
                    const isActive = item.exact ? pathname === item.href : pathname?.startsWith(item.href)

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => isMobileMenuOpen && toggleMobileMenu()}
                            className={`flex items-center gap-3 px-3 py-2 rounded-md font-medium transition-all relative ${isActive
                                ? 'bg-primary/10 text-primary border border-primary/20'
                                : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
                                } ${isCollapsed ? 'justify-center px-0' : ''}`}
                            title={isCollapsed ? item.name : ""}
                        >
                            <item.icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-primary' : ''}`} />
                            {!isCollapsed && <span className="truncate">{item.name}</span>}
                        </Link>
                    )
                })}
            </nav>

            <div className={`p-4 border-t border-border/40 transition-all duration-300 ${isCollapsed ? 'p-2' : 'p-4'}`}>
                {!isCollapsed && (
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-border/20">
                        <div className="text-xs truncate pr-2 text-muted-foreground">
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
            </div>
        </>
    )

    return (
        <>
            {/* Desktop Sidebar */}
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
                {SidebarContent}
            </aside>

            {/* Mobile Sidebar (Drawer) */}
            <div
                className={`fixed inset-0 z-50 bg-background/80 backdrop-blur-sm transition-opacity duration-300 md:hidden ${isMobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
                    }`}
                onClick={toggleMobileMenu}
            />
            <aside
                className={`fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border flex flex-col transition-transform duration-300 transform md:hidden ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
            >
                <div className="p-4 flex justify-end md:hidden">
                    <button onClick={toggleMobileMenu} className="p-2 text-muted-foreground hover:text-foreground">
                        <PanelLeftClose className="w-6 h-6" />
                    </button>
                </div>
                {SidebarContent}
            </aside>
        </>
    )
}
