import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { callAI } from '@/utils/ai';

const SYSTEM_PROMPT = `
Você é o Advogado Tributarista (Strategist).
Com base nos dados extraídos e nos indicadores calculados, identifique ajustes contábeis legítimos que possam melhorar as condições de negociação do contribuinte em uma Transação Tributária com a PGFN.

REGRAS:
- Somente proponha ajustes fundamentados na Portaria PGFN 6.757/2022 ou legislação vigente.
- Ajustes típicos: exclusão de receitas não recorrentes, reclassificação de passivos tributários contestados judicialmente, ajuste de EBITDA por itens extraordinários.
- Se não houver ajustes aplicáveis, retorne ajustes_aplicados como lista vazia.
- O novo_rating_sugerido deve ser o rating que resultaria APÓS os ajustes. Se não há ajustes, mantenha o rating calculado.

Output OBRIGATÓRIO (JSON estrito, sem texto fora do JSON):
{
  "tese_principal": "<descrição da tese jurídica ou 'Sem ajustes aplicáveis' se não houver>",
  "fundamentacao_legal": "<artigos relevantes da Portaria 6.757/2022 ou legislação aplicável>",
  "ajustes_aplicados": [
    {
      "description": "<descrição do ajuste>",
      "original_value": <valor original>,
      "adjusted_value": <valor ajustado>,
      "category": "<DRE|BP|GERAL>"
    }
  ],
  "novo_rating_sugerido": "<A|B|C|D — baseado nos dados reais após ajustes>"
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
