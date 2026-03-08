import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FolderOpen, Search, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createClient } from '@/utils/supabase/server'

export default async function DocumentsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Mock for development if no user
    const userId = user?.id || 'mock-id'

    const { data: documents } = await supabase
        .from('tributario_documents')
        .select('*, tributario_analyses(company_name)')
        .order('created_at', { ascending: false })
        .limit(20)

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
                        Todos os DREs, Balanços e extratos que você já utilizou nas análises.
                    </p>
                </div>
            </div>

            <Card className="bg-card/50 backdrop-blur-sm border-border/50 shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                    <div className="relative w-full max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar documentos..."
                            className="pl-9 bg-background/50 border-border/50"
                        />
                    </div>
                    <Button variant="outline" className="flex items-center gap-2 border-indigo-500/30 text-indigo-500 hover:bg-indigo-500/10">
                        <Upload className="w-4 h-4" /> Upload Avulso
                    </Button>
                </CardHeader>
                <CardContent>
                    {!documents || documents.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-border/50 rounded-lg bg-background/30">
                            <div className="w-16 h-16 rounded-full bg-indigo-500/10 flex items-center justify-center mb-4">
                                <FolderOpen className="h-8 w-8 text-indigo-500" />
                            </div>
                            <h3 className="text-lg font-semibold mb-2">Seu cofre está vazio</h3>
                            <p className="text-muted-foreground max-w-sm mx-auto">
                                Os documentos enviados durante as simulações aparecerão organizados aqui.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* Render list of documents here */}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
