import { FolderOpen, Search, Upload } from 'lucide-react'
import { createClient } from '@/utils/supabase/server'
import DocumentRepository from './DocumentRepository'

export default async function DocumentsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    const { data: documents } = await supabase
        .from('tributario_documents')
        .select(`
            *,
            tributario_analyses (
                company_name
            )
        `)
        .eq('user_id', user.id) // Garantir que só vê os seus (RLS já deve cuidar, mas reforça)
        .order('created_at', { ascending: false })

    return (
        <div className="space-y-6 animate-in fade-in zoom-in duration-500 pb-12">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="h-1 w-8 bg-indigo-500 rounded-full" />
                        <span className="text-xs font-bold uppercase tracking-widest text-indigo-500/70">Repositório</span>
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Base de Documentos</h1>
                    <p className="text-muted-foreground mt-1">
                        Todos os DREs, Balanços e extratos que você já utilizou nas análises ou enviou manualmente.
                    </p>
                </div>
            </div>

            <DocumentRepository initialDocuments={documents || []} />
        </div>
    )
}
