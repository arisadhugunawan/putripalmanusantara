# 05 — API Documentation

**Proyek:** Website Company Profile — CV Putri Palma Nusantara (PPN)
**Mengacu pada:** `02-requirements.md`, `04-database.md`
**Catatan:** Dokumen ini adalah **kontrak API (API contract)** — mendeskripsikan endpoint, method, request, dan response secara konseptual. Tidak berisi kode implementasi (tidak ada kode Node.js/Express/NestJS aktual). Detail teknologi backend ada di `06-architecture.md`.

---

## 1. Prinsip Desain API

- Gaya arsitektur: **REST**, format data: **JSON**.
- Base path publik: `/api/v1/...` — endpoint publik dapat diakses tanpa autentikasi (read-only untuk konten, submit untuk form).
- Base path admin: `/api/v1/admin/...` — seluruh endpoint di bawah path ini **wajib** autentikasi Admin.
- Response konsisten menggunakan struktur amplop (envelope):

```json
{
  "success": true,
  "data": {},
  "meta": {},
  "error": null
}
```

- Format error konsisten:

```json
{
  "success": false,
  "data": null,
  "meta": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Deskripsi error yang jelas",
    "details": {}
  }
}
```

---

## 2. Autentikasi

| Aspek | Ketentuan |
|---|---|
| Metode | Token-based (mis. JWT) dikirim melalui HTTP-only cookie atau header `Authorization: Bearer <token>` |
| Endpoint publik | Tidak memerlukan token |
| Endpoint admin | Wajib token valid; token invalid/expired → HTTP 401 |
| Role | Hanya 1 jenis akun sistem: `Admin` (tidak ada role buyer publik, sesuai `01-prd.md`) |

---

## 3. Daftar Endpoint Publik (Read-Only & Form Submission)

### 3.1 Produk

| Method | Endpoint | Deskripsi | Response Utama |
|---|---|---|---|
| GET | `/api/v1/products` | Daftar seluruh produk published | Array of Product (id, slug, name, category, short_description, cover_image, is_featured) |
| GET | `/api/v1/products/featured` | Daftar produk unggulan (Homepage) | Array of Product (subset featured) |
| GET | `/api/v1/products/{slug}` | Detail 1 produk | Product lengkap + gallery, specification[], packaging[], application[], downloads[] |

### 3.2 Artikel

| Method | Endpoint | Deskripsi | Response Utama |
|---|---|---|---|
| GET | `/api/v1/articles` | Daftar artikel published (dengan pagination) | Array of Article (ringkas) + meta pagination |
| GET | `/api/v1/articles/latest` | 3 artikel terbaru (untuk Homepage) | Array of Article (ringkas, max 3) |
| GET | `/api/v1/articles/{slug}` | Detail 1 artikel | Article lengkap (content, meta SEO) |

### 3.3 Galeri

| Method | Endpoint | Deskripsi | Response Utama |
|---|---|---|---|
| GET | `/api/v1/gallery` | Daftar item galeri, mendukung query `?category=` | Array of GalleryItem |

### 3.4 Fasilitas

| Method | Endpoint | Deskripsi | Response Utama |
|---|---|---|---|
| GET | `/api/v1/facilities` | Daftar fasilitas | Array of Facility |

### 3.5 Proses Produksi

| Method | Endpoint | Deskripsi | Response Utama |
|---|---|---|---|
| GET | `/api/v1/production-steps` | Daftar tahap produksi berurutan | Array of ProductionStep (urut berdasarkan `order`) |

### 3.6 Statistik Homepage

| Method | Endpoint | Deskripsi | Response Utama |
|---|---|---|---|
| GET | `/api/v1/homepage/statistics` | Daftar statistik perusahaan | Array of HomepageStatistic |

### 3.7 FAQ

| Method | Endpoint | Deskripsi | Response Utama |
|---|---|---|---|
| GET | `/api/v1/faqs` | Daftar FAQ published | Array of FAQ |

### 3.8 Pengaturan Situs (Publik)

