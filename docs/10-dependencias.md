# 10 — Dependências

Referência do que instalar. **Não crie o `package.json` à mão** — na Fase 0 o `create-next-app` gera a base, e você adiciona o resto por cima com `npm install`. Este doc existe pra você saber o que adicionar e por quê.

## Scaffold (Fase 0)

```bash
npx create-next-app@latest portfolio-site \
  --typescript --tailwind --app --src-dir --eslint --import-alias "@/*"
```

## Runtime

```bash
# banco
npm i @prisma/client
npm i -D prisma

# animação
npm i gsap @gsap/react lenis

# upload
npm i @vercel/blob

# auth
npm i jose bcryptjs
npm i -D @types/bcryptjs

# validação + forms
npm i zod react-hook-form @hookform/resolvers

# util (opcional, mas usado no plano)
npm i clsx tailwind-merge          # cn()
npm i -D tsx dotenv-cli            # seed: dotenv -e .env.local -- tsx prisma/seed.ts

# server-only barrier
npm i server-only
```

## Dev / análise

```bash
npm i -D @next/bundle-analyzer
# analytics (Fase 9)
npm i @vercel/analytics @vercel/speed-insights
```

## Por que cada peça

| Pacote | Papel | Nota |
|---|---|---|
| `gsap` + `ScrollTrigger` | motor da animação | ScrollTrigger vem na licença padrão. Importar nominalmente, nunca `gsap/all`. |
| `@gsap/react` | `useGSAP` | cleanup automático + safe no Strict Mode. Obrigatório em todo componente de motion. |
| `lenis` | smooth scroll | wiring com GSAP no `SmoothScrollProvider` (doc 03.1). |
| `jose` | assinar/verificar JWT | Edge-safe (Web Crypto) — é o que permite o middleware sem bcrypt. |
| `bcryptjs` | hash de senha | roda só no Route Handler de login (`runtime='nodejs'`). |
| `@vercel/blob` | upload | client upload contorna o limite de 4.5MB do Route Handler. |
| `zod` | validação | `discriminatedUnion` dá type-safety ao JSONB das seções. |
| `react-hook-form` | forms do admin | usa os schemas Zod via `@hookform/resolvers`. |
| `server-only` | barreira de bundle | em `lib/queries/*` e `lib/auth/password.ts`. |

## Config do Next (`next.config.ts`)

Precisa de `images.remotePatterns` liberando o host do Blob:

```ts
images: {
  remotePatterns: [
    { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
  ],
},
```

## Scripts esperados no `package.json`

```jsonc
{
  "scripts": {
    "dev": "next dev",
    "build": "prisma generate && next build",
    "start": "next start",
    "lint": "next lint",
    "db:migrate": "dotenv -e .env.local -- prisma migrate dev",
    "db:push": "dotenv -e .env.local -- prisma db push",
    "db:seed": "dotenv -e .env.local -- prisma db seed",
    "db:studio": "dotenv -e .env.local -- prisma studio"
  },
  "prisma": { "seed": "tsx prisma/seed.ts" }
}
```
