-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('DRAFT', 'PUBLISHED');

-- CreateEnum
CREATE TYPE "TechCategory" AS ENUM ('LANGUAGE', 'FRAMEWORK', 'DATABASE', 'INFRA', 'DESIGN', 'TOOL');

-- CreateEnum
CREATE TYPE "SectionKind" AS ENUM ('HERO', 'MANIFESTO', 'ASSEMBLY', 'FRAME_SEQUENCE', 'PROJECTS_TEASER', 'SERVICES', 'PROCESS', 'STATS', 'TESTIMONIALS', 'CTA', 'CONTACT');

-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('NEW', 'READ', 'REPLIED', 'ARCHIVED', 'SPAM');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT,
    "tokenVersion" INTEGER NOT NULL DEFAULT 0,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" TEXT NOT NULL,
    "slug" VARCHAR(120) NOT NULL,
    "title" VARCHAR(160) NOT NULL,
    "summary" VARCHAR(280) NOT NULL,
    "description" TEXT,
    "coverUrl" TEXT,
    "coverPathname" TEXT,
    "coverWidth" INTEGER,
    "coverHeight" INTEGER,
    "coverBlurData" TEXT,
    "coverAlt" VARCHAR(200),
    "liveUrl" TEXT,
    "repoUrl" TEXT,
    "clientName" VARCHAR(120),
    "year" SMALLINT,
    "role" VARCHAR(160),
    "order" INTEGER NOT NULL DEFAULT 0,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "status" "ProjectStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "content" JSONB,
    "seoTitle" VARCHAR(70),
    "seoDescription" VARCHAR(160),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "techs" (
    "id" TEXT NOT NULL,
    "slug" VARCHAR(60) NOT NULL,
    "name" VARCHAR(60) NOT NULL,
    "category" "TechCategory" NOT NULL DEFAULT 'TOOL',
    "color" VARCHAR(9),
    "iconSlug" VARCHAR(60),
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "techs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_techs" (
    "projectId" TEXT NOT NULL,
    "techId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "primary" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "project_techs_pkey" PRIMARY KEY ("projectId","techId")
);

-- CreateTable
CREATE TABLE "project_images" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "pathname" TEXT NOT NULL,
    "alt" VARCHAR(200),
    "width" INTEGER,
    "height" INTEGER,
    "blurData" TEXT,
    "caption" VARCHAR(280),
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "home_sections" (
    "id" TEXT NOT NULL,
    "key" VARCHAR(60) NOT NULL,
    "kind" "SectionKind" NOT NULL,
    "label" VARCHAR(80) NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "data" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "home_sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leads" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "email" VARCHAR(180) NOT NULL,
    "company" VARCHAR(120),
    "phone" VARCHAR(40),
    "budget" VARCHAR(40),
    "message" TEXT NOT NULL,
    "status" "LeadStatus" NOT NULL DEFAULT 'NEW',
    "notes" TEXT,
    "sourcePath" TEXT,
    "referrer" TEXT,
    "utm" JSONB,
    "userAgent" TEXT,
    "ipHash" VARCHAR(64),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt" TIMESTAMP(3),

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "projects_slug_key" ON "projects"("slug");

-- CreateIndex
CREATE INDEX "projects_status_order_idx" ON "projects"("status", "order");

-- CreateIndex
CREATE INDEX "projects_status_featured_order_idx" ON "projects"("status", "featured", "order");

-- CreateIndex
CREATE UNIQUE INDEX "techs_slug_key" ON "techs"("slug");

-- CreateIndex
CREATE INDEX "techs_category_order_idx" ON "techs"("category", "order");

-- CreateIndex
CREATE INDEX "project_techs_techId_idx" ON "project_techs"("techId");

-- CreateIndex
CREATE INDEX "project_images_projectId_order_idx" ON "project_images"("projectId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "home_sections_key_key" ON "home_sections"("key");

-- CreateIndex
CREATE INDEX "home_sections_enabled_order_idx" ON "home_sections"("enabled", "order");

-- CreateIndex
CREATE INDEX "leads_status_createdAt_idx" ON "leads"("status", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "leads_email_idx" ON "leads"("email");

-- AddForeignKey
ALTER TABLE "project_techs" ADD CONSTRAINT "project_techs_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_techs" ADD CONSTRAINT "project_techs_techId_fkey" FOREIGN KEY ("techId") REFERENCES "techs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_images" ADD CONSTRAINT "project_images_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
