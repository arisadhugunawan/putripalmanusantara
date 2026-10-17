# Deployment — PPN Website

Panduan deploy website publik + admin PPN ke production.

| Bagian | Hosting | Konfigurasi di repo |
|---|---|---|
| Website & admin (`apps/web`, Next.js) | Vercel | Pengaturan di dashboard Vercel (lihat §5) |
| API (`apps/api`, NestJS) | Render | `render.yaml` (Blueprint) |
| Database PostgreSQL | Neon (atau Postgres lain) | Migrasi Prisma di `apps/api/prisma/migrations` |
| Gambar & file upload | Cloudflare R2 (S3-compatible) | `MEDIA_STORAGE_DRIVER=s3` |

> Render dan Vercel men-deploy dari branch default repo (`main`). Merge `feat/business-platform`
> ke `main` dulu, atau pilih branch lain di dashboard masing-masing.

---

## 1. Urutan deploy

Database → Media (R2) → API (Render) → Website (Vercel) → Domain.

Urutan ini penting karena **build website memanggil API** (halaman statis diisi data saat build). Jika API belum bisa diakses, build Vercel gagal dengan `fetch failed`.

---

## 2. Database (Neon)

1. Buat project Neon (region Singapore), lalu salin connection string (`postgresql://…?sslmode=require`).
2. Pilih salah satu cara mengisi data:

   **A. Pindahkan data lokal (disarankan, konten tetap sama).** Dari backup terbaru:

   ```bash
   pg_restore --no-owner --no-privileges --dbname="<NEON_URL>" ppn_dev.dump
   ```

   Riwayat migrasi (`_prisma_migrations`) ikut terbawa, sehingga `migrate deploy` di Render tidak menjalankan apa-apa.

   **B. Database kosong.** Render menjalankan `prisma migrate deploy` saat start. Setelah itu, buat akun admin pertama dari laptop:

   ```bash
   cd apps/api && DATABASE_URL="<NEON_URL>" ADMIN_SEED_NAME="Admin" ADMIN_SEED_EMAIL="<email>" ADMIN_SEED_PASSWORD="<password-kuat>" npm run prisma:seed
   ```

---

## 3. Media (Cloudflare R2)

1. Buat bucket (mis. `ppn-media`) dan aktifkan public access. Catat URL publiknya (`https://pub-xxxx.r2.dev`).
2. Buat API token R2 (*Object Read & Write*). Catat Access Key ID, Secret, dan endpoint (`https://<account-id>.r2.cloudflarestorage.com`).
3. **Jika memakai cara 2A** (data lokal), pindahkan file dan perbarui URL di database:

   a. Upload semua file `apps/api/uploads/*` ke **root bucket** dengan nama file yang sama. Driver S3 memakai skema nama yang sama dengan driver lokal (`<uuid>.<ext>`). Contoh dengan AWS CLI:

   ```bash
   aws s3 cp apps/api/uploads/ s3://ppn-media/ --recursive --endpoint-url https://<account-id>.r2.cloudflarestorage.com
   ```

   b. Database lokal menyimpan URL absolut `http://localhost:4000/uploads/<file>` di `media.file_url`, `product_downloads.file_url`, dan JSON snapshot publish. Ganti prefix-nya di database **Neon** (bukan lokal):

   ```sql
   BEGIN;
   UPDATE media                   SET file_url = replace(file_url, 'http://localhost:4000/uploads/', 'https://pub-xxxx.r2.dev/');
   UPDATE product_downloads       SET file_url = replace(file_url, 'http://localhost:4000/uploads/', 'https://pub-xxxx.r2.dev/');
   UPDATE homepage_published_snapshot      SET data = replace(data::text, 'http://localhost:4000/uploads/', 'https://pub-xxxx.r2.dev/')::jsonb;
   UPDATE about_company_published_snapshot SET data = replace(data::text, 'http://localhost:4000/uploads/', 'https://pub-xxxx.r2.dev/')::jsonb;
   UPDATE product_published_snapshots      SET data = replace(data::text, 'http://localhost:4000/uploads/', 'https://pub-xxxx.r2.dev/')::jsonb;
   UPDATE article_published_snapshots      SET data = replace(data::text, 'http://localhost:4000/uploads/', 'https://pub-xxxx.r2.dev/')::jsonb;
   UPDATE contact_page_published_snapshot  SET data = replace(data::text, 'http://localhost:4000/uploads/', 'https://pub-xxxx.r2.dev/')::jsonb;
   COMMIT;
   ```

   c. Cek hasilnya. Query berikut harus mengembalikan 0 untuk setiap tabel di atas:

   ```sql
   SELECT count(*) FROM media WHERE file_url LIKE '%localhost:4000%';
   ```

4. Jika R2 memakai custom domain (bukan `*.r2.dev`), tambahkan hostname-nya ke `images.remotePatterns` di `apps/web/next.config.ts`.

