# Spesifikasi Implementasi: Pintu Masuk Ujian Santri & Verifikasi Token (TASK-005)

## 1. Masalah & Perilaku yang Diharapkan
- **Masalah**: Santri pesantren memerlukan pintu masuk ujian yang cepat, mudah diakses di lingkungan laboratorium komputer atau tablet santri tanpa prosedur pendaftaran akun atau verifikasi email yang rumit. Santri cukup memasukkan NISN (Nomor Induk Santri), Nama Lengkap, dan Token Ujian 6 digit yang diberikan oleh pengawas/ustadz.
- **Perilaku yang Diharapkan**:
  1. Halaman pintu gerbang ujian santri (`/ujian`) dengan tata letak bersih, elegan, dan bebas distraksi.
  2. Formulir masuk santri:
     - Nomor Induk / NISN (wajib, alfanumerik/angka).
     - Nama Lengkap Santri (wajib).
     - Kelas / Marhalah (opsional/pilihan).
     - Token Akses Ujian 6 Karakter (wajib, input uppercase otomatis).
  3. Verifikasi token secara interaktif:
     - Memeriksa keabsahan token 6 digit via Convex query `verifySessionToken`.
     - Menampilkan pratinjau informasi ujian: Judul Ujian, Mata Pelajaran, Tingkat Kelas, Jumlah Soal, dan Batas Durasi Pengerjaan seketika token valid terdeteksi.
     - Menolak akses jika token salah, sesi berstatus `draf`, atau sesi telah `berakhir`.
  4. Pendaftaran peserta sesi (`startExamSession` mutation) yang mencatat santri ke tabel `examParticipants` dengan status `in_progress` dan timestamp mulai, tanpa mengharuskan akun email santri.
  5. Jika santri yang sama (kombinasi sesi + NISN) masuk kembali saat sesi masih berlangsung (misal browser tertutup atau listrik padam), sistem memulihkan sesi ujian santri secara aman (resume session).
  6. Setelah santri menekan "Mulai Mengerjakan Ujian", data sesi disimpan ke session storage lokal dan santri dialihkan ke lembar instruksi/pengerjaan ujian.
  7. Bebas emoji (menggunakan ikon Lucide) dan zero technical code leaks (`SCR-*`, `TASK-*`, dsb.).

## 2. In / Out of Scope
- **In-Scope**:
  - Penambahan skema tabel `examParticipants` di `apps/convex/schema.ts`.
  - Mutasi `enterExamSession` di `apps/convex/examSession/public/mutations.ts` untuk registrasi santri tanpa email.
  - Halaman antarmuka masuk santri di `apps/app/ujian/page.tsx`.
  - Halaman kartu informasi dan konfirmasi instruksi ujian santri sebelum membuka lembar soal.
  - Unit tests di `apps/tests/student-entry.test.ts`.
  - Spek E2E di `specs/e2e/student-exam-entry.md`.
- **Out-of-Scope**:
  - Lembar navigasi butir soal, hitung mundur timer pengerjaan, dan auto-save jawaban (merupakan cakupan `TASK-006`).

## 3. Berkas Terkait
- `apps/convex/schema.ts`
- `apps/convex/examSession/public/mutations.ts`
- `apps/app/ujian/page.tsx`
- `apps/tests/student-entry.test.ts`
- `specs/e2e/student-exam-entry.md`
- `.planora/EXECUTION/TODO.md`

## 4. Kebutuhan Implementasi Terurut Dependensi
1. **Pembaruan Skema (`apps/convex/schema.ts`)**:
   - Menambahkan tabel `examParticipants` dengan field:
     `sessionId`, `nisn`, `studentName`, `className`, `tokenUsed`, `startedAt`, `finishedAt`, `status` (`in_progress` | `submitted`).
   - Index: `by_session`, `by_session_and_nisn`, `by_nisn`.
2. **Mutasi Masuk Ujian (`apps/convex/examSession/public/mutations.ts`)**:
   - `enterExamSession`: Memvalidasi token, memeriksa keaktifan sesi, memeriksa apakah peserta sudah pernah submit atau baru, mencatat ke `examParticipants`, dan mengembalikan data otorisasi pengerjaan ujian.
3. **Penyusunan Antarmuka Gerbang Ujian (`apps/app/ujian/page.tsx`)**:
   - Layout CBA terpusat dengan logo E-Imtihan At-Tauhid.
   - Form input NISN, Nama, Kelas, dan Token 6 digit dengan kartu pratinjau sesi realtime.
   - Kartu instruksi tata tertib ujian sebelum memulai.
4. **Sinkronisasi Convex Dev**:
   - Menjalankan `npx convex dev --once` untuk memperbarui tipe data.
5. **Pengujian & Validasi**:
   - Unit test logika verifikasi dan sanitasi di `apps/tests/student-entry.test.ts`.
   - Pemindaian kebocoran teks spesifikasi teknis.

## 5. Kriteria Penerimaan Terukur (Acceptance Criteria)
- Santri dapat memvalidasi token 6 digit dan melihat judul ujian yang akan dihadapi.
- Santri dapat masuk tanpa registrasi email.
- Token salah atau sesi non-aktif menampilkan pesan ramah tanpa bocoran kode error teknis.
- TypeScript compile 0 error (`npm run typecheck`).
- Zero technical code leaks.

## 6. Risiko & Kompatibilitas
- Santri di jaringan lokal lab: pastikan query `verifySessionToken` dan mutasi `enterExamSession` tidak memerlukan login Better-Auth.
