
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function setupStorage() {
    console.log('Verificando buckets...')
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()

    if (listError) {
        console.error('Erro ao listar buckets:', listError.message)
        return
    }

    const exists = buckets.find(b => b.name === 'documents')
    if (!exists) {
        console.log('Criando bucket "documents"...')
        const { error: createError } = await supabase.storage.createBucket('documents', {
            public: false,
            allowedMimeTypes: ['application/pdf'],
            fileSizeLimit: 20 * 1024 * 1024 // 20MB
        })

        if (createError) {
            console.error('Erro ao criar bucket:', createError.message)
        } else {
            console.log('Bucket "documents" criado com sucesso!')
        }
    } else {
        console.log('Bucket "documents" já existe.')
    }
}

setupStorage()
