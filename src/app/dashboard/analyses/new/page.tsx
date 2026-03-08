'use client'

import { useState, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Upload, FileUp, Activity, CheckCircle2, FileText, X } from "lucide-react"
import { AgentStatusMonitor } from "@/components/AgentStatusMonitor"
import { useRouter } from 'next/navigation'

export default function NewAnalysisPage() {
    const [files, setFiles] = useState<File[]>([])
    const [isDragActive, setIsDragActive] = useState(false)

    // Status do Pipeline (-1: não iniciado, 0: upload, 1: extrator, 2: calc, 3: strat, 4: builder, 5: concluído)
    const [pipelineStep, setPipelineStep] = useState(-1)
    const [isError, setIsError] = useState(false)
    const [errorMessage, setErrorMessage] = useState('')
    const [analysisResultId, setAnalysisResultId] = useState<string | null>(null)

    const fileInputRef = useRef<HTMLInputElement>(null)
    const router = useRouter()

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFiles(Array.from(e.target.files))
        }
    }

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragActive(true)
    }

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragActive(false)
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragActive(false)

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const droppedFiles = Array.from(e.dataTransfer.files).filter(file => file.type === 'application/pdf')
            if (droppedFiles.length > 0) {
                setFiles(prev => [...prev, ...droppedFiles])
            }
        }
    }

    const removeFile = (index: number) => {
        setFiles(files.filter((_, i) => i !== index))
    }

    const startProcessing = async () => {
        if (files.length === 0) return

        setIsError(false)
        setPipelineStep(0) // Iniciando (vai mostrar agent monitor step 0 - Auditor)

        try {
            // STEP 0: Upload & Carga Inicial
            const formData = new FormData()
            files.forEach(f => formData.append('files', f))
            formData.append('companyName', files[0].name.split('.')[0]) // placeholder nome
            formData.append('cnpj', '12.345.678/0001-90')

            const uploadRes = await fetch('/api/analyses', { method: 'POST', body: formData })
            if (!uploadRes.ok) {
                const errData = await uploadRes.json().catch(() => ({}))
                throw new Error(`[Upload] ${errData.error || uploadRes.statusText}`)
            }

            const uploadData = await uploadRes.json()
            const { analysisId, documentsText } = uploadData

            // STEP 1: Extractor
            setPipelineStep(0)
            const extRes = await fetch('/api/agents/extractor', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ analysisId, documentsText })
            })
            if (!extRes.ok) {
                const errData = await extRes.json().catch(() => ({}))
                throw new Error(`[Extractor] ${errData.error || extRes.statusText}`)
            }
            const { extractedData } = await extRes.json()

            // STEP 2: Calculator
            setPipelineStep(1)
            const calcRes = await fetch('/api/agents/calculator', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ analysisId, extractedData })
            })
            if (!calcRes.ok) {
                const errData = await calcRes.json().catch(() => ({}))
                throw new Error(`[Calculator] ${errData.error || calcRes.statusText}`)
            }
            const { calcData } = await calcRes.json()

            // STEP 3: Strategist
            setPipelineStep(2)
            const stratRes = await fetch('/api/agents/strategist', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ analysisId, extractedData, calcData })
            })
            if (!stratRes.ok) {
                const errData = await stratRes.json().catch(() => ({}))
                throw new Error(`[Strategist] ${errData.error || stratRes.statusText}`)
            }
            const { stratData } = await stratRes.json()

            // STEP 4: Builder
            setPipelineStep(3)
            const buildRes = await fetch('/api/agents/builder', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ analysisId, extractedData, calcData, stratData })
            })
            if (!buildRes.ok) {
                const errData = await buildRes.json().catch(() => ({}))
                throw new Error(`[Builder] ${errData.error || buildRes.statusText}`)
            }

            // CONCLUÍDO
            setPipelineStep(4)
            setAnalysisResultId(analysisId)

        } catch (error: any) {
            console.error(error)
            setIsError(true)
            setErrorMessage(error.message)
        }
    }

    return (
        <div className="space-y-6 animate-in fade-in zoom-in duration-500">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Nova Simulação de CAPAG</h1>
                <p className="text-muted-foreground">
                    Envie os documentos contábeis para análise dos agentes inteligentes Rating.ai.
                </p>
            </div>

            {/* Stepper Visual */}
            <div className="grid gap-6 md:grid-cols-3 mb-8">
                <Card className={`border-primary/20 ${pipelineStep === -1 ? 'bg-primary/5 shadow-md shadow-primary/10' : 'opacity-50'}`}>
                    <CardHeader className="pb-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-2">
                            <FileUp className="w-6 h-6" />
                        </div>
                        <CardTitle className="text-lg">1. Upload</CardTitle>
                        <CardDescription>DRE, Balanço e DFC</CardDescription>
                    </CardHeader>
                </Card>

                <Card className={`border-primary/20 ${pipelineStep >= 0 && pipelineStep < 4 ? 'bg-primary/5 shadow-md shadow-primary/10' : 'opacity-50'}`}>
                    <CardHeader className="pb-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-2">
                            <Activity className="w-6 h-6" />
                        </div>
                        <CardTitle className="text-lg">2. Processamento IA</CardTitle>
                        <CardDescription>Agentes analisando...</CardDescription>
                    </CardHeader>
                </Card>

                <Card className={`border-green-500/20 ${pipelineStep === 4 ? 'bg-green-500/10 shadow-md shadow-green-500/10 border-green-500/30' : 'opacity-50'}`}>
                    <CardHeader className="pb-3">
                        <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center text-green-500 mb-2">
                            <CheckCircle2 className="w-6 h-6" />
                        </div>
                        <CardTitle className="text-lg">3. Resultado</CardTitle>
                        <CardDescription>Laudo e Estratégia</CardDescription>
                    </CardHeader>
                </Card>
            </div>

            {/* Área Principal Dinâmica */}
            {pipelineStep === -1 && (
                <Card
                    className={`border-2 border-dashed transition-all ${isDragActive ? 'border-primary bg-primary/5' : 'border-border/50 hover:border-primary/50'}`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                >
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <input
                            type="file"
                            multiple
                            accept=".pdf"
                            className="hidden"
                            ref={fileInputRef}
                            onChange={handleFileSelect}
                        />

                        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                            <Upload className="w-8 h-8 text-primary" />
                        </div>
                        <div className="text-center space-y-3 w-full max-w-md">
                            <h3 className="font-semibold text-xl">Envie os documentos</h3>
                            <p className="text-sm text-muted-foreground mx-auto">
                                Arraste e solte o DRE e Balanço aqui, ou clique abaixo. Apenas PDFs são permitidos.
                            </p>

                            {files.length > 0 && (
                                <div className="mt-6 mb-2 space-y-2 text-left bg-background p-4 rounded-xl border border-border/50 shadow-sm">
                                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Arquivos Selecionados</p>
                                    {files.map((file, i) => (
                                        <div key={i} className="flex items-center justify-between bg-muted/50 p-2 rounded-lg text-sm">
                                            <div className="flex items-center gap-2 truncate">
                                                <FileText className="w-4 h-4 text-primary shrink-0" />
                                                <span className="truncate">{file.name}</span>
                                            </div>
                                            <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => removeFile(i)}>
                                                <X className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="flex gap-4 justify-center mt-6">
                                <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                                    Procurar Arquivos
                                </Button>
                                <Button
                                    onClick={startProcessing}
                                    disabled={files.length === 0}
                                    className="shadow-lg shadow-primary/20"
                                >
                                    Iniciar Análise Inteligente
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {pipelineStep >= 0 && pipelineStep < 4 && (
                <div className="max-w-3xl mx-auto animate-in slide-in-from-bottom-4 duration-500">
                    <AgentStatusMonitor currentStep={pipelineStep} isError={isError} />
                    {isError && (
                        <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg text-sm flex flex-col items-center text-center">
                            <p className="font-semibold mb-1">Ocorreu um erro no pipeline de IA:</p>
                            <p className="opacity-90">{errorMessage}</p>
                            <Button variant="outline" className="mt-4 border-red-500/50 hover:bg-red-500/10" onClick={() => {
                                setIsError(false);
                                setPipelineStep(-1);
                            }}>
                                Tentar Novamente
                            </Button>
                        </div>
                    )}
                </div>
            )}

            {pipelineStep === 4 && (
                <Card className="bg-green-500/5 border-green-500/20 shadow-lg text-center py-12 max-w-2xl mx-auto animate-in fade-in zoom-in duration-500">
                    <CardContent className="space-y-6">
                        <div className="w-20 h-20 rounded-full bg-green-500 flex items-center justify-center mx-auto text-white shadow-xl shadow-green-500/30">
                            <CheckCircle2 className="w-10 h-10" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold bg-gradient-to-r from-green-500 to-emerald-400 bg-clip-text text-transparent">
                                Laudo Concluído com Sucesso!
                            </h2>
                            <p className="text-muted-foreground mt-2 max-w-md mx-auto">
                                A análise estratégica da empresa foi gerada. O rating sugerido e as hipóteses de ajuste já estão disponíveis.
                            </p>
                        </div>
                        <div className="flex justify-center gap-4 pt-4">
                            <Button variant="outline" onClick={() => router.push('/dashboard/analyses/new')}>
                                Nova Análise
                            </Button>
                            <Button
                                className="bg-green-500 hover:bg-green-600 shadow-lg shadow-green-500/20"
                                onClick={() => router.push(`/dashboard/analyses`)}
                            >
                                Ver Relatório Completo
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
