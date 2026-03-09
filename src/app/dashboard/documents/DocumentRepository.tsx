'use client'

import { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FolderOpen, Search, Upload, FileText, Calendar, Building2, Download, Trash2, X, CheckCircle2, Loader2, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/utils/supabase/client'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default function DocumentRepository({ initialDocuments }: { initialDocuments: any[] }) {
    const [documents, setDocuments] = useState(initialDocuments)
    const [searchTerm, setSearchTerm] = useState('')
    const [isUploading, setIsUploading] = useState(false)
    const [uploadProgress, setUploadProgress] = useState(0)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const supabase = createClient()

    // Filtragem local para busca instantânea
    const filteredDocs = documents.filter(doc =>
        doc.file_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.tributario_analyses?.company_name?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return

        setIsUploading(true)
        setUploadProgress(10)

        const formData = new FormData()
        Array.from(e.target.files).forEach(file => formData.append('files', file))

        try {
            const res = await fetch('/api/documents', {
                method: 'POST',
                body: formData
            })

            if (!res.ok) throw new Error('Falha no upload')

            const data = await res.json()
            if (data.success) {
                // Atualiza a lista localmente
                setDocuments(prev => [...data.documents, ...prev])
                setUploadProgress(100)
                setTimeout(() => {
                    setIsUploading(false)
                    setUploadProgress(0)
                }, 1500)
            }
        } catch (error) {
            console.error(error)
            setIsUploading(false)
            alert('Erro ao enviar documentos.')
        }
    }

    const deleteDocument = async (id: string, path: string) => {
        if (!confirm('Tem certeza que deseja excluir este documento?')) return

        try {
            // 1. Deletar do Storage
            await supabase.storage.from('documents').remove([path])

            // 2. Deletar do DB
            const { error } = await supabase
                .from('tributario_documents')
                .delete()
                .eq('id', id)

            if (error) throw error

            setDocuments(prev => prev.filter(d => d.id !== id))
        } catch (error) {
            console.error(error)
            alert('Erro ao excluir documento.')
        }
    }

    const downloadDocument = async (path: string, fileName: string) => {
        const { data, error } = await supabase.storage
            .from('documents')
            .download(path)

        if (error) {
            alert('Erro ao baixar arquivo.')
            return
        }

        const url = window.URL.createObjectURL(data)
        const a = document.createElement('a')
        a.href = url
        a.download = fileName
        a.click()
    }

    return (
        <Card className="bg-card/50 backdrop-blur-sm border-border/50 shadow-lg">
            <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between space-y-4 md:space-y-0 pb-6">
                <div className="relative w-full max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar por nome ou empresa..."
                        className="pl-9 bg-background/50 border-border/50"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <input
                        type="file"
                        multiple
                        accept=".pdf"
                        className="hidden"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                    />
                    <Button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        className="flex-1 md:flex-none flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/20"
                    >
                        {isUploading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Upload className="w-4 h-4" />
                        )}
                        {isUploading ? `Enviando... ${uploadProgress}%` : 'Upload Avulso'}
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                {filteredDocs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-border/50 rounded-xl bg-background/30">
                        <div className="w-20 h-20 rounded-full bg-indigo-500/10 flex items-center justify-center mb-4 transition-transform hover:scale-110 duration-300">
                            <FolderOpen className="h-10 w-10 text-indigo-500" />
                        </div>
                        <h3 className="text-xl font-bold mb-2">Nenhum documento encontrado</h3>
                        <p className="text-muted-foreground max-w-sm mx-auto">
                            {searchTerm ? 'Tente outros termos de busca.' : 'Os documentos enviados aparecerão organizados aqui conforme o uso.'}
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {filteredDocs.map((doc) => (
                            <div
                                key={doc.id}
                                className="group flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-xl border border-border/50 bg-background/40 hover:bg-background/60 hover:border-indigo-500/30 transition-all duration-300 shadow-sm hover:shadow-md"
                            >
                                <div className="flex items-center gap-4 flex-1 min-w-0">
                                    <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center shrink-0 group-hover:bg-indigo-500/20 transition-colors">
                                        <FileText className="h-6 w-6 text-indigo-500" />
                                    </div>
                                    <div className="space-y-1 flex-1 min-w-0">
                                        <h4 className="font-bold text-foreground truncate text-lg pr-4" title={doc.file_name}>
                                            {doc.file_name}
                                        </h4>
                                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                                            <span className="flex items-center gap-1.5">
                                                <Calendar className="w-3.5 h-3.5 text-indigo-500/70" />
                                                {format(new Date(doc.created_at), "dd 'de' MMM, yyyy", { locale: ptBR })}
                                            </span>
                                            {doc.tributario_analyses?.company_name && (
                                                <span className="flex items-center gap-1.5 font-medium text-indigo-500/80">
                                                    <Building2 className="w-3.5 h-3.5" />
                                                    {doc.tributario_analyses.company_name}
                                                </span>
                                            )}
                                            {doc.file_size && (
                                                <Badge variant="secondary" className="bg-secondary/30 text-[10px] py-0 px-2 h-5">
                                                    {(doc.file_size / 1024).toFixed(1)} KB
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 mt-4 sm:mt-0 w-full sm:w-auto ml-0 sm:ml-4 border-t sm:border-t-0 pt-3 sm:pt-0">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="flex-1 sm:flex-none text-muted-foreground hover:text-indigo-600 hover:bg-indigo-500/10"
                                        onClick={() => downloadDocument(doc.file_path, doc.file_name)}
                                    >
                                        <Download className="w-4 h-4 mr-2" /> Baixar
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="flex-1 sm:flex-none text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
                                        onClick={() => deleteDocument(doc.id, doc.file_path)}
                                    >
                                        <Trash2 className="w-4 h-4 mr-2" /> Excluir
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
