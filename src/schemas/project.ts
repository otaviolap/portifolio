// Compartilhado client/server — NÃO importa "server-only" (o form do admin usa).
import { z } from "zod";

// URL só é aceita se for do NOSSO store do Blob (senão, com sessão, alguém
// gravaria URL arbitrária no campo). Ver docs/06 §camada 3.
export const BLOB_URL_REGEX =
  /^https:\/\/[a-z0-9]+\.public\.blob\.vercel-storage\.com\//;

const emptyToUndefined = (v: unknown) =>
  v === "" || v === null ? undefined : v;

const optionalUrl = z.preprocess(
  emptyToUndefined,
  z.url("URL inválida").max(500).optional(),
);

export const projectFormSchema = z.object({
  title: z.string().min(2, "Mínimo 2 caracteres").max(160),
  slug: z
    .string()
    .min(2)
    .max(120)
    .regex(/^[a-z0-9-]+$/, "Só minúsculas, números e hífen"),
  summary: z.string().min(10, "Mínimo 10 caracteres").max(280),
  description: z.preprocess(
    emptyToUndefined,
    z.string().max(5000).optional(),
  ),
  liveUrl: optionalUrl,
  repoUrl: optionalUrl,
  clientName: z.preprocess(emptyToUndefined, z.string().max(120).optional()),
  year: z.preprocess(
    emptyToUndefined,
    z.coerce.number().int().min(1990).max(2100).optional(),
  ),
  role: z.preprocess(emptyToUndefined, z.string().max(160).optional()),
  featured: z.boolean().default(false),
  status: z.enum(["DRAFT", "PUBLISHED"]).default("DRAFT"),

  // cover (preenchidos pelo BlobImageUploader)
  coverUrl: z.preprocess(
    emptyToUndefined,
    z.string().regex(BLOB_URL_REGEX, "URL de imagem inválida").optional(),
  ),
  coverPathname: z.preprocess(emptyToUndefined, z.string().optional()),
  coverWidth: z.preprocess(
    emptyToUndefined,
    z.coerce.number().int().positive().optional(),
  ),
  coverHeight: z.preprocess(
    emptyToUndefined,
    z.coerce.number().int().positive().optional(),
  ),
  coverBlurData: z.preprocess(emptyToUndefined, z.string().optional()),
  coverAlt: z.preprocess(emptyToUndefined, z.string().max(200).optional()),

  techIds: z.array(z.string()).default([]),
});

export type ProjectFormInput = z.input<typeof projectFormSchema>;
export type ProjectFormData = z.output<typeof projectFormSchema>;

// Payload do client no upload (validado no onBeforeGenerateToken).
export const uploadPayloadSchema = z.object({
  kind: z.enum(["project-cover", "project-gallery", "assembly-piece", "frame"]),
  projectId: z.string().optional(),
});
export type UploadPayload = z.infer<typeof uploadPayloadSchema>;
