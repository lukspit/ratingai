import { Check, Activity, ArrowRight, Shield, Zap, BarChart3 } from "lucide-react"
import Link from "next/link"

const BETA_PRICE_ID = "price_1T9W5rJWP2qoq4Oj0MuND2GY"

const features = [
    "Análises CAPAG ilimitadas",
    "Upload de Balanços e DREs",
    "Identificação de Débitos PGFN",
    "Relatórios de Viabilidade com IA",
    "Exportação de Laudos em PDF",
    "IA de Fundamentação Jurídica",
    "Suporte direto com o time",
]

export default function BetaPage() {
    return (
        <div className="min-h-screen bg-[#F8FAFC] flex flex-col">

            {/* Navbar simples */}
            <nav className="bg-white border-b border-[#E5E7EB] px-6 py-4">
                <div className="mx-auto max-w-3xl flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-[#0A0F1E]/10 rounded-lg flex items-center justify-center">
                            <Activity className="w-5 h-5 text-[#0A0F1E]" />
                        </div>
                        <span className="text-xl font-bold tracking-tight text-[#0A0F1E]">Rating.ai</span>
                    </div>
                    <Link
                        href="/login"
                        className="text-sm text-[#6B7280] hover:text-[#0A0F1E] transition-colors"
                    >
                        Já tem conta? Entrar
                    </Link>
                </div>
            </nav>

            {/* Conteúdo principal */}
            <div className="flex-1 flex items-center justify-center px-6 py-12">
                <div className="w-full max-w-lg">

                    {/* Badge */}
                    <div className="text-center mb-8">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-4 py-1.5 text-sm font-medium text-emerald-700 mb-5">
                            <Zap className="w-3.5 h-3.5" />
                            Acesso Antecipado
                        </span>
                        <h1 className="text-3xl font-bold text-[#111827] tracking-tight sm:text-4xl">
                            Rating.ai Beta
                        </h1>
                        <p className="mt-3 text-[#6B7280] text-base max-w-md mx-auto">
                            Inteligência artificial para análise CAPAG e transações tributárias. Acesso completo por um valor exclusivo de lançamento.
                        </p>
                    </div>

                    {/* Card do plano */}
                    <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-8">

                        {/* Preço */}
                        <div className="text-center pb-6 border-b border-[#F3F4F6]">
                            <div className="flex items-baseline justify-center gap-1">
                                <span className="text-5xl font-bold text-[#111827]">R$ 29</span>
                                <span className="text-2xl font-bold text-[#111827]">,90</span>
                                <span className="text-[#9CA3AF] text-sm font-medium ml-1">/mês</span>
                            </div>
                            <p className="mt-2 text-sm text-[#9CA3AF]">
                                Preço exclusivo para beta testers
                            </p>
                        </div>

                        {/* Features */}
                        <ul className="mt-6 space-y-3.5">
                            {features.map((feature) => (
                                <li key={feature} className="flex items-center gap-3 text-sm text-[#374151]">
                                    <Check className="h-4 w-4 flex-none text-emerald-500" />
                                    {feature}
                                </li>
                            ))}
                        </ul>

                        {/* CTA */}
                        <Link
                            href={`/api/stripe/checkout?priceId=${BETA_PRICE_ID}`}
                            className="mt-8 flex items-center justify-center gap-2 w-full rounded-xl bg-[#0A0F1E] py-3.5 text-sm font-semibold text-white transition-all hover:bg-[#1a1f2e] hover:shadow-md"
                        >
                            Assinar Agora
                            <ArrowRight className="w-4 h-4" />
                        </Link>

                        {/* Trust badges */}
                        <div className="mt-5 flex items-center justify-center gap-4 text-xs text-[#9CA3AF]">
                            <span className="flex items-center gap-1">
                                <Shield className="w-3.5 h-3.5" />
                                Pagamento seguro via Stripe
                            </span>
                            <span>•</span>
                            <span>Cancele quando quiser</span>
                        </div>
                    </div>

                    {/* Benefícios extras */}
                    <div className="mt-8 grid grid-cols-3 gap-4">
                        <div className="text-center">
                            <div className="mx-auto w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center mb-2">
                                <BarChart3 className="w-5 h-5 text-blue-600" />
                            </div>
                            <p className="text-xs text-[#6B7280] font-medium">Análise em Segundos</p>
                        </div>
                        <div className="text-center">
                            <div className="mx-auto w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center mb-2">
                                <Shield className="w-5 h-5 text-amber-600" />
                            </div>
                            <p className="text-xs text-[#6B7280] font-medium">Precisão Jurídica</p>
                        </div>
                        <div className="text-center">
                            <div className="mx-auto w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center mb-2">
                                <Zap className="w-5 h-5 text-emerald-600" />
                            </div>
                            <p className="text-xs text-[#6B7280] font-medium">IA de Ponta</p>
                        </div>
                    </div>

                </div>
            </div>

            {/* Footer simples */}
            <footer className="border-t border-[#E5E7EB] py-4 text-center text-xs text-[#9CA3AF]">
                © 2026 Rating.ai — Todos os direitos reservados
            </footer>
        </div>
    )
}
