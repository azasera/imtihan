# Spesifikasi: Harmonisasi Penilaian Ekstrakurikuler pada Tab Asesmen Wali Kelas

## 1. Definisi Masalah & Perilaku yang Diinginkan
- **Masalah**:
  Saat ini, penilaian ekstrakurikuler dapat diedit di dua tempat berbeda:
  1. Menu `/ekstrakurikuler` (oleh Pembina Ekskul).
  2. Tab "Asesmen Wali Kelas" di menu `/rapor` (oleh Wali Kelas).
  Hal ini menimbulkan:
  - Kebingungan bagi pengguna mengenai siapa yang berwenang mengisi nilai.
  - Risiko data saling timpa (*overwriting*) ketika wali kelas menyimpan catatan wali kelas dan menimpa nilai yang telah diberikan pembina ekskul.
  - Tombol redundan "Sinkronkan Ekskul dari Excel" di halaman rapor yang menduplikasi fungsi di `/ekstrakurikuler`.

- **Perilaku yang Diinginkan**:
  - Menu `/ekstrakurikuler` menjadi **Single Source of Truth** untuk penilaian ekstrakurikuler oleh para pembina.
  - Pada tab **Asesmen Wali Kelas** di `/rapor`:
    - Bagian Ekstrakurikuler disajikan sebagai **Tinjauan Otomatis (Live Read-Only Preview)** yang terhubung langsung dari data pembina ekskul.
    - Menampilkan nama ekskul, status (Wajib/Pilihan), predikat yang diperoleh, dan narasi capaian secara elegan dan informatif.
    - Diberikan keterangan status: *"Nilai otomatis terhubung dari Pembina Ekstrakurikuler"*.
    - Disediakan tombol navigasi pintas *"Kelola di Menu Ekstrakurikuler"* untuk menuju halaman manajemen ekskul.
    - Disediakan tombol opsional *"Koreksi Manual Khusus"* (toggle terkunci secara default) jika wali kelas dalam kondisi khusus perlu menyesuaikan nilai secara darurat tanpa mengubah kebiasaan default yang aman dari tabrakan data.
    - Menghapus tombol redundan "Sinkronkan Ekskul dari Excel" di halaman rapor agar UI bersih dan terpusat.

## 2. Cakupan (In & Out of Scope)
- **In Scope**:
  - `apps/app/(main)/rapor/page.tsx`:
    - Mengubah tampilan kartu "Penilaian Ekstrakurikuler" di formulir Asesmen Wali Kelas menjadi tampilan ringkasan elegan dengan mode terkunci (*read-only by default*) dan toggle buka kunci koreksi manual.
    - Menghapus tombol "Sinkronkan Ekskul dari Excel" yang redundan di bagian filter/header rapor.
    - Menambahkan tautan/tombol pintas ke `/ekstrakurikuler`.
  - Memastikan pencetakan rapor (`ReportCardPrintView.tsx`) tetap membaca data `extracurriculars` santri dengan presisi tanpa perubahan yang merusak tampilan cetak.
  - Unit test di `apps/tests/extracurricular.test.ts` dan `apps/tests/rapor.test.ts`.
- **Out of Scope**:
  - Mengubah skema database atau struktur rapor lainnya (sikap, absensi, hadits, mapel).

## 3. Berkas Terkait
- `apps/app/(main)/rapor/page.tsx`
- `apps/tests/extracurricular.test.ts`
- `apps/lib/extracurricular-constants.ts`

## 4. Rencana Implementasi Bertahap
1. **Analisis Kode di `apps/app/(main)/rapor/page.tsx`**:
   - Cari bagian tombol "Sinkronkan Ekskul dari Excel" (baris ~1500) dan fungsi `handleSyncAllExtracurricularsFromExcel`.
   - Cari bagian kartu "Penilaian Ekstrakurikuler" (baris ~1630-1740).
2. **Refaktor UI Kartu Ekstrakurikuler pada Tab Asesmen Wali Kelas**:
   - Tambahkan state `const [isManualEkskulUnlocked, setIsManualEkskulUnlocked] = React.useState(false)`.
   - Desain tampilan default (terkunci):
     - Badge informasi: *"Terhubung Otomatis dari Pembina Ekskul"*.
     - Tampilkan daftar ekskul santri dalam kartu ringkas: Nama Ekskul, Predikat (Badge Hijau/Biru), Deskripsi Capaian Rapor.
     - Tombol *"Buka Menu Ekstrakurikuler"* (membuka tab baru atau navigasi ke `/ekstrakurikuler`).
     - Tombol *"Koreksi Manual"* dengan ikon pensil/gembok untuk membuka input form jika diperlukan.
   - Jika `isManualEkskulUnlocked` aktif, form edit (select predikat & textarea deskripsi) terbuka dengan peringatan bahwa perubahan manual akan memperbarui nilai rapor santri.
3. **Pembersihan Tombol Redundan**:
   - Sederhanakan tombol sinkronisasi ekskul excel di rapor page dan arahkan ke menu utama ekstrakurikuler jika diperlukan.
4. **Validasi & Pengujian**:
   - Jalankan unit tests `npm test`.
   - Jalankan `npm run typecheck`.
   - Jalankan `npm run test:ui-leak`.
5. **Deployment**:
   - Git commit & push.
   - Deploy Cloudflare Worker (`npm run deploy:worker`).

## 5. Kriteria Penerimaan (Acceptance Criteria)
- [x] Tab Asesmen Wali Kelas menampilkan nilai ekskul secara otomatis tanpa memaksa wali kelas mengisi ulang.
- [x] Nilai ekskul di tab Asesmen Wali Kelas tidak dapat tertimpa secara tidak sengaja saat wali kelas menyimpan catatan umum/absensi (karena form terkunci secara default).
- [x] Opsi koreksi manual tetap tersedia jika dibutuhkan lewat tombol buka kunci yang disengaja.
- [x] Tombol dan elemen bebas dari kebocoran kode teknis dan tidak menggunakan emoji.
- [x] Seluruh unit tests lulus (595+ tests).
