import { Check, X, LogIn, FileText, Search, Download, ShieldCheck, Activity } from "lucide-react"
import Link from "next/link"
import { VideoPlayer } from "./VideoPlayer"

const plans = [
    {
        name: "Plano Individual",
        price: "R$ 497",
        period: "/mês",
        description: "Ideal para advogados autônomos que estão começando a fazer transações tributárias.",
        features: [
            "Até 10 análises CAPAG/mês",
            "Upload de Balanços e DREs",
            "Identificação Automática de Débitos",
            "Relatórios de Viabilidade (Texto)",
            "Suporte via e-mail",
        ],
        notIncluded: [
            "Relatórios em PDF Customizados",
            "Análise de Grupo Econômico",
            "Histórico Ilimitado",
            "IA de Fundamentação Jurídica",
        ],
        priceId: "price_basic_tributario", // Placeholder
        cta: "Começar Agora",
        popular: false,
    },
    {
        name: "Plano Profissional",
        price: "R$ 997",
        period: "/mês",
        description: "Perfeito para escritórios que buscam escala e precisão em grandes transações.",
        features: [
            "Análises CAPAG Ilimitadas",
            "Relatórios PDF com sua logo",
            "IA de Fundamentação Jurídica",
            "Análise de Grupo Econômico",
            "Histórico de Análises Completo",
            "Suporte prioritário",
        ],
        notIncluded: [
            "Consultoria Tributária via API",
            "Gerente de Sucesso dedicado",
        ],
        priceId: "price_pro_tributario", // Placeholder
        cta: "Assinar o Pro",
        popular: true,
    },
    {
        name: "Enterprise",
        price: "Sob Consulta",
        period: "",
        description: "Escritórios full-service e redes de contabilidade com alto volume.",
        features: [
            "Tudo do plano Profissional",
            "Integração via API",
            "Treinamento com dados específicos",
            "Multi-usuários ilimitados",
            "SLA de Suporte Garantido",
            "Gerente de Sucesso Dedicado",
        ],
        notIncluded: [],
        priceId: "contact",
        cta: "Falar com Consultor",
        popular: false,
    },
]

const stats = [
    {
        Icon: Search,
        title: "Análise em Segundos",
        description: "Cruze balanços, DREs e débitos da PGFN instantaneamente com IA.",
        color: "text-primary",
        bg: "bg-primary/10",
    },
    {
        Icon: Download,
        title: "Relatórios de Especialista",
        description: "Gere pareceres técnicos e pedidos de transação prontos para protocolar.",
        color: "text-green-600",
        bg: "bg-green-600/10",
    },
    {
        Icon: ShieldCheck,
        title: "Precisão Jurídica",
        description: "IA treinada nas portarias da PGFN e critérios oficiais de rating CAPAG.",
        color: "text-amber-600",
        bg: "bg-amber-600/10",
    },
]

