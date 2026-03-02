'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Server, Loader2 } from 'lucide-react'

export function ZapiStatusCard({ initialStatus, initialIsConnected, hasInstance }: {
    initialStatus: string
    initialIsConnected: boolean
    hasInstance: boolean
}) {
    const [status, setStatus] = useState(initialStatus)
    const [isConnected, setIsConnected] = useState(initialIsConnected)
    const [isChecking, setIsChecking] = useState(false)

    useEffect(() => {
        if (!hasInstance) return

        const checkStatus = async () => {
            setIsChecking(true)
            try {
                const res = await fetch('/api/whatsapp/status')
                if (res.ok) {
                    const data = await res.json()
                    setIsConnected(data.connected)
                    setStatus(data.connected ? 'Online' : 'Desconectada')
                }
            } catch (err) {
                console.error('Erro ao verificar status:', err)
            } finally {
                setIsChecking(false)
            }
        }

        checkStatus()
    }, [hasInstance])

    return (
        <Card className={`bg-card/50 backdrop-blur-sm border-border/50 shadow-lg relative overflow-hidden transition-all duration-300 group ${isConnected ? 'hover:shadow-green-500/10' : 'hover:shadow-destructive/10'}`}>
            <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl transition-colors duration-500 ${isConnected ? 'bg-green-500/10' : 'bg-destructive/10'}`} />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Status da Z-API</CardTitle>
                {isChecking ? (
                    <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />
                ) : (
                    <Server className={`h-4 w-4 ${isConnected ? 'text-green-500' : 'text-destructive'} group-hover:scale-110 transition-transform`} />
                )}
            </CardHeader>
            <CardContent>
                <div className={`text-3xl font-bold ${isChecking ? 'text-muted-foreground' : isConnected ? 'text-green-500' : 'text-destructive'}`}>
                    {isChecking ? 'Verificando...' : status}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                    {isChecking ? 'Consultando Z-API...' : isConnected ? 'Conectada na Z-API e operando.' : 'API offline.'}
                </p>
            </CardContent>
        </Card>
    )
}