| Method | Endpoint | Deskripsi | Response Utama |
|---|---|---|---|
| GET | `/api/v1/settings/public` | Pengaturan yang boleh diakses publik (kontak, WhatsApp, SEO default) | Object key-value (subset dari SiteSetting) |

### 3.9 Form Submission

| Method | Endpoint | Deskripsi | Request Body |
|---|---|---|---|
| POST | `/api/v1/quotation-requests` | Kirim permintaan penawaran | `{ name, company, country, email, phone?, product_id?, estimated_quantity?, message, source_page }` |
| POST | `/api/v1/contact` | Kirim pesan kontak umum | `{ name, company, country, email, message }` |

**Validasi Server-Side (wajib, sesuai `NFR-SEC-03`):**

| Field | Aturan |
|---|---|
| name | required, string, max 100 |
| company | required, string, max 150 |
| country | required, string |
| email | required, format email valid |
| message | required, string, max 2000 |
| anti-spam token | required (lihat Section 6) |

**Response Sukses (contoh struktur, bukan kode):**

```json
{
  "success": true,
  "data": { "id": "qr_12345", "status": "new" },
  "meta": null,
  "error": null
}
```

### 3.10 SEO Utility

| Method | Endpoint | Deskripsi |
|---|---|---|
| GET | `/sitemap.xml` | Dynamic sitemap (produk, artikel, halaman statis) |
| GET | `/robots.txt` | Robot directives |

---

## 4. Daftar Endpoint Admin (Memerlukan Autentikasi)

### 4.1 Autentikasi Admin

| Method | Endpoint | Deskripsi |
|---|---|---|
| POST | `/api/v1/admin/auth/login` | Login admin (email + password) |
| POST | `/api/v1/admin/auth/logout` | Logout / invalidate token |
| GET | `/api/v1/admin/auth/me` | Info admin yang sedang login |

### 4.2 Manajemen Produk

| Method | Endpoint | Deskripsi |
|---|---|---|
| GET | `/api/v1/admin/products` | Daftar seluruh produk (termasuk draft) |
| POST | `/api/v1/admin/products` | Tambah produk baru |
| PUT | `/api/v1/admin/products/{id}` | Update produk |
| DELETE | `/api/v1/admin/products/{id}` | Hapus produk |
| POST | `/api/v1/admin/products/{id}/gallery` | Tambah gambar galeri produk |
| PUT/DELETE | `/api/v1/admin/products/{id}/gallery/{galleryId}` | Update/hapus item galeri |
| POST/PUT/DELETE | `/api/v1/admin/products/{id}/specifications/...` | Kelola spesifikasi produk |
| POST/PUT/DELETE | `/api/v1/admin/products/{id}/downloads/...` | Kelola file PDF unduhan |

### 4.3 Manajemen Artikel

| Method | Endpoint | Deskripsi |
|---|---|---|
| GET | `/api/v1/admin/articles` | Daftar seluruh artikel |
| POST | `/api/v1/admin/articles` | Tambah artikel |
| PUT | `/api/v1/admin/articles/{id}` | Update artikel |
| DELETE | `/api/v1/admin/articles/{id}` | Hapus artikel |

### 4.4 Manajemen Galeri

| Method | Endpoint | Deskripsi |
|---|---|---|
| GET | `/api/v1/admin/gallery` | Daftar seluruh item galeri |
| POST | `/api/v1/admin/gallery` | Upload media baru ke galeri |
| PUT | `/api/v1/admin/gallery/{id}` | Update kategori/caption |
| DELETE | `/api/v1/admin/gallery/{id}` | Hapus item galeri |

### 4.5 Manajemen Homepage

| Method | Endpoint | Deskripsi |
|---|---|---|
| GET/PUT | `/api/v1/admin/homepage/statistics` | Kelola statistik perusahaan |
| GET/POST/PUT/DELETE | `/api/v1/admin/faqs` | Kelola FAQ |
| PUT | `/api/v1/admin/products/{id}/featured` | Set/unset status unggulan |

