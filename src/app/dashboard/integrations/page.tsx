import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { GoogleConnectButton } from './components/GoogleConnectButton'
import { CalendarDays, Network } from 'lucide-react'
import Image from 'next/image'

export default async function IntegrationsPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        redirect('/login')
    }

    // Buscar a clínica vinculada
    const { data: clinic } = await supabase
        .from('clinics')
        .select('google_refresh_token, google_access_token, google_calendar_id')
        .eq('owner_id', user.id)
        .single()

    // O médico está com a conexão habilitada se a tabela clinic já capturou o Refresh Token.
    const isGoogleConnected = !!(clinic?.google_refresh_token || clinic?.google_access_token);
    const savedCalendarsRaw = clinic?.google_calendar_id || null;

    return (
        <div className="space-y-8 animate-in fade-in zoom-in duration-500">
            <div>
                <h1 className="text-4xl font-bold tracking-tight text-foreground flex items-center gap-3">
                    <Network className="w-8 h-8 text-primary" />
                    Cérebro e Integrações
                </h1>
                <p className="text-muted-foreground text-lg mt-2">
                    Dê super poderes à inteligência artificial médica pareando seus aplicativos principais.
                </p>
            </div>

            <div className="grid gap-6">
                <Card className="bg-card/50 backdrop-blur-sm border-border/50 shadow-sm relative overflow-hidden flex flex-col md:flex-row items-center">
                    <div className="flex-1 md:pr-6 md:border-r border-border/50">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-3">
                                <Image src="/logos/google_calendar_logo.png" alt="Google Calendar Logo" width={32} height={32} className="object-contain" />
                                Google Calendar
                            </CardTitle>
                            <CardDescription className="text-base mt-2">
                                A mágica dos agendamentos autônomos. Permite que a IA médica faça consultas em tempo real da disponibilidade e adicione os eventos de marcação na hora para seus pacientes.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-sm text-foreground bg-muted/50 p-4 rounded-lg border border-border space-y-2">
                                <p className="text-primary font-medium">Permissão Necessária: <span className="text-foreground font-normal">Consulta e Agendamento de Eventos</span></p>
                                <p><strong>O que nosso Cérebro fará:</strong> Analisará as lacunas vazias do seu calendário para sugerir horários ativamente no WhatsApp e preencherá novos slots com os nomes dos interessados.</p>
                            </div>
                        </CardContent>
                    </div>
                    <div className="flex-1 p-6 flex items-center justify-center w-full md:w-auto h-full">
                        <GoogleConnectButton isConnected={isGoogleConnected} savedCalendarsRaw={savedCalendarsRaw} />
                    </div>
                </Card>
            </div>
        </div>
    )
}
