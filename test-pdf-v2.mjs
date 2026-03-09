import { PDFParse } from 'pdf-parse';
import fs from 'fs';

async function test() {
    try {
        console.log('Iniciando teste de pdf-parse...');
        // Procura um PDF qualquer no diretório para testar
        const files = fs.readdirSync('.').filter(f => f.toLowerCase().endsWith('.pdf'));

        if (files.length === 0) {
            console.log('Nenhum arquivo PDF encontrado para teste.');
            return;
        }

        const testFile = files[0];
        console.log(`Testando com o arquivo: ${testFile}`);

        const buffer = fs.readFileSync(testFile);
        console.log(`Buffer lido: ${buffer.length} bytes`);

        console.log('Instanciando PDFParse...');
        const parser = new PDFParse({ data: buffer });

        console.log('Chamando getText()...');
        const data = await parser.getText();

        console.log('Extração concluída com sucesso!');
        console.log(`Texto extraído (primeiros 100 caracteres): ${data.text.substring(0, 100)}...`);

        await parser.destroy();
        console.log('Parser destruído.');
    } catch (error) {
        console.error('ERRO NO TESTE:', error);
    }
}

test();
