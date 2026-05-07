# SDW.hub 2026 | Dashboard Real Time

Landing page do **maior evento de negócios, inovação e tecnologia da Baixada Santista**, construída em Next.js 15 (App Router) + TypeScript + Tailwind v4 + Motion + Phosphor Icons.

> Stack atende a regra do `lp-front-model.md`: todas as dependências são `latest` e os ícones do Phosphor são importados via `@phosphor-icons/react/ssr` para SSR seguro.

## Stack

| Camada | Tecnologia |
| ------ | ---------- |
| Framework | Next.js (latest) — App Router |
| Linguagem | TypeScript (latest) |
| Estilização | Tailwind CSS v4 |
| Animações | Motion (Framer) |
| Ícones | @phosphor-icons/react (SSR) |
| IA | @google/genai |
| Otimização | sharp (WebP) + next/image + next/font |

## Scripts

```bash
npm run dev              # next dev
npm run optimize-images  # gera .webp em /public/images
npm run build            # otimiza imagens + next build
npm run start            # serve build de produção
npm run lint             # next lint
```

## Estrutura

```
sdwhub-dashboard/
├── app/
│   ├── components/
│   │   ├── fade-in.tsx
│   │   ├── navbar.tsx
│   │   ├── hero.tsx
│   │   ├── services-section.tsx
│   │   ├── business-stages.tsx
│   │   ├── weekly-dynamics.tsx
│   │   ├── pricing-section.tsx
│   │   ├── faq-section.tsx
│   │   ├── footer.tsx
│   │   └── floating-whatsapp.tsx
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── lib/
│   ├── fetcher.ts        # fetch wrapper com mode: 'cors'
│   └── utils.ts          # cn() — clsx + tailwind-merge
├── public/
│   ├── images/           # logos SDW + WebP gerados
│   ├── videos/sdwhero.mp4
│   ├── robots.txt
│   └── sitemap.xml
├── scripts/optimize-images.mjs
├── types/typebot.d.ts
├── .env.local            # GEMINI_API_KEY (NÃO commitar)
├── .env.example
├── .gitignore
├── metadata.json
├── next.config.ts
├── postcss.config.mjs
├── tsconfig.json
└── package.json
```

## CORS-enabled fetch

Toda chamada HTTP do projeto deve passar por `lib/fetcher.ts`:

```ts
import { fetcher } from '@/lib/fetcher';

const stats = await fetcher<EventStats>('https://api.sdwhub.com/stats', {
  revalidate: 60,
  tags: ['stats'],
});
```

O wrapper adiciona automaticamente:
- `mode: 'cors'`
- `Content-Type: application/json` (quando há body)
- Tratamento de erro com `FetcherError`
- Suporte a `revalidate` / `tags` do App Router

## Variáveis de ambiente

Crie `.env.local` (já presente):

```env
GEMINI_API_KEY=...
NEXT_PUBLIC_SITE_URL=https://sdwhub.com.br
NEXT_PUBLIC_GTM_ID=GTM-XXXX   # opcional — Google Tag Manager
```

## Branding

- **Paleta**: tokens em `app/globals.css` (`--color-brand-purple`, `--color-brand-cream`, etc.)
- **Tipografia**: Poppins (100–900) via `next/font/google` em `app/layout.tsx`
- **Logos**: `/public/images/sdw-logo-{purple,white,gold}.png`

## Próximos passos

1. Substituir os 3 logos em `public/images/` pelas versões finais (purple, white, gold).
2. Adicionar a logo gold (`sdw-logo-gold.png`) — atualmente faltante.
3. Configurar `NEXT_PUBLIC_GTM_ID` quando o GTM estiver pronto.
4. Apontar `lib/fetcher.ts` para a API real de dados do evento.

## AIOX — Framework de Orquestração de Dev

Este projeto integra **[@aiox-squads/core](https://github.com/SynkraAI/aiox-core)** — framework CLI-first de agentes de IA para acelerar o ciclo de desenvolvimento (planejamento agêntico + desenvolvimento contextualizado por engenharia).

> AIOX é uma camada de **dev tooling**, não runtime — não afeta o bundle do Next.js nem o deploy. Vive em `.claude/` e `.aiox-core/`.

### Instalado em `.claude/`

| Pasta | Conteúdo |
| ----- | -------- |
| `commands/AIOX/agents/` | 12 agentes: `dev`, `qa`, `architect`, `pm`, `po`, `sm`, `analyst`, `devops`, `data-engineer`, `ux-design-expert`, `aiox-master`, `squad-creator` |
| `rules/` | 10 regras (agent-authority, agent-handoff, story-lifecycle, mcp-usage, workflow-execution, etc.) |
| `hooks/` | 3 hooks (synapse-engine, precompact-session-digest) |
| `skills/` | Skills domain-specific |
| `CLAUDE.md` | Instruções base do AIOX (356 linhas) — integra com Claude Code |
| `settings.json` | Config local (idioma, etc.) |

Config core: `.aiox-core/core-config.yaml` (393 linhas).

### Como usar (dentro do Claude Code, neste projeto)

```text
@dev *help              # ativa o agente Developer
@architect *help        # arquitetura de novas features
@pm *create-story       # gera história detalhada
@qa *review             # revisão de código + testes
@aiox-master *help      # menu central de todos os agentes
```

### Variáveis de ambiente AIOX (opcionais)

Em `.env.local` (não commitado), você pode preencher chaves para integrações que o AIOX usa quando solicitado pelos agentes (Supabase, GitHub, Sentry, Vercel, etc.). Veja a seção "AIOX Variables" no [`.env.example`](.env.example).

### Atualização

```bash
npx --yes aiox-core install --ci --yes --ide claude-code --merge
```

O flag `--merge` (brownfield mode) preserva customizações em `.env*` e `CLAUDE.md`.
# sdwhub-dashboard
