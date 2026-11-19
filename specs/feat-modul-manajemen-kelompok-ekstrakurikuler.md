# Spesifikasi Fitur: Modul Terpusat Manajemen Kelompok & Anggota Ekstrakurikuler

## 1. Definisi Masalah & Perilaku yang Diharapkan

### Masalah Saat Ini:
1. **Pengelolaan Terfragmentasi di Level Wali Kelas**:
   - Data ekstrakurikuler saat ini hanya dikelola per santri di dalam Tab "Asesmen Wali Kelas" pada halaman `/rapor`.
   - Tidak ada antarmuka bagi Pembina Ekskul (pelatih futsal, guru TIK, pembina rohis, dll.) untuk melihat daftar seluruh santri bimbingannya yang tersebar lintas kelas (misal anggota Futsal dari kelas VII A, VII B, VIII A, VIII B, IX A, IX B).
2. **Kesulitan Mengatur Mutasi Santri (Keluar / Masuk / Pindah Kelompok)**:
   - Jika seorang santri pindah dari Ekskul Badminton ke Ekskul Panahan, wali kelas harus mencari santri tersebut satu per satu di rapor, menghapus baris lama, dan menambahkan baris baru.
   - Jika tombol *"⚡ Sinkronkan Ekskul dari Excel"* di rapor ditekan kembali, data santri yang telah dipindahkan berisiko ter-reset ke data Excel statis rujukan awal.
3. **Beban Penginputan Nilai & Deskripsi Capaian**:
   - Pembina ekskul harus menyerahkan nilai secara manual/kertas ke masing-masing wali kelas, lalu setiap wali kelas menginput ulang satu per satu ke lembar asesmen rapor.

### Perilaku yang Diharapkan:
1. **Halaman Khusus Manajemen Ekstrakurikuler (`/ekstrakurikuler`)**:
   - Terdapat menu baru di bilah navigasi (Sidebar) aplikasi: **"Ekstrakurikuler"**.
   - Halaman menampilkan kartu ringkasan seluruh kelompok ekskul (Rohis, Futsal, Badminton, Pingpong, Panahan, Volly, Agrobisnis, TIK, Tata Boga, Jurnalis, IPA, IPS, Matematika, dll.) lengkap dengan jumlah anggota aktif per ekskul.
2. **Tampilan Anggota Lintas Kelas per Kelompok Ekskul**:
   - Memilih salah satu ekskul akan menampilkan tabel seluruh anggota santri dari seluruh rombel/kelas (VII s.d IX, SMA, MTA) dengan filter pencarian nama, filter kelas, dan filter jenis kelamin (Ikhwan/Akhwat).
3. **Alur Mutasi Peserta yang Mudah (Keluar, Masuk, Pindah Kelompok)**:
   - **Tambah Anggota (Masuk)**: Modal pencarian santri dari basis data master `students` untuk ditambahkan ke kelompok ekskul terpilih.
   - **Keluarkan Anggota (Keluar)**: Aksi mengeluarkan santri dari kelompok ekskul (dengan konfirmasi).
   - **Pindah Kelompok Ekskul (Transfer)**: Aksi memindahkan santri langsung dari satu ekskul ke ekskul lain dalam satu kali klik.
4. **Penilaian Kolektif & Sinkronisasi Otomatis ke E-Rapor**:
   - Pembina dapat mengubah predikat (A / B / C) dan deskripsi capaian langsung di tabel kelompok ekskul.
   - Perubahan anggota dan nilai di modul ekstrakurikuler **secara otomatis tersinkronisasi ke tabel `homeroomAssessments`** pada Convex backend, sehingga lembar cetak rapor fisik santri (`ReportCardPrintView.tsx`) langsung mencerminkan data terbaru tanpa perlu input ganda oleh wali kelas.
5. **Inisialisasi Data Awal (Seeding / Auto-Populate)**:
   - Sistem dapat menginisialisasi kelompok dan anggota dari data rujukan resmi `EKSKUL_ROSTER_DATA` yang sudah ada, sehingga 334 santri langsung terpetakan dan tidak ada data yang hilang.

