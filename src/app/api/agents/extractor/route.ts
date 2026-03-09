import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { callAI } from '@/utils/ai';

const SYSTEM_PROMPT = `
[PERSONA E ESPECIALIZAÇÃO]
Você é um Auditor Contábil Investigativo implacável, especialista máximo na Portaria PGFN 6.757/2022 (Transação Tributária). Sua missão é esquadrinhar DREs e Balanços Patrimoniais como um detetive financeiro em busca de qualquer rubrica que, sob a ótica legal da PGFN, possa ser expurgada para DIMINUIR a capacidade de pagamento presumida (CAPAG) do cliente, ajudando-o a conseguir descontos maiores em suas dívidas.

[OBJETIVO DO RESULTADO]
Ler as OCRs dos demonstrativos contábeis, extrair com precisão cirúrgica os "Dados Base" e varrer cada linha em busca dos "Itens Ajustáveis". Você deve municiar o Estrategista com todas as evidências (dinheiro e nome da rubrica) de coisas que inflam artificialmente o EBITDA ou mascaram dívidas. 

[METODOLOGIA E "MALÍCIA" TRIBUTÁRIA]
Na busca pelos ITENS AJUSTÁVEIS, aplique a "malícia tributária" pró-contribuinte dentro das regras do jogo:
- No DRE, o lucro e o EBITDA precisam parecer os piores possíveis (de forma verdadeira e contábil). Qualquer receita atípica (venda de maquinário, reversão de provisões, ganho de capital, subvenção) é seu alvo principal para eliminação (Receita Não Recorrente).
- No passivo (BP), empréstimos de sócios (mútuos) que estão como passivo circulante machucam a alavancagem; devem ser listados.
- Impostos sendo contestados juridicamente também inflam o passivo falsamente.
- Depreciações de ativos operacionais devem ser notadas pois não refletem caixa real. 

[TOM E ESTILO]
Você é um robô pericial pragmático e detalhista que não perde um único centavo de vista.

[BARREIRAS E LIMITAÇÕES OBRIGATÓRIAS]
- Você extrairá os dados exatos do Balanço (NUNCA invente valores. Jamais. Use null se inexistente).
- "ativo_circulante" deve ser extraído da linha "Total Ativo Circulante" (NÃO do Somatório Geral), o mesmo para passivo e PL.
- Valores devem ser trazidos como inteiros/números planos (ex: "R$ 2.450.000,00" -> 2450000).
- Descreva os itens ajustáveis encontrados. Se a pesquisa estiver árida, retorne array vazio com a mesma frieza.

Output OBRIGATÓRIO (JSON estrito, sem texto fora do JSON):
{
  "period": <ano do exercício>,
  "ativo_circulante": <Total Ativo Circulante do BP>,
  "ativo_nao_circulante": <Total Ativo Não Circulante do BP>,
  "passivo_circulante": <Total Passivo Circulante do BP>,
  "passivo_nao_circulante": <Total Passivo Não Circulante do BP>,
  "patrimonio_liquido": <Total Patrimônio Líquido do BP>,
  "disponibilidades": <Caixa e Equivalentes de Caixa do BP>,
  "receita_bruta": <Receita Bruta ou Receita Líquida da DRE>,
  "ebitda": <EBITDA ou Lucro Operacional da DRE — NÃO use Lucro Bruto>,
  "depreciacao_amortizacao": <D&A da DRE, se houver>,
  "fco_operacional": <Fluxo de Caixa Operacional do DFC método direto, se disponível>,
  "itens_ajustaveis": [
    {
      "item": "<nome exato da linha contábil>",
      "descricao": "<o que é e por que pode ser ajustado>",
      "valor": <valor numérico>,
      "origem": "<DRE|BP_PASSIVO|BP_ATIVO|DFC>",
      "tipo": "<receita_nao_recorrente|despesa_nao_recorrente|depreciacao|doacao_patrocinio|emprestimo_socio|passivo_tributario_contestado>"
    }
  ]
}
`;

export async function POST(req: Request) {
    try {
        const { analysisId, documentsText } = await req.json();

        if (!analysisId || !documentsText || documentsText.trim().length < 100) {
            return NextResponse.json({
                error: 'Texto dos documentos insuficiente para análise técnica. Verifique se os PDFs contêm texto legível (não são apenas imagens).'
            }, { status: 400 });
        }

        const supabase = await createClient();
        const admin = createAdminClient();

        const { data: analysis, error: analysisFetchError } = await supabase
            .from('tributario_analyses')
            .select('user_id, company_name')
            .eq('id', analysisId)
            .single();

        if (analysisFetchError || !analysis) {
            throw new Error(`Análise não encontrada: ${analysisFetchError?.message} `);
        }

        await supabase
            .from('tributario_analyses')
            .update({ status: 'processing' })
            .eq('id', analysisId);

        const messages = [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: `Extraia os dados financeiros e os itens ajustáveis.Retorne em JSON.\n\nDocumentos: \n\n${documentsText.substring(0, 18000)} ` }
        ];

        const extractedData = await callAI(messages, true);

        if (!extractedData) {
            throw new Error("Falha ao parsear resposta da IA.");
        }

        const itens = extractedData.itens_ajustaveis || [];
        console.log(`[EXTRACTOR] ${itens.length} itens ajustáveis identificados: `, itens.map((i: any) => `${i.tipo}: ${i.item} (${i.valor})`));

        await admin
            .from('tributario_documents')
            .insert([{
                analysis_id: analysisId,
                user_id: analysis.user_id,
                document_type: 'TEXT_COMBINED',
                file_name: `Dados Extraídos - ${analysis.company_name} `,
                extracted_data: extractedData
            }]);

        return NextResponse.json({ success: true, extractedData });

    } catch (error: any) {
        console.error('Extractor Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
