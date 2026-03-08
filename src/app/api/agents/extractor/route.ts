import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { callAI } from '@/utils/ai';

const SYSTEM_PROMPT = `
Você é um Auditor Contábil I.A. (Extractor).
Leia atentamente o texto das demonstrações contábeis e extraia EXATAMENTE os valores que aparecem nos documentos.

REGRAS CRÍTICAS:
- NUNCA invente ou assuma valores. Use apenas os números presentes no texto.
- Se um valor não estiver presente no texto, use null (não use 0).
- Os valores devem ser numéricos (sem R$, sem pontos de milhar, sem vírgulas — use ponto decimal).
- Exemplo: "R$ 2.450.000,00" deve virar 2450000.

Output OBRIGATÓRIO (JSON estrito, sem texto fora do JSON):
{
  "period": <ano do exercício>,
  "ativo_circulante": <Total Ativo Circulante extraído do BP>,
  "passivo_circulante": <Total Passivo Circulante extraído do BP>,
  "passivo_nao_circulante": <Total Passivo Não Circulante extraído do BP>,
  "patrimonio_liquido": <Total Patrimônio Líquido extraído do BP>,
  "disponibilidades": <Caixa e Equivalentes extraído do BP>,
  "receita_bruta": <Receita Bruta/Líquida extraída da DRE>,
  "ebitda": <EBITDA ou Lucro Operacional extraído da DRE>,
  "potential_adjustments": []
}
`;

export async function POST(req: Request) {
    try {
        const { analysisId, documentsText } = await req.json();

        if (!analysisId || !documentsText) {
            return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
        }

        const supabase = await createClient();
        const admin = createAdminClient();

        // Update status to processing
        const { error: statusError } = await supabase
            .from('tributario_analyses')
            .update({ status: 'processing' })
            .eq('id', analysisId);

        if (statusError) {
            console.error('Extractor: failed to update status', statusError);
        }

        // Call AI 1: Extractor
        const messages = [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: `Texto extraído dos documentos:\n\n${documentsText.substring(0, 15000)}` }
        ];

        const extractedData = await callAI(messages, true);

        if (!extractedData) {
            throw new Error("Failed to parse AI response.");
        }

        // Salvar dados extraídos usando admin (bypassa RLS)
        const { error: docError } = await admin
            .from('tributario_documents')
            .insert([{
                analysis_id: analysisId,
                document_type: 'TEXT_COMBINED',
                extracted_data: extractedData
            }]);

        if (docError) {
            console.error('Extractor: failed to save document', docError);
        }

        return NextResponse.json({ success: true, extractedData });

    } catch (error: any) {
        console.error('Extractor Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
