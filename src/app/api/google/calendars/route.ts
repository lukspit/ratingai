import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import { google } from 'googleapis';

// Tipo para uma agenda ativa salva no banco
export type ActiveCalendar = {
    id: string;
    summary: string;
    description: string;
};

/**
 * Faz o parse seguro do google_calendar_id.
 * Aceita tanto o formato legado (string simples) quanto o novo formato (JSON array).
 */
function parseActiveCalendars(raw: string | null): ActiveCalendar[] {
    if (!raw) return [];

    try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
    } catch {
        // Formato legado: string simples com o ID da agenda
        return [{ id: raw, summary: 'Agenda Principal', description: '' }];
    }

    return [];
}

export async function GET(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Buscar as credenciais do Google salvas na clínica do médico
        const { data: clinic, error: clinicError } = await supabase
            .from('clinics')
            .select('google_access_token, google_refresh_token, google_calendar_id')
            .eq('owner_id', user.id)
            .single();

        if (clinicError || !clinic || !clinic.google_refresh_token) {
            return NextResponse.json({ error: 'Google Calendar not connected' }, { status: 400 });
        }

        const oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET
        );

        oauth2Client.setCredentials({
            access_token: clinic.google_access_token,
            refresh_token: clinic.google_refresh_token,
        });

        const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

        // Buscar a lista de agendas
        const response = await calendar.calendarList.list({
            minAccessRole: 'writer',
        });

        const calendars = response.data.items?.map(cal => ({
            id: cal.id,
            summary: cal.summary,
            primary: cal.primary,
            color: cal.backgroundColor
        })) || [];

        // Parse das agendas ativas salvas (compatível com formato antigo e novo)
        const activeCalendars = parseActiveCalendars(clinic.google_calendar_id);

        return NextResponse.json({
            calendars,
            activeCalendars,
            // Mantém retrocompatibilidade caso algum componente antigo use isso
            activeCalendarId: activeCalendars.length === 1 ? activeCalendars[0].id : null,
        });

    } catch (error: any) {
        console.error('Error fetching google calendars:', error);
        return NextResponse.json({
            error: 'Internal Server Error',
            details: error.message
        }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { calendars } = body as { calendars: ActiveCalendar[] };

        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user || !calendars || !Array.isArray(calendars) || calendars.length === 0) {
            return NextResponse.json({ error: 'Invalid operation' }, { status: 400 });
        }

        // Salva como JSON string na coluna existente
        const { error } = await supabase
            .from('clinics')
            .update({ google_calendar_id: JSON.stringify(calendars) })
            .eq('owner_id', user.id);

        if (error) throw error;

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Error saving active calendars:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
