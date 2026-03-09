'use client'

import { useState, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Upload, FileUp, Activity, CheckCircle2, FileText, X, Building2, DollarSign } from "lucide-react"
import { AgentStatusMonitor } from "@/components/AgentStatusMonitor"
import { useRouter } from 'next/navigation'

const MODALIDADES = [
    { value: 'adesao', label: 'Transação por Adesão (Edital)' },
    { value: 'pequeno_valor', label: 'Pequeno Valor (até R$ 1M)' },
    { value: 'simplificada', label: 'Individual Simplificada (R$ 1M–10M)' },
    { value: 'individual', label: 'Individual (acima de R$ 10M)' },
]

export default function NewAnalysisPage() {
    const [files, setFiles] = useState<File[]>([])
    const [isDragActive, setIsDragActive] = useState(false)

    // Dados da empresa e dívida
    const [companyName, setCompanyName] = useState('')
    const [cnpj, setCnpj] = useState('')
    const [valorDivida, setValorDivida] = useState('')
    const [modalidade, setModalidade] = useState('')

    // Status do Pipeline (-1: não iniciado, 0: extrator, 1: calc, 2: strat, 3: builder, 4: concluído)
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
            const droppedFiles = Array.from(e.dataTransfer.files).filter(f => f.type === 'application/pdf')
            if (droppedFiles.length > 0) setFiles(prev => [...prev, ...droppedFiles])
        }
    }

    const removeFile = (index: number) => setFiles(files.filter((_, i) => i !== index))

    // Formata valor monetário enquanto o usuário digita
    const handleValorDivida = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value.replace(/\D/g, '')
        setValorDivida(raw)
    }

    const formatarMoeda = (raw: string) => {
        if (!raw) return ''
        const num = parseFloat(raw) / 100
        return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    }

    const valorDividaNumerico = valorDivida ? parseFloat(valorDivida) / 100 : 0

    const canStart = files.length > 0 && companyName.trim() && valorDivida && modalidade

    const startProcessing = async () => {
        if (!canStart) return

        setIsError(false)
        setPipelineStep(0)

        try {
            // STEP 0: Upload & Criação da análise
            const formData = new FormData()
            files.forEach(f => formData.append('files', f))
            formData.append('companyName', companyName.trim())
            formData.append('cnpj', cnpj.trim())
            formData.append('valorDivida', String(valorDividaNumerico))
            formData.append('modalidade', modalidade)

            const uploadRes = await fetch('/api/analyses', { method: 'POST', body: formData })
            if (!uploadRes.ok) {
                const errText = await uploadRes.text().catch(() => "Não foi possível ler o corpo da resposta")
                let serverError = uploadRes.statusText
                try {
                    const errData = JSON.parse(errText)
                    serverError = errData.error || serverError
                } catch (e) {
                    serverError = errText.substring(0, 150)
                }
                throw new Error(`[Upload ${uploadRes.status}] ${serverError}`)
            }
            const resBody = await uploadRes.json().catch(() => ({}))
            const { analysisId, documentsText } = resBody

            // STEP 1: Extractor
            setPipelineStep(0)
            const extRes = await fetch('/api/agents/extractor', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ analysisId, documentsText })
            })
            if (!extRes.ok) throw new Error(`[Extractor] ${(await extRes.json().catch(() => ({}))).error || extRes.statusText}`)
            const { extractedData } = await extRes.json()

            // STEP 2: Calculator
            setPipelineStep(1)
            const calcRes = await fetch('/api/agents/calculator', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ analysisId, extractedData, valorDivida: valorDividaNumerico })
            })
            if (!calcRes.ok) throw new Error(`[Calculator] ${(await calcRes.json().catch(() => ({}))).error || calcRes.statusText}`)
            const { calcData } = await calcRes.json()

            // STEP 3: Strategist
            setPipelineStep(2)
            const stratRes = await fetch('/api/agents/strategist', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ analysisId, extractedData, calcData })
            })
            if (!stratRes.ok) throw new Error(`[Strategist] ${(await stratRes.json().catch(() => ({}))).error || stratRes.statusText}`)
            const { stratData } = await stratRes.json()

            // STEP 4: Builder
            setPipelineStep(3)
            const buildRes = await fetch('/api/agents/builder', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ analysisId, extractedData, calcData, stratData, valorDivida: valorDividaNumerico, modalidade })
            })
            if (!buildRes.ok) throw new Error(`[Builder] ${(await buildRes.json().catch(() => ({}))).error || buildRes.statusText}`)

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
                    Envie os documentos contábeis para análise de capacidade de pagamento e identificação de ajustes legais.
                </p>
            </div>

            {/* Stepper Visual */}
            <div className="grid gap-6 md:grid-cols-3 mb-8">
                <Card className={`border-primary/20 ${pipelineStep === -1 ? 'bg-primary/5 shadow-md shadow-primary/10' : 'opacity-50'}`}>
                    <CardHeader className="pb-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-2">
                            <FileUp className="w-6 h-6" />
                        </div>
                        <CardTitle className="text-lg">1. Dados e Upload</CardTitle>
                        <CardDescription>Empresa, dívida e documentos</CardDescription>
                    </CardHeader>
                </Card>

                <Card className={`border-primary/20 ${pipelineStep >= 0 && pipelineStep < 4 ? 'bg-primary/5 shadow-md shadow-primary/10' : 'opacity-50'}`}>
                    <CardHeader className="pb-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-2">
                            <Activity className="w-6 h-6" />
                        </div>
                        <CardTitle className="text-lg">2. Análise IA</CardTitle>
                        <CardDescription>Identificando brechas legais...</CardDescription>
                    </CardHeader>
                </Card>

                <Card className={`border-green-500/20 ${pipelineStep === 4 ? 'bg-green-500/10 shadow-md shadow-green-500/10 border-green-500/30' : 'opacity-50'}`}>
                    <CardHeader className="pb-3">
                        <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center text-green-500 mb-2">
                            <CheckCircle2 className="w-6 h-6" />
                        </div>
                        <CardTitle className="text-lg">3. Resultado</CardTitle>
                        <CardDescription>Laudo e Economia em R$</CardDescription>
                    </CardHeader>
                </Card>
            </div>

            {/* Formulário + Upload */}
            {pipelineStep === -1 && (
                <div className="space-y-6 max-w-2xl">
                    {/* Dados da Empresa */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <Building2 className="w-5 h-5 text-primary" />
                                <CardTitle className="text-lg">Dados da Empresa</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="companyName">Razão Social <span className="text-red-500">*</span></Label>
                                <Input
                                    id="companyName"
                                    placeholder="Ex: Comércio ABC Ltda"
                                    value={companyName}
                                    onChange={e => setCompanyName(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="cnpj">CNPJ <span className="text-muted-foreground text-xs">(opcional)</span></Label>
                                <Input
                                    id="cnpj"
                                    placeholder="00.000.000/0001-00"
                                    value={cnpj}
                                    onChange={e => setCnpj(e.target.value)}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Dados da Dívida */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <DollarSign className="w-5 h-5 text-primary" />
                                <CardTitle className="text-lg">Dívida Tributária</CardTitle>
                            </div>
                            <CardDescription>
                                Essencial para calcular a economia real em R$ com os ajustes.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="valorDivida">Valor Total da Dívida (PGFN) <span className="text-red-500">*</span></Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">R$</span>
                                    <Input
                                        id="valorDivida"
                                        className="pl-9"
                                        placeholder="0,00"
                                        value={valorDivida ? formatarMoeda(valorDivida).replace('R$\u00a0', '') : ''}
                                        onChange={handleValorDivida}
                                        inputMode="numeric"
                                    />
                                </div>
                                {valorDividaNumerico > 0 && (
                                    <p className="text-xs text-muted-foreground">
                                        {valorDividaNumerico.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                    </p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="modalidade">Modalidade de Transação <span className="text-red-500">*</span></Label>
                                <Select value={modalidade} onValueChange={setModalidade}>
                                    <SelectTrigger id="modalidade">
                                        <SelectValue placeholder="Selecione a modalidade" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {MODALIDADES.map(m => (
                                            <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Upload de Documentos */}
                    <Card
                        className={`border-2 border-dashed transition-all ${isDragActive ? 'border-primary bg-primary/5' : 'border-border/50 hover:border-primary/50'}`}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                    >
                        <CardContent className="flex flex-col items-center justify-center py-10">
                            <input
                                type="file"
                                multiple
                                accept=".pdf"
                                className="hidden"
                                ref={fileInputRef}
                                onChange={handleFileSelect}
                            />
                            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                                <Upload className="w-7 h-7 text-primary" />
                            </div>
                            <div className="text-center space-y-2 w-full max-w-md">
                                <h3 className="font-semibold text-lg">Documentos Contábeis</h3>
                                <p className="text-sm text-muted-foreground">
                                    Envie DRE, Balanço Patrimonial e DFC (se disponível). Somente PDFs.
                                </p>

                                {files.length > 0 && (
                                    <div className="mt-4 mb-2 space-y-2 text-left bg-background p-4 rounded-xl border border-border/50">
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

                                <div className="flex gap-4 justify-center mt-4">
                                    <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                                        Procurar Arquivos
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Botão de iniciar */}
                    <div className="flex justify-end">
                        <Button
                            size="lg"
                            onClick={startProcessing}
                            disabled={!canStart}
                            className="shadow-lg shadow-primary/20 px-8"
                        >
                            Iniciar Análise Inteligente
                        </Button>
                    </div>
                    {!canStart && files.length > 0 && (
                        <p className="text-xs text-muted-foreground text-right">
                            Preencha a razão social, valor da dívida e modalidade para continuar.
                        </p>
                    )}
                </div>
            )}

            {/* Pipeline em progresso */}
            {pipelineStep >= 0 && pipelineStep < 4 && (
                <div className="max-w-3xl mx-auto animate-in slide-in-from-bottom-4 duration-500">
                    <AgentStatusMonitor currentStep={pipelineStep} isError={isError} />
                    {isError && (
                        <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg text-sm flex flex-col items-center text-center">
                            <p className="font-semibold mb-1">Ocorreu um erro no pipeline:</p>
                            <p className="opacity-90">{errorMessage}</p>
                            <Button variant="outline" className="mt-4 border-red-500/50 hover:bg-red-500/10" onClick={() => {
                                setIsError(false)
                                setPipelineStep(-1)
                            }}>
                                Tentar Novamente
                            </Button>
                        </div>
                    )}
                </div>
            )}

            {/* Concluído */}
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
                                Identificamos os ajustes legais aplicáveis e calculamos o impacto financeiro real na negociação com a PGFN.
                            </p>
                        </div>
                        <div className="flex justify-center gap-4 pt-4">
                            <Button variant="outline" onClick={() => {
                                setPipelineStep(-1)
                                setFiles([])
                                setCompanyName('')
                                setCnpj('')
                                setValorDivida('')
                                setModalidade('')
                            }}>
                                Nova Análise
                            </Button>
                            <Button
                                className="bg-green-500 hover:bg-green-600 shadow-lg shadow-green-500/20"
                                onClick={() => router.push(`/dashboard/analyses/${analysisResultId}`)}
                            >
                                Ver Laudo e Economia
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
