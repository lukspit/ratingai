'use client';

import { useEffect, useState } from 'react';
import { Loader2, Calendar as CalendarIcon, Save, Plus, X, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';

type CalendarItem = {
    id: string;
    summary: string;
    primary: boolean;
    color: string;
};

type ActiveCalendar = {
    id: string;
    summary: string;
    description: string;
};

export function CalendarSelector() {
    const [calendars, setCalendars] = useState<CalendarItem[]>([]);
    const [activeCalendars, setActiveCalendars] = useState<ActiveCalendar[]>([]);
    const [savedCalendars, setSavedCalendars] = useState<ActiveCalendar[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchCalendars();
    }, []);

    const fetchCalendars = async () => {
        try {
            const res = await fetch('/api/google/calendars');
            if (!res.ok) throw new Error('Falha ao buscar agendas');

            const data = await res.json();
            setCalendars(data.calendars);

            if (data.activeCalendars && data.activeCalendars.length > 0) {
                setActiveCalendars(data.activeCalendars);
                setSavedCalendars(data.activeCalendars);
            }
        } catch (err) {
            console.error(err);
            setError('Não foi possível carregar suas agendas do Google.');
        } finally {
            setIsLoading(false);
        }
    };

    const toggleCalendar = (cal: CalendarItem) => {
        setActiveCalendars(prev => {
            const exists = prev.find(a => a.id === cal.id);
            if (exists) {
                return prev.filter(a => a.id !== cal.id);
            }
            return [...prev, { id: cal.id!, summary: cal.summary, description: '' }];
        });
    };

    const updateDescription = (calId: string, description: string) => {
        setActiveCalendars(prev =>
            prev.map(a => a.id === calId ? { ...a, description } : a)
        );
    };

    const handleSave = async () => {
        if (activeCalendars.length === 0) return;

        setIsSaving(true);
        try {
            const res = await fetch('/api/google/calendars', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ calendars: activeCalendars })
            });

            if (!res.ok) throw new Error('Erro ao salvar agendas');

            setSavedCalendars([...activeCalendars]);
        } catch (err) {
            console.error(err);
            alert('Falha ao salvar as agendas selecionadas.');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-4 text-primary">
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                <span className="text-sm">Buscando suas agendas...</span>
            </div>
        );
    }

    if (error) {
        return <div className="p-4 text-sm text-destructive text-center">{error}</div>;
    }

    if (calendars.length === 0) {
        return <div className="p-4 text-sm text-yellow-500 text-center">Nenhuma agenda encontrada na sua conta.</div>;
    }

    const hasChanged = JSON.stringify(activeCalendars) !== JSON.stringify(savedCalendars);

    return (
        <div className="mt-4 p-4 border border-border bg-muted/30 rounded-lg space-y-4">
            <div>
                <h4 className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <CalendarIcon className="w-4 h-4" />
                    Quais agendas a IA deve gerenciar?
                </h4>
                <p className="text-xs text-muted-foreground mt-1">
                    Selecione uma ou mais agendas e descreva o propósito de cada uma para a IA saber quando usá-las.
                </p>
            </div>

            {/* Lista de agendas disponíveis */}
            <div className="space-y-2">
                {calendars.map((cal) => {
                    const isActive = activeCalendars.some(a => a.id === cal.id);
                    const activeCal = activeCalendars.find(a => a.id === cal.id);

                    return (
                        <div
                            key={cal.id}
                            className={`rounded-lg border transition-all duration-200 ${isActive
                                    ? 'border-primary/50 bg-primary/5'
                                    : 'border-border/50 bg-background hover:border-border'
                                }`}
                        >
                            {/* Header da agenda (clicável) */}
                            <button
                                type="button"
                                onClick={() => toggleCalendar(cal)}
                                className="w-full flex items-center gap-3 p-3 text-left"
                            >
                                {/* Checkbox visual */}
                                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors flex-shrink-0 ${isActive
                                        ? 'bg-primary border-primary'
                                        : 'border-muted-foreground/40'
                                    }`}>
                                    {isActive && (
                                        <svg className="w-3 h-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                        </svg>
                                    )}
                                </div>

                                {/* Color dot + nome */}
                                <div
                                    className="w-3 h-3 rounded-full flex-shrink-0"
                                    style={{ backgroundColor: cal.color || '#4285f4' }}
                                />
                                <span className="text-sm font-medium text-foreground flex-1">
                                    {cal.summary}
                                </span>
                                {cal.primary && (
                                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                                        Principal
                                    </span>
                                )}
                            </button>

                            {/* Campo de descrição (aparece quando ativo) */}
                            {isActive && (
                                <div className="px-3 pb-3 pt-0">
                                    <div className="flex items-start gap-2">
                                        <Info className="w-3.5 h-3.5 text-muted-foreground mt-2 flex-shrink-0" />
                                        <textarea
                                            value={activeCal?.description || ''}
                                            onChange={(e) => updateDescription(cal.id!, e.target.value)}
                                            placeholder="Descreva o propósito desta agenda para a IA (ex: Consultas de retorno, Exames Dr. João, Convênio Unimed)"
                                            className="w-full text-xs bg-background border border-border rounded-md px-3 py-2 text-foreground placeholder:text-muted-foreground/60 resize-none focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50"
                                            rows={2}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Ações */}
            <div className="flex items-center justify-between pt-1">
                <div>
                    {activeCalendars.length > 0 && (
                        <p className="text-xs text-muted-foreground">
                            {activeCalendars.length} agenda{activeCalendars.length !== 1 ? 's' : ''} selecionada{activeCalendars.length !== 1 ? 's' : ''}
                        </p>
                    )}
                    {!hasChanged && savedCalendars.length > 0 && (
                        <p className="text-xs text-primary/80 font-medium tracking-wide">Agendas ativas salvas ✓</p>
                    )}
                </div>

                <Button
                    onClick={handleSave}
                    disabled={!hasChanged || activeCalendars.length === 0 || isSaving}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                    Salvar
                </Button>
            </div>
        </div>
    );
}
