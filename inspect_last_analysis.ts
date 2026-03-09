import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectLastAnalysis() {
    console.log('Buscando a última análise registrada...');
    const { data, error } = await supabase
        .from('tributario_analyses')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

    if (error) {
        console.error('Erro ao buscar a análise:', error);
        return;
    }

    console.log('\n--- ÚLTIMA ANÁLISE ---');
    console.log('ID:', data.id);
    console.log('Empresa:', data.company_name);
    console.log('Status:', data.status);
    console.log('\n--- DADOS CALCULADOS (calc_json) ---');
    console.log(JSON.stringify(data.calc_json, null, 2));

    console.log('\nBuscando documentos relacionados à análise...');
    const { data: docs, error: docError } = await supabase
        .from('tributario_documents')
        .select('id, document_type, file_name, extracted_data')
        .eq('analysis_id', data.id);

    if (docError) {
        console.error('Erro ao buscar documentos:', docError);
    } else {
        for (const doc of docs) {
            console.log(`\nDocument Type: ${doc.document_type} | File: ${doc.file_name}`);
            console.log('Extracted Data:', JSON.stringify(doc.extracted_data, null, 2));
        }
    }
}

inspectLastAnalysis();
