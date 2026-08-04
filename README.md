# CV Putri Palma Nusantara — Company Profile Website

Monorepo untuk website company profile PPN (eksportir produk turunan kelapa). Dibangun berdasarkan dokumentasi acuan di [`docs/`](./docs) (`01-prd.md` s.d. `07-user-flow.md`) — dokumen tersebut adalah **satu-satunya sumber kebenaran** untuk scope, desain, data, API, arsitektur, dan alur pengguna. Jangan menambah fitur di luar `01-prd.md` §6.2 (Out of Scope).

## Struktur Monorepo

```
apps/
  web/               Next.js (App Router) — Public Site + Admin Panel
  api/                NestJS — REST API backend
packages/
  shared-types/       Tipe TypeScript bersama (kontrak API, entitas) — dikonsumsi apps/web & apps/api
  ui-components/      Komponen design system (Button, Card, Input, dst.) — dikonsumsi apps/web
docs/                 Dokumentasi acuan proyek (01–07), final, tidak boleh diasumsikan ulang
```

## Tech Stack

| Layer | Pilihan | Catatan |
|---|---|---|
| Frontend | Next.js 16 (App Router) + TypeScript + Tailwind CSS v4 | SSR/SSG/ISR sesuai `docs/06-architecture.md` §4 |
| Backend | NestJS + TypeScript | Struktur modular cocok untuk banyak entitas CRUD di `docs/05-api.md` |
| Database | PostgreSQL 18 (lokal via Postgres.app) | Sesuai `docs/06-architecture.md` §2 — final, tidak dapat diganti MySQL |
| ORM | Prisma (Phase 1) | Migration & schema mengikuti `docs/04-database.md` |
| Auth Admin | JWT via HTTP-only cookie | Sesuai `docs/05-api.md` §2 |
| Anti-spam form publik | Honeypot field + rate limiting per-IP | Opsi non-CAPTCHA dari `docs/05-api.md` §6 — dipilih agar tidak butuh API key pihak ketiga |
| Media storage | Local disk (dev) / S3-compatible (production, via env `MEDIA_STORAGE_DRIVER`) | Sesuai `docs/06-architecture.md` §2 |
| Package manager | npm workspaces | pnpm tidak dapat diinstall secara global tanpa sudo di mesin dev ini; npm workspaces mencukupi kebutuhan monorepo skala ini |

Keputusan teknis kecil di atas (ORM, anti-spam, package manager) adalah keputusan implementasi yang tidak diatur eksplisit di dokumen — bukan keputusan scope/fitur.

## Prasyarat

- Node.js ≥ 20.9 (terverifikasi dengan v24.19.0)
- PostgreSQL 18 berjalan lokal (via [Postgres.app](https://postgresapp.com))

## Setup

```bash
npm install
```

Copy env template dan isi sesuai kebutuhan lokal (nilai default sudah cocok untuk dev di mesin ini):

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
```

## Menjalankan Development Server

```bash
npm run dev:api   # NestJS di http://localhost:4000
npm run dev:web   # Next.js di http://localhost:3000
```

## Scripts Root

| Script | Deskripsi |
|---|---|
| `npm run dev:web` / `dev:api` | Jalankan dev server masing-masing app |
| `npm run build` | Build backend lalu frontend |
| `npm run lint` | Lint kedua app |
| `npm run format` | Format seluruh repo dengan Prettier |
| `npm run prisma:generate` / `prisma:migrate` / `prisma:studio` | Perintah Prisma (tersedia mulai Phase 1) |

## Database Lokal

Database dev: `ppn_dev` (PostgreSQL 18, user `iketutari`, port 5432 lokal). Cek koneksi:

```bash
/Applications/Postgres.app/Contents/Versions/latest/bin/psql -h localhost -d ppn_dev -c '\dt'
```

## Status Pembangunan

Proyek dikerjakan bertahap mengikuti fase di bawah ini (lihat riwayat commit untuk detail per fase):

- [x] Phase 0 — Setup & Scaffolding
- [ ] Phase 1 — Database (Prisma schema sesuai `docs/04-database.md`)
- [ ] Phase 2 — Backend API (`docs/05-api.md`)
- [ ] Phase 3 — Design System (`docs/03-design.md`)
- [ ] Phase 4 — Halaman Publik
- [ ] Phase 5 — Admin CMS Panel
- [ ] Phase 6 — SEO Technical
- [ ] Phase 7 — Performance Optimization
- [ ] Phase 8 — QA & Verifikasi

## Batasan Scope (Wajib Dipatuhi)

Fitur berikut **dilarang** diimplementasikan (lihat `docs/01-prd.md` §6.2): ERP, dashboard operasional/inventory, buyer/supplier portal, fitur AI/chatbot, CocoTrace/traceability, shipment tracking, marketplace/checkout, CRM.
