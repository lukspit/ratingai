import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { PDFParse } from 'pdf-parse';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const files = formData.getAll('files') as File[];
    const companyName = formData.get('companyName') as string;
    const cnpj = formData.get('cnpj') as string;
    const valorDivida = formData.get('valorDivida') as string;
    const modalidade = formData.get('modalidade') as string;

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado.' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
    }

    const userId = user.id;

    // 1. CRIAR REGISTRO DA ANÁLISE PRIMEIRO (para ter o ID para os documentos)
    const { data: analysis, error: analysisError } = await supabase
      .from('tributario_analyses')
      .insert([
        {
          user_id: userId,
          company_name: companyName || 'Empresa Em Análise',
          cnpj_target: cnpj || '',
          status: 'pending',
          valor_divida_tributaria: valorDivida ? parseFloat(valorDivida) : null,
          modalidade_transacao: modalidade || null
        }
      ])
      .select()
      .single();

    if (analysisError) {
      throw analysisError;
    }

    const analysisId = analysis.id;

    // 2. LER OS ARQUIVOS PDF E SALVAR NO STORAGE + DB
    let combinedText = '';
    const documentRecords = [];

    for (const file of files) {
      if (file.type === 'application/pdf') {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // a. Extrair texto para a IA
        try {
          const parser = new PDFParse({ data: buffer });
          const data = await parser.getText();
          await parser.destroy();
          const extractedText = data.text || '';

          if (extractedText.trim().length < 50) {
            console.warn(`[PDF-PARSE AVISO] ${file.name} — Texto insuficiente (${extractedText.length} chars). Pode ser imagem ou protegido.`);
            combinedText += `\n--- ARQUIVO: ${file.name} (Texto Insuficiente/Imagem) ---\n[O PDF parece ser uma imagem ou está protegido. Os dados podem não ser extraídos corretamente.]\n`;
          } else {
            console.log(`[PDF-PARSE OK] ${file.name} — ${extractedText.length} caracteres extraídos`);
            combinedText += `\n--- ARQUIVO: ${file.name} ---\n${extractedText}\n`;
          }
        } catch (pdfError) {
          console.error(`[PDF-PARSE FALHOU] ${file.name}:`, pdfError);
          combinedText += `\n--- ARQUIVO: ${file.name} (Erro na Extração) ---\n[Falha técnica ao extrair texto deste documento.]\n`;
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
    if (documentRecords.length > 0) {
      const { error: docError } = await supabase
        .from('tributario_documents')
        .insert(documentRecords);

      if (docError) {
        console.error('[DB ERROR] Salvando documentos:', docError);
        // Se der erro de coluna, pelo menos a análise foi criada.
      }
    }

    return NextResponse.json({
      success: true,
      analysisId: analysis.id,
      documentsText: combinedText
    });

  } catch (error: any) {
    console.error('API Error /analyses:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
