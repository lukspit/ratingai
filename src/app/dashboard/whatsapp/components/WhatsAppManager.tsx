'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Radio, QrCode, Wifi, AlertTriangle, WifiOff, Loader2, RefreshCw, Smartphone } from 'lucide-react'

interface ZapiStatus {
    connected: boolean
    smartphoneConnected: boolean
    error: string | null
}

export function WhatsAppManager({ initialIsConnected, instanceInfo }: { initialIsConnected: boolean, instanceInfo?: { id: string, zapi_instance_id: string } }) {
    const [isGenerating, setIsGenerating] = useState(false)
    const [isConnected, setIsConnected] = useState(initialIsConnected)
    const [showQR, setShowQR] = useState(false)
    const [isChecking, setIsChecking] = useState(false)
    const [smartphoneConnected, setSmartphoneConnected] = useState(true)
    const [statusError, setStatusError] = useState<string | null>(null)
    const [lastChecked, setLastChecked] = useState<Date | null>(null)

    const checkRealStatus = async () => {
        setIsChecking(true)
        try {
            const res = await fetch('/api/whatsapp/status')
            if (res.ok) {
                const data: ZapiStatus = await res.json()
                setIsConnected(data.connected)
                setSmartphoneConnected(data.smartphoneConnected)
                setStatusError(data.error)
                setLastChecked(new Date())
            }
        } catch (err) {
            console.error('Erro ao verificar status Z-API:', err)
        } finally {
            setIsChecking(false)
        }
    }

    // Verificar status real ao montar o componente
    useEffect(() => {
        if (instanceInfo) {
            checkRealStatus()
        }
    }, [instanceInfo])

    // Simulando delay da Z-API para futuro MVP
    const handleGenerateQR = () => {
        setIsGenerating(true)
        setTimeout(() => {
            setIsGenerating(false)
            setShowQR(true)
        }, 2000)
    }

    const handleSimulateConnected = () => {
        setShowQR(false)
        setIsConnected(true)
    }

    const handleDisconnect = () => {
        setIsConnected(false)
        setShowQR(false)
    }

    return (
        <div className="grid gap-6 md:grid-cols-2">

            {/* Card de Status */}
            <Card className="bg-card/50 backdrop-blur-sm border-border/50 shadow-lg">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Radio className="w-5 h-5 text-primary" />
                                Sua Instância (Z-API)
                            </CardTitle>
                            <CardDescription>Status da conexão com a central de mensagens.</CardDescription>
                        </div>
                        {instanceInfo && (
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={checkRealStatus}
                                disabled={isChecking}
                                title="Verificar status agora"
                            >
                                <RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} />
                            </Button>
                        )}
                    </div>
                </CardHeader>
                <CardContent>
                    {isChecking && !lastChecked ? (
                        // Primeiro check — loading
                        <div className="flex flex-col items-center justify-center py-6 space-y-4">
                            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
                                <Loader2 className="w-10 h-10 text-muted-foreground animate-spin" />
                            </div>
                            <div className="text-center">
                                <h3 className="text-xl font-bold text-muted-foreground">Verificando...</h3>
                                <p className="text-sm text-muted-foreground mt-1">Consultando status real na Z-API.</p>
                            </div>
                        </div>
                    ) : isConnected ? (
                        <div className="flex flex-col items-center justify-center py-6 space-y-4">
                            <div className="w-20 h-20 rounded-full bg-secondary/10 flex items-center justify-center relative">
                                <div className="absolute inset-0 rounded-full animate-ping bg-secondary/20" />
                                <Wifi className="w-10 h-10 text-secondary" />
                            </div>
                            <div className="text-center">
                                <h3 className="text-xl font-bold text-secondary">Conectado e Operando</h3>
                                <p className="text-sm text-muted-foreground mt-1">A IA está monitorando as mensagens.</p>
                                {instanceInfo && (
                                    <p className="text-xs text-muted-foreground mt-2">ID: {instanceInfo.zapi_instance_id}</p>
                                )}
                            </div>

                            {/* Aviso se celular sem internet */}
                            {!smartphoneConnected && (
                                <div className="w-full p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-600 text-sm flex items-start gap-2">
                                    <Smartphone className="w-4 h-4 mt-0.5 shrink-0" />
                                    <p>O celular vinculado parece estar sem internet. As mensagens podem não ser entregues até a conexão voltar.</p>
                                </div>
                            )}

                            {lastChecked && (
                                <p className="text-[11px] text-muted-foreground">
                                    Verificado às {lastChecked.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            )}

                            <Button variant="outline" onClick={handleDisconnect} className="mt-4 text-destructive border-destructive/30 hover:bg-destructive/10">
                                Desconectar Instância
                            </Button>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-6 space-y-4">
                            <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center">
                                <WifiOff className="w-10 h-10 text-destructive" />
                            </div>
                            <div className="text-center">
                                <h3 className="text-xl font-bold text-destructive">Desconectado</h3>
                                <p className="text-sm text-muted-foreground mt-1">Nenhum número vinculado no momento.</p>
                            </div>

                            {/* Aviso com detalhes do erro */}
                            {statusError && (
                                <div className="w-full p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm flex items-start gap-2">
                                    <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                                    <p>{statusError}</p>
                                </div>
                            )}

                            {lastChecked && (
                                <p className="text-[11px] text-muted-foreground">
                                    Verificado às {lastChecked.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Card do QR Code Dinâmico */}
            {!isConnected && !isChecking && (
                <Card className="bg-card/50 backdrop-blur-sm border-border/50 shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />

                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <QrCode className="w-5 h-5 text-primary" />
                            Vincular Novo Aparelho
                        </CardTitle>
                        <CardDescription>
                            Aponte a câmera do WhatsApp para iniciar o atendimento IA.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center justify-center min-h-[250px]">

                        {!showQR && !isGenerating && (
                            <div className="text-center space-y-4">
                                <p className="text-sm text-muted-foreground">
                                    Clique abaixo para solicitar uma nova ponte criptografada com a Z-API.
                                </p>
                                <Button onClick={handleGenerateQR} size="lg" className="w-full sm:w-auto shadow-primary/20 shadow-lg">
                                    Gerar QR Code de Conexão
                                </Button>
                            </div>
                        )}

                        {isGenerating && (
                            <div className="flex flex-col items-center justify-center space-y-4 animate-pulse">
                                <div className="w-48 h-48 border-4 border-dashed border-primary/40 rounded-xl flex items-center justify-center">
                                    <span className="text-sm font-medium text-primary">Provisionando...</span>
                                </div>
                                <p className="text-sm text-muted-foreground">Alocando infraestrutura na Z-API...</p>
                            </div>
                        )}

                        {showQR && (
                            <div className="flex flex-col items-center space-y-6">
                                {/* Mock do QR Code */}
                                <div className="p-4 bg-white rounded-xl shadow-lg relative cursor-pointer" onClick={handleSimulateConnected} title="Clique aqui para simular que escaneou">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="1" strokeLinecap="square" strokeLinejoin="miter">
                                        <rect x="3" y="3" width="7" height="7"></rect>
                                        <rect x="14" y="3" width="7" height="7"></rect>
                                        <rect x="14" y="14" width="7" height="7"></rect>
                                        <rect x="3" y="14" width="7" height="7"></rect>
                                        <rect x="5" y="5" width="3" height="3"></rect>
                                        <rect x="16" y="5" width="3" height="3"></rect>
                                        <rect x="16" y="16" width="3" height="3"></rect>
                                        <rect x="5" y="16" width="3" height="3"></rect>
                                        <path d="M12 3v18"></path>
                                        <path d="M3 12h18"></path>
                                    </svg>
                                    <div className="absolute inset-0 bg-primary/10 animate-pulse rounded-xl" />
                                </div>
                                <div className="text-center">
                                    <p className="text-sm font-medium text-primary">(Simulação: Clique no QR Code para conectar)</p>
                                </div>
                            </div>
                        )}

                    </CardContent>
                </Card>
            )}
        </div>
    )
}
