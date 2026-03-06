'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Radio, QrCode, Wifi, AlertTriangle, WifiOff, Loader2, RefreshCw, Smartphone, Clock, Bell } from 'lucide-react'
import Image from 'next/image'

interface ZapiStatus {
    connected: boolean
    smartphoneConnected: boolean
    error: string | null
    provisioning?: boolean
    notificationPhone?: string | null
}

interface QrCodeResponse {
    value?: string;
    error?: string;
}

export function WhatsAppManager({ initialIsProvisioning, initialIsConnected, instanceInfo }: { initialIsProvisioning: boolean, initialIsConnected: boolean, instanceInfo?: { id: string, zapi_instance_id: string } }) {
    const [isProvisioning, setIsProvisioning] = useState(initialIsProvisioning)
    const [isGenerating, setIsGenerating] = useState(false)
    const [isConnected, setIsConnected] = useState(initialIsConnected)
    const [showQR, setShowQR] = useState(false)
    const [qrCodeImage, setQrCodeImage] = useState<string | null>(null)
    const [notificationPhone, setNotificationPhone] = useState('')
    const [isSavingPhone, setIsSavingPhone] = useState(false)
    const [isChecking, setIsChecking] = useState(false)
    const [smartphoneConnected, setSmartphoneConnected] = useState(true)
    const [statusError, setStatusError] = useState<string | null>(null)
    const [lastChecked, setLastChecked] = useState<Date | null>(null)
    const [isDisconnecting, setIsDisconnecting] = useState(false)

    const checkRealStatus = async () => {
        setIsChecking(true)
        try {
            const res = await fetch('/api/whatsapp/status')
            if (res.ok) {
                const data: ZapiStatus = await res.json()
                setIsConnected(data.connected)
                setSmartphoneConnected(data.smartphoneConnected)
                setStatusError(data.error)
                setIsProvisioning(data.provisioning ?? false)
                if (data.notificationPhone) setNotificationPhone(data.notificationPhone)
                setLastChecked(new Date())

                // Se conectou enquanto estávamos mostrando o QR, tira o QR
                if (data.connected && showQR) {
                    setShowQR(false)
                }
            }
        } catch (err) {
            console.error('Erro ao verificar status Z-API:', err)
        } finally {
            setIsChecking(false)
        }
    }

    const handleSaveNotificationPhone = async () => {
        setIsSavingPhone(true)
        try {
            const res = await fetch('/api/whatsapp/notification', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ notification_phone: notificationPhone })
            })
            if (res.ok) {
                alert('Número de notificação salvo com sucesso!')
            } else {
                alert('Erro ao salvar número.')
            }
        } catch (err) {
            console.error(err)
            alert('Erro ao salvar número.')
        } finally {
            setIsSavingPhone(false)
        }
    }

    // Verificar status real ao montar o componente
    useEffect(() => {
        if (!isProvisioning) {
            checkRealStatus()
        }
    }, [isProvisioning])

    // Polling a cada 5s quando está aguardando scan do QR
    useEffect(() => {
        let interval: NodeJS.Timeout
        if (showQR && !isConnected && !isProvisioning) {
            interval = setInterval(() => {
                checkRealStatus()
            }, 5000)
        }
        return () => {
            if (interval) clearInterval(interval)
        }
    }, [showQR, isConnected, isProvisioning])


    const handleGenerateQR = async () => {
        setIsGenerating(true)
        setQrCodeImage(null)
        setStatusError(null)

        try {
            const res = await fetch('/api/whatsapp/qrcode')
            const data: QrCodeResponse = await res.json()

            if (res.ok && data.value) {
                setQrCodeImage(data.value)
                setShowQR(true)
            } else {
                setStatusError(data.error || 'Não foi possível gerar o QR Code no momento.')
            }
        } catch (err) {
            console.error('Erro ao gerar QR:', err)
            setStatusError('Erro interno ao buscar QR Code.')
        } finally {
            setIsGenerating(false)
        }
    }

    const handleDisconnect = async () => {
        if (!confirm('Tem certeza que deseja desconectar o WhatsApp? O atendimento por IA será interrompido.')) return;

        setIsDisconnecting(true)
        setStatusError(null)

        try {
            const res = await fetch('/api/whatsapp/disconnect', { method: 'POST' })
            const data = await res.json()

            if (res.ok && data.success) {
                setIsConnected(false)
                setShowQR(false)
                setQrCodeImage(null)
            } else {
                setStatusError(data.error || 'Não foi possível desconectar no momento.')
            }
        } catch (err) {
            console.error('Erro ao desconectar:', err)
            setStatusError('Erro interno ao tentar desconectar.')
        } finally {
            setIsDisconnecting(false)
        }
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
                        {(!isProvisioning && instanceInfo) && (
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
                    {isProvisioning ? (
                        <div className="flex flex-col items-center justify-center py-6 space-y-4">
                            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                                <Clock className="w-10 h-10 text-primary animate-pulse" />
                            </div>
                            <div className="text-center">
                                <h3 className="text-xl font-bold text-primary">Provisionando...</h3>
                                <p className="text-sm text-muted-foreground mt-2 max-w-[280px]">Estamos preparando sua infraestrutura dedicada de mensagens. Em breve você poderá conectar seu WhatsApp aqui.</p>
                            </div>
                        </div>
                    ) : isChecking && !lastChecked ? (
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
                                <div className="relative w-12 h-12">
                                    <Image src="/logos/whatsapp.png" alt="WhatsApp" fill className="object-contain" />
                                </div>
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
                                    Verificado às {lastChecked.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' })}
                                </p>
                            )}

                            <Button
                                variant="destructive"
                                onClick={handleDisconnect}
                                disabled={isDisconnecting}
                                className="mt-4 w-full sm:w-auto"
                            >
                                {isDisconnecting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Desconectando...
                                    </>
                                ) : (
                                    'Desconectar Z-API'
                                )}
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
                                    Verificado às {lastChecked.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' })}
                                </p>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Card do QR Code Dinâmico */}
            {!isProvisioning && !isConnected && !isChecking && (
                <Card className="bg-card/50 backdrop-blur-sm border-border/50 shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />

                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <QrCode className="w-5 h-5 text-primary" />
                            Vincular Aparelho
                        </CardTitle>
                        <CardDescription>
                            Aponte a câmera do WhatsApp para iniciar o atendimento IA.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center justify-center min-h-[250px]">

                        {!showQR && !isGenerating && (
                            <div className="text-center space-y-4 z-10 relative">
                                <p className="text-sm text-muted-foreground">
                                    Clique abaixo para buscar o QR Code da sua instância e conectar o número da clínica.
                                </p>
                                <Button onClick={handleGenerateQR} size="lg" className="w-full sm:w-auto shadow-primary/20 shadow-lg">
                                    Exibir QR Code
                                </Button>
                            </div>
                        )}

                        {isGenerating && (
                            <div className="flex flex-col items-center justify-center space-y-4 animate-pulse">
                                <div className="w-48 h-48 border-4 border-dashed border-primary/40 rounded-xl flex items-center justify-center">
                                    <span className="text-sm font-medium text-primary">Buscando...</span>
                                </div>
                                <p className="text-sm text-muted-foreground">Conectando à Z-API...</p>
                            </div>
                        )}

                        {showQR && qrCodeImage && (
                            <div className="flex flex-col items-center space-y-6 z-10 relative">
                                <div className="p-4 bg-white rounded-xl shadow-lg">
                                    <div className="relative w-[200px] h-[200px]">
                                        <Image
                                            src={qrCodeImage.startsWith('data:image') ? qrCodeImage : `data:image/png;base64,${qrCodeImage}`}
                                            alt="QR Code do WhatsApp"
                                            fill
                                            className="object-contain"
                                            unoptimized
                                        />
                                    </div>
                                </div>
                                <div className="text-center">
                                    <p className="text-sm font-medium text-primary">Escaneie o código acima no seu WhatsApp</p>
                                    <p className="text-xs text-muted-foreground mt-1 text-center">Configurações &gt; Aparelhos conectados &gt; Conectar aparelho</p>
                                </div>
                            </div>
                        )}

                    </CardContent>
                </Card>
            )}

            {/* Configuração de Notificações */}
            <Card className="bg-card/50 backdrop-blur-sm border-border/50 shadow-lg md:col-span-2">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Bell className="w-5 h-5 text-primary" />
                        Notificações de Agendamento
                    </CardTitle>
                    <CardDescription>
                        Receba um aviso no seu WhatsApp pessoal sempre que a IA fechar um agendamento para a clínica.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col sm:flex-row gap-4 items-end">
                        <div className="space-y-2 flex-grow">
                            <label htmlFor="notif_phone" className="text-sm font-medium">Seu Número de WhatsApp (com DDI +55)</label>
                            <Input
                                id="notif_phone"
                                placeholder="+5511999999999"
                                value={notificationPhone}
                                onChange={(e) => setNotificationPhone(e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground mt-1">Exemplo: +5511988887777. Deixe em branco se não quiser ser avisado.</p>
                        </div>
                        <Button
                            onClick={handleSaveNotificationPhone}
                            disabled={isSavingPhone}
                            className="w-full sm:w-auto shrink-0"
                        >
                            {isSavingPhone ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : 'Salvar Número'}
                        </Button>
                    </div>
                </CardContent>
            </Card>

        </div>
    )
}
