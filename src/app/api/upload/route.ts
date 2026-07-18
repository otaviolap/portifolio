import { NextResponse } from "next/server";
import {
  handleUpload,
  type HandleUploadBody,
} from "@vercel/blob/client";
import { getUserOrNull } from "@/lib/auth/guard";
import { uploadPayloadSchema } from "@/schemas/project";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const json = await handleUpload({
      body,
      request,
      // ── a validação que importa (docs/06 §camada 2) ──
      onBeforeGenerateToken: async (_pathname, clientPayload) => {
        const user = await getUserOrNull(); // cookie + tokenVersion
        if (!user) throw new Error("Unauthorized");

        const meta = uploadPayloadSchema.parse(
          JSON.parse(clientPayload ?? "{}"),
        );

        return {
          allowedContentTypes: [
            "image/png",
            "image/jpeg",
            "image/webp",
            "image/avif",
          ],
          maximumSizeInBytes: 8 * 1024 * 1024, // o Blob RECUSA acima disso
          addRandomSuffix: true, // evita colisão e enumeração
          tokenPayload: JSON.stringify({ userId: user.id, ...meta }),
        };
      },
      onUploadCompleted: async () => {
        // Webhook do Blob — NÃO tem cookies do usuário e NÃO dispara em
        // localhost. Toda persistência acontece na Server Action do form.
      },
    });
    return NextResponse.json(json);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
