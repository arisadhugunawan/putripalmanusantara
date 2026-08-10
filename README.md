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

## Admin CMS Panel

Panel admin (`apps/web/src/app/admin`) berbahasa Indonesia sesuai `docs/01-prd.md` §5.2, CSR di balik autentikasi sesuai `docs/06-architecture.md` §4. Karena cookie JWT bersifat HttpOnly dan berdomain API (bukan frontend), middleware Next.js tidak bisa membacanya — autentikasi diperiksa di client via `GET /admin/auth/me` (browser tetap mengirim cookie secara otomatis ke origin API). Modul yang tersedia:

- **Login & Dashboard** — ringkasan jumlah quotation baru, artikel, produk (FR-CMS-02)
- **Produk** — CRUD penuh termasuk gambar sampul, galeri, spesifikasi, packaging/application, dan file PDF unduhan — semua sub-resource memicu revalidasi halaman publik terkait
- **Artikel** — CRUD dengan editor rich text sungguhan (Tiptap: tebal, miring, judul, daftar, kutipan) sesuai FR-CMS-04, bukan textarea biasa
- **Galeri** — unggah, kategorikan (Produk/Fasilitas/Proses/Drone), hapus media
- **Fasilitas** & **Proses Produksi** — CRUD single-page termasuk galeri per fasilitas dan ilustrasi per tahap (docs/05-api.md §4.6)
- **Homepage** — editor statistik (bulk replace), CRUD FAQ, toggle produk unggulan
- **Kontak/Quotation** — daftar submission dengan filter status, lihat detail pesan, ubah status (FR-CMS-07)
- **Pengaturan** — data perusahaan, kontak, SEO default, plus tambah pengaturan baru secara bebas (FR-CMS-09)

Infrastruktur: `lib/admin/client.ts` (fetch dengan `credentials:'include'`), `lib/admin/auth-context.tsx` (React context untuk sesi admin), `components/admin/AdminGate.tsx` (route protection + redirect ke `/admin/login`), `components/admin/MediaUploadField.tsx` (unggah-dan-lampirkan langsung ke `/admin/media`, dipakai di seluruh modul yang butuh gambar).

**Diverifikasi end-to-end di browser dengan API live** (bukan hanya lolos build): route protection (akses `/admin` tanpa login → redirect otomatis ke `/admin/login`, dikonfirmasi lewat network log `401` → `/admin/login`), login sungguhan dengan kredensial seed, dashboard menampilkan angka asli dari database, tambah spesifikasi produk (`POST` sungguhan → `201 Created` → tabel ter-refresh), dan tambah artikel dengan konten rich text (`POST` → `201` → **konten HTML `<strong>` terverifikasi tersimpan langsung di database** via query).

**Bug nyata ditemukan & diperbaiki:** endpoint sub-resource produk (`gallery`, `specifications`, `downloads`, `packaging-applications`) dan galeri fasilitas tidak memicu `RevalidationService` seperti endpoint utama — perubahan sub-resource baru akan tampil di halaman publik setelah ISR alami (maks. 1 jam), bukan seketika. Diperbaiki dengan menambahkan pemanggilan revalidasi di seluruh endpoint sub-resource tersebut.

## SEO Technical

Implementasi teknis SEO sesuai `docs/02-requirements.md` §3.2 (NFR-SEO) dan `docs/06-architecture.md` §7:

- **Schema.org (JSON-LD)** — `Organization` di setiap halaman (root layout), `Product` di detail produk, `Article` di detail artikel, `FAQPage` di Homepage (satu-satunya tempat FAQ tampil), `BreadcrumbList` otomatis di setiap halaman yang memakai komponen `PageHeader` (dibangun dari array breadcrumb yang sama dengan yang tampil visual, sehingga tidak mungkin berbeda)
- **OpenGraph & Twitter Card** — dibangun lewat helper tunggal `lib/seo.ts#buildPageMetadata()` di setiap halaman publik, memastikan title/description/canonical/OG/Twitter selalu konsisten dari satu sumber
- **Canonical URL** — di setiap halaman via `alternates.canonical`, `metadataBase` diset di root layout
- **Sitemap dinamis** (`app/sitemap.ts`) & **robots.txt** (`app/robots.ts`, disallow `/admin`) — file convention Next.js, mengambil data produk/artikel published langsung dari API
- **Image SEO** — `alt_text` wajib diisi di level database (`NOT NULL`) dan di form upload CMS (`MediaUploadField` menolak unggah tanpa alt text)
- Admin panel (`/admin/*`) diberi `robots: { index: false }` sebagai lapisan pertahanan kedua selain `robots.txt`

Diverifikasi langsung lewat `curl` terhadap HTML/XML yang benar-benar di-render (bukan cuma baca kode): `robots.txt` dan `sitemap.xml` menghasilkan output yang benar, JSON-LD `Organization`/`FAQPage`/`Product`/`Article`/`BreadcrumbList` muncul persis seperti yang diharapkan di halaman terkait, canonical URL dan OG tags benar di setiap halaman yang dicek.

**Bug nyata ditemukan & diperbaiki:** judul halaman Home menjadi dobel ("...Exporter | CV Putri Palma Nusantara") karena template judul dari root layout (`%s | {nama situs}`) diterapkan ke judul Home yang sudah memuat nama situs sendiri. Diperbaiki dengan opsi `absoluteTitle` pada `buildPageMetadata()` yang melewati (bypass) template untuk kasus ini.

## Performance Optimization

Diaudit dengan Lighthouse CLI (`npx lighthouse`) terhadap **production build** (`next build` + `next start`, bukan dev server) supaya angkanya representatif — target Definition of Done: skor ≥95 di Performance/Accessibility/Best Practices/SEO.

**Skor akhir Home page (setelah perbaikan):**

| Kategori | Skor |
|---|---|
| Performance | 98–100 |
| Accessibility | 100 |
| Best Practices | 100 |
| SEO | 100 |

**Bug nyata ditemukan & diperbaiki:**
1. **Kontras warna gagal WCAG AA** — token `--color-primary-700` (`#6e9a2e`, dipakai untuk label "eyebrow" seperti "ABOUT US" dan label kategori produk/artikel) hanya punya rasio kontras 3.32:1 terhadap putih, di bawah minimum 4.5:1 untuk teks normal (NFR-A11Y-01). Diperbaiki dengan menggelapkan token menjadi `#4a651e` (rasio 6.62:1), tetap dalam nuansa hijau yang sama sehingga tidak melanggar palet desain — perbaikan di satu token memperbaiki semua pemakaian sekaligus (`globals.css`).
2. **Teks link tidak deskriptif** — link "Learn More" di `AboutSummarySection` diflag Lighthouse (`link-text` audit) karena tidak jelas tujuannya tanpa konteks visual. Diperbaiki menjadi "Learn More About Us".

**Temuan yang diinvestigasi tapi BUKAN bug kode (didokumentasikan, bukan "diperbaiki"):**
- Lighthouse dengan metode default (`--throttling-method=simulate`, Lantern) sempat melaporkan LCP 3.3s (skor Performance 92) pada Home, padahal semua metrik lain sempurna (FCP 0.8s, TBT 0ms, server response 10ms, dan seluruh network request nyata selesai dalam ~264ms). Diverifikasi ulang dengan `--throttling-method=devtools` (replay trace asli, bukan estimasi graph) menghasilkan LCP 1.5s dan Performance 100 — mengonfirmasi bahwa skor 92 sebelumnya adalah artefak simulasi Lantern yang salah mengestimasi banyaknya chunk JS granular hasil Turbopack (~15+ chunk kecil terpisah untuk satu halaman), bukan masalah performa nyata bagi pengguna.
- Chunk polyfill Next.js (`4561u0v7ysn3r.js`, ~72KB, flagged 40% unused oleh audit `unused-javascript`) adalah polyfill legacy-browser standar bawaan Next.js (`trimStart`, `Array.prototype.flat`, dll.), bukan kode aplikasi — dikontrol oleh `browserslist`/target build Next.js, tidak diubah karena tidak ada kebutuhan bisnis yang jelas untuk menjatuhkan dukungan browser lama.

## QA & Verifikasi

Verifikasi akhir terhadap seluruh acceptance criteria di `01-prd.md` §14 dan `02-requirements.md` §4, dilakukan dengan membaca ulang setiap requirement table (FR-HOME, FR-ABOUT, FR-PROD, FR-PROC, FR-FAC, FR-GAL, FR-CONTACT, FR-QUOTE, FR-ART, FR-FAQ, FR-CMS, NFR-*) lalu memverifikasi tiap item terhadap kode/API/DB yang sudah berjalan (bukan hanya membaca kode secara statis):

- **Navigasi utama** — dikonfirmasi lewat `Header.tsx`: persis 7 item (Home, About Us, Products, Production Process, Facilities, Gallery, Contact Us), sesuai `01-prd.md` §14; Artikel **tidak** ada di nav utama sesuai FR-ART-04.
- **Urutan section Homepage** — dikonfirmasi cocok dengan urutan final di `02-requirements.md` §1.1.
- **5 titik akses Request Quotation** (FR-QUOTE-01) — diverifikasi via `curl` terhadap HTML hasil render sungguhan: Hero Home, Section Request Quotation Home, halaman detail produk, Footer (semua halaman), dan halaman Hubungi Kami — seluruhnya mengandung form/tautan ke `#request-quotation`.
- **8 tahap Proses Produksi** (FR-PROC-01) — dikonfirmasi urut: Farmer → Receiving → Sorting → Quality Control → Packing → Storage → Stuffing → Export.
- **Tidak ada fitur Out of Scope** — di-grep di seluruh `apps/web/src` dan `apps/api/src` untuk istilah ERP/inventory/tracking/traceability/CocoTrace/marketplace/checkout/CRM/chatbot; satu-satunya kecocokan adalah kelas utility Tailwind `tracking-wide` (letter-spacing), bukan fitur tracking. Model Prisma (16 model) juga ditinjau ulang — seluruhnya memetakan langsung ke entitas in-scope (produk, artikel, galeri, fasilitas, quotation, dsb.), tidak ada tabel ERP/CRM.
- **`alt_text` wajib diisi** (NFR-SEO-06/NFR-A11Y-03) — dikonfirmasi `NOT NULL` di level skema Prisma (`Media.altText`), bukan hanya validasi form.
- **Rate limiting** (NFR-SEC-01) — dikonfirmasi `ThrottlerModule` terpasang global di `app.module.ts` (100 request/menit per klien).
- **Anti-spam form publik** (NFR-SEC-02) — honeypot (`website` field) dikonfirmasi lewat unit test baru (lihat di bawah).

**Tes otomatis untuk endpoint kritis** (`apps/api/src/**/*.spec.ts`, dijalankan dengan `npm test --workspace=api`):

- `quotations.service.spec.ts` — submission dengan honeypot terisi ditolak sebelum menyentuh DB/email; `product_id` yang tidak ada ditolak; submission valid tersimpan **dan** memicu notifikasi email; nilai field yang mengandung tag HTML di-escape sebelum masuk ke email (regresi untuk bug HTML-injection yang diperbaiki di Phase 2).
- `auth.service.spec.ts` — login dengan email yang tidak terdaftar ditolak; login dengan password salah ditolak; login valid mengeluarkan JWT dan memperbarui `lastLoginAt`.

Semua 8 test lolos (`3 suites, 8 tests passed`). Cakupan ini sengaja dibatasi ke dua endpoint dengan risiko tertinggi (submission form publik & autentikasi admin) sesuai instruksi awal ("uji dasar untuk endpoint-endpoint kritis"), bukan cakupan penuh seluruh API.

**Hasil:** tidak ditemukan requirement yang belum terimplementasi atau bertentangan dengan `01-prd.md` selama QA pass ini.

## Internasionalisasi & Revisi Header (Post-Launch)

Permintaan terpisah setelah Phase 8 selesai: header/navigasi premium bergaya perusahaan ekspor internasional (dropdown, scroll behavior, language selector) plus dukungan 6 bahasa. Brief ini **secara eksplisit mengesampingkan** tiga hal yang sudah difinalisasi di dokumen asli — dikonfirmasi lewat tiga putaran klarifikasi dengan pemilik bisnis sebelum implementasi:

1. **Struktur menu** — 6 item dari brief baru (Home, About Company▾, Our Products▾, Facilities & Gallery▾, News, Contact), menggantikan 7 item wajib di `01-prd.md` §14.
2. **Artikel di navigasi** — "News" di menu utama, menggantikan larangan eksplisit FR-ART-04.
3. **Bahasa** — 5 bahasa non-Inggris ditambahkan, menggantikan `01-prd.md` §5.2 (konten publik hanya Inggris).

**Keputusan konten jujur (revisi)** — dropdown "About Company" awalnya minta 5 item, tapi "PPN Team" sempat **dihapus** karena tidak ada data staf sungguhan (fabrikasi nama/foto staf melanggar aturan proyek soal data dummy), dengan "What We Do?"/"Factory" dipetakan ke halaman terpisah (`Production Process`/`Facilities`). Permintaan lanjutan (lihat bagian "Navigasi In-Page Halaman About" di bawah) meminta ke-5 item ini jadi section di DALAM satu halaman About — jadi "PPN Team" **dikembalikan**, tapi tetap dengan konten jujur (deskripsi tim secara umum, tanpa nama/foto fiktif), dan "What We Do?"/"Factory" sekarang jadi section asli di About (bukan lagi tautan keluar), dengan "Factory" menampilkan nama fasilitas asli dari CMS (bukan teks statis). "Facilities & Gallery" di header tetap dropdown 2 item ke halaman terpisah seperti semula.