---

## 2. Cakupan & Batasan (In / Out of Scope)

### In-Scope:
1. **Skema Basis Data Convex (`apps/convex/schema.ts`)**:
   - Tabel `extracurricularGroups`:
     - `code`: Kode unik kelompok ekskul (misal: "futsal", "rohis", "panahan").
     - `name`: Nama resmi ekskul.
     - `category`: "wajib" | "pilihan".
     - `coachName`: Nama pembina/pelatih (opsional).
     - `coachNiy`: NIY pembina (opsional).
     - `genderRestriction`: "all" | "ikhwan" | "akhwat" (opsional).
     - `description`: Deskripsi umum ekskul.
     - `isActive`: boolean.
     - `academicYear`: string.
     - `semester`: 1 | 2.
     - `createdAt`, `updatedAt`, `updatedBy`.
   - Tabel `extracurricularEnrollments`:
     - `groupId`: v.id("extracurricularGroups").
     - `groupCode`: string.
     - `groupName`: string.
     - `santriId`: string.
     - `nisn`: string.
     - `studentName`: string.
     - `className`: string.
     - `gender`: string ("L" | "P").
     - `academicYear`: string.
     - `semester`: 1 | 2.
     - `score`: string ("A" | "B" | "C").
     - `description`: string.
     - `status`: "active" | "transferred" | "dropped".
     - `transferredToGroupCode`: optional string.
     - `updatedBy`: string.
     - `createdAt`, `updatedAt`.
2. **Backend Convex API (`apps/convex/extracurricular/`)**:
   - Mengikuti konvensi direktori fitur Convex:
     - `apps/convex/extracurricular/public/queries.ts`:
       - `getGroups`: Daftar seluruh kelompok ekskul dengan agregat jumlah peserta aktif.
       - `getGroupMembers`: Daftar anggota santri per kelompok ekskul dengan filter pencarian dan kelas.
       - `getAvailableStudentsForGroup`: Daftar santri master yang belum terdaftar di ekskul tersebut untuk dipilih di modal tambah.
     - `apps/convex/extracurricular/public/mutations.ts`:
       - `seedDefaultGroupsAndRoster`: Inisialisasi kelompok & anggota dari konstanta roster master.
       - `addMemberToGroup`: Mendaftarkan santri ke ekskul & otomatis menyinkronkan ke `homeroomAssessments`.
       - `removeMemberFromGroup`: Mengeluarkan santri dari ekskul & memperbarui `homeroomAssessments`.
       - `transferMemberGroup`: Memindahkan santri dari satu ekskul ke ekskul lain & memperbarui `homeroomAssessments`.
       - `updateMemberAssessment`: Mengubah predikat (A/B/C) atau deskripsi & otomatis mengalir ke `homeroomAssessments`.
       - `saveGroupCoach`: Menyimpan nama & NIY pembina ekskul.
     - `apps/convex/extracurricular/private/helpers.ts`:
       - Helper internal sinkronisasi ke tabel `homeroomAssessments` agar nilai di E-Rapor selalu up-to-date.
3. **Antarmuka Pengguna (UI/UX)**:
   - Penambahan menu `Ekstrakurikuler` di sidebar utama (`apps/components/app-sidebar.tsx`) menggunakan ikon Lucide (`TrophyIcon` atau `ActivityIcon`).
   - Halaman utama `apps/app/(main)/ekstrakurikuler/page.tsx`:
     - Tab/Daftar Kelompok Ekskul dengan indikator status wajib/pilihan, pembina, dan jumlah anggota.
     - Area detail kelompok terpilih:
       - Header ringkasan ekskul & informasi pembina.
       - Tabel interaktif anggota lintas kelas: kolom NISN, Nama Santri, Kelas, Jenis Kelamin, Predikat (Dropdown A/B/C), Deskripsi Capaian, dan Aksi.
       - Tombol Aksi: *"Tambah Peserta"*, *"Pindahkan Ekskul"*, dan *"Keluarkan"*.
       - Tombol Inisialisasi Massal *"⚡ Sinkronkan Data Awal Roster Excel"* jika kelompok belum memiliki data.
     - Dialog/Modal berbasis shadcn UI tanpa emoji (menggunakan ikon Lucide) dan feedback notifikasi via Sonner toast.
