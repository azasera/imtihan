# Spesifikasi Implementasi: Dashboard Rekapitulasi Nilai & Ekspor Laporan (TASK-008)

## 1. Masalah & Perilaku yang Diharapkan
- **Masalah**: Pengajar, wali kelas, dan pimpinan pesantren membutuhkan ikhtisar performa akademik santri secara agregat pada setiap sesi ujian. Diperlukan metrik statistik kelas yang komprehensif (nilai rata-rata, nilai tertinggi, nilai terendah, dan persentase ketuntasan KKM), kemampuan mengunduh berkas laporan dalam format CSV yang kompatibel dengan Microsoft Excel/Google Sheets, serta opsi pratinjau cetak langsung (print-ready) yang rapi dengan kop resmi pesantren.
- **Perilaku yang Diharapkan**:
  1. Panel Statistik Kelas Terpadu pada `/rekap-nilai`:
     - Rata-rata Nilai Kelas (mean score).
     - Nilai Tertinggi (max score) & Nilai Terendah (min score).
     - Persentase Santri Tuntas KKM (dibandingkan terhadap `bank.passingScore`).
     - Jumlah Santri Selesai vs Sedang Mengerjakan.
  2. Fitur Ekspor Data CSV:
     - Tombol "Ekspor Data CSV" yang menghasilkan berkas dengan format nama `Rekap-Nilai-[NamaSesi]-[Tanggal].csv`.
     - Menyertakan kolom: No, NISN, Nama Santri, Kelas, Nilai Pilihan Ganda, Nilai Essay, Total Nilai Akhir, Status Ketuntasan (Tuntas / Belum Tuntas), dan Tanggal Pengumpulan.
     - Menggunakan encoding UTF-8 dengan BOM agar terbaca sempurna saat dibuka di Microsoft Excel di Windows tanpa karakter rusak.
  3. Fitur Cetak Laporan Resmi Pesantren:
     - Tombol "Cetak Laporan" yang memicu dialog cetak browser (`window.print()`).
     - Menyertakan kop resmi: Nama Pesantren "PONDOK PESANTREN AT-TAUHID", Judul Ujian, Mata Pelajaran, Tingkat Kelas, Tanggal Ujian, dan KKM.
     - Mengoptimalkan print stylesheet: menyembunyikan tombol navigasi, filter, dan sidebar saat dicetak ke printer atau diekspor ke PDF.
  4. Halaman Beranda / Dashboard (`apps/app/(main)/page.tsx`):
     - Diperkaya dengan metrik ringkasan keseluruhan: Total Bank Soal, Total Sesi Ujian, Santri Mengikuti Ujian, dan Rata-rata Nilai Global.
  5. Nol kebocoran kode spesifikasi teknis (`SCR-*`, `TASK-*`, dsb.) dan bebas emoji (menggunakan ikon Lucide).

## 2. In / Out of Scope
- **In-Scope**:
  - Penambahan perhitungan statistik agregat sesi (rata-rata, tertinggi, terendah, persentase tuntas) di frontend dan query Convex pendukung.
  - Fitur ekspor CSV dengan BOM UTF-8.
  - Print mode (tata letak cetak dokumen resmi pesantren).
  - Integrasi dashboard beranda dengan metrik ringkasan eksekutif.
  - Unit tests di `apps/tests/recap-export.test.ts`.
  - Spek E2E di `specs/e2e/recap-export.md`.
- **Out-of-Scope**:
  - Integrasi payment gateway atau sistem keuangan santri (di luar lingkup sistem ujian).

## 3. Berkas Terkait
- `apps/app/(main)/rekap-nilai/page.tsx`
- `apps/app/(main)/page.tsx`
- `apps/tests/recap-export.test.ts`
- `specs/e2e/recap-export.md`
- `.planora/EXECUTION/TODO.md`

## 4. Kebutuhan Implementasi Terurut Dependensi
1. **Logika Agregasi Statistik**:
   - Menghitung rata-rata, nilai maksimum, nilai minimum, dan persentase lulus KKM dari daftar peserta sesi ujian.
2. **Penyempurnaan Antarmuka `/rekap-nilai`**:
   - Menampilkan 4 kartu statistik kelas di bagian atas tabel.
   - Menambahkan tombol "Ekspor CSV" dan tombol "Cetak Dokumen".
   - Menambahkan styling `@media print` untuk cetak dokumen resmi.
3. **Penyempurnaan Dashboard Beranda (`apps/app/(main)/page.tsx`)**:
   - Menghubungkan metrik bank soal, sesi ujian, dan peserta aktif.
4. **Pengujian & Validasi**:
   - Unit tests validasi formula statistik dan pembentukan payload CSV.
   - Pemindaian kebocoran teks spesifikasi teknis.

## 5. Kriteria Penerimaan Terukur (Acceptance Criteria)
- Statistik rata-rata, tertinggi, terendah, dan kelulusan KKM terhitung akurat.
- File CSV dapat diunduh langsung dan memuat kolom identitas serta nilai santri secara lengkap.
- Tampilan cetak menyajikan dokumen bersih tanpa elemen navigasi website.
- TypeScript 0 error (`npm run typecheck`).
- Zero technical code leaks.

## 6. Risiko & Kompatibilitas
- Jika belum ada santri yang menyelesaikan ujian (jumlah submitted = 0), statistik rata-rata/tertinggi/terendah harus menampilkan tanda `-` atau `0` tanpa menyebabkan `NaN` atau division-by-zero error.
- Format CSV menggunakan delimitasi koma atau titik koma yang aman dari karakter koma dalam nama santri (diberikan quote escaping).
