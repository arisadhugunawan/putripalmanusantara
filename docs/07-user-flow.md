# 07 — User Flow Document

**Proyek:** Website Company Profile — CV Putri Palma Nusantara (PPN)
**Mengacu pada:** `01-prd.md`, `02-requirements.md`, `03-design.md`

---

## 1. Ringkasan Aktor

| Aktor | Deskripsi |
|---|---|
| Buyer/Visitor | Importir, distributor, wholesaler, food manufacturer, trading company yang mengunjungi situs publik |
| Admin | Pengelola konten internal PPN melalui CMS |

Tidak ada aktor lain (tidak ada Buyer Portal/login publik), sesuai `01-prd.md` Section 6.2.

---

## 2. Flow Utama — Buyer Journey (Discovery → Request Quotation)

```mermaid
flowchart TD
    A[Buyer menemukan situs via Google/referral] --> B[Landing di Homepage]
    B --> C{Tertarik?}
    C -->|Ya, ingin tahu profil| D[Scroll ke Tentang Kami / Mengapa Memilih PPN]
    C -->|Ya, ingin lihat produk| E[Klik Produk Unggulan / Menu Produk]
    C -->|Tidak yakin, butuh bukti kapabilitas| F[Lihat Proses Produksi / Fasilitas / Galeri]

    D --> G[Yakin dengan kredibilitas perusahaan]
    E --> H[Buka Halaman Detail Produk]
    F --> G

    H --> I[Baca Specification, Packaging, Application]
    I --> J{Butuh info lebih lanjut?}
    J -->|Unduh brosur| K[Download PDF Spesifikasi]
    J -->|Langsung tanya harga| L[Klik Request Quotation]
    K --> L

    G --> L
    L --> M[Isi Form Quotation - Nama, Perusahaan, Negara, Email, Produk, Pesan]
    M --> N{Validasi Form}
    N -->|Gagal| O[Tampilkan pesan error, buyer perbaiki isian]
    O --> M
    N -->|Berhasil| P[Submission tersimpan + Notifikasi email ke Admin]
    P --> Q[Buyer melihat halaman/pesan konfirmasi]
    Q --> R[Admin menindaklanjuti via Email/WhatsApp di luar sistem]
```

### 2.1 Catatan Alur

- Tindak lanjut quotation (negosiasi, penawaran harga, kontrak) **terjadi di luar sistem** (email/WhatsApp manual oleh tim sales PPN) — sesuai batasan bahwa website bukan CRM/ERP.
- Buyer dapat masuk ke flow "Request Quotation" dari berbagai titik masuk (Hero, Section Homepage, Halaman Produk, Footer, Halaman Hubungi Kami) — lihat `02-requirements.md` FR-QUOTE-01.

---

## 3. Flow Detail — Navigasi Antar Halaman Publik

```mermaid
flowchart LR
    Home -->|klik menu| About[Tentang Kami]
    Home -->|klik menu| Products[Produk]
    Home -->|klik menu| Process[Proses Produksi]
    Home -->|klik menu| Facilities[Fasilitas]
    Home -->|klik menu| Gallery[Galeri]
    Home -->|klik menu| Contact[Hubungi Kami]
    Home -->|klik card artikel| ArticleDetail[Detail Artikel]

    Products -->|klik card produk| ProductDetail[Detail Produk]
    ProductDetail -->|CTA| Quotation[Form Request Quotation]
    Home -->|section Request Quotation| Quotation
    Contact -->|form kontak| ContactSubmit[Submit Pesan]
    Footer -->|tombol quotation| Quotation
```

---

## 4. Flow — Halaman Detail Produk (Fokus Konversi)

```mermaid
flowchart TD
    A[Buka Halaman Detail Produk] --> B[Lihat Gallery Produk]
    B --> C[Baca Specification]
    C --> D[Baca Packaging]
    D --> E[Baca Application]
    E --> F{Aksi Buyer}
    F -->|Unduh Spec Sheet| G[Download PDF]
    F -->|Langsung Request Quotation| H[Form Quotation ter-prefill nama produk]
    G --> F
    H --> I[Submit → Konfirmasi]
```

---

## 5. Flow — Insight & Artikel

```mermaid
flowchart TD
    A[Homepage - Section Insight & Artikel] --> B[Lihat 3 artikel terbaru]
    B --> C[Klik salah satu artikel]
    C --> D[Halaman Detail Artikel]
    D --> E{Aksi lanjutan}
    E -->|Tertarik dengan produk terkait| F[Klik internal link ke Produk]
    E -->|Selesai membaca| G[Kembali ke Homepage/menutup tab]
    F --> H[Halaman Detail Produk]
```

