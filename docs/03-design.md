# 03 — Design System Documentation

**Proyek:** Website Company Profile — CV Putri Palma Nusantara (PPN)
**Mengacu pada:** `01-prd.md`, `02-requirements.md`

---

## 1. Filosofi Desain

Website harus memberikan kesan: **Profesional, Modern, Minimalis, Natural, Premium, Internasional, Elegan, Responsif, dan Mudah Dipahami.**

Prinsip inti:

- Banyak white space — biarkan konten "bernapas"
- Grid modern & konsisten
- Card minimalis dengan rounded corner
- Animasi ringan (subtle), bukan animasi ramai/berlebihan
- Readability sebagai prioritas utama
- **Tidak boleh** terlihat seperti template WordPress generik (hindari shadow berlebihan, gradient murahan, ikon stok generik, layout kaku 3-kolom khas theme gratis)

### 1.1 Referensi Visual (Gaya, Bukan Konten)

Apple, Tesla, Maersk, Flexport, Bloomberg, Notion, Vercel — diadaptasi sebagai **prinsip** (ketenangan visual, tipografi tegas, penggunaan foto berkualitas tinggi, hierarki informasi jelas), **bukan ditiru** secara layout/warna/aset.

> **Referensi struktur konten:** djavacoal.com — hanya untuk pola navigasi & susunan informasi. Dilarang keras menyalin layout, copywriting, warna, gambar, atau desain visual apa pun dari situs tersebut.

---

## 2. Palet Warna

| Nama | Hex | Peran | Aturan Penggunaan |
|---|---|---|---|
| Primary (Green) | `#A4DC4A` | Aksen branding | **Gunakan terbatas** — CTA sekunder, ikon, garis aksen, highlight kecil. Jangan mendominasi layout |
| Secondary (Yellow) | `#FFD800` | Aksen pendukung | Digunakan sangat selektif untuk penekanan (badge, notifikasi kecil) |
| Accent (Brown/Coconut) | `#A0784F` | Identitas produk kelapa | Digunakan pada elemen terkait produk (ikon, garis pemisah, footer) untuk memperkuat identitas "coconut" secara elegan |
| Background | `#FFFFFF` | Warna dominan | Digunakan di ±80–90% area layout |
| Text | Dark Gray (`#1F2421` disarankan) | Teks utama | Kontras tinggi terhadap putih, memenuhi WCAG AA |

### 2.1 Aturan Komposisi Warna

- Website **harus didominasi warna putih**.
- Hijau **hanya sebagai branding** — contoh penggunaan yang tepat: logo, tombol CTA utama (dengan hover state), underline aktif pada navigasi, ikon check pada checklist.
- Hindari background section berwarna hijau penuh secara berulang — cukup 1–2 section dengan aksen warna (mis. section "Mengapa Memilih PPN") untuk variasi ritme visual.
- Gunakan tint/shade dari warna aksen (mis. `#A4DC4A` dengan opacity 8–12%) untuk background section yang lembut, bukan warna solid penuh.

### 2.2 Contoh Palet Turunan (Tint/Shade)

| Token | Nilai | Kegunaan |
|---|---|---|
| `--color-primary-50` | `#F3FAE9` | Background section lembut |
| `--color-primary-500` | `#A4DC4A` | Warna utama primary |
| `--color-primary-700` | `#6E9A2E` | Hover/active state |
| `--color-neutral-900` | `#1F2421` | Teks utama |
| `--color-neutral-600` | `#5B6660` | Teks sekunder |
| `--color-neutral-100` | `#F5F6F4` | Background alternatif (bukan putih murni) |

---

## 3. Tipografi

| Elemen | Rekomendasi Font | Karakter |
|---|---|---|
| Heading (H1–H3) | **General Sans** atau **Satoshi** (sans-serif modern, tegas) | Bold, tracking sedikit rapat, ukuran besar untuk H1 |
| Body Text | **Inter** atau **Manrope** | Regular/Medium, nyaman dibaca ukuran kecil-menengah |
| Angka/Statistik | Font heading dengan varian tabular numerals | Menonjolkan angka statistik perusahaan |

