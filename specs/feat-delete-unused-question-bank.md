# Spesifikasi: Fitur - Penghapusan Aman Paket Bank Soal yang Tidak Terpakai

## 1. Deskripsi Masalah & Perilaku yang Diharapkan
- **Masalah**:
  Sebelumnya, mutasi `deleteQuestionBank` tidak memverifikasi apakah paket bank soal sedang atau pernah ditautkan ke sesi ujian (`examSessions`). Jika pengajar menghapus paket yang sudah memiliki riwayat sesi, data ujian dan nilai santri akan kehilangan rujukan (*orphaned*). Di sisi lain, pengajar membutuhkan kepastian visual di antarmuka untuk mengetahui paket mana yang masih draf / belum terpakai sehingga aman untuk dihapus.
- **Perilaku yang Diharapkan**:
  1. **Proteksi di Server (Convex Backend)**:
     - Mutasi `deleteQuestionBank` memeriksa keterkaitan dengan tabel `examSessions`.
     - Jika paket memiliki relasi ke sesi ujian (`sessionCount > 0`), server menolak penghapusan dengan pesan informatif yang menyebutkan judul sesi terkait.
     - Jika paket belum pernah dipakai sesi (`sessionCount === 0`), server menghapus seluruh butir soal (`questions`) yang berelasi dan menghapus baris `questionBanks`.
     - Hanya pengajar pemilik paket (`authorTokenIdentifier`) yang berhak menghapus.
  2. **Pengayaan Data Query**:
     - Query `listQuestionBanks` menyertakan `sessionCount` (jumlah sesi ujian yang menggunakan paket) dan `activeSessionTitle` (judul sesi aktif bila ada).
  3. **Antarmuka Pengajar (`/bank-soal`)**:
     - Setiap kartu paket menampilkan status pemakaian yang jelas ("Belum dipakai" vs "Dipakai di X sesi").
     - Tombol Hapus aktif hanya untuk paket yang belum terpakai dengan dialog konfirmasi yang menegaskan konsekuensi penghapusan.
     - Tombol Hapus dinonaktifkan (*disabled*) untuk paket yang sudah terpakai disertai keterangan bahwa paket dilindungi karena memiliki riwayat sesi ujian.

## 2. In / Out of Scope
- **In-Scope**:
  - `apps/convex/bank/public/mutations.ts`: Validasi integritas relasi pada `deleteQuestionBank`.
  - `apps/convex/bank/public/queries.ts`: Menambahkan `sessionCount` dan `activeSessionTitle` pada `listQuestionBanks`.
  - `apps/app/(main)/bank-soal/page.tsx`: Indikator status pemakaian, tombol hapus bersyarat, dan dialog konfirmasi.
  - `apps/tests/bank-soal-delete.test.ts`: Pengujian unit untuk memverifikasi logika proteksi dan antarmuka.
- **Out-of-Scope**:
  - Menghapus sesi ujian atau lembar jawaban santri.
  - Mengubah skema basis data Convex (`schema.ts`).

## 3. Bukti & Berkas Terkait
- Permintaan pengguna: "Untuk Bank Soal. apa rencana anda agar bank soal yg tdk terpakai bisa dihapus" & "lanjut sesuai rencana".
- Berkas terkait:
  - `apps/convex/bank/public/mutations.ts`
  - `apps/convex/bank/public/queries.ts`
  - `apps/app/(main)/bank-soal/page.tsx`
  - `apps/tests/bank-soal-delete.test.ts`

## 4. Kebutuhan Perbaikan Terurut Dependensi
1. **Pembaruan Mutasi Backend (`apps/convex/bank/public/mutations.ts`)**:
   - Menambahkan pengecekan `examSessions` pada `deleteQuestionBank`.
2. **Pembaruan Query Backend (`apps/convex/bank/public/queries.ts`)**:
   - Menghitung `sessionCount` dan `activeSessionTitle` pada `listQuestionBanks`.
3. **Sinkronisasi Convex Dev**:
   - Menjalankan `npx convex dev --once`.
4. **Pembaruan Antarmuka (`apps/app/(main)/bank-soal/page.tsx`)**:
   - Menampilkan status pemakaian di kartu bank soal.
   - Mengaktifkan tombol hapus hanya jika `sessionCount === 0`.
   - Menampilkan dialog konfirmasi dan pesan umpan balik toast.
5. **Pembuatan Pengujian Unit (`apps/tests/bank-soal-delete.test.ts`)**:
   - Menguji pencegahan penghapusan paket berelasi sesi dan keberhasilan penghapusan paket bersih.
6. **Validasi Repositori**:
   - Menjalankan `npm run typecheck`, `npm test`, dan `npm --prefix apps run test:ui-leak`.

## 5. Kriteria Penerimaan
- Paket bank soal tanpa sesi ujian (`sessionCount === 0`) dapat dihapus tuntas beserta seluruh butir soalnya.
- Paket bank soal yang memiliki sesi ujian ditolak oleh server dan dinonaktifkan di antarmuka pengguna.
- Pengajar yang bukan pemilik dilarang menghapus paket milik orang lain.
- Seluruh tes lulus 100% (377+ tes).
- Nol kebocoran kode spesifikasi teknis di UI.

## 6. Penilaian E2E
- **Rekomendasi**: `Recommended` (Perubahan alur hapus kartu dan konfirmasi di antarmuka bank soal).
- **Handoff**: `specs/e2e/delete-unused-question-bank.md`.
