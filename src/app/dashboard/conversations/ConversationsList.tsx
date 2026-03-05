'use client'

import { useState, useRef, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Phone, Clock, User, X, Inbox, MousePointerClick, Bot, UserRound, Loader2, ChevronLeft, Send } from 'lucide-react'

export interface Message {
    id?: string;
    instance_id: string;
    phone_number: string;
    role: 'user' | 'assistant';
    content: string;
    created_at: string;
}

export interface Lead {
    phoneNumber: string;
    name?: string | null;
    lastMessage: string;
    lastMessageTime: string;
    messages: Message[];
    aiPaused: boolean;
}

function AiToggleBadge({ phoneNumber, isPaused, onToggle }: {
    phoneNumber: string;
    isPaused: boolean;
    onToggle: (newState: boolean) => void;
}) {
    const [loading, setLoading] = useState(false)

    const handleClick = async (e: React.MouseEvent) => {
        e.stopPropagation()
        setLoading(true)
        try {
            const res = await fetch(`/api/patients/${encodeURIComponent(phoneNumber)}/ai-toggle`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ paused: !isPaused })
            })
            if (res.ok) {
                onToggle(!isPaused)
            }
        } catch (err) {
            console.error('Erro ao alternar IA:', err)
        } finally {
            setLoading(false)
        }
    }

    return (
        <button
            onClick={handleClick}
            disabled={loading}
            className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium transition-all shrink-0 ${isPaused
                ? 'bg-amber-500/15 text-amber-600 hover:bg-amber-500/25'
                : 'bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/25'
                }`}
            title={isPaused ? 'Secretária no controle. Clique para devolver à IA.' : 'IA ativa. Clique para assumir.'}
        >
            {loading ? (
                <Loader2 className="w-3 h-3 animate-spin" />
            ) : isPaused ? (
                <UserRound className="w-3 h-3" />
            ) : (
                <Bot className="w-3 h-3" />
            )}
            {isPaused ? 'Manual' : 'IA'}
        </button>
    )
}

function AiToggleButton({ phoneNumber, isPaused, onToggle }: {
    phoneNumber: string;
    isPaused: boolean;
    onToggle: (newState: boolean) => void;
}) {
    const [loading, setLoading] = useState(false)

    const handleClick = async () => {
        setLoading(true)
        try {
            const res = await fetch(`/api/patients/${encodeURIComponent(phoneNumber)}/ai-toggle`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ paused: !isPaused })
            })
            if (res.ok) {
                onToggle(!isPaused)
            }
        } catch (err) {
            console.error('Erro ao alternar IA:', err)
        } finally {
            setLoading(false)
        }
    }

    return (
        <button
            onClick={handleClick}
            disabled={loading}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${isPaused
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-600 hover:bg-amber-500/20'
                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/20'
                }`}
        >
            {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
            ) : isPaused ? (
                <UserRound className="w-4 h-4" />
            ) : (
                <Bot className="w-4 h-4" />
            )}
            {isPaused ? 'Secretária no Controle' : 'IA Ativa'}
        </button>
    )
}

