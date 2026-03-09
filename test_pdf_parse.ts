import { Buffer } from 'node:buffer';

async function testPdfParseLib() {
    try {
        console.log("Importing pdf-parse-debugging-disabled...");
        const mod = await import('pdf-parse-debugging-disabled');
        console.log("Keys:", Object.keys(mod));
        console.log("Default:", typeof mod.default);

        const pdfParse = mod.default || mod;

        // PDF mínimo válido
        const dummyPdf = '%PDF-1.4\n1 0 obj\n<<\n/Title (Dummy)\n>>\nendobj\nxref\n0 2\n0000000000 65535 f\n0000000010 00000 n\ntrailer\n<<\n/Size 2\n/Root 1 0 R\n>>\nstartxref\n49\n%%EOF';
        const buffer = Buffer.from(dummyPdf, 'utf-8');

        console.log("Parsing...");
        const data = await pdfParse(buffer);
        console.log("Result:", data.text);
    } catch (e) {
        console.error("Error:", e);
    }
}

testPdfParseLib();
