import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { Buffer } from 'node:buffer';

export async function POST(req: Request) {
  console.log('--- POST /api/analyses INICIADO ---');
  try {
    console.log('Recebendo FormData...');
    const formData = await req.formData();
    console.log('FormData recebido com sucesso.');
    const files = formData.getAll('files') as File[];
    const companyName = formData.get('companyName') as string;
    const cnpj = formData.get('cnpj') as string;
    const valorDivida = formData.get('valorDivida') as string;
    const modalidade = formData.get('modalidade') as string;

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado.' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: authData, error: authError } = await supabase.auth.getUser();

    if (authError || !authData?.user) {
      console.error('[AUTH ERROR] User not found or session expired:', authError);
      return NextResponse.json({ error: 'Sessão expirada ou usuário não autenticado.' }, { status: 401 });
    }

    const userId = authData.user.id;

    // 1. CRIAR REGISTRO DA ANÁLISE PRIMEIRO (para ter o ID para os documentos)
    const { data: analysis, error: analysisError } = await supabase
      .from('tributario_analyses')
      .insert([
        {
          user_id: userId,
          company_name: companyName || 'Empresa Em Análise',
          cnpj_target: cnpj || '',
          status: 'pending',
          valor_divida_tributaria: valorDivida && !isNaN(parseFloat(valorDivida)) ? parseFloat(valorDivida) : null,
          modalidade_transacao: modalidade || null
        }
      ])
      .select()
      .single();

    if (analysisError) {
      console.error('[DB ERROR] Criando análise:', analysisError);
      return NextResponse.json({ error: `Erro ao criar análise no banco de dados: ${analysisError.message}` }, { status: 500 });
    }

    const analysisId = analysis.id;

    // 2. LER OS ARQUIVOS PDF E SALVAR NO STORAGE + DB
    let combinedText = '';
    let totalExtractedLength = 0;
    const documentRecords = [];
    const pdfErrors: string[] = [];

    for (const file of files) {
      if (file.type === 'application/pdf') {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // a. Extrair texto para a IA
        try {
          console.log(`[PDF-PARSE] Iniciando extração de ${file.name} (${file.size} bytes)`);

          const { extractText } = await import('unpdf');
          const uint8Array = new Uint8Array(buffer);
          const data = await extractText(uint8Array);

          const textRaw = data.text || '';
          const extractedText = Array.isArray(textRaw) ? textRaw.join('\n') : textRaw;

          if (extractedText.trim().length < 50) {
            console.warn(`[PDF-PARSE AVISO] ${file.name} — Texto insuficiente (${extractedText.length} chars).`);
            combinedText += `\n--- ARQUIVO: ${file.name} (Texto Insuficiente/Imagem) ---\n[O PDF parece ser uma imagem ou está protegido.]\n`;
          } else {
            console.log(`[PDF-PARSE OK] ${file.name} — ${extractedText.length} caracteres extraídos`);
            combinedText += `\n--- ARQUIVO: ${file.name} ---\n${extractedText}\n`;
            totalExtractedLength += extractedText.trim().length;
          }
        } catch (pdfError: any) {
          console.error(`[PDF-PARSE FALHOU] ${file.name}:`, pdfError);
          combinedText += `\n--- ARQUIVO: ${file.name} (Erro na Extração: O PDF não pôde ser lido.) ---\n`;
          pdfErrors.push(`[${file.name}]: ${pdfError.message || String(pdfError)}`);
        }

        // b. Salvar arquivo no Storage
        const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
        const filePath = `${userId}/${analysisId}/${fileName}`;

        const { data: storageData, error: storageError } = await supabase.storage
          .from('documents')
          .upload(filePath, buffer, {
            contentType: 'application/pdf',
            upsert: true
          });

        if (storageError) {
          console.error(`[STORAGE ERROR] ${file.name}:`, storageError);
        } else {
          // c. Criar registro na tabela de documentos
          documentRecords.push({
            analysis_id: analysisId,
            user_id: userId,
            document_type: 'UPLOADED_PDF',
            file_name: file.name,
            file_path: filePath,
            file_type: file.type,
            file_size: file.size
          });
        }
      }
    }

    // SALVAR DOCUMENTOS NO DB (se houver registros)
    // Usa adminClient para bypass RLS (autenticação já foi verificada acima)
    if (documentRecords.length > 0) {
      const admin = createAdminClient();
      const { data: savedDocs, error: docError } = await admin
        .from('tributario_documents')
        .insert(documentRecords)
        .select();

      if (docError) {
        console.error('[DB ERROR] Salvando documentos:', docError);
        console.error('[DB ERROR] Records tentados:', JSON.stringify(documentRecords));
      } else {
        console.log(`[DB OK] ${savedDocs?.length} documentos salvos com sucesso`);
      }
    }

    if (totalExtractedLength < 100) {
      let errorMsg = 'Nenhum texto contábil pôde ser extraído dos documentos enviados. Verifique se os PDFs não estão protegidos por senha e se não são apenas imagens digitalizadas.';
      if (pdfErrors.length > 0) {
        errorMsg += ' Erros técnicos encontrados: ' + pdfErrors.join(' | ');
      }
      return NextResponse.json({
        error: errorMsg
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      analysisId: analysisId,
      documentsText: combinedText
    });

  } catch (error: any) {
    console.error('API Error /analyses (Unexpected):', error);
    return NextResponse.json({
      error: `Erro inesperado no servidor: ${error.message}`,
      details: error.stack
    }, { status: 500 });
  }
}
