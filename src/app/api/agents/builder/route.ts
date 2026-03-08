import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { callAI } from '@/utils/ai';

const SYSTEM_PROMPT = `
Você é o Perito Contábil (Report Builder).
Gere um Laudo Técnico de CAPAG-e formatado exclusivamente em Markdown.

Regras:
- Use cabeçalhos (#, ##, ###).
- Apresente um resumo executivo logo no início.
- Explique os cálculos de Índice de Liquidez, Alavancagem e Margem Operacional.
- Finalize com a Conclusão: O Rating final sugerido para a transação.
`;

export async function POST(req: Request) {
    try {
        const { analysisId, extractedData, calcData, stratData } = await req.json();

        if (!analysisId) return NextResponse.json({ error: 'Missing analysisId' }, { status: 400 });

        const supabase = await createClient();
        const admin = createAdminClient();

        const messages = [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: `Contexto do Cliente:\nExtrato: ${JSON.stringify(extractedData)}\nCálculo: ${JSON.stringify(calcData)}\nEstratégia: ${JSON.stringify(stratData)}` }
        ];

        // Call AI 4: Builder (Output is Markdown Text)
        const markdownReport = await callAI(messages, false);

        if (!markdownReport) throw new Error("Failed to generate report.");

        // Finaliza análise com status completed
        const { error: updateError } = await supabase
            .from('tributario_analyses')
            .update({ status: 'completed' })
            .eq('id', analysisId);

        if (updateError) {
            console.error('Builder: failed to update status', updateError);
        }

        // Salva laudo como documento — admin bypassa RLS
        const { error: docError } = await admin
            .from('tributario_documents')
            .insert([{
                analysis_id: analysisId,
                document_type: 'REPORT_MARKDOWN',
                extracted_data: { markdown: markdownReport }
            }]);

        if (docError) {
            console.error('Builder: failed to save report document', docError);
        }

        return NextResponse.json({ success: true, markdownReport });

    } catch (error: any) {
        console.error('Builder Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
