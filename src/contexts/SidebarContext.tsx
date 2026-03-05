'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

interface SidebarContextType {
    isCollapsed: boolean;
    toggleSidebar: () => void;
    setCollapsed: (collapsed: boolean) => void;
    isMobileMenuOpen: boolean;
    toggleMobileMenu: () => void;
    setMobileMenuOpen: (open: boolean) => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined)

export function SidebarProvider({ children }: { children: React.ReactNode }) {
    const [isCollapsed, setIsCollapsed] = useState(false)
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

    // Opcional: Persistir o estado no localStorage
    useEffect(() => {
        const saved = localStorage.getItem('sidebar-collapsed')
        if (saved === 'true') {
            setIsCollapsed(true)
        }
    }, [])

    const toggleSidebar = () => {
        setIsCollapsed(prev => {
            const newState = !prev
            localStorage.setItem('sidebar-collapsed', String(newState))
            return newState
        })
    }

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(prev => !prev)
    }

    const setMobileMenuOpen = (open: boolean) => {
        setIsMobileMenuOpen(open)
    }

    return (
        <SidebarContext.Provider value={{
            isCollapsed,
            toggleSidebar,
            setCollapsed: setIsCollapsed,
            isMobileMenuOpen,
            toggleMobileMenu,
            setMobileMenuOpen
        }}>
            {children}
        </SidebarContext.Provider>
    )
}

export function useSidebar() {
    const context = useContext(SidebarContext)
    if (context === undefined) {
        throw new Error('useSidebar must be used within a SidebarProvider')
    }
    return context
}
