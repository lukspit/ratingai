import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { callAI } from '@/utils/ai';

const SYSTEM_PROMPT = `
Você é um Auditor Contábil I.A. (Extractor).
Mapeie e extraia os dados abaixo a partir do texto das demonstrações contábeis.

Output OBRIGATÓRIO (JSON estrito):
{
  "period": 2024,
  "ativo_circulante": 0,
  "passivo_circulante": 0,
  "passivo_nao_circulante": 0,
  "disponibilidades": 0,
  "receita_bruta": 0,
  "ebitda": 0,
  "potential_adjustments": [
    { "account": "Receitas Diversas", "value": 50000, "justification": "Receita não recorrente" }
  ]
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
