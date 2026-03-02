import { Check, X, LogIn } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

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

            {/* Header */}
            <div className="mx-auto max-w-7xl px-6 pt-12 pb-4 text-center">
                <span className="inline-block rounded-full bg-[#4A90E2]/10 px-4 py-1.5 text-sm font-semibold text-[#4A90E2] mb-4">
                    Planos e Assinaturas
                </span>
                <h1 className="text-4xl font-bold tracking-tight text-[#111827] sm:text-5xl">
                    Escolha o plano ideal para a sua clínica
                </h1>
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
                                {/* Título e descrição */}
                                <h2 className="text-lg font-semibold text-[#111827]">
                                    {plan.name}
                                </h2>
                                <p className="mt-2 text-sm text-[#6B7280]">
                                    {plan.description}
                                </p>

                                {/* Preço */}
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

                                {/* Divisor */}
                                <div className="my-6 border-t border-[#F3F4F6]" />

                                {/* Features */}
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

                            {/* CTA */}
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

                {/* Rodapé */}
                <p className="mt-10 text-center text-sm text-[#9CA3AF]">
                    Todos os planos incluem 7 dias de teste grátis. Cancele quando quiser.
                </p>
            </div>
        </div>
    )
}
