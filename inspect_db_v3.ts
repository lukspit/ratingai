
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function inspectSchema() {
    console.log('Tentando insert com user_id...')
    const { error: insError } = await supabase.from('tributario_documents').insert({
        user_id: 'd6b8b0e0-0000-0000-0000-000000000000' // dummy uuid
    }).select()
    console.log('Erro de insert:', insError?.message)
}

inspectSchema()
