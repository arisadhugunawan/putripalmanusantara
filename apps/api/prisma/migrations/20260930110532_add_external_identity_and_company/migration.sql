-- Database Implementation Plan — Migration 2 (External Identity Foundation).
-- Four brand-new tables (external_accounts, companies, company_users, business_relationships),
-- zero changes to any existing table. In particular: no statement in this file references
-- "admins" or "admin_activity_logs" in any way — the hybrid identity architecture keeps the two
-- systems completely separate at the database level. Hand-written (not `prisma migrate dev`),
-- same reason as Migration 1: this database has a pre-existing, already-documented false-positive
-- drift on `ai_knowledge_chunks`'s generated tsvector column that makes Prisma's shadow-database
-- diff tooling misbehave (see 20260821165057_add_product_published_snapshot's own migration.sql
-- comment). This file touches nothing related to that table.

-- CreateEnum
CREATE TYPE "ExternalAccountStatus" AS ENUM ('pending', 'active', 'suspended');

-- CreateEnum
CREATE TYPE "CompanyStatus" AS ENUM ('pending', 'active', 'suspended');

-- CreateEnum
CREATE TYPE "CompanyUserRole" AS ENUM ('owner', 'member');

-- CreateEnum
CREATE TYPE "CompanyUserStatus" AS ENUM ('pending', 'active', 'suspended');

-- CreateEnum
CREATE TYPE "BusinessRelationshipType" AS ENUM ('buyer', 'supplier', 'vendor', 'partner');

-- CreateEnum
CREATE TYPE "BusinessRelationshipStatus" AS ENUM ('pending', 'active', 'suspended');

-- CreateTable
CREATE TABLE "external_accounts" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "phone" TEXT,
    "status" "ExternalAccountStatus" NOT NULL DEFAULT 'pending',
    "email_verified_at" TIMESTAMP(3),
    "last_login_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "external_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "companies" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "legal_name" TEXT,
    "country" TEXT NOT NULL,
    "address" TEXT,
    "website" TEXT,
    "status" "CompanyStatus" NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_users" (
    "id" TEXT NOT NULL,
    "external_account_id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "role" "CompanyUserRole" NOT NULL DEFAULT 'member',
    "status" "CompanyUserStatus" NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "company_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_relationships" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "relationship_type" "BusinessRelationshipType" NOT NULL,
    "status" "BusinessRelationshipStatus" NOT NULL DEFAULT 'pending',
    "approved_by_id" TEXT,
    "approved_by_name" TEXT,
    "approved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "business_relationships_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "external_accounts_email_key" ON "external_accounts"("email");

-- CreateIndex
CREATE INDEX "companies_status_idx" ON "companies"("status");

-- CreateIndex
CREATE INDEX "company_users_company_id_idx" ON "company_users"("company_id");

-- CreateIndex
CREATE INDEX "company_users_status_idx" ON "company_users"("status");

-- CreateIndex
CREATE UNIQUE INDEX "company_users_external_account_id_company_id_key" ON "company_users"("external_account_id", "company_id");

-- CreateIndex
CREATE INDEX "business_relationships_status_idx" ON "business_relationships"("status");

-- CreateIndex
CREATE UNIQUE INDEX "business_relationships_company_id_relationship_type_key" ON "business_relationships"("company_id", "relationship_type");

-- AddForeignKey
ALTER TABLE "company_users" ADD CONSTRAINT "company_users_external_account_id_fkey" FOREIGN KEY ("external_account_id") REFERENCES "external_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_users" ADD CONSTRAINT "company_users_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_relationships" ADD CONSTRAINT "business_relationships_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
