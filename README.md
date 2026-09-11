# Sistem Minit Curai Kursus Guru — SK Taman Jasmin

Aplikasi web penuh untuk mengurus **Minit Curai Kursus Guru** di SK Taman Jasmin: borang rasmi, dashboard,
tandatangan digital, muat naik dokumentasi bergambar, dan penjanaan PDF rasmi — dikuasakan oleh **Supabase**
(PostgreSQL Database, Storage).

> **Nota versi ini: SISTEM TERBUKA (TANPA LOG MASUK).** Bermula migration `0005_buka_akses_tanpa_login.sql`,
> keperluan log masuk/daftar akaun telah dibuang sepenuhnya. Sesiapa sahaja yang mempunyai pautan aplikasi
> boleh terus mencipta, melihat, mengedit dan memadam mana-mana rekod minit curai — tiada lagi konsep
> "rekod milik guru tertentu" atau "admin". Sesuai untuk kegunaan dalaman sekolah yang dipercayai, tetapi
> **tiada kawalan capaian** — sesiapa yang tahu URL aplikasi boleh mengubah/memadam mana-mana rekod.

## 1. Teknologi

- **Frontend:** React 18 + TypeScript + Vite + Tailwind CSS + React Router
- **Backend / Pangkalan Data:** Supabase (PostgreSQL, Auth, Storage)
- **PDF:** jsPDF (dijana di sisi klien, A4 mudah cetak)
- **Tandatangan Digital:** signature_pad (mouse / touch / skrin sentuh)

## 2. Struktur Projek

```
sistem-minit-curai/
├── src/
│   ├── components/       # HeaderRasmi, SignaturePadInput, ImageUploadField
│   ├── data/             # Senarai nama guru
│   ├── lib/              # supabaseClient, generatePdf, validation
│   ├── pages/             # Dashboard, MinitCuraiForm, LihatRekod
│   ├── types/            # Definisi TypeScript
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── supabase/
│   ├── migrations/
│   │   ├── 0001_init.sql                      # Jadual, index, trigger
│   │   ├── 0002_rls_policies.sql              # RLS asal (berasaskan akaun)
│   │   ├── 0003_storage.sql                   # Bucket & polisi Storage asal
│   │   ├── 0004_auto_create_profile.sql       # (warisan — tidak lagi releven tanpa login)
│   │   └── 0005_buka_akses_tanpa_login.sql    # BUANG keperluan login, buka akses penuh
│   ├── schema.sql                 # Gabungan semua migration mengikut turutan (rujukan pantas)
│   └── seed_demo.sql              # Data demo pilihan
├── .env.example
└── README.md
```

**Untuk projek Supabase BAHARU:** jalankan kelima-lima fail migration mengikut turutan
(0001 → 0002 → 0003 → 0004 → 0005), atau jalankan `schema.sql` sekali gus.

**Untuk projek Supabase yang SUDAH dipasang dengan versi log masuk sebelum ini:** anda hanya perlu
jalankan `0005_buka_akses_tanpa_login.sql` sahaja untuk membuka akses.

## 3. Sediakan Projek Supabase