### Navigasi In-Page Halaman About

Permintaan lanjutan: bukan lagi dropdown/halaman terpisah, tapi satu halaman About dengan 5 section (`#company`, `#team`, `#what-we-do`, `#legal`, `#factory`) dan navigasi sidebar sticky yang smooth-scroll ke section terkait — gaya situs korporat internasional (Cargill/Olam-style).

- **Desktop/tablet** — sidebar kiri `position: sticky`, berhenti otomatis begitu mencapai batas kontainer dua-kolom (tidak perlu JS khusus — CTA "Ready to work with us?" sengaja diletakkan **di luar** kontainer sticky, jadi sidebar tidak pernah menimpa footer).
- **Mobile** — sidebar berubah jadi tab horizontal yang bisa di-scroll/swipe, sticky di atas; tab aktif otomatis ikut ter-scroll ke posisi terlihat saat section berganti.
- **Active state** — dilacak dengan `IntersectionObserver` (bukan `scroll` event listener, sesuai instruksi performa), dengan `rootMargin` yang membuat pita deteksi tipis tepat di bawah header sticky.
- **Smooth scroll** — animasi kustom berbasis `requestAnimationFrame` (bukan `scrollIntoView` native) karena butuh durasi tetap (600ms) dan offset yang presisi menghindari section title tertutup header; otomatis dilewati (langsung lompat) untuk pengguna dengan `prefers-reduced-motion`. Setiap section juga punya `scroll-mt-24` (CSS) supaya navigasi native via link `/about#team` dari halaman lain (mis. dropdown header) tetap mendapat offset yang sama.
- **Animasi kemunculan** — fade-up sekali per section via `IntersectionObserver` terpisah, transform+opacity saja (compositor-friendly, tidak memicu layout reflow).

Diverifikasi langsung di browser: klik tiap item nav → scroll ke section yang benar dengan offset yang tidak menutupi judul; scroll manual → highlight aktif berpindah sesuai section yang terlihat; sidebar berhenti tepat sebelum CTA, tidak menimpa; tab mobile scroll horizontal + auto-center saat section aktif berganti; navigasi lintas-halaman dari dropdown header (`/en#legal` dari Home) mendarat di posisi yang benar. Lighthouse halaman About: Performance 99, Accessibility/Best Practices/SEO 100 — tidak ada regresi dari perombakan ini.

### Arsitektur i18n

- **Routing** — path-prefixed (`/en/...`, `/id/...`, dst.) mengikuti pola resmi Next 16 App Router (`app/[locale]/...` + `proxy.ts`, bukan `middleware.ts` yang sudah deprecated). Tidak ada dependency npm baru. `app/layout.tsx` tetap satu-satunya root `<html>` (mendukung SSG — membaca locale via `cookies()` di sana akan mematikan static generation untuk seluruh situs), jadi `/admin/*` tetap tidak berprefix locale (tetap berbahasa Indonesia, sesuai keputusan lama) sementara `<html lang>` dikoreksi di sisi klien lewat `LocaleHtmlLang`.
- **String UI statis** (label nav, footer, tombol umum) — sistem dictionary (`apps/web/src/i18n/dictionaries/*.ts`) mengikuti pola resmi Next.js. **Batasan yang didokumentasikan secara sadar:** isi halaman yang hardcode di komponen (headline Hero, paragraf About, kartu Why-Choose-Us, dll.) belum masuk dictionary — hanya header/footer/nav yang penuh diterjemahkan sekarang; memperluas ke body halaman lain adalah pekerjaan mekanis serupa untuk lain waktu.
- **Konten dari CMS** (produk, artikel, fasilitas, proses produksi, statistik homepage, FAQ, site settings, item galeri) — kolom `translations Json?` baru **additive-only** di 11 model Prisma (migrasi `20260805080904_add_translations_columns`), menyimpan override 5 bahasa non-Inggris di atas kolom scalar Inggris yang tidak diubah. API publik menerima `?locale=`, fallback otomatis ke Inggris per-field jika terjemahan belum ada.
- **Admin CMS** — komponen `LocaleTabs` (tab strip 6 bendera bahasa) dibangun dan diintegrasikan penuh di form edit Produk sebagai contoh acuan (termasuk bug nyata yang ditemukan & diperbaiki: pindah tab sebelum menyimpan sempat meng-null-kan field Inggris karena tab tak-aktif ter-unmount dari DOM — diperbaiki dengan menyembunyikan lewat CSS, bukan unmount). DTO/service 6 modul admin lain (Artikel, Fasilitas, Proses Produksi, Statistik Homepage, FAQ, Pengaturan, Galeri) sudah menerima & menyimpan `translations`, tapi UI tab-bahasa untuk form-form tersebut belum dibangun — pekerjaan lanjutan mekanis mengikuti pola yang sama.

**Isi terjemahan** — seluruh ~54 baris konten yang sudah ada (produk, spesifikasi, kemasan/aplikasi, artikel, fasilitas, tahap produksi, statistik, FAQ, sebagian site settings) diterjemahkan sekaligus lewat skrip satu-kali `apps/api/scripts/translate-seed-content.ts` (dicocokkan lewat natural key seperti slug/title, bukan ID database, supaya tetap valid setelah re-seed). **Setiap terjemahan adalah draf buatan AI (Claude), bukan dari layanan penerjemahan eksternal, dan WAJIB direview oleh penutur asli atau penerjemah profesional sebelum benar-benar ditampilkan ke pembeli internasional sungguhan** — terutama spesifikasi produk dan teks sertifikasi di masa depan, di mana kesalahan terjemahan membawa risiko bisnis/hukum nyata. Nama perusahaan, nomor WhatsApp, email, dan alamat sengaja **tidak** diterjemahkan (tetap dalam bentuk aslinya di semua bahasa).

**Diverifikasi end-to-end** (bukan hanya lolos build): alur penuh admin → database → API → tampilan publik diuji langsung di browser (ubah nama produk lewat tab Bahasa Indonesia di admin → tersimpan di kolom `translations` → `GET /products/:slug?locale=id` mengembalikan nama terjemahan → judul halaman publik `/id/products/:slug` berubah sesuai). Perilaku header diverifikasi satu per satu: dropdown desktop, language switcher (6 bahasa, ganti URL + cookie `NEXT_LOCALE` persisten), drawer mobile dengan grup collapsible bersarang, scroll shrink/hide/show, Escape menutup dropdown, klik di luar menutup dropdown — semuanya lewat pengecekan state DOM langsung, bukan asumsi dari screenshot (alat screenshot browser di sesi ini sempat memberi koordinat yang salah karena skala tampilan, jadi verifikasi memakai `aria-expanded` dan `getBoundingClientRect()` langsung).

**Bug nyata ditemukan & diperbaiki selama build ini:**
1. `next/root-params` (fitur baru Next 16.3) **tidak berlaku** untuk struktur proyek ini — fitur itu hanya membaca segmen dinamis yang berada **di atas** root layout fisik, sedangkan root layout proyek ini sengaja tetap di luar `app/[locale]/` (agar `/admin` tidak berprefiks locale), sehingga `locale` bukan root param di sini. Ditemukan lewat error build sungguhan, bukan asumsi; diperbaiki dengan threading `params` eksplisit di lokasi yang murah dilakukan, dan default aman di `PageHeader`/`not-found.tsx` untuk lokasi yang tidak murah.
2. `params` **tidak reliable** untuk file khusus `not-found.tsx` — kosong (`undefined`) saat dirender sebagai fallback boundary selama static generation halaman lain, dikonfirmasi lewat error build sungguhan. Halaman 404 disederhanakan untuk selalu berbahasa Inggris.
3. `transform-gpu` pada elemen `<header>` (untuk animasi hide/show saat scroll) membuat containing block baru bagi descendant `position: fixed` — drawer mobile yang saat itu dirender **di dalam** `<header>` jadi terpotong tingginya (77px, mengikuti tinggi header, bukan tinggi viewport). Ditemukan lewat inspeksi `getBoundingClientRect()` langsung, bukan tebakan. Diperbaiki dengan memindahkan `<MobileMenu>` menjadi sibling dari `<header>`, bukan child.
4. Endpoint revalidasi on-demand (`/api/revalidate`) awalnya hanya me-revalidate path tanpa prefiks locale (mis. `/products/x`), padahal URL nyata sekarang berprefiks locale — diperbaiki agar setiap path yang dikirim backend di-expand ke 6 varian locale sekaligus.

## Katalog Produk Premium (Post-Launch)

Permintaan lanjutan: rombak total halaman detail produk (`/products/[slug]`) menjadi pengalaman katalog B2B premium — sidebar produk sticky + 10 bagian (Banner, Overview/slider+zoom, Quick Action, Deskripsi, Kartu Spesifikasi, Galeri, Kartu Kemasan, Kartu Aplikasi, Info Ekspor, Produk Terkait) — terinspirasi Cargill/Olam/Wilmar-style, **hanya** untuk sistem katalog produk. Header, Footer, Homepage, About Company, dan Contact **sengaja tidak disentuh** (dikonfirmasi lewat `git diff` kosong pada file-file tersebut setelah selesai).

- **Kartu listing baru terpisah** — `ProductCatalogueCard.tsx` dibuat sebagai komponen baru, bukan mengubah `ProductCard.tsx` yang sudah ada, karena `ProductCard` juga dipakai Homepage (`FeaturedProductsSection`) yang eksplisit di luar scope permintaan ini. Mengubah `ProductCard` langsung akan ikut mengubah tampilan Homepage secara tidak sengaja.
- **Skema tambahan (additive, non-breaking)** — kolom `group` (`specification` | `export_info`) ditambahkan ke `ProductSpecification` (migrasi `20260807061638_add_product_specification_group`) supaya Bagian 5 "Specifications" dan Bagian 9 "Export Information" bisa memakai tabel key-value yang sama (fleksibel, admin bisa menambah field apa saja) tanpa model/CRUD baru. Form admin "Spesifikasi" dapat selector grup baru.
- **Bagian 9 "Export Information" sengaja kosong di data seed** — field seperti MOQ, Incoterms, Lead Time adalah klaim bisnis spesifik yang hanya pemilik bisnis yang tahu angka sebenarnya; bukan dibuat-buat. Section header otomatis tersembunyi jika belum ada data (state jujur, sama seperti pola Legal & Certificate/Hero video sebelumnya) — admin tinggal menambah "spesifikasi" dengan grup "Info Ekspor" lewat CMS kapan pun data asli tersedia.
- **Bagian 7/8 (Packaging/Applications)** — sekarang benar-benar menampilkan `media` (foto) yang sebelumnya ada di data model tapi tidak pernah dirender; kalau admin belum unggah foto, tampil placeholder on-brand jujur (`SafeImage`), bukan gambar palsu. Ikon di kartu Aplikasi dipilih lewat pencocokan kata kunci pada judul asli dari CMS (murni kosmetik, teksnya tetap 100% data nyata) — bukan field baru yang perlu diisi admin.
- **Lightbox baru, bukan refactor `GalleryGrid`** — `ProductImageViewer.tsx` (hero + thumbnail + zoom) dibuat sebagai komponen mandiri untuk Bagian 2, sengaja tidak me-refactor `GalleryGrid.tsx` yang sudah ada (dipakai juga oleh halaman Gallery umum) untuk menghindari risiko regresi di luar scope. Bagian 6 "Product Gallery" tetap memakai `GalleryGrid` apa adanya.
- **Schema.org Product diperkaya** — `productJsonLd()` sekarang menyertakan seluruh galeri sebagai `image[]` dan spesifikasi sebagai `additionalProperty`; tidak ada `offers`/harga karena model bisnisnya berbasis permintaan penawaran, bukan harga publik (menambahkan harga palsu akan menyesatkan).

**Diverifikasi end-to-end di browser** (bukan hanya lolos build): navigasi sidebar antar produk berfungsi (highlight aktif berpindah benar), tombol WhatsApp Inquiry berisi pesan pra-isi dengan nama produk asli + nomor perusahaan asli dari Pengaturan, tombol Request Quotation scroll ke form yang benar, kartu Related Products menampilkan 3 produk lain yang sebenarnya, tampilan mobile (tab horizontal sticky) dan desktop (sidebar sticky) sama-sama diverifikasi via screenshot nyata, Homepage/Header/Footer/About/Contact dikonfirmasi tidak berubah lewat `git diff` kosong.

**Bug nyata ditemukan & diperbaiki:** audit Lighthouse aksesibilitas menemukan `heading-order` gagal (kartu memakai `<h4>` langsung setelah `<h2>` seksi, melompati `<h3>`, dan kartu produk di halaman listing memakai `<h3>` langsung setelah `<h1>` halaman) — diperbaiki dengan menyesuaikan level heading semantik di `PackagingCards`, `ApplicationCards`, `RelatedProducts`, dan `ProductCatalogueCard` (ukuran visual/CSS tidak berubah, hanya tag semantiknya). Skor akhir: Lighthouse 100/100/100/100 di halaman detail produk dan listing.

