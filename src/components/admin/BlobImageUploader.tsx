"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { upload } from "@vercel/blob/client";
import type { UploadPayload } from "@/schemas/project";

const ACCEPT = ["image/png", "image/jpeg", "image/webp", "image/avif"];
const MAX_BYTES = 8 * 1024 * 1024;

export type UploadedImage = {
  url: string;
  pathname: string;
  width: number;
  height: number;
  blurData: string;
};

type Props = {
  kind: UploadPayload["kind"];
  projectId?: string;
  current?: { url: string | null; alt?: string | null };
  onUploaded: (img: UploadedImage) => void;
  onRemoved: () => void;
};

/** Dimensões + blurDataURL (canvas 8px → webp) calculados 1x no client. */
async function measureAndBlur(file: File): Promise<{
  width: number;
  height: number;
  blurData: string;
}> {
  const bitmap = await createImageBitmap(file);
  const { width, height } = bitmap;

  const w = 8;
  const h = Math.max(1, Math.round((height / width) * w));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  let blurData = "";
  if (ctx) {
    ctx.drawImage(bitmap, 0, 0, w, h);
    blurData = canvas.toDataURL("image/webp", 0.5);
  }
  bitmap.close();
  return { width, height, blurData };
}

export function BlobImageUploader({
  kind,
  projectId,
  current,
  onUploaded,
  onRemoved,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(current?.url ?? null);

  async function handleFile(file: File) {
    setError(null);

    if (!ACCEPT.includes(file.type)) {
      setError("Formato inválido. Use PNG, JPEG, WebP ou AVIF.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("Arquivo acima de 8 MB.");
      return;
    }

    try {
      setProgress(0);
      const { width, height, blurData } = await measureAndBlur(file);

      const blob = await upload(file.name, file, {
        access: "public",
        handleUploadUrl: "/api/upload",
        clientPayload: JSON.stringify({ kind, projectId } satisfies UploadPayload),
        onUploadProgress: (p) => setProgress(Math.round(p.percentage)),
      });

      setPreview(blob.url);
      onUploaded({ url: blob.url, pathname: blob.pathname, width, height, blurData });
    } catch (e) {
      setError((e as Error).message || "Falha no upload.");
    } finally {
      setProgress(null);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {preview ? (
        <div className="relative aspect-video w-full max-w-md overflow-hidden rounded-lg border border-foreground/10">
          <Image
            src={preview}
            alt={current?.alt ?? "Prévia da imagem"}
            fill
            sizes="(max-width: 448px) 100vw, 448px"
            className="object-cover"
          />
        </div>
      ) : (
        <div className="flex aspect-video w-full max-w-md items-center justify-center rounded-lg border border-dashed border-foreground/20 text-sm text-foreground/40">
          Sem imagem
        </div>
      )}

      <div className="flex items-center gap-3">
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT.join(",")}
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
            e.target.value = "";
          }}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={progress !== null}
          className="rounded-lg border border-foreground/20 px-3 py-1.5 text-sm transition-colors hover:bg-foreground/5 disabled:opacity-50"
        >
          {progress !== null
            ? `Enviando… ${progress}%`
            : preview
              ? "Trocar imagem"
              : "Enviar imagem"}
        </button>
        {preview && progress === null && (
          <button
            type="button"
            onClick={() => {
              setPreview(null);
              onRemoved();
            }}
            className="text-sm text-foreground/50 transition-colors hover:text-red-400"
          >
            Remover
          </button>
        )}
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  );
}
