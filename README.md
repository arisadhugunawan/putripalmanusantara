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
| ORM | Prisma 7 (driver adapter `@prisma/adapter-pg`) | Schema di `apps/api/prisma/schema.prisma` 1:1 dengan `docs/04-database.md`; client di-generate ke `apps/api/generated/prisma` (bukan `node_modules`, ketentuan generator `prisma-client` di Prisma 7) |
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
| `npm run prisma:generate` / `prisma:migrate` / `prisma:studio` | Perintah Prisma (proxy ke `apps/api`) |

## Database Lokal

Database dev: `ppn_dev` (PostgreSQL 18, user lokal, port 5432). Cek koneksi:

```bash
/Applications/Postgres.app/Contents/Versions/latest/bin/psql -h localhost -d ppn_dev -c '\dt'
```

Isi database dengan data awal (produk, FAQ, tahap produksi, fasilitas, statistik, 1 akun Admin) — aman dijalankan berulang kali:

```bash
cd apps/api && npm run prisma:seed
```

Kredensial Admin hasil seed diambil dari `ADMIN_SEED_EMAIL` / `ADMIN_SEED_PASSWORD` di `apps/api/.env`.

`GET /health` di API mengonfirmasi koneksi database aktif (jumlah produk tersimpan).

## Backend API

Seluruh endpoint di `docs/05-api.md` sudah diimplementasikan di `apps/api` (base path `/api/v1`), termasuk:

- Response envelope konsisten (`{ success, data, meta, error }`) via `ResponseInterceptor` + `HttpExceptionFilter`
- Auth admin JWT (HTTP-only cookie), guard `JwtAuthGuard` di seluruh route `/admin/*`
- Validasi server-side (`class-validator`) di seluruh endpoint POST/PUT
- Anti-spam form publik: honeypot field (`website`) + rate limiting per-IP (`@nestjs/throttler`) — 5 req/menit untuk `/quotation-requests` & `/contact`, 5 req/15menit untuk login admin
- Notifikasi email ke admin (Resend) bersifat best-effort — kegagalan kirim email tidak pernah menggagalkan submission (data sudah tersimpan di DB)
- Upload media lokal (`apps/api/uploads`, disajikan statis di `/uploads`) dengan driver S3-compatible siap pakai untuk production (`MEDIA_STORAGE_DRIVER=s3`)
- Webhook revalidasi ke frontend (`RevalidationService`) dipanggil best-effort setiap admin publish/update — endpoint `/api/revalidate` di sisi Next.js akan dibangun di Phase 4/6

**Catatan:** `GET /sitemap.xml` dan `GET /robots.txt` (`docs/05-api.md` §3.10) sengaja **tidak** diimplementasikan di backend — akan dibangun sebagai file convention Next.js (`sitemap.ts`/`robots.ts`) di Phase 6, karena itu adalah pola standar Next.js App Router dan menghindari duplikasi data antara frontend/backend.

## Design System

Design tokens (`docs/03-design.md` §2–§4) hidup sebagai CSS custom properties Tailwind v4 di `apps/web/src/app/globals.css` (`@theme` block) — warna, skala tipografi responsif (mobile → desktop di breakpoint 1024px), radius, shadow, dan container width. Font heading memakai **Sora** (bukan General Sans/Satoshi — keduanya font komersial Fontshare yang tidak tersedia di Google Fonts; Sora dipilih sebagai alternatif open-source dengan karakter visual terdekat), font body **Inter** sesuai rekomendasi utama dokumen.

Komponen dasar di `packages/ui-components` (dikonsumsi `apps/web` via `transpilePackages`, sumber TSX langsung tanpa build step terpisah): `Button` (3 varian), `Card`, `Input`/`Textarea`/`Label`/`FieldError`, `Accordion` (single-open, ikon plus/minus animasi), `Badge`, `Container`, `Section`. Seluruh komponen menghormati `prefers-reduced-motion` (global CSS rule) dan target sentuh 44×44px minimum.