---

## 4. API (Render)

1. Render → **New → Blueprint**, lalu pilih repo ini. Render membaca `render.yaml`.
2. Isi variabel bertanda `sync: false`:

   | Variabel | Nilai |
   |---|---|
   | `DATABASE_URL` | Connection string Neon |
   | `CORS_ORIGIN` | URL website, mis. `https://www.domainanda.com` (boleh lebih dari satu, dipisah koma) |
   | `WEB_APP_URL` | URL website (untuk revalidasi ISR) |
   | `REVALIDATE_SECRET` | String acak panjang, **sama persis** dengan di Vercel |
   | `S3_ENDPOINT`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_PUBLIC_URL` | Dari langkah 3 |
   | `RESEND_API_KEY`, `EMAIL_FROM`, `ADMIN_NOTIFICATION_EMAIL` | Notifikasi email form quotation |
   | `AI_PROVIDER`, `AI_MODEL`, dan `GROQ_API_KEY` atau `ANTHROPIC_API_KEY` | AI Assistant (`groq` atau `anthropic`) |
   | `INSTAGRAM_GRAPH_ACCESS_TOKEN` | Opsional (impor artikel dari Instagram) |

   `JWT_SECRET` dibuat otomatis oleh Render. Untuk membuat nilai acak sendiri:

   ```bash
   openssl rand -base64 48
   ```

3. Deploy. Yang terjadi:
   - Build: `npm ci --include=dev && npm run build --workspace=api`
   - Start: `npm run start:api:prod` → `prisma migrate deploy`, lalu `node dist/src/main`
   - Render memantau health check di `/health`
4. Catat URL API, mis. `https://ppn-api.onrender.com`.

Catatan:

- **Jangan** set `ADMIN_AUTH_DISABLED=true`. Dengan `NODE_ENV=production`, API sengaja menolak start jika nilai itu aktif.
- `TRUST_PROXY=1` sudah diset di `render.yaml`, agar rate limit login/form dihitung per pengunjung, bukan per proxy Render.
- Paket gratis Render "tidur" setelah idle. Untuk website perusahaan, gunakan paket berbayar (`plan: starter`).

---

## 5. Website (Vercel)

1. Vercel → **Add New → Project**, lalu impor repo ini.
2. Pengaturan proyek:

   | Pengaturan | Nilai |
   |---|---|
   | Root Directory | `apps/web` |
   | Framework | Next.js |
   | Install Command | `cd ../.. && npm ci` (instal workspace dari root; postinstall membangun `@ppn/shared-types`) |
   | Build Command | `next build` (default) |

3. Environment variables:

   | Variabel | Nilai |
   |---|---|
   | `NEXT_PUBLIC_API_URL` | `https://<api-domain>/api/v1` |
   | `NEXT_PUBLIC_SITE_URL` | URL website (canonical, sitemap, robots, OpenGraph) |
   | `REVALIDATE_SECRET` | Sama persis dengan di Render |
   | `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Opsional |

4. Deploy. API harus sudah hidup (langkah 4).

---

## 6. Domain (wajib untuk login admin)

Cookie login admin memakai `SameSite=Lax`. Jika website di `*.vercel.app` dan API di `*.onrender.com`, browser menganggap keduanya situs berbeda, sehingga **login admin tidak akan berfungsi**.

Gunakan satu domain untuk keduanya:

- `www.domainanda.com` → Vercel (Settings → Domains)
- `api.domainanda.com` → Render (Settings → Custom Domains)

Setelah domain aktif, perbarui lalu redeploy keduanya:
- Render: `CORS_ORIGIN`, `WEB_APP_URL`
- Vercel: `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SITE_URL`

---

## 7. Checklist setelah deploy

- [ ] `https://api.domainanda.com/health` → `status: ok`, `database: connected`
- [ ] Homepage, produk, detail produk, artikel, galeri, kontak tampil (cek beberapa bahasa)
- [ ] Gambar tampil dan dilayani lewat `/_next/image`
- [ ] `/sitemap.xml` dan `/robots.txt` memakai domain production
- [ ] Login dan logout admin berhasil
- [ ] Upload gambar baru di admin, lalu file muncul di bucket R2 dan tampil di website
- [ ] Publish konten di admin, lalu perubahan tampil di website (revalidasi)
- [ ] Kirim form quotation, lalu data masuk di admin dan email notifikasi terkirim
- [ ] AI Assistant menjawab (jika API key diisi)

---

## 8. Menjalankan mode production secara lokal

```bash
npm run build --workspace=api
```

```bash
NODE_ENV=production ADMIN_AUTH_DISABLED=false npm run start:api:prod
```

`start:api:prod` menjalankan `prisma migrate deploy` terhadap `DATABASE_URL` yang aktif sebelum API start.
