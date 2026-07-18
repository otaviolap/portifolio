import "server-only";
import { del } from "@vercel/blob";

/**
 * Apaga um blob pelo pathname. Silencioso em erro (best-effort) — não vale
 * quebrar um update de projeto porque a imagem antiga já não existe.
 * É por isso que guardamos coverPathname no schema (docs/06 §gotchas).
 */
export async function deleteBlob(pathname?: string | null): Promise<void> {
  if (!pathname) return;
  try {
    await del(pathname);
  } catch (e) {
    console.warn(`Falha ao deletar blob ${pathname}:`, (e as Error).message);
  }
}