### 3.1 Skala Tipografi (Type Scale)

| Token | Ukuran (Desktop) | Ukuran (Mobile) | Penggunaan |
|---|---|---|---|
| `--text-h1` | 56–64px | 32–36px | Hero headline |
| `--text-h2` | 40px | 28px | Judul section |
| `--text-h3` | 28px | 22px | Sub-judul/card title |
| `--text-body-lg` | 18px | 16px | Paragraf penting/intro |
| `--text-body` | 16px | 15px | Paragraf umum |
| `--text-small` | 14px | 13px | Caption, label, metadata |

### 3.2 Aturan Spacing Tipografi

- Line-height longgar: 1.4–1.6 untuk body, 1.1–1.2 untuk heading besar.
- Letter-spacing heading besar sedikit negatif (-0.01em hingga -0.02em) agar terasa premium.
- Maksimal lebar paragraf (measure): 65–75 karakter per baris untuk readability optimal.

---

## 4. Grid & Layout

| Breakpoint | Lebar | Kolom Grid | Container Max-Width |
|---|---|---|---|
| Mobile | < 640px | 4 kolom | 100% (padding 20px) |
| Tablet | 640–1024px | 8 kolom | 100% (padding 32px) |
| Desktop | 1024–1440px | 12 kolom | 1200px |
| Large Desktop | > 1440px | 12 kolom | 1320px |

- Gutter: 24px (desktop), 16px (mobile)
- Section vertical spacing: minimal 96–120px antar section besar di desktop, 56–72px di mobile — untuk memperkuat kesan white space premium.

---

## 5. Komponen (Component Library)

### 5.1 Button

| Varian | Style |
|---|---|
| Primary | Background primary green, teks putih/dark (kontras terjaga), rounded-full atau rounded-lg (12–24px), hover: sedikit gelapkan warna |
| Secondary | Outline dengan border neutral/brown accent, background transparan |
| Ghost/Text Link | Teks dengan underline animasi saat hover |

### 5.2 Card

- Rounded corner: 16–24px
- Shadow sangat halus (`0 4px 20px rgba(0,0,0,0.06)`), hindari shadow tebal ala template gratis
- Hover state: elevasi ringan (translateY -4px) + shadow sedikit membesar, transisi 200–300ms ease

### 5.3 Navigasi (Header)

- Sticky header dengan background solid/blur saat scroll
- Logo kiri, menu tengah/kanan, CTA "Request Quotation" menonjol di kanan
- Mobile: hamburger menu → fullscreen drawer minimalis

### 5.4 Statistik Counter

- Angka besar dengan animasi count-up ringan saat masuk viewport
- Ikon minimalis (line icon, bukan flat icon berwarna-warni)

### 5.5 Timeline Proses Produksi

- Desktop: horizontal stepper dengan garis penghubung
- Mobile: vertical stepper
- Setiap step: ikon/nomor, judul, deskripsi singkat

### 5.6 Accordion (FAQ)

- Border minimalis antar item, ikon plus/minus animasi rotate saat expand/collapse

### 5.7 Form (Request Quotation / Contact)

- Input field rounded (8–12px), border tipis neutral, focus state menggunakan warna primary
- Label di atas field (bukan placeholder-only, untuk aksesibilitas)
- Tombol submit full-width di mobile

### 5.8 Gallery / Lightbox

- Grid masonry atau grid rapi (2–4 kolom tergantung breakpoint)
- Lightbox fullscreen dengan navigasi next/prev dan tombol close jelas

---

## 6. Ikonografi & Imagery

- Ikon: line-style minimalis, stroke konsisten (mis. 1.5–2px), satu warna (neutral atau primary saat aktif) — hindari ikon flat design berwarna-warni ala clipart.
- Fotografi: kualitas tinggi, natural lighting, dokumentasi asli fasilitas/produk (bukan stok foto generik) untuk memperkuat kepercayaan buyer.
- Video Hero: rasio 16:9, kompresi H.264/H.265, disediakan poster image untuk fallback dan performa awal.