## Halaman Facilities Satu-Halaman (Post-Launch)

Permintaan lanjutan: tambah menu navigasi baru **Facilities** yang membuka satu halaman (`/facilities`) dengan sidebar sticky (mobile: tab horizontal) berisi 6 bagian — Facilities, Production Process, MOQ & Payment Terms, Shipment Terms, Packaging Options, FAQ — menggunakan pola in-page nav + smooth scroll + `IntersectionObserver` yang sama seperti halaman About Company. Header, Footer, Homepage, About Company, Products, dan Contact **sengaja tidak disentuh secara langsung** kecuali satu perubahan navigasi yang memang diminta secara eksplisit di bawah.

- **Nav baru mandiri, bukan reuse `AboutNav`** — `FacilitiesNav.tsx` adalah salinan independen dari pola sticky-nav/smooth-scroll `AboutNav.tsx` (bukan import langsung), supaya halaman About Company (termasuk `aria-label`-nya) tidak ikut berubah sedikit pun akibat perubahan apa pun di masa depan pada Facilities. Konsisten dengan pola isolasi yang sama dipakai saat membangun `ProductSidebarNav` terpisah dari komponen About.
- **Perubahan header nav (satu-satunya perubahan di luar halaman Facilities itu sendiri, dan memang diminta eksplisit oleh brief ini)** — dropdown "Facilities & Gallery" dipecah menjadi dua tautan datar sejajar "Facilities" dan "Gallery" di `nav-config.ts`, supaya "Facilities" tampil sebagai menu utama tersendiri (sesuai permintaan) tanpa menghilangkan akses ke Gallery. Header.tsx, Footer.tsx, dan seluruh halaman lain tidak diubah.
- **Tidak ada data terkait MOQ/pembayaran/pengiriman yang dikarang** — FAQ yang sudah ada di CMS sejak awal (`seed.ts`) secara eksplisit sudah menyatakan "MOQ varies by product... submit a Request Quotation" dan "Lead time depends on... quotation request", bukan angka tetap. Mengikuti keputusan bisnis yang sudah ada ini, kartu-kartu di bagian "MOQ & Payment Terms" dan "Shipment Terms" berisi kebijakan umum/negotiable (mis. "Payment Terms: L/C, T/T, atau dinegosiasikan", "Port of Loading: pelabuhan terdekat dari fasilitas kami di Cilacap") yang selalu diarahkan ke tombol Request Quotation untuk angka pastinya — bukan MOQ/harga/lead time spesifik yang belum pernah dikonfirmasi klien. Satu-satunya angka yang ditampilkan (Production Capacity) diambil langsung dari data `HomepageStatistic` yang sudah ada, bukan angka baru.
- **Packaging Options memakai data paket asli per produk** — bukan daftar generik "Mesh Bag/PP Bag/Bulk" yang dikarang, section ini mengambil field `packaging` asli tiap produk (Admin > Produk > Packaging, sudah ada sejak Fase 5) lewat `getProductBySlug` untuk keempat produk lalu digabung jadi kartu, masing-masing menampilkan produk aslinya ("Suitable for Semi Husked Coconut", dst).
- **Facilities, Production Process, dan FAQ memakai komponen & data CMS yang sudah ada apa adanya** — `FacilityGrid`, `ProductionTimeline`, dan `Accordion` (dari `getFacilities`, `getProductionSteps`, `getFaqs`) di-import langsung tanpa modifikasi, konsisten dengan pola reuse yang sudah dipakai di redesain katalog produk.

**Diverifikasi di browser**: sidebar desktop sticky dengan highlight bagian aktif berpindah benar saat navigasi klik maupun scroll; tab horizontal mobile sticky di bawah header dengan auto-scroll ke tab aktif; smooth scroll berfungsi dengan animasi custom (durasi ~600ms); accordion FAQ membuka/menutup dengan animasi halus; header desktop menampilkan "Facilities" dan "Gallery" sebagai dua menu datar terpisah; `git diff` kosong pada Header.tsx, Footer.tsx, Home, About, Products, dan Contact (kecuali `nav-config.ts` yang memang bagian dari permintaan ini). `tsc --noEmit` dan `eslint` bersih.

## Facilities Dropdown + Mobile Nav Redesign (Post-Launch)

Permintaan lanjutan kedua: (1) ubah "Facilities" di header dari tautan datar menjadi dropdown yang menautkan langsung ke 6 bagian in-page halaman Facilities (pola sama seperti dropdown "About Company"), dan (2) rombak drawer navigasi mobile menjadi overlay layar penuh dengan top bar sendiri (logo + tombol tutup), bagian Bahasa yang bisa dibuka/tutup, dan item aktif ditandai pill terisi — terinspirasi struktur mobile menu sebuah situs kompetitor yang ditunjukkan pengguna, **tanpa meniru warna hitam/emasnya** — tetap memakai palet hijau/putih PPN yang sudah ada di seluruh situs, konsisten dengan aturan yang sama yang berlaku sejak redesain katalog produk.

- **Dropdown Facilities** — `nav-config.ts`: 6 item baru (`/facilities#facilities`, `#production-process`, `#moq-payment`, `#shipment-terms`, `#packaging-options`, `#faq`) ditambahkan sebagai `NavDropdownGroup`, memakai komponen `NavDropdown`/`MobileGroup` yang sudah ada tanpa perlu komponen baru. Label-labelnya baru di kamus i18n (`dictionary.d.ts` + 6 file locale) — machine-translated draft, sama seperti kebijakan M3 sebelumnya.
- **Drawer mobile ditulis ulang total** (`MobileMenu.tsx`) — dari drawer sisi-kanan `max-w-sm` dengan grid bahasa selalu-terbuka di bagian bawah, menjadi overlay `inset-0` layar penuh dengan top bar sendiri (logo + tombol X), bagian "Language" collapsible (flag + centang untuk bahasa aktif, mengikuti pola accordion `grid-rows` yang sudah dipakai di seluruh situs), dan item nav aktif (mis. "Home" saat di beranda) ditandai pill hijau terisi.
- **Bug nyata ditemukan & diperbaiki saat menulis ulang** — perbandingan "item aktif" (`pathname === item.href`) di seluruh nav mobile sebelumnya tidak pernah cocok karena `usePathname()` selalu menyertakan prefiks locale (`/en/...`) sedangkan `href` di `nav-config.ts` tidak (`/...`) — highlight pill/warna aktif sebelumnya diam-diam tidak pernah menyala. Ditambahkan helper `stripLocale()` untuk menormalkan perbandingan.
- **Header desktop, Footer, Homepage, About, Products, Contact tidak disentuh** — hanya `nav-config.ts` (data), `dictionary.d.ts` + 6 file locale (label baru), dan `MobileMenu.tsx` (komponen mobile-only, `lg:hidden`) yang berubah.

**Diverifikasi di browser**: dropdown desktop "Facilities" menampilkan 6 sub-item dengan label benar dan link ke anchor yang tepat; drawer mobile layar-penuh menampilkan top bar+X, bagian Language buka/tutup dengan centang pada bahasa aktif, pill hijau pada "Home", grup dropdown ("About Company"/"Our Products"/"Facilities") buka/tutup dengan chevron berputar, tombol tutup mengembalikan ke halaman di baliknya; tampilan desktop tidak berubah. `tsc --noEmit` dan `eslint` bersih.

## Language Switcher Pill + Penghapusan "Request Quotation" dari Header (Post-Launch)

Permintaan lanjutan ketiga: (1) ubah tombol bahasa (globe icon) menjadi pill berisi bendera + kode bahasa (mis. "EN") + chevron, dengan dropdown bendera+nama+centang pada bahasa aktif — terinspirasi tampilan pill bahasa sebuah situs kompetitor yang ditunjukkan pengguna, tetap dengan warna hijau/putih PPN (bukan oranye/hitam referensi), dan (2) hapus tombol "Request Quotation" dari header/drawer navigasi di semua perangkat.

- **`LanguageSwitcher.tsx` ditulis ulang** — tombol sebelumnya ikon globe polos (`h-10 w-10`) menjadi pill `rounded-full border-2 border-primary-500` berisi bendera + `locale.toUpperCase()` + chevron yang berputar saat terbuka; item dropdown menampilkan bendera+nama lengkap, item aktif mendapat isian solid `bg-primary-500` + ikon centang (bukan sekadar teks tebal seperti sebelumnya). Komponen ini dipakai identik di top bar desktop maupun mobile (satu komponen, satu perubahan berlaku di semua perangkat).
- **Tombol "Request Quotation" dihapus dari Header.tsx (baris nav desktop) dan MobileMenu.tsx (CTA di bawah drawer)** — CTA yang sama di tempat lain (Hero homepage, Facilities page, About page, dsb.) **tidak disentuh**, karena itu konten halaman, bukan bagian header. Import `buttonVariants` yang jadi tidak terpakai di kedua file dibersihkan.
- Tidak ada perubahan pada Footer, Homepage, About, Products, halaman Facilities, atau Contact — hanya 3 file layout (`Header.tsx`, `MobileMenu.tsx`, `LanguageSwitcher.tsx`) yang berubah.

**Diverifikasi di browser**: pill bahasa tampil identik di desktop dan mobile (bendera+EN+chevron), dropdown terbuka menampilkan 6 bahasa dengan centang pada bahasa aktif, tombol Request Quotation sudah tidak ada di nav bar desktop maupun drawer mobile, tombol Request Quotation di Hero/CTA halaman lain tetap ada dan berfungsi normal. `tsc --noEmit` dan `eslint` bersih.

## Footer Premium 5-Kolom (Post-Launch)

Permintaan lanjutan keempat: rombak Footer menjadi tampilan gelap premium 5-kolom (logo+sosial media, Company, Products, Quick Link, Contact Us) terinspirasi footer sebuah situs kompetitor yang ditunjukkan pengguna — **warna disesuaikan dengan palet PPN** (hijau/putih di atas latar gelap `neutral-900`, bukan foto tekstur arang + emas dari referensi).

- **Tidak ada foto latar belakang ditambahkan** — referensi memakai foto tekstur produk arang sebagai latar footer; PPN tidak punya aset foto semacam itu dan menambahkan foto generik akan melanggar aturan proyek "tidak ada gambar stok generik" (sudah ditegakkan sejak Fase 4). Sebagai gantinya dipakai warna solid `neutral-900` (hijau-gelap, bagian dari skema warna PPN yang sudah ada) — pola "footer gelap premium di atas situs bertema terang" yang juga umum dipakai situs B2B sekelas Cargill/Olam.
- **4 kolom link dipetakan ke halaman PPN yang sungguh ada** (bukan meniru struktur navigasi Djavacoal apa adanya): kolom "Company" → bagian-bagian About Company (Profil, Tim, Legal & Sertifikat, Pabrik) + Gallery; kolom "Products" → 4 produk asli diambil live dari API (`getProducts`), bukan daftar statis; kolom "Quick Link" → 6 bagian halaman Facilities yang sudah dibangun (Production Process, Shipment Terms, MOQ & Payment Terms, Packaging Options, FAQ) + News — memakai label kamus i18n yang sudah ada dari fitur dropdown Facilities sebelumnya, nyaris tanpa key baru.
- **Ikon media sosial: tidak ada tautan dikarang** — referensi menampilkan 4 ikon (Facebook/Instagram/LinkedIn/TikTok), tapi PPN belum pernah memberikan URL media sosial sungguhan di mana pun dalam proyek ini. Ditambahkan 4 key `SiteSetting` opsional baru (`social_facebook`, `social_instagram`, `social_linkedin`, `social_tiktok`, group `social`, diekspos lewat `PUBLIC_KEYS` di `settings.service.ts` — tanpa migrasi skema, memakai tabel key-value fleksibel yang sudah ada) dan Admin > Pengaturan sudah mendukung menambah key baru apa pun lewat form "Tambah Pengaturan Baru" yang sudah ada. Footer hanya menampilkan ikon untuk platform yang benar-benar diisi — honest empty state, bukan tautan `#` palsu.
- **Kolom Contact Us memakai data nyata** (alamat, telepon, WhatsApp, email dari `getPublicSettings`) dengan ikon — tidak ada data dikarang.
- **Kolom "Get a Quote" dihapus dari footer** untuk mengikuti struktur referensi 4-kolom apa adanya; CTA Request Quotation tetap ada di Hero, halaman Facilities, About, dan Contact — hanya dihapus dari footer dan header (konsisten dengan permintaan sebelumnya).

**Diverifikasi di browser**: footer gelap 5-kolom tampil benar di desktop (grid 5 kolom) dan mobile (stack 1 kolom, urutan tetap terbaca); data Company/Products/Quick Link/Contact Us semuanya nyata dan tertaut benar; ikon sosial media tidak tampil karena belum ada URL diisi (empty state jujur, sesuai desain); bar hak cipta bawah solid hijau tua dengan teks putih di tengah. `tsc --noEmit` dan `eslint` bersih di kedua workspace (`api`, `web`).

## Halaman Contact Premium (Post-Launch)

