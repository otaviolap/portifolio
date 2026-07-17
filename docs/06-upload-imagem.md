# 06 — Upload de imagem (Vercel Blob)

**Decisão: client upload (`@vercel/blob/client`), não server upload.** Motivo: Route Handler na Vercel tem limite de **4.5 MB** de request body. Screenshot de projeto em PNG passa disso fácil. No client upload, o browser envia o arquivo **direto para o Blob**; o Route Handler só emite um token de curta duração.

## Fluxo

```
[BlobImageUploader.tsx  "use client"]
  1. valida no client: type ∈ {png,jpeg,webp,avif}, size ≤ 8MB
     → feedback instantâneo, NÃO é segurança
  2. upload(file, {
       access: 'public',
       handleUploadUrl: '/api/upload',
       clientPayload: JSON.stringify({ kind: 'project-cover', projectId }),
       onUploadProgress: setProgress,
     })
     └─ o SDK primeiro faz POST /api/upload pedindo token,
        depois PUT direto no Blob com esse token
  3. recebe { url, pathname } → grava nos hidden inputs do form
  4. cliente calcula width/height via createImageBitmap e um blurDataURL
     (canvas 8px → toDataURL('image/webp', 0.5)) e manda junto no form
  5. Server Action salva Project.coverUrl/coverPathname/width/height/blurData
```

## Onde valida — as três camadas

```ts
// src/app/api/upload/route.ts
export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = (await request.json()) as HandleUploadBody;
  try {
    const json = await handleUpload({
      body,
      request,
      // ── ESTA é a validação que importa ──
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        const user = await getUserOrNull();          // lê cookie + confere tokenVersion
        if (!user) throw new Error("Unauthorized");  // → 401, sem token, sem upload

        const meta = uploadPayloadSchema.parse(JSON.parse(clientPayload ?? "{}"));

        return {
          allowedContentTypes: ["image/png", "image/jpeg", "image/webp", "image/avif"],
          maximumSizeInBytes: 8 * 1024 * 1024,       // o Blob RECUSA acima disso
          addRandomSuffix: true,                      // evita colisão e enumeração
          validUntil: Date.now() + 60_000,            // token vive 1 min
          tokenPayload: JSON.stringify({ userId: user.id, ...meta }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        // roda como webhook do Blob — NÃO tem os cookies do usuário.
        // Confie apenas no tokenPayload (assinado pelo próprio fluxo).
        // Não funciona em localhost sem túnel → não coloque lógica crítica aqui.
      },
    });
    return NextResponse.json(json);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
```

As três camadas:
1. **Client** — UX. Descartável, um atacante ignora.
2. **`onBeforeGenerateToken`** — a real. Auth + `allowedContentTypes` + `maximumSizeInBytes`. O Blob aplica esses limites no PUT, então o cliente não consegue subir 500MB nem um `.exe` mesmo forjando a request.
3. **Server Action de save** — Zod valida que `coverUrl` bate com o hostname do nosso store: `/^https:\/\/[a-z0-9]+\.public\.blob\.vercel-storage\.com\//`. Sem isso, alguém com sessão pode gravar uma URL arbitrária no campo.

## Gotchas

- `onUploadCompleted` **não dispara em `localhost`** (o Blob não alcança sua máquina). Toda persistência acontece na Server Action do form, não nesse callback.
- Ao **substituir/deletar** a cover: `del(oldPathname)` na Server Action, senão o store acumula órfãos. É por isso que `coverPathname` está no schema.
- `next.config.ts` precisa de `images.remotePatterns` com `{ protocol: 'https', hostname: '*.public.blob.vercel-storage.com' }`, senão `next/image` recusa.
- Os PNGs das peças do `ScrubAssembly` e os frames da sequência sobem pelo mesmo pipeline, com `kind: 'assembly-piece'` / `'frame'` e prefixo de pathname próprio.