export function ConversationsList({ leads }: { leads: Lead[] }) {
    const [leadsState, setLeadsState] = useState<Lead[]>(leads)
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
    const [messageText, setMessageText] = useState('')
    const [isSending, setIsSending] = useState(false)
    const scrollRef = useRef<HTMLDivElement>(null)

    // Auto-scroll ao abrir conversa ou receber novas mensagens
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [selectedLead, selectedLead?.messages.length])

    const formatPhone = (phone: string) => {
        const cleaned = phone.replace(/\D/g, '')
        if (cleaned.length === 13 && cleaned.startsWith('55')) {
            const ddd = cleaned.slice(2, 4)
            const part1 = cleaned.slice(4, 9)
            const part2 = cleaned.slice(9, 13)
            return `(${ddd}) ${part1}-${part2}`
        }
        return phone
    }

    const handleToggle = (phoneNumber: string, newPaused: boolean) => {
        setLeadsState(prev => prev.map(l =>
            l.phoneNumber === phoneNumber ? { ...l, aiPaused: newPaused } : l
        ))
        if (selectedLead?.phoneNumber === phoneNumber) {
            setSelectedLead(prev => prev ? { ...prev, aiPaused: newPaused } : null)
        }
    }

    const handleSendMessage = async (e?: React.FormEvent) => {
        if (e) e.preventDefault()
        if (!selectedLead || !messageText.trim() || isSending || !selectedLead.aiPaused) return

        setIsSending(true)
        try {
            // Pegamos o instance_id da primeira mensagem disponível como referência
            // Na nossa interface idealmente o Lead já deveria ter o instance_id direto,
            // mas como as mensagens têm, pegamos de lá.
            const instanceId = selectedLead.messages[0]?.instance_id

            if (!instanceId) {
                console.error('Instance ID não encontrado para o lead')
                return
            }

            const response = await fetch('/api/messages/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    phoneNumber: selectedLead.phoneNumber,
                    message: messageText,
                    instanceId: instanceId
                })
            })

            if (response.ok) {
                // Adicionamos a mensagem localmente para feedback instantâneo
                const newMsg: Message = {
                    instance_id: instanceId,
                    phone_number: selectedLead.phoneNumber,
                    role: 'assistant',
                    content: messageText,
                    created_at: new Date().toISOString()
                }

                const updatedLeads = leadsState.map(l => {
                    if (l.phoneNumber === selectedLead.phoneNumber) {
                        return {
                            ...l,
                            lastMessage: messageText,
                            lastMessageTime: newMsg.created_at,
                            messages: [...l.messages, newMsg]
                        }
                    }
                    return l
                })

                setLeadsState(updatedLeads)
                setSelectedLead(prev => prev ? {
                    ...prev,
                    lastMessage: messageText,
                    lastMessageTime: newMsg.created_at,
                    messages: [...prev.messages, newMsg]
                } : null)
                setMessageText('')
            } else {
                console.error('Erro ao enviar mensagem')
            }
        } catch (err) {
            console.error('Erro na requisição de envio:', err)
        } finally {
            setIsSending(false)
        }
    }

    if (leadsState.length === 0) {
        return (
            <Card className="p-8 text-center bg-card border-border mt-6 shadow-sm">
                <Inbox className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold text-foreground">Nenhuma conversa encontrada</h3>
                <p className="text-muted-foreground mt-2">Assim que a IA começar a atender, os leads aparecerão aqui.</p>
            </Card>
        )
    }

    return (
        <div className="flex flex-col md:grid md:grid-cols-3 gap-6 h-[calc(100vh-180px)] md:h-[calc(100vh-200px)] min-h-[500px]">
            {/* Leads List */}
            <div className={`md:col-span-1 space-y-3 overflow-y-auto pr-2 custom-scrollbar ${selectedLead ? 'hidden md:block' : 'block'}`}>
                {leadsState.map(lead => (
                    <Card
                        key={lead.phoneNumber}
                        className={`p-4 cursor-pointer transition-all hover:translate-x-1 hover:shadow-sm border-border bg-card/50 backdrop-blur-md ${selectedLead?.phoneNumber === lead.phoneNumber ? 'ring-1 ring-primary bg-primary/5 shadow-sm' : ''}`}
                        onClick={() => setSelectedLead(lead)}
                    >
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shadow-sm">
                                <Phone className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <h4 className="font-semibold text-foreground tracking-wide truncate">
                                        {lead.name || formatPhone(lead.phoneNumber)}
                                    </h4>
                                    {/* Lugar 2: Badge compacto na lista de leads */}
                                    <AiToggleBadge
                                        phoneNumber={lead.phoneNumber}
                                        isPaused={lead.aiPaused}
                                        onToggle={(newState) => handleToggle(lead.phoneNumber, newState)}
                                    />
                                </div>
                                {lead.name && (
                                    <div className="text-[11px] text-muted-foreground -mt-0.5 mb-0.5">
                                        {formatPhone(lead.phoneNumber)}
                                    </div>
                                )}
                                <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                                    <Clock className="w-3 h-3" />
                                    {new Date(lead.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                            </div>
                        </div>
                        <p className="text-sm text-muted-foreground truncate line-clamp-2 leading-relaxed">
                            {lead.lastMessage}
                        </p>
                    </Card>
                ))}
            </div>

            {/* Simulated WhatsApp Interface */}
            <div className={`md:col-span-2 h-full flex flex-col min-h-0 ${selectedLead ? 'block' : 'hidden md:flex'}`}>
                {selectedLead ? (
                    <Card className="flex flex-col h-full bg-card border-border shadow-sm relative overflow-hidden rounded-xl">
                        {/* Header */}
                        <div className="flex items-center justify-between p-3 md:p-4 bg-muted/50 border-b border-border shadow-sm z-10 shrink-0">
                            <div className="flex items-center gap-2 md:gap-3">
                                <button
                                    onClick={() => setSelectedLead(null)}
                                    className="md:hidden p-1 -ml-1 text-muted-foreground hover:text-foreground"
                                >
                                    <ChevronLeft className="w-6 h-6" />
                                </button>
                                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                    <User className="w-4 h-4 md:w-5 md:h-5" />
                                </div>
                                <div className="min-w-0">
                                    <h4 className="font-semibold text-foreground tracking-wide text-sm md:text-base truncate">
                                        {selectedLead.name || formatPhone(selectedLead.phoneNumber)}
                                    </h4>
                                    <p className="text-[10px] md:text-xs text-muted-foreground">
                                        {selectedLead.name ? formatPhone(selectedLead.phoneNumber) : 'Paciente ativo'}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {/* Lugar 1: Botão completo no header do chat */}
                                <AiToggleButton
                                    phoneNumber={selectedLead.phoneNumber}
                                    isPaused={selectedLead.aiPaused}
                                    onToggle={(newState) => handleToggle(selectedLead.phoneNumber, newState)}
                                />
                                <button onClick={() => setSelectedLead(null)} className="hidden md:block text-muted-foreground hover:text-foreground transition-colors">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                        </div>

                        {/* Background Clean Canvas */}
                        <div className="absolute inset-0 top-[73px] z-0 bg-secondary/5"></div>

                        {/* Chat Body */}
                        <div
                            ref={scrollRef}
                            className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 z-10 flex flex-col custom-scrollbar scroll-smooth"
                        >
                            <div className="text-center my-4 shrink-0">
                                <span className="px-3 py-1 bg-muted/80 text-muted-foreground text-xs rounded-lg uppercase tracking-wider font-semibold shadow-sm">
                                    Início da Conversa Ativa
                                </span>
                            </div>

                            {selectedLead.messages.map((msg, index) => {
                                const isUser = msg.role === 'user'
                                return (
                                    <div key={msg.id || `${msg.created_at}-${index}`} className={`flex ${isUser ? 'justify-start' : 'justify-end'} shrink-0`}>
                                        <div className={`max-w-[85%] rounded-lg p-3 relative shadow-sm ${isUser ? 'bg-background text-foreground rounded-tl-none border border-border' : 'bg-primary text-primary-foreground rounded-tr-none border border-primary'}`}>
                                            <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                                            <div className="flex justify-end gap-1 mt-1.5 opacity-80">
                                                <span className={`text-[10px] ${isUser ? 'text-muted-foreground' : 'text-primary-foreground/80'}`}>
                                                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>

                        {/* Message Input Section */}
                        <div className="p-3 md:p-4 bg-muted/30 border-t border-border z-10 shrink-0">
                            {!selectedLead.aiPaused ? (
                                <div className="flex flex-col items-center justify-center py-2 bg-amber-500/5 rounded-lg border border-amber-500/10 mb-2">
                                    <p className="text-[11px] md:text-xs text-amber-600 font-medium flex items-center gap-1.5">
                                        <Bot className="w-3 h-3 md:w-3.5 md:h-3.5" />
                                        Inteligência Artificial Ativa
                                    </p>
                                    <p className="text-[9px] md:text-[10px] text-amber-500/80">
                                        Pause a IA no topo para assumir o controle e responder manualmente.
                                    </p>
                                </div>
                            ) : null}

                            <form
                                onSubmit={handleSendMessage}
                                className={`flex items-center gap-2 p-1.5 rounded-xl border transition-all ${selectedLead.aiPaused
                                    ? 'bg-background border-primary/20 focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/20 shadow-sm'
                                    : 'bg-muted/50 border-border/50 opacity-60'
                                    }`}
                            >
                                <input
                                    type="text"
                                    value={messageText}
                                    onChange={(e) => setMessageText(e.target.value)}
                                    placeholder={selectedLead.aiPaused ? "Digite sua resposta..." : "IA em controle..."}
                                    disabled={!selectedLead.aiPaused || isSending}
                                    className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-1.5 md:py-2 px-2 text-foreground placeholder:text-muted-foreground disabled:cursor-not-allowed"
                                />
                                <button
                                    type="submit"
                                    disabled={!selectedLead.aiPaused || !messageText.trim() || isSending}
                                    className={`p-2 rounded-lg transition-all ${selectedLead.aiPaused && messageText.trim() && !isSending
                                        ? 'bg-primary text-primary-foreground hover:scale-105 active:scale-95 shadow-md hover:shadow-primary/20'
                                        : 'bg-muted text-muted-foreground cursor-not-allowed'
                                        }`}
                                >
                                    {isSending ? (
                                        <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin" />
                                    ) : (
                                        <Send className="w-4 h-4 md:w-5 md:h-5" />
                                    )}
                                </button>
                            </form>
                        </div>
                    </Card>
                ) : (
                    <Card className="flex flex-col items-center justify-center h-full bg-card/50 backdrop-blur-md border-border border-dashed shadow-sm">
                        <MousePointerClick className="w-16 h-16 text-primary/40 mb-4 animate-pulse" />
                        <h4 className="text-xl font-semibold text-foreground">Nenhum Lead Selecionado</h4>
                        <p className="text-sm text-muted-foreground mt-2 text-center max-w-[250px]">Clique em um chat à esquerda para visualizar todo o histórico da conversa entre o cliente e a IA Médica.</p>
                    </Card>
                )}
            </div>
        </div>
    )
}