1. Daftar / log masuk di [supabase.com](https://supabase.com) dan cipta projek baharu.
2. Pergi ke **SQL Editor** dalam Supabase Dashboard.
3. Jalankan fail berikut **mengikut turutan** (klik "+ New query", tampal, klik "Run", ulang):
   - `supabase/migrations/0001_init.sql`
   - `supabase/migrations/0002_rls_policies.sql`
   - `supabase/migrations/0003_storage.sql`
   - `supabase/migrations/0004_auto_create_profile.sql`
   - `supabase/migrations/0005_buka_akses_tanpa_login.sql`

   (Atau jalankan `supabase/schema.sql` sekali gus — kandungannya sama, sudah tersusun ikut turutan.)

4. Dapatkan `Project URL` dan `anon public key` daripada **Project Settings > API Keys**.

Tiada langkah persediaan Authentication diperlukan — aplikasi ini tidak lagi menggunakan log masuk.

## 4. Pemasangan Tempatan

```bash
# 1. Pasang pakej
npm install

# 2. Salin fail environment dan isikan nilai Supabase anda
cp .env.example .env
# kemudian edit .env: VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY

# 3. Jalankan pelayan pembangunan
npm run dev
```

Aplikasi akan berjalan di `http://localhost:5173`.

## 5. Sambungan ke Supabase

- Fail `src/lib/supabaseClient.ts` membaca `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY`
  daripada environment variable — **hanya anon key** digunakan di frontend.
- Jangan sekali-kali letakkan `service_role` key dalam kod frontend atau fail `.env` yang dikongsi.

## 6. Arahan Deployment (Vercel)

1. Push kod ke repositori Git (GitHub/GitLab/Bitbucket).
2. Di [vercel.com](https://vercel.com), import repositori tersebut sebagai projek baharu.
3. Framework Preset: **Vite**.
4. Tambah Environment Variables di Vercel Project Settings:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Deploy. Selepas selesai, kemaskini **Site URL** dan **Redirect URLs** di Supabase
   Authentication settings dengan domain Vercel anda.

Platform lain seperti Netlify atau Cloudflare Pages juga boleh digunakan dengan langkah yang serupa
(tetapkan build command `npm run build`, output directory `dist`, dan environment variables yang sama).

## 7. Ciri-ciri Utama

- **Akses terbuka:** tiada log masuk/daftar akaun — semua orang nampak & boleh urus semua rekod.
- **Dashboard:** statistik ringkas, carian, penapis status, cipta/lihat/edit/salin/padam/jana PDF.
- **Borang Minit Curai:** 9 bahagian rasmi mengikut spesifikasi, termasuk dropdown nama guru
  boleh cari (dengan pilihan "Nama tiada dalam senarai"), muat naik gambar (Supabase Storage),
  dan tandatangan digital (penyedia & pengesah).
- **Fungsi Simpan:** draf, lengkap, edit, salin sebagai rekod baharu, auto-save borang baharu ke
  session storage sekiranya rangkaian terputus.
- **Jana PDF:** PDF A4 rasmi dengan logo, jadual maklumat, gambar dokumentasi, tandatangan,
  nombor halaman, tarikh dijana, dan pemecahan automatik ke berbilang halaman.
- **Reka Bentuk:** warna biru gelap/putih/kelabu, font Inter/sans-serif, responsif, mod cetakan
  yang menyembunyikan butang & menu (kelas `.no-print`).

## 8. Senarai Ujian Manual (Sebelum Digunakan Sebenar)

Gunakan senarai ini untuk mengesahkan aplikasi berfungsi sepenuhnya sebelum diguna pakai di sekolah:

- [ ] Dropdown nama guru boleh dicari dan dipilih.
- [ ] Pilihan "Nama tiada dalam senarai" memaparkan medan manual & menyimpan dengan betul.
- [ ] Validasi nama guru (tidak boleh kedua-dua medan diisi/kosong serentak) berfungsi.
- [ ] Cipta rekod baharu, simpan sebagai draf, dan edit rekod berjaya.
- [ ] Validasi medan wajib (nama kursus, tarikh mula/tamat, tempat) dan tarikh/masa logik berfungsi.
- [ ] Muat naik gambar (JPG/PNG, maks 5MB), pratonton, padam & ganti gambar berfungsi.
- [ ] Tandatangan digital boleh dilukis, dipadam dan ditandatangan semula (mouse/skrin sentuh).
- [ ] Jana PDF menghasilkan fail A4 kemas dengan logo, jadual, gambar & tandatangan tanpa teks bertindih.
- [ ] Muat turun & cetak PDF berfungsi.
- [ ] Paparan responsif disemak pada telefon, tablet dan komputer.
- [ ] Semua mesej ralat dan mesej berjaya dipaparkan dengan jelas dalam Bahasa Melayu.

## 9. Nota Keselamatan

- **PENTING:** Versi ini **tiada kawalan capaian pengguna**. Sesiapa sahaja yang mempunyai pautan aplikasi
  boleh mencipta, mengedit, dan memadam mana-mana rekod. Sesuai untuk kegunaan dalaman yang dipercayai
  sahaja (contoh: kongsi pautan hanya dengan guru-guru sekolah), bukan untuk capaian awam sepenuhnya.
- Muat naik fail dihadkan kepada format JPG/JPEG/PNG dan saiz maksimum melalui semakan di frontend
  **dan** konfigurasi bucket Storage (`allowed_mime_types`, `file_size_limit`) di peringkat pangkalan data.
- `service_role` key tidak pernah digunakan atau didedahkan di frontend.
- Jika pada masa hadapan anda mahu kembalikan kawalan akses (contohnya elak sesiapa memadam rekod
  guru lain), boleh sambung semula Supabase Authentication dan kembalikan polisi RLS dalam
  `0002_rls_policies.sql` (gantikan semula polisi "terbuka" daripada `0005`).
