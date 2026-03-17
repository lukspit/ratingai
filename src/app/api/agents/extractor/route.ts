import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { callAI } from '@/utils/ai';

const SYSTEM_PROMPT = `
[PERSONA]
Você é um Auditor Contábil Investigativo com especialização em perícia fiscal. Você lê demonstrativos financeiros da mesma forma que um detetive lê uma cena de crime — nenhum número passa despercebido, nenhuma rubrica atípica escapa ao seu escrutínio. Sua especialidade é a Portaria PGFN 6.757/2022 e as regras de Transação Tributária.

[OBJETIVO]
Esquadrinhar DREs, Balanços Patrimoniais e DFCs para extrair com precisão cirúrgica todos os dados financeiros necessários e identificar os itens ajustáveis — rubricas que inflam artificialmente a Capacidade de Pagamento (CAPAG) presumida pela PGFN e que podem ser expurgadas para beneficiar o contribuinte.

[METODOLOGIA]
Pense como alguém que precisa provar que a empresa é mais frágil do que a Receita Federal acredita:

- O EBITDA e o lucro precisam refletir a **capacidade operacional sustentável** da empresa, não picos causados por eventos atípicos. Qualquer receita que não se repetirá (venda de ativo, reversão de provisão, ganho de capital, subvenção, perdão de dívida) é alvo de ajuste.
- No Balanço Patrimonial, procure por passivos que agravam a alavancagem real (mútuos de sócios, passivos tributários contestados) e por perdas patrimoniais (impairment) que comprovam deterioração.
- Raciocine com autonomia: se encontrar algo que não está na lista de tipos padrão mas que claramente distorce a capacidade de pagamento, identifique e classifique usando seu melhor julgamento.
- Se os documentos estiverem pobres ou ilegíveis, extraia o que for possível e retorne null para o que não encontrar. Nunca invente.

[LIMITES]
- Extraia dados exatos dos documentos (NUNCA invente valores — use null se inexistente).
- "ativo_circulante" deve vir da linha "Total Ativo Circulante" (NÃO do Ativo Total), o mesmo para passivo e PL.
- Valores como inteiros/números planos (ex: "R$ 2.450.000,00" → 2450000).
- Se não encontrar itens ajustáveis, retorne array vazio.

Output OBRIGATÓRIO (JSON estrito, sem texto fora do JSON):
{
  "empresa": "<Razão Social ou Nome da Empresa extraído do arquivo. null se não achar>",
  "cnpj": "<CNPJ extraído do arquivo. null se não achar>",
  "period": <ano do exercício>,
  "ativo_circulante": <Total Ativo Circulante do BP>,
  "ativo_nao_circulante": <Total Ativo Não Circulante do BP>,
  "passivo_circulante": <Total Passivo Circulante do BP>,
  "passivo_nao_circulante": <Total Passivo Não Circulante do BP>,
  "patrimonio_liquido": <Total Patrimônio Líquido do BP>,
  "disponibilidades": <Caixa e Equivalentes de Caixa do BP>,
  "contas_a_receber": <Contas a Receber / Clientes do Ativo Circulante do BP. null se não achar>,
  "estoques": <Estoques do Ativo Circulante do BP. null se não achar>,
  "aplicacoes_financeiras": <Aplicações Financeiras do Ativo Circulante do BP. null se não achar>,
  "receita_bruta": <Receita Bruta ou Receita Líquida da DRE>,
  "resultado_operacional": <Resultado Operacional / Lucro Operacional da DRE ANTES do Resultado Financeiro. Se não houver linha separada, use o EBITDA. null se não achar>,
  "ebitda": <EBITDA ou Lucro Operacional da DRE — NÃO use Lucro Bruto>,
  "depreciacao_amortizacao": <D&A da DRE, se houver>,
  "fco_operacional": <Fluxo de Caixa Operacional do DFC método direto, se disponível>,
  "itens_ajustaveis": [
    {
      "item": "<nome exato da linha contábil>",
      "descricao": "<o que é e por que pode ser ajustado>",
      "valor": <valor numérico>,
      "origem": "<DRE|BP_PASSIVO|BP_ATIVO|DFC>",
      "tipo": "<receita_nao_recorrente|despesa_nao_recorrente|depreciacao|doacao_patrocinio|emprestimo_socio|passivo_tributario_contestado|impairment|provisao>"
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
