# Spesifikasi Fitur: Tambah Cabang Ekstrakurikuler Baru

## 1. Definisi Masalah & Perilaku yang Diharapkan
- **Latar Belakang**:
  Saat ini, daftar kelompok ekstrakurikuler diinisialisasi melalui data awal (*seedDefaultGroupsAndRoster*) dengan 15-16 cabang bawaan. Jika sekolah/pesantren membuka cabang ekskul baru (misalnya: *Robotik & Coding*, *Pencak Silat*, *Renang*, *Karya Tulis Ilmiah*, dll.), pengajar atau admin belum memiliki tombol antarmuka untuk membuat cabang ekstrakurikuler baru secara mandiri.
- **Perilaku yang Diharapkan**:
  - Disediakan tombol **"+ Tambah Cabang Ekskul"** yang elegan di halaman utama Ekstrakurikuler.
  - Membuka modal dialog interaktif `CreateGroupModal` yang memungkinkan pengisian:
    1. Nama Cabang Ekskul (wajib, misal: "Robotik & Coding").
    2. Kategori Ekskul (Pilihan atau Wajib).
    3. Batasan Gender Santri (Semua / Campuran, Khusus Ikhwan, Khusus Akhwat).
    4. Pembina Awal (opsional, dapat memilih guru SiPAKSa atau input manual pelatih luar).
    5. Deskripsi / Fokus Kegiatan (opsional, dengan saran otomatis).
  - Setelah disimpan, cabang ekskul baru langsung muncul pada bilah tabs atas dan otomatis terpilih sebagai kelompok aktif.

## 2. Ruang Lingkup (Scope)
- **In-Scope**:
  - Backend Mutation Convex: `createGroup` pada `apps/convex/extracurricular/public/mutations.ts`.
  - Komponen Modal: `apps/components/ekstrakurikuler/CreateGroupModal.tsx` dengan desain shadcn rapi, elegan, dan 100% responsif.
  - Integrasi UI: Penambahan tombol pemicu modal di header `apps/app/(main)/ekstrakurikuler/page.tsx` dan auto-select ID kelompok baru.
  - Pengujian & Validasi: Unit test di `apps/tests/extracurricular-module.test.ts`.
- **Out-of-Scope**:
  - Menghapus kelompok ekskul yang sudah memiliki anggota aktif (keamanan integritas data rapor).

## 3. Bukti & Dasar Kebutuhan
- Instruksi pengguna: *"buat fitur untuk menambah cabang eskul. UI buat rapi elegan."*

## 4. Berkas Terkait
- `apps/convex/extracurricular/public/mutations.ts` — Mutasi pembuatan cabang ekskul baru `createGroup`.
- `apps/components/ekstrakurikuler/CreateGroupModal.tsx` — Modal dialog pembuatan cabang ekskul baru.
- `apps/app/(main)/ekstrakurikuler/page.tsx` — Halaman utama manajemen ekstrakurikuler.
- `apps/tests/extracurricular-module.test.ts` — Suite pengujian modul ekstrakurikuler.

## 5. Rencana Implementasi Bertahap
1. **Mutasi Backend (`createGroup`)**:
   - Autentikasi dengan `ctx.auth.getUserIdentity()`.
   - Validasi nama tidak boleh kosong dan tidak boleh duplikat pada tahun ajaran & semester aktif.
   - Insert ke tabel `extracurricularGroups` dan return `groupId`.
2. **Sinkronisasi Fungsi ke Convex Cloud**:
   - Jalankan `npx convex dev --once` untuk memastikan Convex production deployment menerima mutasi baru.
3. **Komponen Dialog (`CreateGroupModal.tsx`)**:
   - Komponen modal elegan dengan input nama, kategori (Wajib/Pilihan), gender, penambahan pembina terintegrasi guru SiPAKSa, dan deskripsi kegiatan.
   - Desain responsif di semua ukuran layar (mobile, tablet, desktop).
4. **Integrasi ke Halaman Utama (`page.tsx`)**:
   - Tambahkan tombol CTA `+ Tambah Cabang Ekskul` di header bilah atas.
   - State `isCreateGroupOpen`.
   - Otomatis memilih grup baru saat berhasil dibuat.
5. **Validasi & Pengujian**:
   - Jalankan `npm test` dan `npm run typecheck`.
   - Pastikan bebas kebocoran kode spesifikasi dan tanpa emoji.

## 6. Kriteria Keberterimaan (Acceptance Criteria)
1. Pengguna dapat membuat cabang ekskul baru melalui dialog dengan validasi nama yang jelas.
2. Cabang ekskul baru langsung tampil pada deretan tabs di bagian atas.
3. Mendukung penentuan batasan gender (Semua, Ikhwan, Akhwat) dan kategori (Pilihan/Wajib).
4. Mendukung penugasan pembina langsung saat pembuatan cabang baru.
5. Seluruh suite pengujian lolos tanpa regresi.
