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

## Batasan Scope (Wajib Dipatuhi)

Fitur berikut **dilarang** diimplementasikan (lihat `docs/01-prd.md` §6.2): ERP, dashboard operasional/inventory, buyer/supplier portal, fitur AI/chatbot, CocoTrace/traceability, shipment tracking, marketplace/checkout, CRM.
