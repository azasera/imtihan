# Spesifikasi Validasi E2E: Sinkronisasi Data Santri SiPAKSa & Ruang Ujian Santri

## Klasifikasi E2E
- **Klasifikasi**: Recommended
- **Komponen Terkait**:
  - `apps/convex/students/` (Backend Actions, Queries, Mutations)
  - `apps/app/(main)/santri/page.tsx` (Dashboard Manajemen Santri & Trigger Sinkronisasi)
  - `apps/app/ujian/page.tsx` (Pintu Masuk Ruang Ujian Santri)

## Skenario Pengujian Alur Santri

### Skenario 1: Penarikan Data dari SiPAKSa
1. **Prasyarat**: Pengajar/Admin login dan membuka menu `/santri`.
2. **Aksi**: Pengguna menekan tombol "Tarik Data dari SiPAKSa".
3. **Ekspektasi**:
   - Sistem menampilkan status loading sinkronisasi.
   - Muncul notifikasi toast sukses yang merangkum jumlah santri terfilter (346 santri).
   - Kartu statistik menampilkan:
     - Total Santri: 346
     - SMPITA: 245
     - SMAITA: 78
     - MTA: 23
   - Filter tab SMPITA, SMAITA, dan MTA menampilkan daftar santri masing-masing tanpa ada data SDITA/TK.

### Skenario 2: Masuk Ujian dengan NISN (SMPITA / SMAITA)
1. **Prasyarat**: Sesi ujian aktif tersedia dengan token yang valid.
2. **Aksi**: Santri membuka `/ujian` dan memasukkan NISN (contoh: `0127121695`).
3. **Ekspektasi**:
   - Sistem secara instan mencocokkan master data santri.
   - Banner "Santri Terverifikasi: Abdillah (SMPITA - 9A)" muncul.
   - Bidang nama dan kelas terisi secara otomatis tanpa perlu diketik manual.
   - Santri memasukkan token ujian dan berhasil masuk ke lembar ujian.

### Skenario 3: Masuk Ujian Santri Ma'had Tahfidz (MTA) Tanpa NISN
1. **Prasyarat**: Santri MTA tidak memiliki nomor NISN resmi.
2. **Aksi**: Santri membuka `/ujian` dan memasukkan ID Santri (contoh: `21.04.001`).
3. **Ekspektasi**:
   - Sistem mengenali ID Santri dan melakukan verifikasi.
   - Banner "Santri Terverifikasi: Bilal Putra Wijaya (MTA - MTA 6)" muncul.
   - Santri tidak diblokir oleh validasi NISN dan dapat memulai pengerjaan ujian.
