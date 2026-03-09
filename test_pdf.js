async function testPdfParseImport() {
    try {
        const mod = await import('pdf-parse');
        console.log("Keys in 'pdf-parse':", Object.keys(mod));
        console.log("Module default:", typeof mod.default);
        console.log("Module PDFParse:", typeof mod.PDFParse);
    } catch (e) {
        console.error(e);
    }
}
testPdfParseImport();