### 4.6 Manajemen Fasilitas & Proses Produksi

| Method | Endpoint | Deskripsi |
|---|---|---|
| GET/POST/PUT/DELETE | `/api/v1/admin/facilities` | Kelola fasilitas |
| GET/POST/PUT/DELETE | `/api/v1/admin/production-steps` | Kelola tahap proses produksi |

### 4.7 Manajemen Kontak/Quotation

| Method | Endpoint | Deskripsi |
|---|---|---|
| GET | `/api/v1/admin/quotation-requests` | Daftar submission (dengan filter status) |
| GET | `/api/v1/admin/quotation-requests/{id}` | Detail submission |
| PUT | `/api/v1/admin/quotation-requests/{id}/status` | Ubah status (`new`/`in_progress`/`done`) |

### 4.8 Manajemen Media

| Method | Endpoint | Deskripsi |
|---|---|---|
| POST | `/api/v1/admin/media` | Upload file (gambar/video/PDF) |
| DELETE | `/api/v1/admin/media/{id}` | Hapus file |

### 4.9 Pengaturan

| Method | Endpoint | Deskripsi |
|---|---|---|
| GET | `/api/v1/admin/settings` | Ambil seluruh pengaturan |
| PUT | `/api/v1/admin/settings` | Update pengaturan (kontak, WhatsApp, SEO default) |

---

## 5. Pagination

Endpoint list (mis. `/articles`, `/admin/quotation-requests`) menggunakan query parameter standar:

| Parameter | Tipe | Default | Keterangan |
|---|---|---|---|
| `page` | Integer | 1 | Halaman ke- |
| `limit` | Integer | 10 | Jumlah item per halaman |
| `sort` | String | `-created_at` | Format `field` (asc) atau `-field` (desc) |

Response `meta` untuk endpoint berpaginasi:

```json
"meta": {
  "page": 1,
  "limit": 10,
  "total": 42,
  "total_pages": 5
}
```

---

## 6. Anti-Spam pada Form Publik

Sesuai `FR-QUOTE-03`, endpoint `POST /quotation-requests` dan `POST /contact` wajib menyertakan salah satu mekanisme berikut (ditentukan lebih lanjut di `06-architecture.md`):

- Token CAPTCHA pihak ketiga yang divalidasi di server, **atau**
- Honeypot field tersembunyi + rate limiting berbasis IP

Request tanpa token/validasi anti-spam valid akan ditolak dengan HTTP 400 dan `error.code: "SPAM_VALIDATION_FAILED"`.

---

## 7. Kode Status HTTP Standar

| Kode | Arti | Kapan Digunakan |
|---|---|---|
| 200 | OK | Request GET/PUT berhasil |
| 201 | Created | Resource baru berhasil dibuat (POST) |
| 400 | Bad Request | Validasi input gagal |
| 401 | Unauthorized | Token admin tidak ada/invalid |
| 403 | Forbidden | Admin tidak memiliki hak akses (jika multi-role diterapkan) |
| 404 | Not Found | Resource tidak ditemukan (mis. slug produk salah) |
| 429 | Too Many Requests | Rate limit terlampaui (proteksi spam) |
| 500 | Internal Server Error | Kegagalan sistem |

---

## 8. Rate Limiting

| Endpoint | Batas |
|---|---|
| `POST /quotation-requests`, `POST /contact` | Mis. 5 request / menit / IP |
| `POST /admin/auth/login` | Mis. 5 percobaan / 15 menit / IP (mencegah brute force) |

---

## 9. Catatan Konsistensi

- Seluruh endpoint publik hanya bersifat **read + form submission** — tidak ada endpoint yang memungkinkan modifikasi data oleh pengguna publik, konsisten dengan larangan Buyer Portal (`01-prd.md`).
- Struktur data setiap response mengacu langsung ke entitas pada `04-database.md`.
- Dokumen ini tidak memuat kode implementasi backend — implementasi aktual (routing, controller, middleware) menjadi tanggung jawab tim Backend Engineer mengacu pada `06-architecture.md`.
