import { NextResponse } from 'next/server';
import { Buffer } from 'node:buffer';
import fs from 'fs';
import path from 'path';

export async function GET() {
    try {
        console.log("Iniciando teste PDF...");
        // @ts-ignore
        const pdfParse = (await import('pdf-parse-debugging-disabled')).default;

        const buffer = Buffer.from('%PDF-1.4\n1 0 obj\n<<\n/Title (Dummy PDF)\n>>\nendobj\nxref\n0 2\n0000000000 65535 f\n0000000010 00000 n\ntrailer\n<<\n/Size 2\n/Root 1 0 R\n>>\nstartxref\n49\n%%EOF', 'utf-8');

        const data = await pdfParse(buffer);

        return NextResponse.json({ success: true, text: data.text });
    } catch (e: any) {
        console.error("ERRO TESTE PDF:", e);
        return NextResponse.json({ success: false, error: e.message, stack: e.stack }, { status: 500 });
    }
}