---

## 7. Motion & Animasi

| Elemen | Jenis Animasi | Durasi |
|---|---|---|
| Fade-in saat scroll (section masuk viewport) | Opacity + translateY ringan (8–16px) | 400–600ms ease-out |
| Hover Card/Button | Scale/translate halus | 150–250ms |
| Counter Statistik | Count-up angka | 1–1.5s saat masuk viewport |
| Navigasi Mobile Drawer | Slide-in | 250–300ms |

> **Aturan:** Animasi harus ringan dan fungsional (memberi konteks/hierarki), bukan dekoratif berlebihan. Hormati preferensi `prefers-reduced-motion` pengguna.

---

## 8. Aksesibilitas dalam Desain

- Kontras warna teks terhadap background minimal rasio 4.5:1 (WCAG AA)
- Ukuran target sentuh (tap target) minimal 44x44px di mobile
- Fokus state (focus ring) jelas terlihat untuk navigasi keyboard
- Semua ikon fungsional disertai label aria/teks alternatif

---

## 9. Panduan Halaman (Ringkasan Wireframe Konsep)

### 9.1 Homepage — Urutan Section (Final, mengacu `02-requirements.md`)

1. Hero (video drone + headline + 2 CTA)
2. Statistik Perusahaan (counter grid)
3. Tentang Kami (ringkas + gambar + CTA "Selengkapnya")
4. Mengapa Memilih PPN (grid card value proposition)
5. Produk Unggulan (card grid produk)
6. Proses Produksi (timeline ringkas)
7. Fasilitas (grid galeri fasilitas)
8. Galeri (preview grid + CTA "Lihat Semua")
9. Insight & Artikel (3 card artikel terbaru)
10. FAQ (accordion)
11. Request Quotation (form)
12. Footer

### 9.2 Halaman Produk

- Header halaman (breadcrumb + judul)
- Grid card produk (gambar, nama, ringkasan singkat, tombol "Lihat Detail")

### 9.3 Halaman Detail Produk

- Gallery (carousel/grid)
- Deskripsi & Specification (tabel)
- Packaging
- Application
- Tombol Download PDF
- CTA Request Quotation (ter-prefill nama produk)

### 9.4 Halaman Proses Produksi

- Header halaman + intro singkat
- Timeline lengkap 8 tahap (lihat `02-requirements.md` FR-PROC-01)

### 9.5 Halaman Fasilitas

- Grid fasilitas dengan foto + deskripsi
- Section Drone Gallery terpisah

### 9.6 Halaman Galeri

- Filter kategori (Produk/Fasilitas/Proses/Drone)
- Grid gambar dengan lightbox

### 9.7 Halaman Hubungi Kami

- Form kontak + informasi kontak langsung + peta embed

---

## 10. Do's and Don'ts

| Do ✅ | Don't ❌ |
|---|---|
| White space luas antar section | Section rapat tanpa jarak (kesan sesak) |
| Foto asli berkualitas tinggi | Stok foto generik/clipart |
| Warna hijau sebagai aksen kecil | Warna hijau mendominasi background besar |
| Animasi halus & fungsional | Animasi ramai/parallax berlebihan |
| Tipografi tegas dengan hierarki jelas | Banyak jenis font tercampur |
| Layout grid custom sesuai konten | Layout kaku 3-kolom khas theme gratis |
| Rounded corner konsisten | Kombinasi sudut tajam & rounded tidak konsisten |

---

## 11. Catatan

Sistem desain ini menjadi acuan bagi tim Frontend Engineer saat implementasi UI dan wajib konsisten dengan struktur konten pada `02-requirements.md` serta struktur data pada `04-database.md` (khususnya field-field yang bersifat dinamis/CMS-driven seperti statistik, warna badge, dsb.).
