
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function inspectSchema() {
    const { data, error } = await supabase.rpc('inspect_table', { table_name: 'tributario_documents' })

    if (error) {
        // Fallback if RPC doesn't exist: try a direct query to information_schema
        const { data: cols, error: colError } = await supabase.from('tributario_documents').select('*').limit(1)
        if (colError) {
            console.error('Erro ao acessar tributario_documents:', colError.message)
        } else {
            console.log('Tabela tributario_documents existe. Colunas:', Object.keys(cols[0] || {}))
        }
    } else {
        console.log('Info tabela:', data)
    }
}

inspectSchema()
