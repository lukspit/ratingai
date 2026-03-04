'use client'

import { useState, useRef } from 'react'
import { Card } from '@/components/ui/card'
import {
    UserPlus, MessageSquare, Star, CalendarCheck, CheckCircle2, XCircle,
    Phone, Clock, GripVertical, User, Loader2, Bot, UserRound
} from 'lucide-react'

// ============================================================================
// TIPOS
// ============================================================================
export interface KanbanLead {
    id: string
    phoneNumber: string
    name: string | null
    leadStatus: string
    createdAt: string
    aiPaused: boolean
    lastMessage: string | null
    lastMessageAt: string | null
}

// ============================================================================
// CONFIGURAÇÃO DAS COLUNAS
// ============================================================================
const COLUMNS = [
    {
        id: 'NOVO',
        label: 'Novo',
        icon: UserPlus,
        color: 'blue',
        bgGradient: 'from-blue-500/10 to-blue-600/5',
        borderColor: 'border-blue-500/30',
        headerBg: 'bg-blue-500/15',
        textColor: 'text-blue-400',
        badgeBg: 'bg-blue-500/20 text-blue-300',
        dotColor: 'bg-blue-400',
        cardHover: 'hover:border-blue-500/40',
    },
    {
        id: 'EM_ATENDIMENTO',
        label: 'Em Atendimento',
        icon: MessageSquare,
        color: 'yellow',
        bgGradient: 'from-yellow-500/10 to-amber-600/5',
        borderColor: 'border-yellow-500/30',
        headerBg: 'bg-yellow-500/15',
        textColor: 'text-yellow-400',
        badgeBg: 'bg-yellow-500/20 text-yellow-300',
        dotColor: 'bg-yellow-400',
        cardHover: 'hover:border-yellow-500/40',
    },
    {
        id: 'INTERESSE',
        label: 'Interesse',
        icon: Star,
        color: 'orange',
        bgGradient: 'from-orange-500/10 to-orange-600/5',
        borderColor: 'border-orange-500/30',
        headerBg: 'bg-orange-500/15',
        textColor: 'text-orange-400',
        badgeBg: 'bg-orange-500/20 text-orange-300',
        dotColor: 'bg-orange-400',
        cardHover: 'hover:border-orange-500/40',
    },
    {
        id: 'AGENDADO',
        label: 'Agendado',
        icon: CalendarCheck,
        color: 'green',
        bgGradient: 'from-emerald-500/10 to-green-600/5',
        borderColor: 'border-emerald-500/30',
        headerBg: 'bg-emerald-500/15',
        textColor: 'text-emerald-400',
        badgeBg: 'bg-emerald-500/20 text-emerald-300',
        dotColor: 'bg-emerald-400',
        cardHover: 'hover:border-emerald-500/40',
    },
    {
        id: 'CONCLUIDO',
        label: 'Concluído',
        icon: CheckCircle2,
        color: 'slate',
        bgGradient: 'from-slate-500/10 to-slate-600/5',
        borderColor: 'border-slate-500/30',
        headerBg: 'bg-slate-500/15',
        textColor: 'text-slate-400',
        badgeBg: 'bg-slate-500/20 text-slate-300',
        dotColor: 'bg-slate-400',
        cardHover: 'hover:border-slate-500/40',
    },
    {
        id: 'PERDIDO',
        label: 'Perdido',
        icon: XCircle,
        color: 'red',
        bgGradient: 'from-red-500/10 to-red-600/5',
        borderColor: 'border-red-500/30',
        headerBg: 'bg-red-500/15',
        textColor: 'text-red-400',
        badgeBg: 'bg-red-500/20 text-red-300',
        dotColor: 'bg-red-400',
        cardHover: 'hover:border-red-500/40',
    },
]

