# Spesifikasi Fitur: Halaman Panduan Operasional Pengawas Ujian In-App

## 1. Definisi Masalah & Perilaku yang Diharapkan
- **Masalah**:
  1. Pengawas ruang ujian dan guru sering kali menghadapi situasi darurat di kelas (seperti santri tidak ditemukan, 2 angka token tidak cocok, lembar terkunci karena pelanggaran tab, santri tidak sengaja tertekan kumpul ujian, atau baterai gawai habis).
  2. Saat ini petunjuk operasional hanya berada di dokumen luar aplikasi atau dokumen perencanaan, sehingga pengawas yang sedang memegang gawai/ponsel di kelas tidak memiliki akses cepat, nyaman, dan terstruktur di dalam aplikasi E-Imtihan.
  3. Pengguna meminta: *"masukan ke App. agar mudah diakses, buat nyaman dibaca di semua layar. tampilan bagus modern"*.

- **Perilaku yang Diharapkan**:
  1. **Halaman Khusus Panduan In-App**:
     - Tersedia halaman khusus di `/panduan-pengawas` yang memuat SOP dan panduan penanganan kendala ujian secara komprehensif.
     - Menyediakan fitur pencarian cepat (*instant quick search*) sehingga pengawas dapat mengetik kata kunci (misal: "token", "kumpul", "terkunci", "baterai", "sipaksa") dan langsung menemukan kartu solusi dalam hitungan detik.
     - Desain modern, bersih, tipografi nyaman dibaca di layar HP, tablet, maupun monitor laptop/PC.
     - Struktur terbagi dalam 4 fase jelas:
       1. **Pra-Ujian**: Sinkronisasi data santri dan aktivasi sesi.
       2. **Format Login & Token 8 Karakter**: Panduan rumus token 6 huruf sesi + 2 digit santri (mendukung NISN/NIS/ID).
       3. **Solusi Cepat Kendala Ruang Ujian (Troubleshooting)**: 6 kartu solusi interaktif dengan langkah tindakan terurut.
       4. **Pasca Ujian**: Verifikasi pengumpulan dan alur koreksi esai.
  2. **Navigasi & Aksesibilitas**:
     - Ditambahkan tautan menu resmi **"Panduan Pengawas"** pada bilah navigasi samping (`apps/components/app-sidebar.tsx`).
     - Ditambahkan tombol pintas (*quick action button*) di bilah atas halaman **Monitoring Sesi** (`apps/app/(main)/monitoring-sesi/page.tsx`), sehingga pengawas yang sedang memantau dapat membuka panduan hanya dengan 1 klik.
  3. **Kepatuhan Desain & Aturan Kode**:
     - 100% bebas dari emoji (menggunakan ikon Lucide).
     - Bebas dari kebocoran kode spesifikasi teknis (`SCR-*`, `TASK-*`, dll).
     - Menggunakan komponen shadcn UI (`Card`, `Badge`, `Button`, `Input`, `Tabs`, `Separator`).

## 2. In / Out of Scope
- **In-Scope**:
  - `apps/app/(main)/panduan-pengawas/page.tsx`: Halaman responsif panduan pengawas dengan filter/pencarian kendala dan kartu solusi.
  - `apps/components/app-sidebar.tsx`: Menambahkan menu navigasi "Panduan Pengawas" dengan ikon `HelpCircleIcon` / `BookOpenCheckIcon`.
  - `apps/app/(main)/monitoring-sesi/page.tsx`: Menambahkan tombol akses cepat "Panduan Pengawas" di bilah header.
  - `apps/tests/panduan-pengawas.test.ts`: Pengujian unit untuk memverifikasi keberadaan halaman, ketersediaan navigasi, responsivitas, nihil emoji, dan nihil kebocoran kode teknis.
- **Out-of-Scope**:
  - Mengubah logika backend Convex (`schema.ts`, mutasi ujian).

## 3. Bukti & Berkas Terkait
- Permintaan pengguna: *"masukan ke App. agar mudah diakses, buat nyaman dibaca di semua layar. tampilan bagus modern"*
- Berkas terkait:
  - `apps/app/(main)/panduan-pengawas/page.tsx`
  - `apps/components/app-sidebar.tsx`
  - `apps/app/(main)/monitoring-sesi/page.tsx`
  - `apps/tests/panduan-pengawas.test.ts`

## 4. Kebutuhan Implementasi Terurut Dependensi
1. **Langkah 1**: Buat halaman `apps/app/(main)/panduan-pengawas/page.tsx`:
   - State pencarian kata kunci kendala.
   - Kategori filter tab (Semua, Pra-Ujian, Format Token, Kendala Teknis, Pasca Ujian).
   - Kartu panduan modern dengan tata letak grid responsif, callout tips, dan langkah penanganan bernomor.
2. **Langkah 2**: Perbarui `apps/components/app-sidebar.tsx`:
   - Tambahkan item menu `{ title: "Panduan Pengawas", url: "/panduan-pengawas", icon: <HelpCircleIcon /> }`.
3. **Langkah 3**: Perbarui `apps/app/(main)/monitoring-sesi/page.tsx`:
   - Tambahkan tombol tautan cepat ke `/panduan-pengawas` di header halaman.
4. **Langkah 4**: Buat pengujian unit di `apps/tests/panduan-pengawas.test.ts`.
5. **Langkah 5**: Jalankan `npm test` dan `tsc --noEmit`.

## 5. Kriteria Penerimaan yang Terukur
1. Halaman `/panduan-pengawas` dapat diakses langsung oleh pengajar dan pengawas.
2. Menu "Panduan Pengawas" muncul di sidebar navigasi utama.
3. Tombol "Panduan Pengawas" tersedia di header halaman monitoring sesi.
4. Kotak pencarian dapat menyaring kartu kendala secara instan.
5. Tampilan adaptif dan terbaca dengan nyaman pada viewport ponsel (320px-480px), tablet, dan desktop.
6. Nihil emoji, nihil kebocoran kode teknis, dan seluruh pengujian lolos 100%.

## 6. Risiko, Kompatibilitas, & Mitigasi
- **Risiko**: Ukuran teks panduan terlalu kecil di layar HP.
- **Mitigasi**: Terapkan tipografi Tailwind dengan hierarki jelas (`text-sm sm:text-base`, `leading-relaxed`, kartu bernomor).

## 7. Perintah Validasi Repositori
- `cd apps && npm test -- tests/panduan-pengawas.test.ts`
- `cd apps && npx tsc --noEmit`

## 8. Ekspektasi Dokumentasi
- Sertakan komentar dalam kode yang rapi dan deskriptif.