4. **Pengujian & Validasi**:
   - Unit tests di `apps/tests/extracurricular-module.test.ts` untuk memverifikasi logika mutasi peserta, perubahan predikat, dan auto-sinkronisasi ke `homeroomAssessments`.
   - Handoff spesifikasi E2E di `specs/e2e/feat-modul-manajemen-kelompok-ekstrakurikuler.md`.

### Out-of-Scope:
- Sistem presensi kehadiran pertemuan mingguan dengan barcode/QR-code (fokus fitur adalah manajemen roster anggota, mutasi peserta, dan penilaian capaian rapor).
- Modifikasi format cetak PDF fisik rapor di luar data array `extracurriculars` yang sudah didukung.

---

## 3. Berkas yang Relevan & Rencana Perubahan

1. `apps/convex/schema.ts` — Penambahan tabel `extracurricularGroups` dan `extracurricularEnrollments`.
2. `apps/convex/extracurricular/private/helpers.ts` (Berkas Baru) — Helper sinkronisasi dua arah ke `homeroomAssessments`.
3. `apps/convex/extracurricular/public/queries.ts` (Berkas Baru) — Query daftar grup, anggota lintas kelas, dan pencarian santri.
4. `apps/convex/extracurricular/public/mutations.ts` (Berkas Baru) — Mutasi pendaftaran, mutasi keluar/pindah, pembaruan nilai, dan inisialisasi roster.
5. `apps/components/app-sidebar.tsx` — Penambahan menu "Ekstrakurikuler" pada navigasi utama.
6. `apps/app/(main)/ekstrakurikuler/page.tsx` (Berkas Baru) — Halaman antarmuka manajemen kelompok ekskul dan peserta.
7. `apps/tests/extracurricular-module.test.ts` (Berkas Baru) — Unit test logika mutasi kelompok ekskul dan integrasi rapor.
8. `specs/e2e/feat-modul-manajemen-kelompok-ekstrakurikuler.md` (Berkas Baru) — Spesifikasi E2E handoff pengujian browser.

---

## 4. Persyaratan Implementasi Berurutan (Dependency-Ordered)

1. **Langkah 1: Skema Convex (`apps/convex/schema.ts`)**
   - Tambahkan tabel `extracurricularGroups` dan `extracurricularEnrollments` dengan indeks:
     - `by_academic_year_and_semester`: ["academicYear", "semester"]
     - `by_code_and_period`: ["groupCode", "academicYear", "semester"]
     - `by_group_and_status`: ["groupId", "status"]
     - `by_santri_and_period`: ["santriId", "academicYear", "semester"]
2. **Langkah 2: Backend Logic Convex (`apps/convex/extracurricular/`)**
   - Buat `private/helpers.ts` untuk fungsi `syncEnrollmentToHomeroomAssessment(ctx, santriId, academicYear, semester)`.
   - Buat `public/queries.ts` untuk `getGroups`, `getGroupMembers`, dan `getAvailableStudents`.
   - Buat `public/mutations.ts` untuk `seedDefaultGroupsAndRoster`, `addMemberToGroup`, `removeMemberFromGroup`, `transferMemberGroup`, `updateMemberAssessment`, dan `updateGroupDetails`.
   - Validasi backend dengan `npx convex dev --once`.
3. **Langkah 3: Integrasi Navigasi Sidebar (`apps/components/app-sidebar.tsx`)**
   - Tambahkan entri navigasi `{ title: "Ekstrakurikuler", url: "/ekstrakurikuler", icon: <TrophyIcon /> }` di bawah E-Rapor / Rekap Nilai.
