# Spesifikasi Perbaikan: Kejelasan Notifikasi Saat Santri Mencoba Mengikuti Ujian Dua Kali

## 1. Definisi Masalah & Perilaku yang Diharapkan
- **Masalah**:
  1. Ketika santri yang telah menyelesaikan dan mengumpulkan lembar ujian (status `submitted`) mencoba login kembali ke sesi ujian yang sama, sistem di backend (`apps/convex/examSession/public/mutations.ts`) melempar eksepsi standar:
     `throw new Error("Anda telah menyelesaikan dan mengumpulkan lembar ujian ini sebelumnya.")`.
  2. Di lingkungan produksi Convex, eksepsi `new Error(...)` di-redact oleh Convex menjadi teks `Server Error`.
  3. Di sisi antarmuka klien (`apps/app/ujian/page.tsx`), fungsi `cleanErrorMessage` memiliki cacat pembersihan regex:
     `raw.replace(/^Server Error\s*/i, "").replace(/\.?\s*Called by client.*$/i, ".").trim()`.
     Ketika `Server Error. Called by client...` diproses, ekspresi reguler menggantikan seluruh teks menjadi hanya satu tanda titik `"."`.
  4. Akibatnya, notifikasi Sonner toast di layar santri hanya menampilkan ikon silang diikuti sebuah titik: `(x) .` (sebagaimana terlihat pada tangkapan layar pengguna `media_1794985531618_1886dcea.png`), tanpa pesan yang dapat dipahami santri maupun pengawas.
  5. Selain itu, pada Langkah 1 gerbang ujian, verifikasi token belum secara proaktif mendeteksi apakah santri yang bersangkutan sudah mengumpulkan ujian untuk sesi tersebut, sehingga santri masih harus menunggu sampai menekan konfirmasi di Langkah 2 untuk mengetahui penolakan tersebut.

- **Perilaku yang Diharapkan**:
  1. **Notifikasi yang Jelas, Informatif, & Menenangkan**:
     - Jika santri yang sudah berstatus `submitted` mencoba masuk ke sesi ujian yang sama, sistem menampilkan pesan yang jelas dan ramah:
       > *"Anda telah menyelesaikan dan mengumpulkan lembar ujian ini. Tidak diperbolehkan mengikuti ujian dua kali pada sesi yang sama. Hubungi pengawas ruang jika Anda memerlukan ujian susulan."*
     - Tidak boleh ada notifikasi yang hanya menampilkan tanda titik `"."` atau kata ambigu seperti `Server Error`.
  2. **Penggunaan `ConvexError` di Backend**:
     - Backend menggunakan `ConvexError` dari `convex/values` untuk seluruh validasi domain di `enterExamSession`, sehingga pesan validasi dalam bahasa Indonesia tidak pernah disamarkan oleh Convex menjadi `Server Error` di lingkungan produksi.
  3. **Pendeteksian Dini di Langkah 1 (`verifySessionToken`)**:
     - `verifySessionToken` memeriksa apakah nomor induk santri (`identifier`) yang dimasukkan telah tercatat dalam `examParticipants` untuk sesi tersebut dengan status `submitted`.
     - Jika sudah selesai, `verifySessionToken` mengembalikan flag `isAlreadySubmitted: true` dan pesan penjelasan yang ramah, sehingga tombol di Langkah 1 langsung menolak dan menampilkan penjelasan sebelum santri kebingungan di Langkah 2.
  4. **Penyempurnaan `cleanErrorMessage`**:
     - Membaca `ConvexError` data secara langsung jika tersedia.
     - Memastikan fallback aman dan tidak pernah mengembalikan tanda titik `"."` tunggal atau string kosong.

## 2. In / Out of Scope
- **In-Scope**:
  - `apps/convex/examSession/public/mutations.ts`: Menggunakan `ConvexError` pada validasi santri yang sudah mengumpulkan ujian (`existingParticipant.status === "submitted"`) dan validasi domain lainnya di `enterExamSession`.
  - `apps/convex/examSession/public/queries.ts`: Memperluas `verifySessionToken` agar memeriksa status keikutsertaan santri (`isAlreadySubmitted: true`) jika santri terdaftar dan telah mengumpulkan.
  - `apps/convex/model/nisn.ts`: Memastikan `getValidStudentTwoDigits` fleksibel mendukung 2 angka dari NISN, NIS, maupun ID Santri.
  - `apps/app/ujian/page.tsx`:
    - Memperbaiki `cleanErrorMessage` agar mengekstrak data `ConvexError` dan tidak pernah mengembalikan tanda titik `"."`.
    - Menghubungkan `identifier: cleanNisn` ke query `verifySessionToken`.
    - Menampilkan notifikasi banner dan toast yang ramah dan tegas ketika santri terdeteksi sudah menyelesaikan ujian.
  - `apps/tests/student-entry.test.ts`: Menambahkan pengujian untuk memastikan proteksi ujian dua kali memberikan pesan yang jelas dan tidak bocor kode teknis.
