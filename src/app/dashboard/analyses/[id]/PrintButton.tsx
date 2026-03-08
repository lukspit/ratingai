'use client'

import { Button } from '@/components/ui/button'
import { Printer } from 'lucide-react'

export function PrintButton() {
    return (
        <Button variant="outline" className="flex items-center gap-2 shrink-0" onClick={() => window.print()}>
            <Printer className="w-4 h-4" />
            Exportar PDF
        </Button>
    )
}
