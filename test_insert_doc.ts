import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''; // Admin
const supabase = createClient(supabaseUrl, supabaseKey);

async function testInsert() {
    console.log('Buscando a última análise registrada...');
    const { data: analysis, error: errAnal } = await supabase
        .from('tributario_analyses')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

    if (errAnal) {
        console.error('Erro ao buscar:', errAnal);
        return;
    }

    console.log('Tentando inserir documento para analysis_id =', analysis.id);

    const { data: doc, error: docError } = await supabase
        .from('tributario_documents')
        .insert([{
            analysis_id: analysis.id,
            user_id: analysis.user_id,
            document_type: 'UPLOADED_PDF',
            file_name: 'teste.pdf',
            file_path: 'teste/teste.pdf',
            file_type: 'application/pdf',
            file_size: 1024
        }])
        .select();

    if (docError) {
        console.error('ERRO REAL AO INSERIR DOCUMENTO:', JSON.stringify(docError, null, 2));
    } else {
        console.log('INSERÇÃO BEM SUCEDIDA:', doc);
    }
}

testInsert();
