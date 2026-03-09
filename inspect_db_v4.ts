
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function inspectSchema() {
    console.log('Tentando insert mais completo...')
    const { error: insError } = await supabase.from('tributario_documents').insert({
        user_id: 'd6b8b0e0-0000-0000-0000-000000000000',
        file_name: 'test.pdf',
        file_path: 'test.pdf',
        file_type: 'application/pdf',
        file_size: 100,
        analysis_id: 'd6b8b0e0-0000-0000-0000-000000000000'
    }).select()
    console.log('Erro de insert:', insError?.message)
}

inspectSchema()
