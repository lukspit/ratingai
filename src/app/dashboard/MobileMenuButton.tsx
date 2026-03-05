'use client'

import { Menu } from 'lucide-react'
import { useSidebar } from '@/contexts/SidebarContext'

export function MobileMenuButton() {
    const { toggleMobileMenu } = useSidebar()

    return (
        <button
            onClick={toggleMobileMenu}
            className="p-2 text-muted-foreground hover:text-foreground md:hidden"
        >
            <Menu className="w-6 h-6" />
        </button>
    )
}