> Artikel bukan menu navigasi utama — akses hanya melalui Homepage atau internal link, sesuai `FR-ART-04`.

---

## 6. Flow — Form Hubungi Kami (Contact, Non-Quotation)

```mermaid
flowchart TD
    A[Buyer buka Halaman Hubungi Kami] --> B[Isi Form: Nama, Perusahaan, Email, Negara, Pesan]
    B --> C{Validasi}
    C -->|Gagal| D[Tampilkan error field terkait]
    D --> B
    C -->|Berhasil + lolos anti-spam| E[Simpan submission + Notifikasi email Admin]
    E --> F[Tampilkan konfirmasi ke Buyer]
```

---

## 7. Flow — Admin CMS Journey

```mermaid
flowchart TD
    A[Admin buka /admin] --> B[Halaman Login]
    B --> C{Kredensial Valid?}
    C -->|Tidak| D[Tampilkan error login]
    D --> B
    C -->|Ya| E[Dashboard Admin]

    E --> F[Kelola Produk]
    E --> G[Kelola Artikel]
    E --> H[Kelola Galeri]
    E --> I[Kelola Homepage - Statistik/FAQ/Featured Product]
    E --> J[Kelola Kontak/Quotation]
    E --> K[Kelola Download PDF]
    E --> L[Kelola Pengaturan]

    J --> J1[Lihat daftar submission baru]
    J1 --> J2[Tandai status: new/in_progress/done]

    F --> F1[Tambah/Edit/Hapus Produk]
    F1 --> F2[Isi Gallery, Specification, Packaging, Application, PDF]
    F2 --> F3[Publish produk]
    F3 --> M[Perubahan tampil di situs publik - via ISR/on-demand revalidation]
```

### 7.1 Catatan Alur Admin

- Setelah admin melakukan publish/update konten (produk, artikel, statistik, FAQ), sistem memicu revalidation agar perubahan tampil di situs publik tanpa deployment ulang (lihat `06-architecture.md` Section 4–5).
- Tidak ada flow registrasi admin baru secara mandiri melalui UI publik (penambahan admin dilakukan manual/terbatas) — mencegah celah keamanan.

---

## 8. Flow — Mobile Considerations

```mermaid
flowchart TD
    A[Buyer buka situs di mobile] --> B[Hero video - fallback poster image jika koneksi lambat]
    B --> C[Scroll vertikal melalui seluruh section Homepage]
    C --> D[Tap hamburger menu untuk navigasi]
    D --> E[Fullscreen drawer menu terbuka]
    E --> F[Pilih halaman tujuan]
    F --> G[Form Request Quotation - Layout satu kolom, tombol submit full-width]
```

- Statistik counter, timeline proses produksi, dan galeri menyesuaikan menjadi layout vertikal/single-column di mobile (lihat `03-design.md` Section 9).
- Tap target minimal 44x44px untuk seluruh elemen interaktif (`03-design.md` Section 8).

---

## 9. Edge Cases & Skenario Alternatif

| Skenario | Penanganan |
|---|---|
| Buyer submit form quotation tanpa mengisi field wajib | Validasi client-side + server-side menampilkan pesan error spesifik per field |
| Buyer submit form berkali-kali dalam waktu singkat (indikasi spam/bot) | Rate limiting menolak request berlebih (`05-api.md` Section 8), pesan generik ditampilkan |
| Koneksi internet buyer lambat (negara dengan infrastruktur terbatas) | Hero video memiliki fallback poster image; gambar lazy-load; halaman tetap SSR/SSG cepat |
| Artikel/produk belum memiliki gambar dari CMS | Sistem menampilkan gambar placeholder default (bukan broken image) |
| Admin lupa password | Mekanisme reset password terbatas (mis. melalui email terverifikasi) — detail implementasi di tahap development |
| Buyer mengakses halaman produk yang sudah dihapus/unpublish | Redirect ke halaman 404 kustom yang tetap on-brand, dengan CTA kembali ke Produk/Home |

---

## 10. Ringkasan Titik Konversi (Conversion Touchpoints)

| Halaman | Titik Konversi (CTA Request Quotation) |
|---|---|
| Home | Hero, Section Request Quotation, Footer |
| Detail Produk | Setelah Application, sebelum penutup halaman |
| Hubungi Kami | Form kontak (alternatif jalur konversi) |
| Footer | Selalu tersedia di seluruh halaman (global) |

---

## 11. Catatan

Seluruh alur pada dokumen ini konsisten dengan struktur halaman (`02-requirements.md`), sistem desain (`03-design.md`), struktur data (`04-database.md`), dan kontrak API (`05-api.md`). Tidak ada alur yang melibatkan fitur di luar scope (login buyer, tracking, pembayaran, dsb.).
