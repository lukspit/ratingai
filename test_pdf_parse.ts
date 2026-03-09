import { Buffer } from 'node:buffer';
import { extractText } from 'unpdf';

async function testPdfParseLib() {
    try {
        console.log("Importing unpdf...");

        // PDF mínimo válido
        const dummyPdf = '%PDF-1.4\n1 0 obj\n<<\n/Title (Dummy)\n>>\nendobj\nxref\n0 2\n0000000000 65535 f\n0000000010 00000 n\ntrailer\n<<\n/Size 2\n/Root 1 0 R\n>>\nstartxref\n49\n%%EOF';
        const buffer = Buffer.from(dummyPdf, 'utf-8');
        const uint8Array = new Uint8Array(buffer);

        console.log("Parsing...");
        const data = await extractText(uint8Array);

        console.log("Result:", data.text);
    } catch (e) {
        console.error("Error:", e);
    }
}

testPdfParseLib();
