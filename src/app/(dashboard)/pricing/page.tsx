import { Check, X, LogIn, Zap, CalendarCheck, RefreshCw } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { VideoPlayer } from "./VideoPlayer"

const plans = [
    {
        name: "Plano Base",
        price: "R$ 797",
        period: "/mês",
        description: "Profissionais em consultório particular que precisam automatizar o atendimento receptivo.",
        features: [
            "Atendimento IA agendador",
            "Integração WhatsApp",
            "Gestão de 1 agenda",
            "Até 300 atendimentos/mês",
            "Suporte via e-mail",
        ],
        notIncluded: [
            "Gestão de múltiplas agendas",
            "IA Ativa (Follow-up de pacientes perdidos)",
            "Disparo lógico de lembretes",
            "Dashboard analítico completo",
            "Suporte prioritário via WhatsApp",
        ],
        priceId: "price_1T6dZgJWP2qoq4Oj7KoZvogo",
        cta: "Assinar o Base",
        popular: false,
    },
    {
        name: "Plano Pro",
        price: "R$ 997",
        period: "/mês",
        description: "Clínicas que precisam de uma IA inteligente para recuperar leads e gerir múltiplos médicos.",
        features: [
            "Tudo do plano Base",
            "Até 1.500 atendimentos/mês",
            "Gestão de até 3 agendas",
            "IA Ativa: Follow-up de recuperação",
            "Disparo automático de lembretes",
            "Dashboard analítico avançado",
            "Suporte prioritário via WhatsApp",
        ],
        notIncluded: [
            "SLA de Resposta Garantido",
            "Gerente de Sucesso dedicado",
        ],
        priceId: "price_1T6dZmJWP2qoq4Oj5DvYRwYr",
        cta: "Assinar o Pro",
        popular: true,
    },
    {
        name: "Enterprise",
        price: "Custom",
        period: "",
        description: "Redes de clínicas ou alto volume de consultas com necessidades personalizadas.",
        features: [
            "Tudo do plano Pro",
            "5.000+ atendimentos/mês",
            "Agendas Ilimitadas (custom)",
            "Treinamento de IA com dados internos",
            "SLA de Tempo de Resposta",
            "Customer Success Dedicado",
        ],
        notIncluded: [],
        priceId: "contact",
        cta: "Falar com Vendas",
        popular: false,
    },
]

const stats = [
    {
        Icon: Zap,
        title: "Resposta em segundos",
        description: "A IA atende seus pacientes no WhatsApp a qualquer hora, inclusive de madrugada.",
        color: "text-[#4A90E2]",
        bg: "bg-[#4A90E2]/10",
    },
    {
        Icon: CalendarCheck,
        title: "Zero vagas perdidas",
        description: "Agendamentos confirmados automaticamente, sem precisar de intervenção humana.",
        color: "text-[#6DA08D]",
        bg: "bg-[#6DA08D]/10",
    },
    {
        Icon: RefreshCw,
        title: "Pacientes recuperados",
        description: "Follow-up automático para quem não respondeu ou estava prestes a desistir.",
        color: "text-[#F59E0B]",
        bg: "bg-[#F59E0B]/10",
    },
]

export default function PricingPage() {
    return (
        <div className="min-h-screen bg-[#F8FAFC]">

            {/* Navbar */}
            <nav className="bg-white border-b border-[#E5E7EB] px-6 py-4">
                <div className="mx-auto max-w-7xl flex items-center justify-between">
                    <div className="relative h-9 w-40">
                        <Image
                            src="/logos/nexus_logo_equalized.png"
                            alt="Nexus Clínicas"
                            fill
                            className="object-contain object-left"
                            priority
                        />
                    </div>
                    <Link
                        href="/login"
                        className="inline-flex items-center gap-2 rounded-lg border border-[#4A90E2] px-4 py-2 text-sm font-medium text-[#4A90E2] transition-colors hover:bg-[#4A90E2] hover:text-white"
                    >
                        <LogIn className="h-4 w-4" />
                        Já sou cliente
                    </Link>
                </div>
            </nav>

            {/* Hero + Vídeo */}
            <div className="bg-[#0A0F1E] px-6 pt-16 pb-24">
                <div className="mx-auto max-w-3xl text-center">
                    <span className="inline-block rounded-full bg-[#4A90E2]/15 border border-[#4A90E2]/30 px-4 py-1.5 text-sm font-semibold text-[#4A90E2] mb-6">
                        Como funciona na prática
                    </span>
                    <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-[56px] lg:leading-tight">
                        Pare de perder consultas.{' '}
                        <span className="text-[#4A90E2]">Sua clínica no piloto automático,</span>{' '}
                        24h por dia.
                    </h1>
                    <p className="mx-auto mt-6 max-w-2xl text-lg text-white/55 leading-relaxed">
                        Veja como a Nexus responde seus pacientes no WhatsApp, agenda consultas e recupera quem quase desistiu, enquanto você trabalha ou descansa.
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
                <span className="inline-block rounded-full bg-[#4A90E2]/10 px-4 py-1.5 text-sm font-semibold text-[#4A90E2] mb-4">
                    Planos e Assinaturas
                </span>
                <h2 className="text-4xl font-bold tracking-tight text-[#111827] sm:text-5xl">
                    Escolha o plano ideal para a sua clínica
                </h2>
                <p className="mx-auto mt-4 max-w-2xl text-lg text-[#6B7280]">
                    Automatize seus agendamentos 24/7 com IA e libere sua equipe para focar no que realmente importa: atender bem.
                </p>
            </div>

            {/* Cards */}
            <div className="mx-auto max-w-7xl px-6 pb-16 pt-8">
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    {plans.map((plan) => (
                        <div
                            key={plan.name}
                            className={`relative flex flex-col rounded-2xl border p-8 transition-shadow hover:shadow-lg ${plan.popular
                                ? "border-[#4A90E2] bg-white shadow-md ring-2 ring-[#4A90E2]/20"
                                : "border-[#E5E7EB] bg-white shadow-sm"
                                }`}
                        >
                            {plan.popular && (
                                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                                    <span className="inline-flex items-center rounded-full bg-[#4A90E2] px-4 py-1 text-xs font-semibold text-white shadow-sm">
                                        ⭐ Mais Assinado
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
                                    <span className={`text-4xl font-bold tracking-tight ${plan.popular ? "text-[#4A90E2]" : "text-[#111827]"}`}>
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
                                            <Check className="mt-0.5 h-4 w-4 flex-none text-[#6DA08D]" />
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
                                    ? "https://wa.me/seunumerodevendas"
                                    : `/api/stripe/checkout?priceId=${plan.priceId}`}
                                className={`mt-8 block w-full rounded-xl py-3 text-center text-sm font-semibold transition-all ${plan.popular
                                    ? "bg-[#4A90E2] text-white hover:bg-[#3a7acc] shadow-sm hover:shadow-md"
                                    : "border border-[#4A90E2] text-[#4A90E2] hover:bg-[#4A90E2] hover:text-white"
                                    }`}
                            >
                                {plan.cta}
                            </Link>
                        </div>
                    ))}
                </div>

                <p className="mt-10 text-center text-sm text-[#9CA3AF]">
                    Todos os planos incluem 7 dias de teste grátis. Cancele quando quiser.
                </p>
            </div>
        </div>
    )
}
