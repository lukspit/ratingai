import { google } from "googleapis";

interface CalendarAuthArgs {
    accessToken: string;
    refreshToken: string;
}

function getGoogleCalendarClient(authArgs: CalendarAuthArgs) {
    const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
    );
    oauth2Client.setCredentials({
        access_token: authArgs.accessToken,
        refresh_token: authArgs.refreshToken,
    });
    return google.calendar({ version: "v3", auth: oauth2Client });
}

export async function checkAvailability(
    authArgs: CalendarAuthArgs,
    calendarId: string,
    dateIso: string,
) {
    const calendar = getGoogleCalendarClient(authArgs);
    // O TS Date com .toISOString() transforma "-03:00" em UTC (+3h) quebrando o timezone
    // Precisamos construir a string literal para o Google Calendar entender como São Paulo
    const timeMin = `${dateIso}T00:00:00-03:00`;
    const timeMax = `${dateIso}T23:59:59-03:00`;

    console.log(`[CALENDAR] Buscando eventos entre ${timeMin} e ${timeMax}`);

    const events = await calendar.events.list({
        calendarId,
        timeMin,
        timeMax,
        singleEvents: true,
        orderBy: "startTime",
        timeZone: "America/Sao_Paulo",
    });
    const busySlots =
        events.data.items?.map((e) => ({
            start: e.start?.dateTime || e.start?.date,
            end: e.end?.dateTime || e.end?.date,
            summary: "Ocupado",
        })) || [];

    console.log(`[CALENDAR] Encontrados ${busySlots.length} slots ocupados.`);
    return busySlots;
}

export async function bookAppointment(
    authArgs: CalendarAuthArgs,
    calendarId: string,
    patientName: string,
    phone: string,
    startTimeIso: string,
    endTimeIso: string,
) {
    const calendar = getGoogleCalendarClient(authArgs);

    // Normaliza o ISO string se o LLM esquecer o TimeZone
    let isoStart = startTimeIso;
    let isoEnd = endTimeIso;
    if (!isoStart.includes("T") || isoStart.length <= 10) {
        isoStart = `${isoStart.split("T")[0]}T10:00:00-03:00`; // fallback
    } else if (!isoStart.includes("-03:00") && !isoStart.includes("Z")) {
        isoStart = `${isoStart}-03:00`;
    }

    if (!isoEnd.includes("T") || isoEnd.length <= 10) {
        isoEnd = `${isoEnd.split("T")[0]}T11:00:00-03:00`; // fallback
    } else if (!isoEnd.includes("-03:00") && !isoEnd.includes("Z")) {
        isoEnd = `${isoEnd}-03:00`;
    }

    const event = await calendar.events.insert({
        calendarId,
        requestBody: {
            summary: `[Nexus] Consulta: ${patientName}`,
            description: `Agendado via IA.\\nTelefone Paciente: ${phone}`,
            start: { dateTime: new Date(isoStart).toISOString() },
            end: { dateTime: new Date(isoEnd).toISOString() },
        },
    });

    return { isoStart, isoEnd, eventId: event.data.id };
}
