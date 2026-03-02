import { Button } from "@/components/ui/button"
import { Check, X } from "lucide-react"
import Link from "next/link"

const plans = [
    {
        name: "Nexus SaaS - Plano Base",
        price: "R$ 297",
        period: "/mês",
        description: "Perfeito para profissionais autônomos iniciando com IA.",
        features: [
            "Atendimento IA agendador",
            "Integração WhatsApp",
            "Gestão de 1 agenda",
            "Até 500 atendimentos/mês",
        ],
        notIncluded: [
            "Múltiplos atendentes",
            "Integração com prontuário eletrônico",
            "Suporte prioritário",
        ],
        priceId: "price_1T6ZN5JWP2qoq4OjNqFBRydO",
        cta: "Começar agora",
        popular: false,
    },
    {
        name: "Nexus SaaS - Plano Pro",
        price: "R$ 497",
        period: "/mês",
        description: "Para clínicas que precisam escalar seus atendimentos sem limites.",
        features: [
            "Tudo do plano Base",
            "Atendimentos ILIMITADOS",
            "Múltiplas agendas/médicos",
            "Integração avançada de sistema",
            "Dashboard analítico completo",
        ],
        notIncluded: [],
        priceId: "price_1T6ZN5JWP2qoq4Oj6Ws2XUk5",
        cta: "Assinar o Pro",
        popular: true,
    },
    {
        name: "Nexus Enterprise",
        price: "Custom",
        period: "",
        description: "Soluções totalmente personalizadas e implementações on-premise.",
        features: [
            "Tudo do plano Pro",
            "Agentes de IA múltiplos (Triage, Vendas, etc)",
            "Treinamento de IA com seus dados",
            "SLA Garantido",
            "Gerente de Sucesso dedicado",
        ],
        notIncluded: [],
        priceId: "contact",
        cta: "Falar com Vendas",
        popular: false,
    },
]

export default function PricingPage() {
    return (
        <div className="py-24 sm:py-32 bg-slate-50 min-h-screen">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
                <div className="mx-auto max-w-4xl text-center">
                    <h2 className="text-base font-semibold leading-7 text-indigo-600">Assinaturas</h2>
                    <p className="mt-2 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
                        Escolha o plano ideal para a sua clínica
                    </p>
                </div>
                <p className="mx-auto mt-6 max-w-2xl text-center text-lg leading-8 text-gray-600">
                    Automatize seus agendamentos 24/7 com nossa Inteligência Artificial e libere sua equipe para focar no que realmente importa: atender bem.
                </p>

                <div className="isolate mx-auto mt-16 grid max-w-md grid-cols-1 gap-y-8 sm:mt-20 lg:mx-0 lg:max-w-none lg:grid-cols-3 lg:gap-x-8 lg:gap-y-0">
                    {plans.map((plan) => (
                        <div
                            key={plan.name}
                            className={`rounded-3xl p-8 ring-1 xl:p-10 flex flex-col justify-between ${plan.popular
                                    ? "bg-indigo-600 ring-indigo-600 text-white shadow-xl"
                                    : "bg-white ring-gray-200 text-gray-900"
                                }`}
                        >
                            <div>
                                <div className="flex items-center justify-between gap-x-4">
                                    <h3
                                        className={`text-lg font-semibold leading-8 ${plan.popular ? "text-white" : "text-gray-900"
                                            }`}
                                    >
                                        {plan.name}
                                    </h3>
                                    {plan.popular && (
                                        <span className="rounded-full bg-indigo-500/20 px-2.5 py-1 text-xs font-semibold leading-5 text-indigo-100 ring-1 ring-inset ring-indigo-500/30">
                                            Mais Assinado
                                        </span>
                                    )}
                                </div>
                                <p
                                    className={`mt-4 text-sm leading-6 ${plan.popular ? "text-indigo-100" : "text-gray-600"
                                        }`}
                                >
                                    {plan.description}
                                </p>
                                <p className="mt-6 flex items-baseline gap-x-1">
                                    <span
                                        className={`text-4xl font-bold tracking-tight ${plan.popular ? "text-white" : "text-gray-900"
                                            }`}
                                    >
                                        {plan.price}
                                    </span>
                                    <span
                                        className={`text-sm font-semibold leading-6 ${plan.popular ? "text-indigo-100" : "text-gray-600"
                                            }`}
                                    >
                                        {plan.period}
                                    </span>
                                </p>

                                <ul
                                    role="list"
                                    className={`mt-8 space-y-3 text-sm leading-6 ${plan.popular ? "text-indigo-100" : "text-gray-600"
                                        }`}
                                >
                                    {plan.features.map((feature) => (
                                        <li key={feature} className="flex gap-x-3">
                                            <Check
                                                className={`h-6 w-5 flex-none ${plan.popular ? "text-indigo-400" : "text-indigo-600"
                                                    }`}
                                                aria-hidden="true"
                                            />
                                            {feature}
                                        </li>
                                    ))}
                                    {plan.notIncluded && plan.notIncluded.map((feature) => (
                                        <li key={(feature)} className="flex gap-x-3 text-gray-400">
                                            <X
                                                className="h-6 w-5 flex-none text-gray-300"
                                                aria-hidden="true"
                                            />
                                            {feature}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <Link
                                href={plan.priceId === "contact" ? "https://wa.me/seunumerodevendas" : `/api/stripe/checkout?priceId=${plan.priceId}`}
                                className={`mt-8 block rounded-md px-3 py-2 text-center text-sm font-semibold leading-6 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${plan.popular
                                        ? "bg-white text-indigo-600 hover:bg-gray-50 focus-visible:outline-white"
                                        : "bg-indigo-600 text-white hover:bg-indigo-500 focus-visible:outline-indigo-600"
                                    }`}
                            >
                                {plan.cta}
                            </Link>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