Permintaan lanjutan kelima: rombak **hanya** halaman Contact menjadi tampilan premium B2B — hero gelap, panel info perusahaan + kartu kontak + peta, formulir inquiry lengkap, dan kartu quick-contact — terinspirasi referensi yang ditunjukkan pengguna, dengan palet PPN (hijau/putih), bukan warna referensi. Header, Footer, Homepage, About, Products, dan Facilities **tidak disentuh**.

- **Hero gelap dibangun mandiri (`ContactHero.tsx`), bukan `PageHeader` yang dipakai semua halaman lain** — brief secara eksplisit meminta hero gelap khusus terpusat, berbeda dari banner terang standar situs. Tidak ada foto stok "gudang/kontainer/pabrik" ditambahkan — PPN tidak punya aset foto tersebut dan menyisipkan foto generik melanggar aturan proyek "tanpa gambar stok generik" yang sudah ditegakkan sejak Fase 4. Sebagai gantinya dipakai gradien gelap + glow yang sama persis dengan gaya Hero Homepage (dibangun ulang secara independen, bukan meng-import/mengubah `Hero.tsx` milik Homepage, supaya Homepage tidak ikut berubah).
- **Formulir inquiry baru (`ContactInquiryForm.tsx`), bukan modifikasi `QuotationForm.tsx`** — brief meminta checkbox "I agree to the Privacy Policy" yang tidak diminta di titik pemakaian `QuotationForm` lain (Homepage, halaman produk, CTA Facilities); mengubah komponen bersama itu akan ikut mengubah semua halaman tersebut. Form baru ini adalah salinan independen dengan field yang sama (Nama, Perusahaan, Negara, Email, Telepon, Produk Diminati, Estimasi Kuantitas, Pesan) + checkbox consent, mengirim ke endpoint `quotation-requests` yang sama karena tombolnya memang "Request Quotation".
- **Checkbox tidak menaut ke halaman "Privacy Policy" yang tidak ada** — proyek ini belum pernah punya halaman kebijakan privasi, dan menulis dokumen legalnya bukan wewenang saya. Teks checkbox diubah menjadi pernyataan persetujuan penggunaan data yang akurat, tanpa tautan palsu/mengarah ke diri sendiri.
- **Kartu "Download Company Catalogue" hanya tampil jika ada filenya** — ditambahkan satu key `SiteSetting` opsional baru (`company_catalogue_url`, additive, tanpa migrasi) yang diekspos lewat `PUBLIC_KEYS`; kartu ini disembunyikan seluruhnya sampai admin mengunggah PDF katalog asli dan mengisi URL-nya lewat Admin > Pengaturan — tidak ada tautan unduhan mati.
- **Ikon media sosial memakai key yang sama dengan Footer** (`social_facebook/instagram/linkedin/tiktok`, sudah ada sejak redesain Footer) — hanya tampil jika sungguh diisi.
- **Schema.org LocalBusiness baru (`localBusinessJsonLd()`)** dibangun sepenuhnya dari data Settings asli (nama, email, telepon, alamat) — field yang belum diisi cukup dihilangkan dari objek, bukan diisi nilai palsu. Organization schema sudah ada global sejak awal (root layout), tidak perlu diduplikasi.

**Diverifikasi di browser**: hero gelap tampil terpusat dengan breadcrumb, subjudul, dan fade-in di desktop maupun mobile (satu kolom, tanpa scroll horizontal); panel kiri menampilkan data kontak asli (email, telepon, alamat, jam operasional) dengan kartu yang naik saat hover, plus ikon WhatsApp meski belum ada ikon media sosial lain (empty state jujur); peta Google Maps + tombol "View on Google Maps" tampil dengan sudut membulat dan bayangan; form kanan memvalidasi semua field wajib termasuk checkbox consent baru (`Please agree to the Privacy Policy to continue.`) sebelum mengirim; dua kartu quick-contact (WhatsApp, Email) tampil, kartu Catalogue tersembunyi karena belum ada URL; Footer di bawahnya tidak berubah. `git diff` kosong pada Header, Footer, Homepage, About, Products, Facilities, News, dan `QuotationForm.tsx`/`ContactForm.tsx`. `tsc --noEmit` dan `eslint` bersih di kedua workspace.

## Homepage Premium — Hero Slider, Partner Logos, Elemen Dekoratif (Post-Launch)

Permintaan lanjutan keenam dan terbesar sejauh ini: rombak **hanya Homepage** menjadi hero slider layar-penuh yang sepenuhnya dikelola dari Admin CMS, marquee logo mitra, dan sistem elemen dekoratif watermark — tiga modul CMS baru dari nol (skema Prisma + API + Admin CRUD + komponen publik). Header, Footer, About, Products, Facilities, News, dan Contact **tidak disentuh**.

### Dua penyelesaian scope (diputuskan sendiri, didokumentasikan di sini)

1. **Konflik di dalam brief itu sendiri**: bagian "Decorative Background Elements" secara eksplisit meminta elemen dekoratif tersebar di About/Products/Facilities/Production/News/Contact/Footer — tetapi bagian "IMPORTANT" yang sama meminta "Do NOT redesign: About Company, Products, Facilities, News, Contact, Footer. Only redesign the Homepage." Instruksi scope-boundary diprioritaskan (konsisten dengan seluruh sesi post-launch ini): sistem dekoratif dibangun agar dapat diperluas ke halaman lain (field `page` pada model, default `"home"`), tetapi **hanya benar-benar dirender di Homepage** untuk saat ini.
2. **Logo mitra/institusi pemerintah tidak dikarang** — brief secara eksplisit meminta slot untuk Kementerian Perdagangan, Barantin, LPEI, Bea Cukai, Kementan, INSW, KADIN, dll. Menampilkan logo institusi pemerintah di situs publik menyiratkan hubungan/pengesahan resmi yang sungguh ada — klaim yang jauh lebih serius daripada perkiraan angka MOQ, dan saya tidak punya cara memverifikasi kerja sama semacam itu. Modul **Logo Mitra dibangun penuh (CRUD, kategori, marquee)**, tetapi **tidak diisi data apa pun** — bagian "Trusted Partners" otomatis tersembunyi sampai admin menambahkan logo yang kerja samanya benar-benar terkonfirmasi.

### Tiga modul CMS baru (skema additive, tanpa mengubah tabel yang ada)

