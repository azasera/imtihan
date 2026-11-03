# Spesifikasi Implementasi: Sesi Ujian & Generator Token (TASK-003)

## 1. Masalah & Perilaku yang Diharapkan
- **Masalah**: Pengajar dan panitia ujian memerlukan backend yang andal untuk menjadwalkan sesi ujian santri, menautkan sesi ke paket bank soal terstandar, mengatur rentang waktu dan durasi pengerjaan, serta menghasilkan token akses ujian 6 digit alfanumerik yang unik dan dapat di-generate ulang.
- **Perilaku yang Diharapkan**:
  1. Skema Convex memiliki tabel `examSessions` dengan index efisien (`by_token`, `by_creator`, `by_status`, `by_bank`).
  2. Fungsi publik & internal terisolasi rapi di `apps/convex/examSession/` mengikuti konvensi arsitektur Convex (`public/` dan `private/`).
  3. Generator token acak 6 digit alfanumerik yang aman, mudah dibaca (menghindari karakter ambigu seperti `O`, `0`, `I`, `1`), dan unik.
  4. Pengajar dapat membuat sesi, mengubah jadwal/durasi, mengaktifkan/menonaktifkan sesi, dan meregenerasi token ujian.
  5. Santri / publik dapat memverifikasi validitas token sesi ujian tanpa membocorkan data sensitif pengajar atau kunci jawaban.

## 2. In / Out of Scope
- **In-Scope**:
  - Definisi tabel `examSessions` di `apps/convex/schema.ts`.
  - Helper fungsi `generateExamToken()` di `apps/convex/examSession/private/helpers.ts`.
  - Mutasi publik di `apps/convex/examSession/public/mutations.ts`: `createExamSession`, `updateExamSession`, `regenerateSessionToken`, `setSessionStatus`, `deleteExamSession`.
  - Query publik di `apps/convex/examSession/public/queries.ts`: `listExamSessions`, `getExamSession`, `verifySessionToken`.
  - Pengujian unit untuk logika generator token, validasi durasi & status sesi.
  - Sinkronisasi deployment Convex development (`npx convex dev --once`).
- **Out-of-Scope**:
  - Halaman antarmuka penjadwalan sesi (akan dikerjakan pada `TASK-004`).
  - Halaman input token dan autentikasi santri via NISN (akan dikerjakan pada `TASK-005`).

## 3. Berkas Terkait
- `apps/convex/schema.ts`
- `apps/convex/examSession/private/helpers.ts`
- `apps/convex/examSession/public/mutations.ts`
- `apps/convex/examSession/public/queries.ts`
- `apps/tests/exam-session.test.ts`
- `specs/e2e/exam-session-backend.md`

## 4. Kebutuhan Implementasi Terurut Dependensi
1. **Pembaruan Skema (`apps/convex/schema.ts`)**:
   - Menambahkan tabel `examSessions` dengan field:
     `title`, `bankId`, `token`, `startTime`, `endTime`, `durationMinutes`, `randomizeQuestions`, `randomizeOptions`, `status`, `creatorTokenIdentifier`, `creatorName`, `createdAt`, `updatedAt`.
   - Menambahkan index `by_token`, `by_creator`, `by_status`, `by_bank`.
2. **Helper Logic (`apps/convex/examSession/private/helpers.ts`)**:
   - `generateExamToken(length = 6)`: Menghasilkan token alfanumerik kapital.
   - `requireAuthenticatedUser(ctx)`: Autentikasi pengajar.
3. **Public Mutations (`apps/convex/examSession/public/mutations.ts`)**:
   - `createExamSession`: Validasi bank soal, hitung durasi, generate token unik, simpan sesi.
   - `updateExamSession`: Mengubah parameter sesi.
   - `regenerateSessionToken`: Mengganti token lama dengan token baru acak.
   - `setSessionStatus`: Mengubah status menjadi "draft", "active", atau "ended".
   - `deleteExamSession`: Menghapus sesi non-aktif.
4. **Public Queries (`apps/convex/examSession/public/queries.ts`)**:
   - `listExamSessions`: Menampilkan daftar sesi milik pengajar dengan metadata bank soal.
   - `getExamSession`: Mengambil detail sesi lengkap.
   - `verifySessionToken`: Memverifikasi token untuk santri (mengecek status aktif dan jendela waktu).
5. **Pengujian Unit & E2E Classification**:
   - Menulis pengujian unit di `apps/tests/exam-session.test.ts`.
   - Mengklasifikasikan E2E sebagai `Recommended` (karena sesi ini merupakan backend fondasi untuk UI `TASK-004`).

## 5. Kriteria Penerimaan Terukur (Acceptance Criteria)
- `SESI-FR-001` & `SESI-FR-002`:
  - Token selalu berformat 6 karakter alfanumerik kapital.
  - Sesi tersimpan dengan `status: "draft"` secara default atau `"active"`.
  - Durasi menit harus bernilai positif (> 0).
  - Verifikasi token menghasilkan status ketersediaan sesi (apakah aktif dan dalam rentang waktu).
- Zero technical code leaks dalam pesan kesalahan pengguna.

## 6. Risiko & Kompatibilitas
- Perubahan skema aman dan memperluas tabel tanpa mengubah data tabel yang sudah ada (`subjects`, `questionBanks`, `questions`).
- Menjalankan `npx convex dev --once` untuk memperbarui data model TypeScript di deployment pengembang.
