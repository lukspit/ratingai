import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { callAI } from '@/utils/ai';

const SYSTEM_PROMPT = `
Você é um Auditor Contábil especialista em CAPAG-e e Transação Tributária com a PGFN.
Leia os documentos contábeis (DRE, Balanço Patrimonial e DFC) e extraia DOIS conjuntos de dados:

1. DADOS BASE: os valores principais dos demonstrativos
2. ITENS AJUSTÁVEIS: linhas que podem ser excluídas ou ajustadas legalmente para reduzir o CAPAG-e

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REGRAS CRÍTICAS DE EXTRAÇÃO:
- NUNCA invente valores. Use apenas os números presentes no texto.
- Se um valor não estiver no texto, use null.
- Valores numéricos sem R$, pontos ou vírgulas (ex: "R$ 2.450.000,00" → 2450000).
- "ativo_circulante" = linha "Total Ativo Circulante" (NÃO é o Total do Ativo)
- "patrimonio_liquido" = linha "Total Patrimônio Líquido" (NÃO é Capital Social)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ITENS AJUSTÁVEIS — o que procurar (Portaria PGFN 6.757/2022):

- RECEITAS NÃO RECORRENTES (DRE): venda de imóvel/ativo fixo, indenizações, reversão de provisões, dividendos atípicos
- DESPESAS NÃO RECORRENTES (DRE): multas judiciais, perdas por roubo/sinistro, provisões para contingências de baixa probabilidade
- DEPRECIAÇÃO/AMORTIZAÇÃO (DRE): de ativos essenciais para operação (é lançamento não-caixa)
- DOAÇÕES/PATROCÍNIOS/MARKETING INSTITUCIONAL (DRE): despesas não essenciais para continuidade
- EMPRÉSTIMOS DE SÓCIOS (BP - Passivo): mútuos de sócios que podem ser capitalizados
- PASSIVOS TRIBUTÁRIOS CONTESTADOS (BP - Passivo): tributos com impugnação, recurso ou garantia judicial

Para cada item, descreva com precisão. Se NÃO encontrar itens ajustáveis, retorne lista vazia.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
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
            throw new Error(`Análise não encontrada: ${analysisFetchError?.message}`);
        }

        await supabase
            .from('tributario_analyses')
            .update({ status: 'processing' })
            .eq('id', analysisId);

        const messages = [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: `Extraia os dados financeiros e os itens ajustáveis. Retorne em JSON.\n\nDocumentos:\n\n${documentsText.substring(0, 18000)}` }
        ];

        const extractedData = await callAI(messages, true);

        if (!extractedData) {
            throw new Error("Falha ao parsear resposta da IA.");
        }

        const itens = extractedData.itens_ajustaveis || [];
        console.log(`[EXTRACTOR] ${itens.length} itens ajustáveis identificados:`, itens.map((i: any) => `${i.tipo}: ${i.item} (${i.valor})`));

        await admin
            .from('tributario_documents')
            .insert([{
                analysis_id: analysisId,
                user_id: analysis.user_id,
                document_type: 'TEXT_COMBINED',
                file_name: `Dados Extraídos - ${analysis.company_name}`,
                extracted_data: extractedData
            }]);

        return NextResponse.json({ success: true, extractedData });

    } catch (error: any) {
        console.error('Extractor Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
