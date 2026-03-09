
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function inspectSchema() {
    const { data: columns, error } = await supabase
        .from('tributario_documents')
        .select('*')
        .limit(0)

    if (error) {
        console.error('Erro:', error.message)
    } else {
        // This doesn't help if empty. Let's try to query information_schema directly
        const { data, error: sqlError } = await supabase.rpc('execute_sql', {
            sql: "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'tributario_documents'"
        })

        if (sqlError) {
            // If no exec_sql RPC, let's just try to insert a dummy and see error or structure
            console.log('Tentando insert dummy para ver erro de colunas...')
            const { error: insError } = await supabase.from('tributario_documents').insert({}).select()
            console.log('Erro de insert (provável colunas obrigatórias):', insError?.message)
        } else {
            console.log('Colunas:', data)
        }
    }
}

inspectSchema()