// ============================================================================
// HELPERS
// ============================================================================
function timeAgo(dateStr: string | null): string {
    if (!dateStr) return ''
    const diff = Date.now() - new Date(dateStr).getTime()
    const minutes = Math.floor(diff / 60000)
    if (minutes < 1) return 'agora'
    if (minutes < 60) return `${minutes}min`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h`
    const days = Math.floor(hours / 24)
    return `${days}d`
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================
export function KanbanBoard({ leads }: { leads: KanbanLead[] }) {
    const [leadsState, setLeadsState] = useState<KanbanLead[]>(leads)
    const [draggedLead, setDraggedLead] = useState<KanbanLead | null>(null)
    const [dragOverColumn, setDragOverColumn] = useState<string | null>(null)
    const [updatingLead, setUpdatingLead] = useState<string | null>(null)
    const dragCounter = useRef<Record<string, number>>({})

    // Agrupa leads por status
    const columnLeads: Record<string, KanbanLead[]> = {}
    for (const col of COLUMNS) {
        columnLeads[col.id] = leadsState.filter(l => l.leadStatus === col.id)
    }

    // === DRAG & DROP HANDLERS ===
    const handleDragStart = (e: React.DragEvent, lead: KanbanLead) => {
        setDraggedLead(lead)
        e.dataTransfer.effectAllowed = 'move'
        e.dataTransfer.setData('text/plain', lead.id)
        // Styling do ghost
        const el = e.currentTarget as HTMLElement
        el.style.opacity = '0.4'
    }

    const handleDragEnd = (e: React.DragEvent) => {
        const el = e.currentTarget as HTMLElement
        el.style.opacity = '1'
        setDraggedLead(null)
        setDragOverColumn(null)
        dragCounter.current = {}
    }

    const handleDragEnter = (e: React.DragEvent, columnId: string) => {
        e.preventDefault()
        if (!dragCounter.current[columnId]) dragCounter.current[columnId] = 0
        dragCounter.current[columnId]++
        setDragOverColumn(columnId)
    }

    const handleDragLeave = (e: React.DragEvent, columnId: string) => {
        e.preventDefault()
        dragCounter.current[columnId]--
        if (dragCounter.current[columnId] <= 0) {
            dragCounter.current[columnId] = 0
            if (dragOverColumn === columnId) setDragOverColumn(null)
        }
    }

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
        e.dataTransfer.dropEffect = 'move'
    }

    const handleDrop = async (e: React.DragEvent, targetColumnId: string) => {
        e.preventDefault()
        setDragOverColumn(null)
        dragCounter.current = {}

        if (!draggedLead || draggedLead.leadStatus === targetColumnId) return

        const leadToUpdate = draggedLead
        const previousStatus = leadToUpdate.leadStatus

        // Optimistic update
        setLeadsState(prev =>
            prev.map(l =>
                l.id === leadToUpdate.id ? { ...l, leadStatus: targetColumnId } : l
            )
        )
        setUpdatingLead(leadToUpdate.id)
        setDraggedLead(null)

        try {
            const res = await fetch(
                `/api/patients/${encodeURIComponent(leadToUpdate.phoneNumber)}/status`,
                {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: targetColumnId }),
                }
            )

            if (!res.ok) {
                throw new Error('Erro ao atualizar status')
            }
        } catch (err) {
            console.error('[KANBAN] Erro ao mover lead:', err)
            // Rollback
            setLeadsState(prev =>
                prev.map(l =>
                    l.id === leadToUpdate.id ? { ...l, leadStatus: previousStatus } : l
                )
            )
        } finally {
            setUpdatingLead(null)
        }
    }

    return (
        <div className="flex gap-4 overflow-x-auto pb-4 min-h-[calc(100vh-220px)]">
            {COLUMNS.map(col => {
                const colLeads = columnLeads[col.id] || []
                const isDropTarget = dragOverColumn === col.id && draggedLead?.leadStatus !== col.id
                const Icon = col.icon

                return (
                    <div
                        key={col.id}
                        className={`flex-shrink-0 w-[280px] flex flex-col rounded-xl transition-all duration-300 ${isDropTarget
                                ? `bg-gradient-to-b ${col.bgGradient} border-2 border-dashed ${col.borderColor} scale-[1.02] shadow-lg`
                                : 'bg-card/30 border border-border/50'
                            }`}
                        onDragEnter={(e) => handleDragEnter(e, col.id)}
                        onDragLeave={(e) => handleDragLeave(e, col.id)}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, col.id)}
                    >
                        {/* Column Header */}
                        <div className={`p-3 rounded-t-xl ${col.headerBg} border-b border-border/30`}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${col.dotColor} animate-pulse`} />
                                    <Icon className={`w-4 h-4 ${col.textColor}`} />
                                    <span className={`text-sm font-semibold ${col.textColor}`}>
                                        {col.label}
                                    </span>
                                </div>
                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${col.badgeBg}`}>
                                    {colLeads.length}
                                </span>
                            </div>
                        </div>

                        {/* Column Body */}
                        <div className="flex-1 p-2 space-y-2 overflow-y-auto max-h-[calc(100vh-320px)] custom-scrollbar">
                            {colLeads.length === 0 ? (
                                <div className={`flex flex-col items-center justify-center py-8 text-center transition-all ${isDropTarget ? 'opacity-100' : 'opacity-40'
                                    }`}>
                                    <Icon className={`w-8 h-8 mb-2 ${col.textColor}`} />
                                    <p className="text-xs text-muted-foreground">
                                        {isDropTarget ? 'Solte aqui' : 'Nenhum lead'}
                                    </p>
                                </div>
                            ) : (
                                colLeads.map(lead => (
                                    <LeadCard
                                        key={lead.id}
                                        lead={lead}
                                        column={col}
                                        isUpdating={updatingLead === lead.id}
                                        onDragStart={handleDragStart}
                                        onDragEnd={handleDragEnd}
                                    />
                                ))
                            )}
                        </div>
                    </div>
                )
            })}
        </div>
    )
}

// ============================================================================
// LEAD CARD
// ============================================================================
function LeadCard({
    lead,
    column,
    isUpdating,
    onDragStart,
    onDragEnd,
}: {
    lead: KanbanLead
    column: typeof COLUMNS[number]
    isUpdating: boolean
    onDragStart: (e: React.DragEvent, lead: KanbanLead) => void
    onDragEnd: (e: React.DragEvent) => void
}) {
    return (
        <Card
            draggable
            onDragStart={(e) => onDragStart(e, lead)}
            onDragEnd={onDragEnd}
            className={`p-3 cursor-grab active:cursor-grabbing transition-all duration-200 
                bg-card/80 backdrop-blur-sm border-border/50 
                hover:shadow-md ${column.cardHover} hover:-translate-y-0.5
                ${isUpdating ? 'opacity-60 pointer-events-none' : ''}
                group relative overflow-hidden`}
        >
            {/* Accent bar */}
            <div className={`absolute left-0 top-0 bottom-0 w-1 ${column.dotColor} rounded-l-lg opacity-60 group-hover:opacity-100 transition-opacity`} />

            <div className="pl-2">
                {/* Header: nome/telefone + grip */}
                <div className="flex items-start justify-between gap-1 mb-2">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                        <div className={`w-7 h-7 rounded-full ${column.headerBg} flex items-center justify-center shrink-0`}>
                            {lead.name ? (
                                <User className={`w-3.5 h-3.5 ${column.textColor}`} />
                            ) : (
                                <Phone className={`w-3.5 h-3.5 ${column.textColor}`} />
                            )}
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-semibold text-foreground truncate leading-tight">
                                {lead.name || formatPhone(lead.phoneNumber)}
                            </p>
                            {lead.name && (
                                <p className="text-[10px] text-muted-foreground truncate">
                                    {formatPhone(lead.phoneNumber)}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                        {isUpdating ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
                        ) : (
                            <GripVertical className="w-3.5 h-3.5 text-muted-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity" />
                        )}
                    </div>
                </div>

                {/* Last message preview */}
                {lead.lastMessage && (
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed mb-2">
                        {cleanMessagePreview(lead.lastMessage)}
                    </p>
                )}

                {/* Footer: time + status */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                        {lead.lastMessageAt && (
                            <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                <Clock className="w-2.5 h-2.5" />
                                {timeAgo(lead.lastMessageAt)}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-1">
                        <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-medium ${lead.aiPaused
                                ? 'bg-amber-500/15 text-amber-500'
                                : 'bg-emerald-500/15 text-emerald-500'
                            }`}>
                            {lead.aiPaused ? (
                                <><UserRound className="w-2.5 h-2.5" /> Manual</>
                            ) : (
                                <><Bot className="w-2.5 h-2.5" /> IA</>
                            )}
                        </span>
                    </div>
                </div>
            </div>
        </Card>
    )
}

// ============================================================================
// UTILS
// ============================================================================
function formatPhone(phone: string): string {
    // Formata 5511999999999 → (11) 99999-9999
    const cleaned = phone.replace(/\D/g, '')
    if (cleaned.length === 13 && cleaned.startsWith('55')) {
        const ddd = cleaned.slice(2, 4)
        const part1 = cleaned.slice(4, 9)
        const part2 = cleaned.slice(9, 13)
        return `(${ddd}) ${part1}-${part2}`
    }
    return phone
}

function cleanMessagePreview(content: string): string {
    // Remove marcadores de ferramenta/sistema
    if (content.startsWith('[MEMÓRIA DE SISTEMA')) {
        const parts = content.split('\n\n')
        return parts.length > 1 ? parts.slice(1).join(' ').slice(0, 100) : content.slice(0, 100)
    }
    return content.slice(0, 100)
}
