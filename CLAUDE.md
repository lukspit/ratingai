# Nexus Clínicas SaaS

Sistema SaaS para gestão de clínicas com integração WhatsApp, Google Calendar e IA.

## Idioma

- Sempre responder e escrever comentários em **português brasileiro**
- Commits em português

## Stack

- **Framework:** Next.js 16 (App Router)
- **Linguagem:** TypeScript (strict mode)
- **Auth/DB:** Supabase (SSR com @supabase/ssr)
- **UI:** Tailwind CSS 4 + shadcn/ui + Radix UI
- **Ícones:** Lucide React
- **IA:** OpenAI SDK
- **Integrações:** Google APIs (Calendar), Z-API (WhatsApp)

## Comandos

- Dev: `npm run dev`
- Build: `npm run build`
- Lint: `npm run lint`

## Estrutura do Projeto

```
src/
├── app/                    # App Router (pages e API routes)
│   ├── api/
│   │   ├── google/calendars/   # API Google Calendar
│   │   └── webhook/zapi/       # Webhook WhatsApp (Z-API)
│   ├── auth/callback/          # OAuth callback
│   ├── dashboard/              # Área logada
│   │   ├── conversations/      # Chat/conversas
│   │   ├── integrations/       # Google Calendar
│   │   ├── settings/           # Configurações
│   │   └── whatsapp/           # Gestão WhatsApp
│   └── login/                  # Página de login
├── components/
│   ├── ui/                 # Componentes shadcn (button, card, input)
│   └── DashboardSidebar.tsx
├── lib/
│   └── utils.ts            # Utilitários (cn, etc.)
├── utils/
│   └── supabase/           # Client, server e middleware do Supabase
└── middleware.ts            # Auth middleware (Supabase session)
```

## Convenções de Código

- Path alias: `@/*` mapeia para `./src/*`
- Componentes UI base ficam em `src/components/ui/` (shadcn)
- Componentes de feature ficam dentro da pasta da rota (ex: `dashboard/whatsapp/components/`)
- Usar `cn()` de `@/lib/utils` para merge de classes Tailwind
- Supabase client: `@/utils/supabase/client` (browser) ou `@/utils/supabase/server` (server)

## Variáveis de Ambiente

Arquivo `.env.local` (nunca commitar):
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Credenciais Google OAuth
- Credenciais Z-API
- `OPENAI_API_KEY`
