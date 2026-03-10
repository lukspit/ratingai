import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const files = formData.getAll('files') as File[];

        if (!files || files.length === 0) {
            return NextResponse.json({ error: 'Nenhum arquivo enviado.' }, { status: 400 });
        }

        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
        }

        const userId = user.id;
        const uploadResults = [];

        for (const file of files) {
            if (file.type === 'application/pdf') {
                const arrayBuffer = await file.arrayBuffer();
                const buffer = Buffer.from(arrayBuffer);

                const fileName = `${Date.now()}-avulso-${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
                const filePath = `${userId}/avulso/${fileName}`;

                const { data: storageData, error: storageError } = await supabase.storage
                    .from('documents')
                    .upload(filePath, buffer, {
                        contentType: 'application/pdf',
                        upsert: true
                    });

                if (storageError) {
                    console.error(`[STORAGE ERROR] ${file.name}:`, storageError);
                    continue;
                }

                // Criar registro na tabela de documentos (usa admin para bypass RLS)
                const admin = createAdminClient();
                const { data: doc, error: docError } = await admin
                    .from('tributario_documents')
                    .insert({
                        user_id: userId,
                        document_type: 'MANUAL_UPLOAD',
                        file_name: file.name,
                        file_path: filePath,
                        file_type: file.type,
                        file_size: file.size
                    })
                    .select()
                    .single();

                if (docError) {
                    console.error('[DB ERROR] Salvando documento avulso:', docError);
                    continue;
                }

                uploadResults.push(doc);
            }
        }

        return NextResponse.json({
            success: true,
            count: uploadResults.length,
            documents: uploadResults
        });

    } catch (error: any) {
        console.error('API Error /documents:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