- **Out-of-Scope**:
  - Mengubah logika penilaian atau koreksi lembar soal di `ExamWorksheet.tsx`.
  - Mengubah skema database di `schema.ts`.

## 3. Bukti & Berkas Terkait
- Tangkapan layar pengguna:
  - `media_1794985531618_1886dcea.png`: Toast putih dengan ikon silang hitam dan hanya satu titik `.` di tengah layar.
- Berkas terkait:
  - `apps/app/ujian/page.tsx`
  - `apps/convex/examSession/public/mutations.ts`
  - `apps/convex/examSession/public/queries.ts`
  - `apps/convex/model/nisn.ts`
  - `apps/tests/student-entry.test.ts`

## 4. Kebutuhan Implementasi Terurut Dependensi
1. **Langkah 1**: Perbarui `apps/convex/model/nisn.ts`:
   - Lengkapi `getValidStudentTwoDigits` agar mengembalikan seluruh kemungkinan 2 angka valid (dari NISN, NIS, dan santriId) sehingga santri tidak ditolak karena beda nomor acuan.
2. **Langkah 2**: Perbarui `apps/convex/examSession/public/mutations.ts`:
   - Import `ConvexError` dari `convex/values`.
   - Gunakan `new ConvexError(...)` untuk penolakan santri yang sudah `submitted`.
   - Gunakan `new ConvexError(...)` untuk validasi domain nomor induk, token, status sesi, dan kelas.
3. **Langkah 3**: Perbarui `apps/convex/examSession/public/queries.ts`:
   - Di `verifySessionToken`, periksa apakah santri dengan nomor induk tersebut sudah ada di `examParticipants` dengan status `submitted`.
   - Kembalikan `isAlreadySubmitted: true` beserta pesan yang jelas.
4. **Langkah 4**: Perbarui `apps/app/ujian/page.tsx`:
   - Perbaiki `cleanErrorMessage` untuk menangani objek `ConvexError` dan membuang bug titik `"."`.
   - Sambungkan `identifier: cleanNisn` ke `verifySessionToken`.
   - Tangani kondisi `isAlreadySubmitted` baik di Langkah 1 (banner peringatan kuning/merah & tombol disabled) maupun saat mutasi masuk gagal.
5. **Langkah 5**: Tambahkan test assertion di `apps/tests/student-entry.test.ts`.
6. **Langkah 6**: Validasi dengan menjalankan tes dan `tsc`.

## 5. Kriteria Penerimaan yang Terukur
1. Ketika santri yang sudah menyelesaikan ujian mencoba login kembali dengan token dan nomor induk yang sama, muncul notifikasi jelas:
   *"Anda telah menyelesaikan dan mengumpulkan lembar ujian ini. Tidak diperbolehkan mengikuti ujian dua kali pada sesi yang sama. Hubungi pengawas ruang jika Anda memerlukan ujian susulan."*
2. Tidak ada lagi toast dengan pesan satu titik `"."` atau `Server Error`.
3. Pada Langkah 1, jika token dan nomor induk santri yang sudah submit dimasukkan, antarmuka langsung menampilkan banner informatif bahwa ujian untuk sesi tersebut sudah selesai.
4. Seluruh pengujian di `apps/tests/student-entry.test.ts` (dan seluruh suite aplikasi) lulus 100%.
5. Bebas dari kebocoran kode spesifikasi teknis dan bebas emoji.

## 6. Risiko, Kompatibilitas, & Mitigasi
- **Risiko**: Santri yang sedang melanjutkan ujian (status `in_progress`) tidak boleh salah terdeteksi sebagai `submitted`.
- **Mitigasi**: Pengecekan secara eksplisit memeriksa `status === "submitted"`. Santri yang berstatus `in_progress` tetap diizinkan melanjutkan lembar ujiannya (`isResumed: true`).

## 7. Perintah Validasi Repositori
- `cd apps && npm test -- tests/student-entry.test.ts`
- `cd apps && npx tsc --noEmit`

## 8. Ekspektasi Dokumentasi
- Pertahankan komentar kode dalam bahasa Indonesia yang bersih dan rapi.