4. **Langkah 4: Antarmuka Web Interaktif (`apps/app/(main)/ekstrakurikuler/page.tsx`)**
   - Buat tampilan master-detail responsif:
     - Panel kiri: Grid kartu daftar ekskul (wajib & pilihan) beserta lencana jumlah anggota.
     - Panel kanan: Tabel data anggota santri lintas kelas, toolbar pencarian & filter, tombol tambah peserta, tombol pindah ekskul, dan dialog konfirmasi.
     - Pemilih predikat (A/B/C) langsung per baris dengan auto-fill deskripsi resmi dari kamus `OFFICIAL_EXTRACURRICULARS`.
5. **Langkah 5: Pengujian & Validasi**
   - Buat dan jalankan unit test `apps/tests/extracurricular-module.test.ts`.
   - Pastikan build Next.js dan Convex lolos tanpa regresi.
   - Siapkan berkas handoff E2E di `specs/e2e/feat-modul-manajemen-kelompok-ekstrakurikuler.md`.

---

## 5. Kriteria Penerimaan yang Terukur (Acceptance Criteria)

- **AC-01**: Terdapat menu navigasi "Ekstrakurikuler" di sidebar yang mengarahkan ke halaman `/ekstrakurikuler`.
- **AC-02**: Halaman menampilkan daftar 14 cabang ekskul pilihan + 1 ekskul wajib (Rohis) beserta jumlah anggota aktif.
- **AC-03**: Pembina dapat melihat daftar anggota ekskul terpilih yang mencakup santri lintas kelas (VII, VIII, IX, SMA, MTA) dalam satu tabel terpadu.
- **AC-04**: Tersedia tombol *"Tambah Anggota"* yang memungkinkan pencarian dan penambahan santri aktif ke kelompok ekskul.
- **AC-05**: Tersedia fitur *"Pindah Ekskul"* yang memindahkan santri dari ekskul asal ke ekskul tujuan dalam satu aksi, serta otomatis mencatat status kepindahan.
- **AC-06**: Mengeluarkan santri (*"Keluarkan"*) menghapus/menonaktifkan keanggotaan santri dari kelompok pilihan tersebut.
- **AC-07**: Setiap penambahan, penghapusan, atau perubahan predikat (A/B/C) di modul ekstrakurikuler otomatis memperbarui `homeroomAssessments` santri terkait di modul E-Rapor.
- **AC-08**: Tindakan *"⚡ Sinkronkan Data Awal Roster Excel"* mampu memuat 334 santri dari data rujukan resmi `EKSKUL_ROSTER_DATA` tanpa duplikasi.

---

## 6. Pertimbangan Risiko, Keamanan, & Migrasi

1. **Kompatibilitas Mundur (Backward Compatibility)**:
   - Data ekskul yang sudah ada di `homeroomAssessments` tetap utuh. Helper sinkronisasi hanya memutakhirkan array `extracurriculars` tanpa menghapus nilai absensi, P5, catatan wali kelas, atau nilai rapor mapel lainnya.
2. **Penetapan Hak Akses (Authorization)**:
   - Semua mutasi publik di `apps/convex/extracurricular/public/mutations.ts` memverifikasi identitas pengguna melalui autentikasi token pengajar.
3. **Pencegahan Duplikasi**:
   - Satu santri dicegah terdaftar ganda pada ekskul pilihan yang sama di semester yang sama.
   - Ekskul wajib (Rohis) dilindungi agar tidak dapat dihapus massal tanpa pengganti.

---

## 7. Perintah Validasi Proyek

- **Validasi Skema & Fungsi Convex**:
  ```bash
  cd apps && npx convex dev --once
  ```
- **Validasi Unit Test**:
  ```bash
  cd apps && npm test
  ```
- **Validasi Build / Typecheck**:
  ```bash
  cd apps && npm run build
  ```

---

## 8. Penilaian E2E

- **Rekomendasi**: `Recommended`
- **Alasan**: Modul ini memiliki interaksi UI baru (manajemen kelompok lintas kelas, modal tambah peserta, modal pindah ekskul, dan pembaruan tabel reaktif) yang perlu diverifikasi alur browser-nya melalui handoff `specs/e2e/feat-modul-manajemen-kelompok-ekstrakurikuler.md`.
