import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { callAI } from '@/utils/ai';

const SYSTEM_PROMPT = `
Você é o Advogado PGFN (Strategist).
Seu objetivo é justificar os ajustes contábeis para melhorar/piorar o rating da empresa de forma favorável ao contribuinte (buscando Rating C ou D para maximizar descontos em transação tributária).

Output OBRIGATÓRIO (JSON estrito):
{
  "tese_principal": "Texto curto descrevendo a tese jurídica aplicável.",
  "fundamentacao_legal": "Artigos da portaria...",
  "ajustes_aplicados": [
    {
      "description": "Exclusão de Receita Não Recorrente",
      "original_value": 50000,
      "adjusted_value": 0,
      "category": "DRE"
    }
  ],
  "novo_rating_sugerido": "D"
}
`;

export async function POST(req: Request) {
    try {
        const { analysisId, extractedData, calcData } = await req.json();

        if (!analysisId) return NextResponse.json({ error: 'Missing analysisId' }, { status: 400 });

        const supabase = await createClient();
        const admin = createAdminClient();

        const messages = [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: `Dados Atuais:\nExtrato: ${JSON.stringify(extractedData)}\nCálculo: ${JSON.stringify(calcData)}` }
        ];

        const stratData = await callAI(messages, true);

        if (!stratData) throw new Error("Failed to parse AI 3 response.");

        // Atualizar simulated rating
        if (stratData.novo_rating_sugerido) {
            const { error: updateError } = await supabase
                .from('tributario_analyses')
                .update({ simulated_rating: stratData.novo_rating_sugerido })
                .eq('id', analysisId);

            if (updateError) {
                console.error('Strategist: failed to update simulated rating', updateError);
            }
        }

        // Inserir ajustes usando admin — bypassa RLS
        if (stratData.ajustes_aplicados?.length > 0) {
            const inserts = stratData.ajustes_aplicados.map((a: any) => ({
                analysis_id: analysisId,
                description: a.description,
                original_value: a.original_value,
                adjusted_value: a.adjusted_value,
                category: a.category || 'GERAL'
            }));

            const { error: adjError } = await admin
                .from('tributario_adjustments')
                .insert(inserts);

            if (adjError) {
                console.error('Strategist: failed to save adjustments', adjError);
            }
        }

        return NextResponse.json({ success: true, stratData });

    } catch (error: any) {
        console.error('Strategist Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