- **`HeroSlide`** — gambar desktop/mobile (opsional), heading, sub-heading, 2 tombol CTA (teks+tautan), urutan, aktif/nonaktif, tanggal terbit. Endpoint publik memfilter `enabled=true` dan `publish_date` (kosong atau sudah lewat). Satu baris dari data nyata Homepage lama (heading/CTA yang sama persis seperti sebelumnya) di-seed agar situs tidak "kosong" pasca-migrasi — **tanpa gambar** (mengikuti aturan "tanpa foto stok generik" yang sama sejak Fase 4); `HeroSlider.tsx` merender fallback placeholder honest (`SafeImage`) sampai admin mengunggah foto asli.
- **`PartnerLogo`** — logo (upload media wajib), nama mitra, URL website, kategori (government/certification/logistics/association/bank/other), urutan, aktif/nonaktif. **Sengaja tidak di-seed** (lihat poin scope #2 di atas).
- **`DecorativeGraphic`** — bukan upload foto, melainkan field `variant` yang memilih salah satu dari 7 ilustrasi line-art monokrom yang saya buat sendiri (leaf outline, coconut cross-section, ship outline, compass, world map outline, palm leaf, coconut tree silhouette) — pilihan desain generik (seperti memilih warna aksen), bukan klaim data bisnis, sehingga aman untuk saya susun langsung tanpa melanggar aturan "tidak boleh mengarang". Field `placement` (posisi terkontrol, bukan koordinat piksel bebas — lebih aman/mudah dirawat), `opacity` (dibatasi maksimal 0.1 sesuai brief), `scale`, `enabled`. Dua baris contoh di-seed (leaf di belakang hero, world-map di pojok) sebagai pilihan desain awal yang bisa diubah/dihapus admin kapan saja.

Ketiga modul ini digabung ke `HomepageModule`/`/admin/homepage` yang sudah ada (bukan route admin baru) — konsisten dengan pola: Statistik, FAQ, dan Produk Unggulan Homepage sudah dikelola dari satu halaman yang sama.

### Komponen publik baru

- **`HeroSlider.tsx`** — 1 slide: statis tanpa kontrol carousel. ≥2 slide: [Embla Carousel](https://www.embla-carousel.com/) (autoplay 6 detik, infinite loop, swipe, pause-on-hover desktop, navigasi keyboard panah kiri/kanan, titik indikator, tombol panah) + efek Ken Burns (zoom halus CSS `transform: scale`, di-restart setiap slide aktif berganti via React key remount) pada gambar slide yang sedang aktif saja (bukan semua slide sekaligus, demi performa).
- **`PartnerMarquee.tsx`** — marquee CSS murni (bukan loop JS), logo digandakan sekali untuk translateX 50% yang mulus, grayscale→warna asli + scale halus saat hover, pause saat hover via `animation-play-state`. Tidak dirender sama sekali jika tidak ada logo aktif.
- **`components/decorative/`** — `DecorativeSvgs.tsx` (7 ilustrasi) + `DecorativeGraphics.tsx` (renderer: posisi berdasarkan `placement`, fade-in via `IntersectionObserver`, parallax halus ≤18px murni `transform` via satu scroll listener ber-`requestAnimationFrame`, `pointer-events-none`+`aria-hidden` karena murni dekoratif). Prop `tone="light"|"dark"` mengatur warna guratan SVG agar tetap terlihat di atas hero gelap maupun bagian terang lain.
- **Schema.org LocalBusiness** ditambahkan ke Homepage lewat `localBusinessJsonLd()` yang sama yang sudah dibangun untuk halaman Contact — dari data Settings asli, bukan diduplikasi.

**Bug nyata ditemukan & diperbaiki saat membangun**: percobaan pertama merender `<DecorativeGraphics>` sebagai anak langsung `<main>` (`position: absolute inset-0`) — karena `<main>` tidak punya tinggi eksplisit, elemen dekoratif akan meregang setinggi SELURUH halaman dan "hero_behind_content" akan berakhir di tengah tinggi total halaman (kira-kira di sekitar section FAQ), bukan di belakang hero. Diperbaiki dengan memindahkan render ke dalam elemen `<section>` hero sendiri (punya `min-height` eksplisit + `position: relative`).

**Diverifikasi**: `tsc --noEmit`, `eslint` (skrip lint asli proyek, bukan lint mentah pada folder `prisma/` yang memang di luar cakupan lint proyek), dan **build produksi penuh** (`next build`) semuanya bersih di kedua workspace, 108 halaman berhasil digenerate. CRUD Hero Slide/Partner Logo/Elemen Dekoratif diuji end-to-end langsung di Admin (login asli, tambah/hapus elemen dekoratif, dikonfirmasi lewat panggilan API langsung sebelum dan sesudah). Homepage diverifikasi di browser desktop dan mobile (375px, tanpa scroll horizontal, tombol CTA lebar penuh di mobile). `git diff` kosong pada Header, Footer, About, Products, Facilities, News, dan Contact.

## Homepage: Section "About Company Preview" (Post-Launch)

Permintaan lanjutan ketujuh: tambah satu section baru di Homepage — perkenalan perusahaan dua kolom (teks + video) dengan 4 kartu keunggulan — tampil tepat setelah Hero Slider dan Partner Logo Carousel, sepenuhnya dikelola dari Admin CMS. Header, Hero Slider, Partner Logo Carousel, Products, Facilities, News, Contact, dan Footer **tidak disentuh**.

- **Mengganti `AboutSummarySection.tsx` lama**, bukan menambah section baru berdampingan — komponen lama itu memang duduk persis di posisi yang diminta brief ini, jadi mengganti isinya adalah "membuat section ini" yang sebenarnya diminta (pola yang sama seperti `Hero.tsx` → `HeroSlider.tsx` sebelumnya). File lama dihapus karena sudah 100% tidak terpakai.
- **Dua model CMS baru**: `HomepageAboutPreview` (singleton — get-or-create terhadap satu baris, bukan daftar, karena section ini memang cuma satu; field: label, heading, 3 paragraf, teks+tautan CTA, sumber video, aktif/nonaktif) dan `HomepageHighlight` (daftar 4 kartu: ikon, judul, deskripsi, urutan, aktif/nonaktif) — keduanya digabung ke `HomepageModule`/Admin > Homepage yang sudah ada, konsisten dengan pola Hero Slide/Partner Logo/Elemen Dekoratif sebelumnya.
- **Konten paragraf memakai deskripsi perusahaan asli yang sama** dengan yang sudah dipakai di halaman About Company (`/about#company`) — bukan teks placeholder baru yang dikarang, meski brief secara eksplisit mengizinkan placeholder ("Use placeholder content. The administrator will replace the text later."). Memakai deskripsi asli yang sudah ada mencegah dua bagian situs saling bertentangan ceritanya, dan tetap 100% dapat diedit admin kapan saja.
- **Tautan CTA diarahkan ke `/about` (rute asli situs), bukan `/about-company`** seperti disebut di brief — situs ini tidak pernah punya rute `/about-company`; mengikuti brief secara harfiah akan menghasilkan tautan 404. Field tetap dapat diedit admin.
- **Video: tidak ada video dikarang** — `video_source` default `"none"` (state asli, karena PPN belum punya video perusahaan), dan `CompanyVideo.tsx` menampilkan placeholder honest yang sama (`SafeImage` dengan `media=null`) seperti pola "belum ada foto/video" yang konsisten dipakai sejak Fase 4. Ketika admin nanti mengisi URL YouTube/Vimeo atau mengunggah file, komponen otomatis menampilkan facade thumbnail + tombol play (klik baru memuat iframe — hemat performa) atau `<video>` native untuk file unggahan.
- **6 ikon highlight card bawaan** (quality, sustainability, partnership, service, globe, award) sebagai SVG line-art kecil yang sudah dibuat — admin memilih dari dropdown, tidak perlu upload ikon.
- **Elemen dekoratif section ini memakai infrastruktur yang sama dari fitur Homepage sebelumnya**, tanpa perubahan skema — cukup memanggil `getDecorativeGraphics("home-about-preview")` (nilai `page` baru, field itu memang string bebas) supaya watermark section ini tidak berbagi/berebut slot dengan watermark Hero. Dua baris contoh (palm leaf pojok kanan atas, container outline pojok kiri bawah) di-seed sebagai titik awal yang bisa diubah admin. Satu varian ilustrasi baru ditambahkan (`container_outline`, sesuai daftar brief), varian lain reuse dari fitur Hero.

**Bug nyata ditemukan & diperbaiki**: percobaan pertama menyusun 2-kolom (blok teks+highlight+CTA sebagai satu unit kiri, video sebagai unit kanan) dengan `order-1`/`order-2` pada level grid-item — hasilnya di mobile, video selalu tampil PALING BAWAH (setelah highlight cards & CTA), padahal brief eksplisit meminta urutan mobile: Intro → Video → Highlights → CTA. `order-*` Tailwind hanya bisa mengurutkan antar grid-item, bukan konten DI DALAM satu grid-item. Diperbaiki dengan memecah jadi 3 grid-item terpisah (Intro, Video, Highlights+CTA) yang di mobile otomatis mengikuti urutan dokumen (sudah benar), dan di desktop diberi `lg:col-start`/`lg:row-start`/`lg:row-span` eksplisit supaya video tetap menjadi satu kolom kanan yang membentang penuh di sebelah teks+highlight kiri.

**Diverifikasi**: `tsc --noEmit`, lint (skrip proyek asli), dan **build produksi penuh** bersih di kedua workspace (108 halaman). Urutan DOM mobile dikonfirmasi lewat pemeriksaan langsung di browser (Intro → Video placeholder → Highlights). `git diff` kosong pada Header, Hero Slider (`HeroSlider.tsx`), Partner Logo Carousel (`PartnerMarquee.tsx`), Products, Facilities, News, Contact, dan Footer.

## Peningkatan Section "Trusted Institutions & Partners" (Post-Launch)

Permintaan lanjutan kedelapan: perluas fitur marquee logo mitra (dibangun di task Homepage sebelumnya) menjadi versi premium — judul/subjudul/kecepatan yang bisa diedit admin, kartu logo konsisten, fallback gambar rusak, grid statis saat `prefers-reduced-motion`, kategori yang bisa diperluas admin, dan field per-logo yang lebih lengkap. Hanya section Partner Logo/Trusted Institutions, Admin Partner Management, dan komponen database/API pendukungnya yang diubah — Header, Hero Slider, About Preview, Products, Facilities, News, Contact, dan Footer **tidak disentuh**.

- **Kategori diubah dari Prisma enum menjadi teks bebas** — brief eksplisit meminta "Admin can create additional categories," yang tidak mungkin dilakukan dengan enum Prisma tetap (perlu migrasi setiap kali ada kategori baru). Kolom `category` sekarang `String` biasa dengan 9 kategori yang disarankan sebagai `datalist`/starting point (`PARTNER_LOGO_SUGGESTED_CATEGORIES` di shared-types) — admin bisa mengetik kategori apa saja.
- **"Aktif" dan "Featured" adalah dua saklar independen** — sesuai kalimat brief yang eksplisit ("Only Active logos appear" DAN terpisah "Featured logos appear on the Homepage carousel. Non-featured logos remain available in Admin Panel but do not appear"). Ditafsirkan sebagai: sebuah logo tampil di beranda hanya jika **keduanya** benar. Ini memberi admin kendali menyimpan data logo tanpa langsung menampilkannya.
- **Tetap tidak ada logo institusi pemerintah yang dikarang** — brief sendiri secara eksplisit meminta ini ("Do not invent logos... If an official downloadable logo is unavailable, DO NOT create a fake logo. Instead, create an admin placeholder"). Tidak ada baris `PartnerLogo` di-seed sama sekali; section otomatis tersembunyi sampai admin sungguh mengunggah aset logo resmi. Hanya field-field section (judul/subjudul/kecepatan) yang di-seed, karena itu murni teks brief yang sudah diberikan secara eksplisit, bukan data institusi.
- **Kecepatan marquee dapat dikonfigurasi admin** — model singleton baru `HomepagePartnersSection` (pola sama seperti `HomepageAboutPreview`) menyimpan judul, subjudul, dan `marqueeDurationSeconds` (15–90, default 40 sesuai rekomendasi brief). Diterapkan ke CSS lewat custom property `--marquee-duration` yang di-set inline per instance — animasi keyframe tetap satu definisi global.
- **Kartu logo konsisten + fallback gambar rusak** — setiap logo kini dibungkus kartu (tinggi tetap, border tipis, padding, `object-contain`, tidak pernah crop/stretch) lewat komponen client baru `PartnerLogoTile.tsx` yang menangani `onError` pada gambar dan beralih ke fallback teks nama mitra — carousel tidak pernah rusak karena satu logo gagal dimuat.
- **Grid statis saat reduced-motion — tanpa JavaScript** — dua markup (marquee animasi + grid statis) dirender sekaligus di server, ditampilkan salin satu lewat varian Tailwind `motion-safe:`/`motion-reduce:` (memetakan langsung ke media query `prefers-reduced-motion`). Grid statis memakai daftar logo asli (tidak digandakan), sedangkan marquee memakai daftar yang digandakan sekali untuk loop mulus — dikonfirmasi lewat pemeriksaan DOM langsung selama verifikasi.
- **Field baru per logo**: `description`, `alt_text` (fallback ke nama mitra bila kosong), `open_in_new_tab`, `featured` — semuanya additive di migrasi Prisma yang sama.
- **`translate3d`/`will-change` untuk performa** — keyframe marquee diubah dari `translateX` ke `translate3d` (akselerasi GPU eksplisit), sesuai permintaan brief ("Avoid: top, left, margin-left, layout-triggering animations").
- **Touch-drag manual pada mobile sengaja tidak ditambahkan** — brief menandainya sebagai opsional ("if possible") dan secara eksplisit memprioritaskan animasi berkelanjutan yang mulus tanpa reset/lompatan; menambah scroll manual di atas animasi transform yang berjalan berisiko membuat keduanya saling mengganggu (jank) — pengguna tetap bisa menonton logo lewat tanpa interaksi apa pun, sesuai perilaku inti yang diminta.

**Ditemukan tapi sengaja tidak diperbaiki di task ini (dilaporkan terpisah)**: endpoint upload media (dipakai bersama oleh seluruh situs — produk, fasilitas, hero slide, dst., bukan spesifik ke fitur ini) menerima file SVG mentah tanpa sanitasi; SVG bisa berisi `<script>`/event handler yang berpotensi XSS tersimpan. Ini adalah masalah pra-eksisting (sejak Fase 5) di luar cakupan perubahan section Partner Logo, jadi dilaporkan sebagai task terpisah alih-alih ditambal langsung di tengah perubahan ini.

**Diverifikasi**: `tsc --noEmit`, lint (skrip proyek asli, bersih di kedua workspace), dan **build produksi penuh** (108 halaman) bersih. Alur CRUD penuh diuji end-to-end lewat API sungguhan yang sudah diautentikasi di browser (unggah logo asli via `/admin/media`, buat `PartnerLogo`, tampil benar di beranda dengan kartu+tautan+`target="_blank"` yang benar, dikonfirmasi lewat `getComputedStyle` bahwa durasi animasi 40 detik terbaca dari config admin, grid reduced-motion memakai daftar tidak-digandakan, lalu dibersihkan lagi ke state kosong semula). Tidak ada overflow horizontal di 375px. `git diff` kosong pada Header, Hero Slider, About Preview, Products, Facilities, News, Contact, dan Footer.

## Homepage: Section "Why Choose Us?" (Post-Launch)

Permintaan lanjutan kesembilan: tambah section "Why Choose Us?" di Homepage — **ikon + judul singkat saja, tanpa deskripsi** — 8 kartu default (Premium Quality, Reliable Supply, Export Ready, Consistent Quality, Sustainable Sourcing, Professional Service, Competitive Pricing, On-Time Delivery), grid responsif, interaksi klik "pulse" singkat, sepenuhnya dikelola dari Admin CMS. Hanya section ini, wiring Homepage (`page.tsx`), dan `globals.css` yang diubah — Header, Hero Slider, Partner Logos, About Preview, Statistics, Products, Facilities, News, Contact, dan Footer **tidak disentuh**.

- **Mengganti `WhyChooseUsSection.tsx` lama di tempat**, bukan menambah file baru — versi lama (4 kartu dengan deskripsi, judul "Why Choose PPN") duduk di posisi semantik yang sama persis yang diminta brief ini ("why choose us"), jadi ini upgrade in-place, bukan penggantian identitas komponen (beda dengan `Hero.tsx` → `HeroSlider.tsx` yang memang berganti sifat).
- **Model CMS baru `HomepageWhyChooseUs`** (daftar, bukan singleton — 8+ kartu): `icon` (enum tetap 8 nilai, sesuai daftar ikon di brief), `title`, `order`, `enabled`, `featured`, `translations`. **Sengaja tidak ada field deskripsi sama sekali** di skema — brief eksplisit melarang deskripsi/paragraf/penjelasan pada section ini, jadi larangan itu ditegakkan di level skema, bukan cuma UI, supaya section ini tidak bisa "mengembang" jadi kartu produk/blog di masa depan tanpa migrasi baru.
- **"Aktif" dan "Featured" adalah dua saklar independen**, pola yang sama persis dengan `PartnerLogo` di task sebelumnya — "Aktif" menyimpan kartu di Admin (bisa diedit kapan saja), "Featured" adalah yang benar-benar menerbitkannya ke Homepage.
- **8 ikon line-art baru dibuat tangan** (`WhyChooseUsIcons.tsx`) — proyek ini sejak awal tidak memakai library ikon eksternal (Lucide, dst.) di mana pun; seluruh ikon (highlight cards, dekorasi, dll.) adalah SVG inline buatan sendiri. Set baru ini melanjutkan pola yang sama: stroke 1.5px konsisten, `currentColor` (mengikuti warna hijau tua PPN dari elemen pembungkus), tanpa emoji/ikon kartun.
- **Grid responsif 3 breakpoint** sesuai spesifikasi brief: mobile 2 kolom (`grid-cols-2`), tablet/tablet besar 4 kolom (`md:grid-cols-4`), desktop 8 kolom satu baris (`lg:grid-cols-8`) — dikonfirmasi visual di 375px, 768px, dan 1440px, tanpa overflow horizontal di breakpoint mana pun.
- **Interaksi klik "pulse" ~450ms, bukan animasi berkelanjutan** — komponen client baru `WhyChooseUsCard.tsx` (elemen `<button>` asli, bukan `<div onClick>`, supaya fokus keyboard & aktivasi Enter/Space bekerja native tanpa `role`/`tabIndex` tambahan) memicu kelas `animate-card-pulse`/`animate-icon-pulse` sekali per klik (kartu scale 1→1.04→1, ikon scale 1→1.12→1, glow hijau tipis lewat `box-shadow`, keyframe baru di `globals.css`), lalu melepas kelas itu lewat `onAnimationEnd`. State "aktif" (border/ikon/bg hijau) bertahan sedikit lebih lama (900ms) dari pulse itu sendiri supaya pulse tetap terasa sebagai feedback utama, lalu memudar — dikonfirmasi lewat pemeriksaan `className`/`getComputedStyle` langsung di browser pada 100ms (pulse+aktif menyala), 600ms (pulse selesai, aktif masih menyala), dan 1800ms (kembali ke state default, tidak ada glow permanen).
- **Hover desktop terpisah dari pulse klik** — `hover:-translate-y-1`, border & background menguat, ikon membesar sedikit, transisi 220ms (dalam rentang 200–250ms yang diminta) — memakai variant Tailwind `hover:` biasa, pola yang sama dengan `HighlightCards.tsx`/`PartnerLogoTile.tsx`.
- **Animasi hanya `transform`/`opacity`/`box-shadow`** (GPU-friendly) sesuai permintaan performa brief — tidak ada properti yang memicu layout (`top`/`left`/`margin`/`width`/`height` pada elemen yang beranimasi).
- **`prefers-reduced-motion` tidak butuh kode baru** — override global di `globals.css` (`animation-duration: 0.01ms !important; transition-duration: 0.01ms !important` pada `*`) yang sudah ada sejak fase-fase awal otomatis menonaktifkan pulse & stagger entry untuk section ini juga; hover tetap berjalan (tidak bergantung pada `animation`/`transition-duration` panjang untuk terasa "minimal").
- **Entry animation stagger 60ms per kartu** (dalam rentang 50–80ms brief) — komponen client baru `WhyChooseUsGrid.tsx` memakai satu `IntersectionObserver` (bukan satu per kartu) untuk memicu `visible`, lalu tiap kartu membaca `transitionDelay` dari indeksnya sendiri — pola transisi yang sama dengan `FadeUpSection.tsx`, bukan `@keyframes` terpisah per kartu.
- **Elemen dekoratif memakai infrastruktur `DecorativeGraphic` yang sama** tanpa perubahan skema — `page: "home-why-choose-us"` (nilai baru, field memang string bebas), dua varian yang sudah ada (`coconut_tree_silhouette`, `leaf_outline`) di-seed pada opacity 0.04 (dalam rentang 2–5% yang diminta) di pojok kanan-atas dan kiri-bawah.
- **Latar section**: gradien putih → hijau sangat muda → putih (`bg-gradient-to-b from-white via-primary-50/30 to-white`), bukan warna solid, sesuai permintaan "subtle gradient, not strong".
- **Konten 100% dinamis dari CMS** — `WhyChooseUsSection.tsx` menerima `items`/`decorativeGraphics` sebagai props dari `page.tsx` (`getWhyChooseUs(locale)`), tidak ada array kartu yang di-hardcode; admin bisa menambah kartu ke-9 dst. tanpa perubahan kode. 8 kartu default di-seed persis sesuai nama & urutan brief.
- **Warna hanya dari sistem warna PPN yang sudah ada** (`primary-*` hijau, `neutral-*`, putih) — tidak ada warna baru ditambahkan, sesuai larangan eksplisit brief terhadap hitam+emas/oranye/kuning terang.

**Diverifikasi**: `tsc --noEmit` dan lint (skrip proyek asli) bersih di kedua workspace, **build produksi penuh** (108 halaman, 6 bahasa) bersih. Diuji langsung di browser: grid 8 kolom di desktop (1440px), 4×2 di tablet (768px), 2×4 di mobile (375px), tanpa overflow horizontal di breakpoint mana pun; klik-pulse dikonfirmasi lewat pemeriksaan kelas CSS bertahap (100ms/600ms/1800ms) persis sesuai timeline yang diminta; ukuran kartu jauh di atas target sentuh minimum 44px; alur admin (tambah kartu, ubah ikon/judul, toggle Aktif/Featured, Naik/Turun reorder, hapus) diuji end-to-end lewat API terautentikasi sungguhan, lalu dibersihkan lagi ke 8 kartu default urutan asli. `git diff` kosong pada Header, Hero Slider, Partner Logos, About Preview, Statistics, Products, Facilities, News, Contact, dan Footer.

**Catatan lingkungan (bukan bagian task ini)**: pada saat task ini dikerjakan, working tree berisi perubahan tidak ter-commit dari task terpisah (sanitasi upload SVG di `media.service.ts`, dilaporkan sebagai temuan terpisah di task Partner Logo sebelumnya) yang belum lolos lint (`media.service.spec.ts`). Berkas-berkas itu **tidak disentuh dan tidak disertakan** dalam commit fitur ini.

## Homepage: Hero Slider — Upgrade Menjadi CMS Manajemen Penuh (Post-Launch)

Permintaan lanjutan kesepuluh: upgrade "Homepage → Hero Slider" di Admin (yang sebelumnya hanya form dasar — aktif/nonaktif, hapus, gambar desktop, alt text, upload) menjadi sistem manajemen Hero Slider lengkap — CRUD, Duplicate, Aktif/Nonaktif, Reorder, Preview, dengan field tampilan yang jauh lebih kaya. Ini **upgrade in-place** terhadap model/komponen yang sudah ada (`HeroSlide`, `HeroSlideEditor`, `HeroSlider.tsx`), bukan sistem CMS terpisah — sesuai instruksi eksplisit brief ini ("If a Hero Slider CMS already exists: UPGRADE IT. Do NOT create a second Hero Slider system").

- **Field baru pada model `HeroSlide`** (migrasi additive, field lama tidak diubah): `eyebrowText` (label kecil di atas heading), `description` (paragraf opsional di bawah subheading), `button1Enabled`/`button2Enabled` (saklar eksplisit, sebelumnya implisit dari ada/tidaknya teks), `button1Style`/`button2Style` (enum `primary`/`secondary`), `textAlignment` (enum `left`/`center`/`right`, default `center` — sama seperti perilaku lama), `overlayOpacity` (0–100%, default 35 — sebelumnya hardcode `bg-neutral-900/35` di komponen, sekarang dikontrol admin per slide).
- **Duplicate slide** — endpoint admin baru `POST /admin/homepage/hero-slides/:id/duplicate` menyalin seluruh field kecuali id/timestamp, judul otomatis diberi akhiran " — Copy", dan slide hasil duplikat **default nonaktif** (persis sesuai brief) supaya tidak langsung tayang sebelum diperiksa admin.
- **Slide baru kini default nonaktif juga** (sebelumnya langsung aktif meski belum ada gambar) — mencegah hero kosong/rusak tampil di beranda saat admin baru mulai mengisi slide baru; admin mengaktifkan manual setelah detail lengkap.
- **Preview WYSIWYG** — modal baru (`HeroSlidePreviewModal.tsx`) dengan toggle Desktop/Tablet/Mobile, memakai overlay opacity/perataan teks/gaya tombol/field enable yang sama persis dengan yang dirender `HeroSlider.tsx` di beranda sungguhan, supaya preview di Admin benar-benar mewakili tampilan akhir.
- **Toast notification** — primitif baru (`Toast.tsx`, dipasang sekali di `AdminShell`) karena sebelumnya **tidak ada sistem notifikasi sukses/gagal sama sekali** di seluruh Admin Panel (setiap editor lain hanya reload diam-diam). Dipasang untuk aksi eksplisit (tambah, hapus, duplicate, reorder, aktifkan/nonaktifkan) — sengaja **tidak** dipasang di setiap blur field teks (mengikuti pola auto-save-on-blur yang sudah konsisten di semua editor lain, supaya tidak spam toast saat mengetik banyak field berurutan).
- **Reorder tetap memakai tombol Naik/Turun**, bukan drag-and-drop yang direkomendasikan brief — demi konsistensi dengan seluruh section admin lain (Partner Logo, Highlight, Why Choose Us) yang semuanya memakai pola swap-order yang sama; brief sendiri mengizinkan alternatif ini ("or provide a Save Order button").
- **Validasi upload gambar sisi klien** — `MediaUploadField` mendapat prop opsional baru `maxSizeBytes`/`hint` (tidak breaking untuk pemakai lain); Hero Slider memakai batas 5MB dengan pesan "Gambar terlalu besar. Maksimum 5MB." sebelum request upload dikirim, plus teks rekomendasi resolusi (1920×1080 desktop, 1080×1350 mobile).
- **Fallback gambar mobile yang jelas** — jika gambar mobile kosong, tampil pesan "Belum ada gambar mobile. Gambar desktop akan dipakai di layar mobile." (perilaku fallback-nya sendiri sudah ada sejak awal di `HeroSlider.tsx`, sekarang dikomunikasikan eksplisit ke admin).
- **Peringatan CTA tidak konsisten** — jika tombol diaktifkan tapi teks/tautan kosong, muncul pesan inline "Tombol aktif tapi teks/tautan kosong — tombol tidak akan tampil di beranda" (validasi lunak, bukan blocking, konsisten dengan pola form lain di proyek ini).
- **Notice performa** — jika jumlah slide aktif melebihi 7, muncul pesan "Untuk performa terbaik, disarankan maksimal 7 slide aktif" persis sesuai teks brief.
- **Fallback nol-slide yang sebelumnya tidak ada** — `HeroSlider.tsx` dulu me-return `null` (benar-benar kosong) saat tidak ada slide aktif. Sekarang menampilkan `HeroFallback` — section bermerek PPN sederhana (gradien hijau + nama perusahaan) yang tidak bergantung sama sekali pada data CMS, sesuai permintaan eksplisit brief ("Homepage must NOT break... Do NOT render a blank Hero section").
- **Autoplay berhenti saat tab browser tidak aktif** — listener `visibilitychange` baru memanggil `stop()`/`play()` pada plugin Autoplay Embla, mencegah slider "meloncat" beberapa slide sekaligus saat pengguna kembali ke tab setelah lama tidak aktif.
- **Character counter live** — `HeroSlideEditor` diekstrak jadi sub-komponen `HeroSlideCard` dengan state lokal khusus untuk field Heading/Sub Heading, supaya jumlah karakter ter-update di setiap ketikan sementara penyimpanan tetap terjadi saat blur (pola auto-save yang sama, hanya counter-nya yang live).
- **Sengaja tidak diimplementasikan** (dipangkas dari brief demi menghindari kerumitan yang tidak proporsional terhadap nilainya): drag-and-drop reorder (lihat poin di atas), video background, field `customClass`, `scheduledEnd` (tanggal berhenti tayang — `publishDate`/tanggal mulai tayang tetap ada dan berfungsi), generasi varian gambar AVIF manual (sudah otomatis lewat `next/image`), aksi bulk multi-select, dan pengaturan durasi autoplay per-slide/global (tetap 6000ms tetap, sudah dalam rentang 4000–8000ms yang direkomendasikan brief).

**Diverifikasi**: `tsc --noEmit` dan lint bersih di kedua workspace, **build produksi penuh** (108 halaman, 6 bahasa) bersih. Diuji langsung di browser dengan API terautentikasi sungguhan: Preview modal (Desktop/Tablet/Mobile) menampilkan gambar+heading+subheading+deskripsi+tombol dengan benar; Duplicate mengonfirmasi baris database baru dengan judul " — Copy" dan `enabled: false`; slide dengan `eyebrow_text`/`description`/`text_alignment: left`/`overlay_opacity: 60`/gaya tombol custom dikonfirmasi tampil identik di beranda sungguhan; mode 1-slide (statis, tanpa carousel chrome) dan mode 0-slide (`HeroFallback`) keduanya dikonfirmasi visual; tidak ada overflow horizontal di 1440px; layout desktop asli tidak berubah untuk slide yang memakai nilai default. Seluruh data uji dibersihkan kembali ke state semula (1 slide asli, aktif, field default) setelah verifikasi.

## Homepage: Section "Global Export Reach" — Peta Ekspor Interaktif (Post-Launch)

Permintaan lanjutan kesebelas: tambah section baru "Global Export Reach" di Homepage — peta dunia vektor interaktif yang menyorot negara tujuan ekspor CV Putri Palma Nusantara — tampil setelah News & Articles, sebelum FAQ/Contact/Footer. Sepenuhnya dikelola dari Admin CMS (modul "Negara Tujuan Ekspor" baru); **tidak ada data negara yang di-hardcode di frontend**. Hanya section ini, wiring Homepage (`page.tsx`), dan `globals.css` yang diubah — Header, Hero Slider, Partner Logo Marquee, About Preview, Statistics, Why Choose Us, Products, Facilities, Contact, dan Footer **tidak disentuh**.

- **Peta vektor asli, bukan gambar statis** — data geografis (173 negara, format path SVG) digenerate satu kali dari dataset Natural Earth 110m (via paket `world-atlas`, domain publik) memakai proyeksi `geoNaturalEarth1` (`d3-geo`) dan disimpan sebagai berkas JSON statis (`apps/web/src/data/world-map.json`, ±160KB). Paket generator (`world-atlas`, `topojson-client`, `d3-geo`, `i18n-iso-countries`) hanya dipakai sebagai tooling sekali-pakai lalu **dihapus dari dependency** — tidak ada library mapping berat yang ikut ke bundle produksi.
- **Server/Client Component split untuk performa** — `WorldMapSvg.tsx` (Server Component) merender ~173 elemen `<path>` sebagai HTML statis (bukan JS), sementara `WorldMapInteractive.tsx` (Client Component) hanya menambahkan lapisan interaksi (hover/klik/keyboard) lewat event delegation — geometri peta tidak pernah masuk ke JS bundle klien.
- **Palet warna PPN murni** (bukan skema oranye/hitam dari referensi visual yang diberikan): negara default abu-abu netral, negara tujuan ekspor hijau PPN, hover hijau lebih terang, negara terpilih hijau tua + animasi pulse halus 450ms sekali-jalan (bukan loop tak berhenti — draf awal sempat menyertakan cincin pulse `infinite` yang justru melanggar permintaan brief sendiri soal "no excessive/constant pulsing", sehingga dihapus sebelum dipakai).
- **5 negara wajib memiliki kode ISO resmi** — dropdown pemilihan negara di Admin dibatasi ke 173 negara dengan kode ISO alpha-2/alpha-3 valid (diverifikasi lewat `i18n-iso-countries`); wilayah tanpa kode ISO resmi (mis. Kosovo, Somaliland) sengaja **tidak** disertakan, sesuai larangan eksplisit brief ("Do NOT manually invent country codes").
- **Model `ExportDestination`** menyimpan: kode negara, status ekspor (`active_destination`/`previous_destination`/`potential_market`/`inactive` — hanya `active_destination` yang otomatis tersorot di peta publik), deskripsi singkat, volume/frekuensi ekspor, pelabuhan tujuan (semua opsional), relasi many-to-many ke `Product` yang **sudah ada** (bukan data produk duplikat), urutan, Aktif, Featured (murni penekanan visual di daftar chip, bukan gerbang visibilitas).
- **Visibilitas publik = `enabled: true` DAN `export_status: active_destination`** secara bersamaan — keputusan desain sendiri karena brief agak tumpang tindih antara toggle "Active" dan status "Active Destination"; didokumentasikan di kode (`export-destination.mapper.ts`, `homepage.service.ts`).
- **Tidak pernah menampilkan data yang belum diisi Admin** — Country Information Panel hanya merender field yang benar-benar terisi (deskripsi, volume, frekuensi, pelabuhan, daftar produk); field kosong disembunyikan sepenuhnya, tidak diisi teks placeholder atau angka contoh.
- **"Serving N Export Destinations" dihitung otomatis** dari jumlah baris `active_destination` + `enabled` sungguhan — tidak pernah di-hardcode.
- **UX mobile** — di bawah breakpoint `sm`, muncul dropdown "Select Export Destination" sebagai alternatif tap-negara-kecil-di-peta yang tidak reliable di layar sempit; peta sendiri tetap responsif (SVG `viewBox`, tanpa overflow horizontal terkonfirmasi di 375px).
- **Fallback aksesibilitas** — negara tujuan ekspor punya `role="button"`, `tabindex="0"`, `aria-label` deskriptif, bisa dipilih lewat keyboard (Tab + Enter/Space); negara non-tujuan tidak fokusable.
- **Pencarian di daftar chip** — filter client-side terhadap nama negara, tidak memanggil API tambahan.
- **`prefers-reduced-motion`** — otomatis tercakup lewat aturan global `*` yang sudah ada di `globals.css` (tidak perlu override khusus per fitur).
- **Modul Admin "Negara Tujuan Ekspor"** — CRUD penuh (tambah dari dropdown 173 negara, ubah status/deskripsi/volume/frekuensi/pelabuhan/produk terkait, toggle Aktif/Featured, Naik/Turun, Hapus dengan `ConfirmDialog` — pola yang sama dengan Hero Slider/Partner Logo), plus editor singleton terpisah untuk judul/subjudul section (`HomepageExportReach`, sama pola get-or-create seperti `HomepageAboutPreview`/`HomepagePartnersSection`).

**Diverifikasi**: `tsc --noEmit`, lint (skrip proyek asli), dan **build produksi penuh** (108 halaman, 6 bahasa) bersih di kedua workspace setelah dependency generator peta dihapus. Diuji langsung di browser dengan data sungguhan lewat Admin (bukan curl saja): toggle Aktif menyembunyikan negara dari peta publik seketika; ubah status ekspor ke `potential_market` membuat negara hilang dari peta publik (hanya `active_destination` yang tampil); Naik/Turun mengubah urutan; tombol Hapus memicu `ConfirmDialog`, tombol Batal membatalkan (data tidak terhapus), konfirmasi Hapus benar-benar menghapus dari database + Admin UI; form Tambah Negara menambah baris baru lewat dropdown negara. Di beranda: klik/keyboard pada negara di peta memilih negara dan membuka Country Information Panel yang hanya menampilkan field yang benar-benar terisi Admin (tidak ada data fiktif); klik chip di daftar "Export Destinations" menyinkronkan pilihan ke peta; pencarian di daftar chip memfilter dengan benar; "Serving N Export Destinations" berubah sesuai jumlah tujuan aktif sungguhan. Di mobile (375px): tidak ada overflow horizontal, dropdown "Select Export Destination" tampil dan berfungsi sebagai pengganti tap-peta. State nol-negara dikonfirmasi: section tidak dirender sama sekali (`return null`), konsisten dengan seluruh section Homepage lain di proyek ini. Seluruh data uji dibersihkan kembali ke state kosong asli setelah verifikasi selesai. `git diff` kosong pada Header, Hero Slider, Partner Logo Marquee, About Preview, Statistics, Why Choose Us, Products, Facilities, Contact, dan Footer.

## Homepage: Section "Global Shipping Partner" — Carousel Logo Shipping/Logistics (Post-Launch)

Permintaan lanjutan kedua belas: tambah section baru "Global Shipping Partner" di Homepage — carousel logo horizontal untuk shipping line/carrier/logistics partner, tampil tepat setelah Global Export Reach, sebelum FAQ/Contact/Footer. Sepenuhnya dikelola dari Admin CMS (modul "Global Shipping Partners" baru); **tidak ada logo shipping partner yang di-hardcode di frontend**. Hanya section ini, wiring Homepage (`page.tsx`), dan `globals.css` (baca ulang, tidak diubah — memakai animasi marquee yang sudah ada) yang disentuh — Header, Hero Slider, Partner Logo Marquee, About Preview, Statistics, Why Choose Us, Products, Facilities, Global Export Reach, Contact, dan Footer **tidak disentuh**.

- **Model `ShippingPartner` terpisah dari `PartnerLogo`** yang sudah ada, sesuai arahan brief sendiri ("Global Shipping Partner should have its own data model if that is the cleanest architecture") — field/pola CRUD-nya (duplicate, reorder, enabled+featured dual-gate, preview modal, ConfirmDialog untuk hapus) sengaja meniru persis `PartnerLogo` (`partner-logo.mapper.ts`/`homepage.service.ts`/`PartnerLogoEditor`) supaya konsisten dengan pola CMS yang sudah terbukti, bukan membangun sistem CMS kedua yang berbeda. "Logo Mitra & Institusi" yang sudah ada **tidak disentuh sama sekali**.
- **`relationship_type` sebagai enum Prisma beranggota 7 nilai** (Shipping Partner/Shipping Line/Carrier/Logistics Partner/Freight Network/Service Provider/Other) — mengikuti permintaan eksplisit brief agar admin bisa mencatat hubungan yang sebenarnya per baris tanpa section publik otomatis mengklaim "Official Partner" untuk logo yang belum tentu benar-benar partner resmi.
- **Reuse marquee CSS yang sudah ada** (`animate-marquee` + `--marquee-duration`, dari `PartnerMarquee.tsx`) alih-alih membangun ulang animasi marquee kedua — teknik duplicated-track + `translateX` loop yang sama persis, hanya `--marquee-duration` yang berbeda nilai per section. Ini memenuhi permintaan "reuse existing architecture" sekaligus menghindari duplikasi kode animasi.
- **Satu perilaku baru yang tidak ada di Partner Marquee**: pause saat disentuh di mobile (bukan cuma hover mouse) — `ShippingPartnerMarquee.tsx` menambah `onTouchStart`/`onTouchEnd` yang men-toggle `animation-play-state` lewat `ref`, karena CSS `:hover` semata tidak berlaku di layar sentuh, sementara brief eksplisit meminta autoplay berhenti saat jari pengguna berinteraksi dengan carousel.
- **Reduced-motion fallback berupa strip scroll horizontal asli** (`overflow-x-auto` + `snap-x`), bukan grid statis seperti Partner Marquee — brief eksplisit meminta "static horizontally scrollable carousel", bukan grid, untuk section ini; kedua markup (marquee animasi dan strip scroll) dirender sekaligus di server, hanya satu yang tampil lewat varian Tailwind `motion-safe:`/`motion-reduce:` (tanpa JS deteksi preferensi).
- **Ukuran kartu logo jauh lebih besar** dari Partner Logo Marquee (sesuai permintaan eksplisit brief): ±208px mobile, ±224px tablet, ±288px desktop (brief merekomendasikan 150–210/180–240/220–300px) — padding besar, radius 20px, tanpa `grayscale`/`opacity`/`mix-blend-mode` apa pun (warna logo asli, konsisten dengan aturan "never recolor an official logo" yang sudah berlaku di Partner Logo).
- **Panel "Section Settings"** (`ShippingSectionEditor`, singleton `HomepageShippingSection`) — judul/subjudul, kecepatan marquee (preset Slow/Medium/Fast + custom detik, pola identik dengan Partners Section), dan dua toggle tampilan (Tampilkan Nama Partner, Tampilkan Relationship Type) — diuji langsung di browser: mematikan "Tampilkan Relationship Type" seketika menyembunyikan label relationship di beranda tanpa mempengaruhi nama partner.
- **Sengaja tidak diimplementasikan** (dipangkas dari brief demi menghindari kerumitan yang tidak proporsional terhadap nilainya, didokumentasikan di sini seperti setiap keputusan pemangkasan scope sebelumnya): tombol navigasi Previous/Next — brief sendiri menandainya "Optional", dan carousel marquee kontinu (bukan carousel berbasis halaman/slide) secara arsitektural tidak punya konsep "halaman" untuk dinavigasi tombol; sebagai gantinya, mode reduced-motion sudah menyediakan scroll horizontal asli (mouse/trackpad/sentuh) yang jadi padanan praktis dari navigasi manual. Endpoint admin terpisah untuk activate/deactivate/feature/unfeature/reorder (disebutkan di brief) tidak dibuat karena `PUT` parsial yang sudah ada (field `enabled`/`featured`/`order`) sudah mencakupnya — brief sendiri melarang membuat API duplikat jika endpoint setara sudah ada.
- **Draf awal heading dua-baris** ("GLOBAL" baris pertama, "SHIPPING PARTNER" baris kedua, sesuai contoh visual brief) diganti jadi satu baris dengan garis dekoratif kecil di kiri — supaya konsisten dengan pola heading section lain di beranda ini (Global Export Reach, Why Choose Us, dst. semuanya satu baris `text-h2`), bukan memperkenalkan gaya heading baru yang berbeda sendiri.

**Diverifikasi**: `tsc --noEmit`, lint (skrip proyek asli), dan **build produksi penuh** (108 halaman, 6 bahasa) bersih di kedua workspace. Diuji langsung di browser dengan data sungguhan lewat Admin (curl untuk upload logo — batasan tooling sesi ini, bukan batasan aplikasi — lalu setiap aksi CRUD lain diuji lewat klik/interaksi UI sungguhan): tambah shipping partner lewat form (termasuk validasi "Unggah logo terlebih dahulu" saat submit tanpa logo); toggle Aktif/Featured menyembunyikan/menampilkan dari carousel beranda seketika; Naik/Turun menukar `order`; Duplicate membuat baris baru bersuffix " — Copy" dengan `enabled/featured: false`; tombol Hapus memicu `ConfirmDialog`, Batal membatalkan (data tidak terhapus, dikonfirmasi lewat API), konfirmasi Hapus benar-benar menghapus; pencarian nama/relationship/website dan filter status (Active/Inactive/Featured/Not Featured) memfilter dengan benar; Preview menampilkan logo besar + field yang benar-benar terisi saja. Pause-on-touch dikonfirmasi lewat pemeriksaan `animation-play-state` sebelum/selama/sesudah event sentuh. Di mobile (375px): tidak ada overflow horizontal, ±1.8–2 kartu terlihat sekaligus sesuai rekomendasi brief. State nol-partner dikonfirmasi: section beranda tidak dirender sama sekali (`return null`), Admin menampilkan pesan "No shipping partners have been added yet." — konsisten dengan seluruh section CMS lain di proyek ini. Seluruh data uji (3 shipping partner + logo dummy) dibersihkan kembali ke state kosong asli setelah verifikasi selesai. `git diff` kosong pada Header, Hero Slider, Partner Logo Marquee, About Preview, Statistics, Why Choose Us, Products, Facilities, Global Export Reach, Contact, dan Footer.

**Catatan lingkungan (bukan bug aplikasi)**: saat verifikasi, logo SVG yang diunggah untuk pengujian gagal dimuat oleh `<img>` di dalam iframe pratinjau sandboxed sesi ini (`ERR_BLOCKED_BY_RESPONSE.NotSameOrigin`) — dikonfirmasi ini murni batasan lingkungan pratinjau, bukan bug kode: (1) `fetch()` terhadap URL SVG yang sama dari dalam halaman berhasil 200 OK; (2) mengganti logo uji ke format PNG (yang dioptimasi same-origin lewat proxy `/_next/image`) langsung berhasil dimuat dan dirender natural-color dengan benar. Next.js `<Image>` tidak mem-proxy SVG lewat optimizer secara default (`dangerouslyAllowSVG` tidak diaktifkan, sesuai rekomendasi keamanan Next.js sendiri), sehingga SVG selalu diminta langsung cross-origin ke `localhost:4000` — perilaku yang identik juga berlaku untuk section "Logo Mitra & Institusi" yang sudah ada sejak sebelumnya, bukan regresi baru dari fitur ini.

## Homepage Manager — Upgrade Menjadi CMS Draft/Publish (Post-Launch)

Permintaan lanjutan ketiga belas: perbaiki dan tingkatkan Admin → Homepage — yang sebelumnya satu halaman client component ±2.700 baris berisi 14 editor inline berturut-turut, setiap field auto-save langsung ke baris yang sama dengan yang dibaca beranda publik (save = publish seketika) — menjadi CMS profesional bergaya Section Navigator dengan pemisahan **Draft vs Published** yang sungguhan, honest save-state feedback di setiap field, dan `ConfirmDialog` konsisten di seluruh aksi destruktif. Brief eksplisit menyatakan pola ini "should become the standard for the rest of the Admin Panel" — tiga keputusan arsitektur besar dikonfirmasi langsung ke klien lewat pertanyaan terstruktur sebelum implementasi dimulai (lihat tiga poin pertama di bawah).

- **Draft/Publish memakai arsitektur whole-homepage snapshot** (bukan draft ganda per-model) — dikonfirmasi klien sebagai pilihan yang direkomendasikan, sekaligus fallback yang disarankan brief sendiri ("Otherwise: use a global Homepage publication snapshot"). Setiap tabel Homepage yang sudah ada (`HeroSlide`, `PartnerLogo`, `ShippingPartner`, dst.) **tidak diubah perilakunya sama sekali** — tetap jadi "draft" kerja admin persis seperti sebelumnya. Tabel baru `HomepagePublishedSnapshot` (append-only, `{id, data: Json, publishedAt}`) menyimpan salinan beku mentah (belum diterjemahkan) dari 9 section yang benar-benar dimiliki Homepage CMS setiap kali admin menekan **Publish Changes** — beranda publik sekarang **hanya** membaca dari snapshot terakhir lewat satu endpoint (`GET /homepage/published-snapshot`), bukan lagi 25 pemanggilan langsung ke tabel draft. Karena snapshot bersifat append-only dan tidak pernah dihapus, riwayat publish otomatis berfungsi sebagai rollback ("Restore" pada baris riwayat manapun cukup menerbitkan ulang payload lama sebagai snapshot terbaru — tidak pernah mengubah/menghapus riwayat).
- **9 section yang di-snapshot** (dimiliki penuh oleh Homepage CMS): Hero Slider, Partners Section + Partner Logos, About Preview + Highlights, Why Choose Us, Export Reach Section + Export Destinations, Shipping Section + Shipping Partners, Statistics, FAQ. **5 section yang sengaja TIDAK di-snapshot** (tetap selalu-live seperti sebelumnya, tidak berubah): Featured Products, Facilities, Gallery, Production Process, News/Articles — karena masing-masing dimiliki modul lain yang sudah punya siklus hidup sendiri (lihat poin retrofit di bawah); Elemen Dekoratif juga tidak masuk snapshot karena melapisi banyak section sekaligus lewat scoping `page`, bukan satu blok posisi tunggal. Contact CTA adalah konten statis, tidak punya tabel CMS sendiri.
- **Locale-agnostic**: snapshot menyimpan baris mentah apa adanya, lalu diproses ulang lewat fungsi mapper yang **sama persis, tidak diubah** (`toHeroSlide`, `toPartnerLogo`, dst.) saat dibaca — satu snapshot melayani seluruh 6 bahasa tanpa duplikasi logika i18n.
- **`HomepageSectionConfig`** — tabel ringan baru (`{key, order, visible, updatedAt}`, 14 key tetap sesuai urutan JSX asli `[locale]/page.tsx`) mengontrol urutan/visibilitas *blok* section di halaman, sebagai gerbang **tambahan** yang dilapiskan di atas logika masing-masing section yang sudah ada (mis. Export Reach tetap tidak tampil sendiri kalau nol tujuan aktif) — tidak pernah menggantikan logika lama. Reorder memakai tombol **Naik/Turun** (dikonfirmasi klien, bukan drag-and-drop) — konsisten dengan pola swap-order yang sudah dipakai di Hero Slide/Partner Logo/Export Destination/Shipping Partner.
- **Section Navigator overview** (`/admin/homepage`, dirombak total) — baris statistik (Total/Visible/Hidden section, Last Published), kotak pencarian, grid kartu section (nomor urut, nama, deskripsi, badge Visible/Hidden, Naik/Turun, link "Manage"), tombol **Preview Homepage** dan **Publish Changes** di header sticky. Tidak ada konten section yang di-fetch di halaman ini — hanya metadata ringan, memenuhi syarat "jangan muat semua editor sekaligus".
- **Route editor per-section baru** (`/admin/homepage/[section]`) — setiap section punya route sendiri, editor dimuat lazy lewat `next/dynamic` (kode section lain tidak ikut ter-load), dibungkus `SectionEditorShell` (breadcrumb, toggle Visible-on-Homepage, toolbar bawah sticky). 14 fungsi editor yang sebelumnya menyatu di satu file diekstrak jadi file terpisah di `admin/homepage/_editors/` — logika internal (panggilan `adminApi`, `ConfirmDialog`, `MediaUploadField`) tidak diubah, murni pemindahan terstruktur.
- **4 sisa native `confirm()` di dalam editor Homepage** (FAQ, elemen dekoratif, highlight, why-choose-us) diganti `ConfirmDialog` untuk konsistensi dengan 4 yang sudah lebih dulu memakainya di file yang sama.
- **Preview Homepage** (`/admin/preview/homepage`, route admin-only) sengaja **tidak** membaca dari snapshot — menjalankan ulang agregasi 25-panggilan versi lama langsung ke endpoint publik draft yang sudah ada, supaya Preview selalu menampilkan draft terkini apa adanya, sepenuhnya terpisah dari apa yang tayang di Production.
- **Primitif save-state baru yang dipakai ulang di mana-mana**: `useSaveState` (status `idle/saving/saved/error` murni dari respons server, tidak pernah optimis, guard anti-double-submit, auto-reset "Saved" setelah ±2.5 detik), `SaveStateIndicator` (pil "● Saved"/"◌ Saving..."/"⚠ Save Failed"), `useAutosaveField` (pengganti pola `defaultValue`+`onBlur` lama — field terkontrol, dan **saat save gagal field kembali ke nilai tersimpan terakhir, bukan diam-diam menampilkan nilai baru yang sebenarnya gagal tersimpan** — pemenuhan langsung aturan brief "failed requests must not look like success"), `useUnsavedChangesWarning` (peringatan `beforeunload` saat ada perubahan belum tersimpan di editor section).
- **Bug nyata ditemukan & diperbaiki selama verifikasi langsung di browser** (bukan lewat `tsc`/lint — murni bug logika runtime): draf awal `useAutosaveField` memakai satu state yang sama untuk "nilai terakhir tersimpan" dan "pelacak perubahan prop eksternal" — akibatnya, update state dari save yang **berhasil** salah dikira perubahan eksternal satu render kemudian, dan nilai yang baru saja tersimpan sukses malah ditimpa balik ke nilai lama. Diperbaiki dengan memisahkan jadi tiga state (`value`/`committed`/`lastProp`) mengikuti pola resmi React "adjusting state when a prop changes".
- **Retrofit 5 modul lain (Produk, Artikel, Fasilitas, Galeri, Kontak) — lapisan UI/UX saja**, dikonfirmasi klien lewat pertanyaan lanjutan setelah pilihan awal "retrofit semua modul sekarang": **bukan** arsitektur Draft/Publish baru untuk modul-modul ini — field `status` draft/published yang sudah ada tetap berfungsi sama seperti sebelumnya (simpan = langsung tayang, tidak berubah). Yang diganti hanya: native `confirm()` → `ConfirmDialog` di semua aksi hapus (termasuk 3 titik hapus di dalam Produk detail — galeri, spesifikasi, unduhan — yang sebelumnya **tidak punya konfirmasi sama sekali**), dan `useSaveState`/`SaveStateIndicator` menggantikan pesan teks polos yang tidak pernah hilang otomatis. Fasilitas juga mendapat tombol hapus gambar galeri yang sebelumnya tersembunyi (endpoint backend `DELETE /admin/facilities/:id/gallery/:galleryId` sudah ada tapi tidak pernah dipakai UI) — memerlukan perbaikan kecil di shared-types (`Facility.gallery` sebelumnya membuang id baris relasi yang dibutuhkan endpoint hapus). `proses-produksi` **sengaja tidak disentuh** — tidak termasuk daftar modul yang disetujui klien, celah `confirm()` yang identik di sana dibiarkan sebagai follow-up terpisah, bukan diperluas diam-diam.
- **~30 endpoint mutasi Homepage draft** (Hero Slide, Partner Logo, Export Destination, Shipping Partner, dst.) yang sebelumnya masing-masing memanggil `revalidate(['/'])` langsung — dilucuti, karena tabel draft ini sekarang tidak lagi memberi makan beranda publik secara langsung. Ini perbaikan konkret untuk permintaan brief "I don't want automatic live updates" — hanya `publish()` dan `restoreSnapshot()` yang memicu revalidasi.

**Diverifikasi**: `tsc --noEmit`, lint, dan **build produksi penuh** (109 halaman) bersih di kedua workspace. Snapshot pertama diterbitkan lewat `curl` sebelum cutover beranda publik, dikonfirmasi identik dengan data live sebelum switch. Diuji langsung di browser: edit section → beranda publik tidak berubah sebelum Publish; Publish Changes → beranda publik berubah sesuai snapshot baru; Section Navigator menampilkan 14 Sections/14 Visible/0 Hidden dan timestamp Last Published yang benar; riwayat publish (6 snapshot) tampil dengan tombol Restore. Pemeriksaan integritas data pasca-migrasi mengonfirmasi seluruh data produksi asli utuh: baris `ExportDestination` Thailand yang diinput sendiri oleh klien, 8 Partner Logo, 1 Shipping Partner — semuanya selamat tanpa perubahan lewat migrasi skema dan ekstraksi 14 file editor. Satu artefak data uji ditemukan saat pemeriksaan akhir (4 slide Hero Slider hasil klik "Duplicate" berulang selama pengujian fitur, bersuffix " — Copy", ikut tayang di beranda publik) — dibersihkan lewat API admin, snapshot diterbitkan ulang, beranda publik dikonfirmasi kembali menampilkan 1 slide asli tanpa suffix uji. Tidak ada error console di overview, editor section, maupun beranda publik. **Sengaja tidak diimplementasikan** (dipangkas dari brief, didokumentasikan seperti setiap keputusan pemangkasan scope sebelumnya): drag-and-drop reorder (Naik/Turun dipilih klien sebagai gantinya), publish independen per-section (publish tetap satu tombol untuk seluruh homepage, sesuai arsitektur snapshot yang disepakati), Draft/Publish penuh untuk Produk/Artikel/Fasilitas/Galeri/Kontak (dikonfirmasi klien sebagai "UI/UX layer only"), dan retrofit `proses-produksi` (di luar daftar modul yang disetujui).

## Status Pembangunan

Proyek dikerjakan bertahap mengikuti fase di bawah ini (lihat riwayat commit untuk detail per fase):

- [x] Phase 0 — Setup & Scaffolding
- [x] Phase 1 — Database (Prisma schema sesuai `docs/04-database.md`)
- [x] Phase 2 — Backend API (`docs/05-api.md`)
- [x] Phase 3 — Design System (`docs/03-design.md`)
- [x] Phase 4 — Halaman Publik
- [x] Phase 5 — Admin CMS Panel
- [x] Phase 6 — SEO Technical
- [x] Phase 7 — Performance Optimization
- [x] Phase 8 — QA & Verifikasi
- [x] Post-Launch — Internasionalisasi (6 bahasa) & Revisi Header
- [x] Post-Launch — Navigasi In-Page Halaman About Company
- [x] Post-Launch — Katalog Produk Premium (Listing + Detail 10 Bagian)
- [x] Post-Launch — Halaman Facilities Satu-Halaman (6 Bagian) + Menu Nav Baru
- [x] Post-Launch — Dropdown Facilities di Header + Redesain Drawer Mobile
- [x] Post-Launch — Language Switcher Pill + Hapus "Request Quotation" dari Header
- [x] Post-Launch — Footer Premium 5-Kolom (Company/Products/Quick Link/Contact)
- [x] Post-Launch — Halaman Contact Premium (Hero, Info, Peta, Form, Quick Contact)
- [x] Post-Launch — Homepage: Hero Slider CMS + Partner Logos CMS + Elemen Dekoratif CMS
- [x] Post-Launch — Homepage: Section "About Company Preview" (Teks + Video + 4 Highlight)
- [x] Post-Launch — Peningkatan Section "Trusted Institutions & Partners"
- [x] Post-Launch — Homepage: Section "Why Choose Us?" (8 Kartu Ikon + Judul, Klik-Pulse)
- [x] Post-Launch — Homepage: Hero Slider Upgrade (CRUD, Duplicate, Preview, Toast)
- [x] Post-Launch — Homepage: Section "Global Export Reach" (Peta Interaktif + Admin CRUD)
- [x] Post-Launch — Homepage: Section "Global Shipping Partner" (Carousel Logo + Admin CRUD)
- [x] Post-Launch — Homepage Manager: CMS Draft/Publish + Section Navigator + Retrofit UI/UX 5 Modul

## Batasan Scope (Wajib Dipatuhi)

Fitur berikut **dilarang** diimplementasikan (lihat `docs/01-prd.md` §6.2): ERP, dashboard operasional/inventory, buyer/supplier portal, fitur AI/chatbot, CocoTrace/traceability, shipment tracking, marketplace/checkout, CRM.
