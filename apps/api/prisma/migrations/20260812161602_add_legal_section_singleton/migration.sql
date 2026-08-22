-- CreateTable
CREATE TABLE "about_company_legal_section" (
    "id" TEXT NOT NULL,
    "eyebrow" TEXT NOT NULL DEFAULT 'Legal & Company Information',
    "heading" TEXT NOT NULL DEFAULT 'Trusted Compliance, Verified Documentation',
    "description" TEXT NOT NULL DEFAULT '',
    "hide_expired" BOOLEAN NOT NULL DEFAULT false,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "translations" JSONB,

    CONSTRAINT "about_company_legal_section_pkey" PRIMARY KEY ("id")
);
