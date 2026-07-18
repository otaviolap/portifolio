"use client";

import { useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { projectFormSchema } from "@/schemas/project";
import type { ProjectEditDTO } from "@/lib/queries/projects";
import type { TechDTO } from "@/lib/queries/techs";
import { createProject, updateProject } from "@/lib/actions/projects";
import { slugify } from "@/lib/utils";
import { BlobImageUploader } from "./BlobImageUploader";

// Tipos "amigáveis de form" (inputs produzem string); o Zod da action
// converte (preprocess) — a action é a fonte de verdade da validação.
type FormValues = {
  title: string;
  slug: string;
  summary: string;
  description: string;
  liveUrl: string;
  repoUrl: string;
  clientName: string;
  year: string;
  role: string;
  featured: boolean;
  status: "DRAFT" | "PUBLISHED";
  coverUrl: string;
  coverPathname: string;
  coverWidth: string;
  coverHeight: string;
  coverBlurData: string;
  coverAlt: string;
  techIds: string[];
};

function toDefaults(p?: ProjectEditDTO): FormValues {
  return {
    title: p?.title ?? "",
    slug: p?.slug ?? "",
    summary: p?.summary ?? "",
    description: p?.description ?? "",
    liveUrl: p?.liveUrl ?? "",
    repoUrl: p?.repoUrl ?? "",
    clientName: p?.clientName ?? "",
    year: p?.year != null ? String(p.year) : "",
    role: p?.role ?? "",
    featured: p?.featured ?? false,
    status: (p?.status as "DRAFT" | "PUBLISHED") ?? "DRAFT",
    coverUrl: p?.coverUrl ?? "",
    coverPathname: p?.coverPathname ?? "",
    coverWidth: p?.coverWidth != null ? String(p.coverWidth) : "",
    coverHeight: p?.coverHeight != null ? String(p.coverHeight) : "",
    coverBlurData: p?.coverBlurData ?? "",
    coverAlt: p?.coverAlt ?? "",
    techIds: p?.techIds ?? [],
  };
}

const inputCls =
  "rounded-lg border border-foreground/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-foreground/40";

export function ProjectForm({
  techs,
  project,
}: {
  techs: TechDTO[];
  project?: ProjectEditDTO;
}) {
  const router = useRouter();
  const isEdit = !!project;
  const [serverError, setServerError] = useState<string | null>(null);
  const [slugTouched, setSlugTouched] = useState(isEdit);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(projectFormSchema) as unknown as Resolver<FormValues>,
    defaultValues: toDefaults(project),
  });

  const coverUrl = watch("coverUrl");

  async function onSubmit(values: FormValues) {
    setServerError(null);
    const result = isEdit
      ? await updateProject(project!.id, values)
      : await createProject(values);
    // sucesso → a action redireciona; só chega aqui em erro
    if (result && !result.ok) {
      setServerError(result.error ?? "Falha ao salvar.");
    }
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex max-w-2xl flex-col gap-5"
      noValidate
    >
      <Field label="Título" error={errors.title?.message}>
        <input
          {...register("title", {
            onChange: (e) => {
              if (!slugTouched) setValue("slug", slugify(e.target.value));
            },
          })}
          className={inputCls}
        />
      </Field>

      <Field label="Slug (URL)" error={errors.slug?.message}>
        <input
          {...register("slug", { onChange: () => setSlugTouched(true) })}
          className={inputCls}
        />
      </Field>

      <Field label="Resumo (card / SEO)" error={errors.summary?.message}>
        <textarea {...register("summary")} rows={2} className={inputCls} />
      </Field>

      <Field label="Descrição" error={errors.description?.message}>
        <textarea {...register("description")} rows={4} className={inputCls} />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="URL no ar" error={errors.liveUrl?.message}>
          <input {...register("liveUrl")} className={inputCls} placeholder="https://" />
        </Field>
        <Field label="Repositório" error={errors.repoUrl?.message}>
          <input {...register("repoUrl")} className={inputCls} placeholder="https://" />
        </Field>
        <Field label="Cliente" error={errors.clientName?.message}>
          <input {...register("clientName")} className={inputCls} />
        </Field>
        <Field label="Papel" error={errors.role?.message}>
          <input {...register("role")} className={inputCls} placeholder="Full-stack" />
        </Field>
        <Field label="Ano" error={errors.year?.message}>
          <input
            {...register("year")}
            className={inputCls}
            inputMode="numeric"
            placeholder="2025"
          />
        </Field>
        <Field label="Status" error={errors.status?.message}>
          <select {...register("status")} className={inputCls}>
            <option value="DRAFT">Rascunho</option>
            <option value="PUBLISHED">Publicado</option>
          </select>
        </Field>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" {...register("featured")} />
        Destaque na home
      </label>

      {/* Cover */}
      <div className="flex flex-col gap-2">
        <span className="text-sm text-foreground/70">Imagem de capa</span>
        <BlobImageUploader
          kind="project-cover"
          projectId={project?.id}
          current={{ url: coverUrl || null, alt: watch("coverAlt") }}
          onUploaded={(img) => {
            setValue("coverUrl", img.url);
            setValue("coverPathname", img.pathname);
            setValue("coverWidth", String(img.width));
            setValue("coverHeight", String(img.height));
            setValue("coverBlurData", img.blurData);
          }}
          onRemoved={() => {
            setValue("coverUrl", "");
            setValue("coverPathname", "");
            setValue("coverWidth", "");
            setValue("coverHeight", "");
            setValue("coverBlurData", "");
          }}
        />
        {errors.coverUrl && (
          <span className="text-xs text-red-400">{errors.coverUrl.message}</span>
        )}
        <input type="hidden" {...register("coverUrl")} />
        <input type="hidden" {...register("coverPathname")} />
        <input type="hidden" {...register("coverWidth")} />
        <input type="hidden" {...register("coverHeight")} />
        <input type="hidden" {...register("coverBlurData")} />
        <Field label="Texto alternativo da capa" error={errors.coverAlt?.message}>
          <input {...register("coverAlt")} className={inputCls} />
        </Field>
      </div>

      {/* Techs */}
      <div className="flex flex-col gap-2">
        <span className="text-sm text-foreground/70">Tecnologias</span>
        <div className="flex flex-wrap gap-3">
          {techs.map((t) => (
            <label key={t.id} className="flex items-center gap-1.5 text-sm">
              <input type="checkbox" value={t.id} {...register("techIds")} />
              {t.name}
            </label>
          ))}
        </div>
      </div>

      {serverError && (
        <p className="text-sm text-red-400" role="alert">
          {serverError}
        </p>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {isSubmitting ? "Salvando…" : isEdit ? "Salvar alterações" : "Criar projeto"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/projetos")}
          className="rounded-lg border border-foreground/20 px-4 py-2 text-sm transition-colors hover:bg-foreground/5"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm text-foreground/70">{label}</label>
      {children}
      {error && <span className="text-xs text-red-400">{error}</span>}
    </div>
  );
}