export default function PricingPage() {
    return (
        <div className="min-h-screen bg-[#F8FAFC]">

            {/* Navbar */}
            <nav className="bg-white border-b border-[#E5E7EB] px-6 py-4">
                <div className="mx-auto max-w-7xl flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                            <Activity className="w-5 h-5" />
                        </div>
                        <span className="text-xl font-bold tracking-tight text-primary">Rating.ai</span>
                    </div>
                    <Link
                        href="/login"
                        className="inline-flex items-center gap-2 rounded-lg border border-primary px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary hover:text-white"
                    >
                        <LogIn className="h-4 w-4" />
                        Acessar Painel
                    </Link>
                </div>
            </nav>

            {/* Hero + Vídeo */}
            <div className="bg-[#0A0F1E] px-6 pt-16 pb-24">
                <div className="mx-auto max-w-3xl text-center">
                    <span className="inline-block rounded-full bg-primary/15 border border-primary/30 px-4 py-1.5 text-sm font-semibold text-primary mb-6 text-indigo-400">
                        Inteligência Artificial Tributária
                    </span>
                    <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-[56px] lg:leading-tight">
                        Reduza dívidas tributárias em até{' '}
                        <span className="text-primary italic text-indigo-400">70%</span>{' '}
                        com análises CAPAG precisas.
                    </h1>
                    <p className="mx-auto mt-6 max-w-2xl text-lg text-white/55 leading-relaxed">
                        Pare de perder dias cruzando planilhas. Nossa IA analisa balanços e débitos automaticamente, gerando relatórios de transação prontos para uso.
                    </p>
                </div>

                <div className="mx-auto max-w-3xl mt-14">
                    <VideoPlayer />
                </div>
            </div>

            {/* Stat blocks */}
            <div className="bg-white border-b border-[#E5E7EB] px-6 py-14">
                <div className="mx-auto max-w-5xl grid grid-cols-1 gap-5 sm:grid-cols-3">
                    {stats.map(({ Icon, title, description, color, bg }) => (
                        <div
                            key={title}
                            className="flex flex-col gap-4 rounded-2xl border border-[#E5E7EB] bg-[#F8FAFC] p-7 hover:border-[#D1D5DB] hover:shadow-sm transition-all"
                        >
                            <div className={`w-fit rounded-xl ${bg} p-3`}>
                                <Icon className={`w-5 h-5 ${color}`} />
                            </div>
                            <div>
                                <h3 className="font-semibold text-[#111827] text-base mb-1.5">
                                    {title}
                                </h3>
                                <p className="text-sm text-[#6B7280] leading-relaxed">
                                    {description}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Header dos planos */}
            <div className="mx-auto max-w-7xl px-6 pt-14 pb-4 text-center">
                <span className="inline-block rounded-full bg-primary/10 px-4 py-1.5 text-sm font-semibold text-primary mb-4">
                    Assinaturas
                </span>
                <h2 className="text-4xl font-bold tracking-tight text-[#111827] sm:text-5xl">
                    O plano certo para o seu escritório
                </h2>
                <p className="mx-auto mt-4 max-w-2xl text-lg text-[#6B7280]">
                    Ganhe escala na recuperação de créditos e transações tributárias com tecnologia de ponta.
                </p>
            </div>

            {/* Cards */}
            <div className="mx-auto max-w-7xl px-6 pb-16 pt-8">
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    {plans.map((plan) => (
                        <div
                            key={plan.name}
                            className={`relative flex flex-col rounded-2xl border p-8 transition-shadow hover:shadow-lg ${plan.popular
                                ? "border-primary bg-white shadow-md ring-2 ring-primary/20"
                                : "border-[#E5E7EB] bg-white shadow-sm"
                                }`}
                        >
                            {plan.popular && (
                                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                                    <span className="inline-flex items-center rounded-full bg-primary px-4 py-1 text-xs font-semibold text-white shadow-sm">
                                        ⭐ Mais Escolhido
                                    </span>
                                </div>
                            )}

                            <div className="flex-1">
                                <h2 className="text-lg font-semibold text-[#111827]">
                                    {plan.name}
                                </h2>
                                <p className="mt-2 text-sm text-[#6B7280]">
                                    {plan.description}
                                </p>

                                <div className="mt-6 flex items-baseline gap-1">
                                    <span className={`text-4xl font-bold tracking-tight ${plan.popular ? "text-primary" : "text-[#111827]"}`}>
                                        {plan.price}
                                    </span>
                                    {plan.period && (
                                        <span className="text-sm font-medium text-[#6B7280]">
                                            {plan.period}
                                        </span>
                                    )}
                                </div>

                                <div className="my-6 border-t border-[#F3F4F6]" />

                                <ul className="space-y-3">
                                    {plan.features.map((feature) => (
                                        <li key={feature} className="flex items-start gap-3 text-sm text-[#374151]">
                                            <Check className="mt-0.5 h-4 w-4 flex-none text-green-600" />
                                            {feature}
                                        </li>
                                    ))}
                                    {plan.notIncluded.map((feature) => (
                                        <li key={feature} className="flex items-start gap-3 text-sm text-[#9CA3AF]">
                                            <X className="mt-0.5 h-4 w-4 flex-none text-[#D1D5DB]" />
                                            {feature}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <Link
                                href={plan.priceId === "contact"
                                    ? "https://wa.me/5511999999999"
                                    : `/api/stripe/checkout?priceId=${plan.priceId}`}
                                className={`mt-8 block w-full rounded-xl py-3 text-center text-sm font-semibold transition-all ${plan.popular
                                    ? "bg-primary text-white hover:bg-primary/90 shadow-sm hover:shadow-md"
                                    : "border border-primary text-primary hover:bg-primary hover:text-white"
                                    }`}
                            >
                                {plan.cta}
                            </Link>
                        </div>
                    ))}
                </div>

                <p className="mt-10 text-center text-sm text-[#9CA3AF]">
                    Faturamento via Boleto ou Cartão. Upgrade ou downgrade a qualquer momento.
                </p>
            </div>
        </div>
    )
}