Diverifikasi visual di browser (desktop & mobile viewport) — halaman showcase sementara sudah digantikan Homepage asli di Phase 4.

## Halaman Publik

Seluruh 8 halaman publik (`docs/02-requirements.md` §1, urutan prioritas di master prompt) sudah dibangun di `apps/web/src/app/(public)`:

- **Home** — 11 section sesuai urutan final `docs/03-design.md` §9.1 (Hero → Statistik → Tentang Kami → Mengapa Memilih PPN → Produk Unggulan → Proses Produksi → Fasilitas → Galeri → Insight & Artikel → FAQ → Request Quotation)
- **Produk** — listing (`/products`) & detail (`/products/[slug]`, SSG dari `generateStaticParams`) dengan gallery+lightbox, spesifikasi, packaging, application, download PDF, form quotation ter-prefill
- **Proses Produksi** — timeline 8 tahap penuh (horizontal di desktop, vertikal di mobile)
- **Fasilitas** — grid fasilitas + Drone Gallery terpisah (FR-FAC-03)
- **Galeri** — filter kategori client-side (halaman tetap statis/ISR) + lightbox
- **Tentang Kami**, **Hubungi Kami** (form + info kontak + Google Maps embed), **Artikel** (listing berpaginasi + detail, tidak ada di menu utama sesuai FR-ART-04)
- **404 custom** on-brand dengan CTA kembali ke Produk/Home

Infrastruktur bersama: `lib/api.ts` (server-only, fetch dengan ISR `revalidate: 3600` sesuai `docs/06-architecture.md` §4), `lib/api-client.ts` (client-safe untuk form submission), `app/api/revalidate/route.ts` (menerima webhook on-demand revalidation dari backend), `Header`/`Footer` (route group `(public)`), `QuotationForm`/`ContactForm` (honeypot + validasi client & server), `SafeImage` (placeholder on-brand saat media belum ada — tidak pernah broken image, sesuai `docs/07-user-flow.md` §9).

Diverifikasi end-to-end di browser dengan API live: navigasi semua halaman, submit quotation form sungguhan (tersimpan di DB, terkonfirmasi via query langsung), accordion FAQ, lightbox galeri, dan 404 (diverifikasi via `curl` — response 404 asli dengan halaman custom).

**Bug nyata yang ditemukan & diperbaiki selama verifikasi:**
1. `StatCounter` memformat angka dengan locale `undefined` (browser locale) → menghasilkan `1.200+` alih-alih `1,200+`; dipaksa ke `en-US` karena konten publik berbahasa Inggris
2. `QuotationForm`/`ContactForm` membaca `event.currentTarget` **setelah** `await` — di React, `currentTarget` di-null-kan begitu dispatch event sinkron selesai, jadi form gagal reset & masuk ke error state meski submission ke backend sudah berhasil (201 Created). Diperbaiki dengan menangkap referensi form sebelum `await`.

## Status Pembangunan

Proyek dikerjakan bertahap mengikuti fase di bawah ini (lihat riwayat commit untuk detail per fase):

- [x] Phase 0 — Setup & Scaffolding
- [x] Phase 1 — Database (Prisma schema sesuai `docs/04-database.md`)
- [x] Phase 2 — Backend API (`docs/05-api.md`)
- [x] Phase 3 — Design System (`docs/03-design.md`)
- [x] Phase 4 — Halaman Publik
- [ ] Phase 5 — Admin CMS Panel
- [ ] Phase 6 — SEO Technical
- [ ] Phase 7 — Performance Optimization
- [ ] Phase 8 — QA & Verifikasi

## Batasan Scope (Wajib Dipatuhi)

Fitur berikut **dilarang** diimplementasikan (lihat `docs/01-prd.md` §6.2): ERP, dashboard operasional/inventory, buyer/supplier portal, fitur AI/chatbot, CocoTrace/traceability, shipment tracking, marketplace/checkout, CRM.
