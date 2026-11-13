# Spesifikasi: Perbaikan Validasi Token di Langkah 1 & Pembersihan Notifikasi Error

## 1. Definisi Masalah & Perilaku yang Diharapkan
- **Masalah**:
  1. Pada halaman pintu masuk ujian santri (`apps/app/ujian/page.tsx`), token ujian resmi berformat 8 karakter: 6 huruf token sesi (dari pengawas) + 2 digit terakhir nomor identitas santri (NISN/NIS/ID santri).
  2. Pada formulir Langkah 1, validasi token hanya memeriksa 6 huruf awal token sesi melalui query `verifySessionToken({ token: cleanToken.slice(0, 6) })`. Dua digit terakhir token santri **tidak divalidasi sama sekali di Langkah 1**.
  3. Akibatnya, santri yang memasukkan 2 digit nomor identitas yang salah (contoh: token `9SD4HD25` untuk santri dengan nomor induk `26.02.029` yang seharusnya berakhiran `29`) **tetap diizinkan melangkah ke Langkah 2 ("Periksa data Anda")**.
  4. Ketika santri menekan "Benar, masuk ruang ujian" di Langkah 2, mutasi backend `enterExamSession` menolak token dan melempar pesan *error*.
  5. Antarmuka menangkap *error* tersebut dan menampilkannya secara mentah ke kotak peringatan (`submitError`), sehingga teks internal Convex ikut bocor ke layar:
     `[CONVEX M(examSession/public/mutations:enterExamSession)] [Request ID: deae558df6bc1cf5] Server Error Uncaught Error: 2 angka terakhir token tidak cocok dengan nomor induk santri Anda... Called by client`.

- **Perilaku yang Diharapkan**:
  1. **Validasi Lengkap Sejak Langkah 1**:
     - Santri wajib memasukkan 8 karakter token (6 huruf token sesi + 2 angka nomor identitas).
     - Jika 2 digit terakhir token tidak cocok dengan nomor identitas santri yang terverifikasi, sistem langsung menolak di Langkah 1 dengan pesan peringatan yang ramah dan **tidak pernah meloloskan santri ke Langkah 2**.
     - Tombol "Lanjut" menolak proses jika token belum valid atau proses verifikasi token di server masih berjalan (*loading*).
  2. **Pembersihan Pesan Kesalahan (*Sanitize Convex Error*)**:
     - Dibuat fungsi utilitas pembersih pesan error (misal: `cleanErrorMessage`) yang membuang semua kode pelacak internal Convex (`[CONVEX ...]`, `[Request ID: ...]`, `Server Error`, `Uncaught Error:`, `Called by client`).
     - Banner peringatan di Langkah 1 menampilkan pesan berbahasa Indonesia yang bersih, rapi, dan mudah dipahami:
       > *"2 angka terakhir token tidak cocok dengan nomor induk santri Anda. Pastikan memasukkan 6 huruf token sesi diikuti 2 angka terakhir nomor identitas Anda. (Sisa percobaan: 3)"*

## 2. In / Out of Scope
- **In-Scope**:
  - `apps/convex/students/public/queries.ts`: Menyertakan `twoDigits: extractStudentTwoDigits(student)` pada `studentGateProfile` agar frontend dapat memvalidasi kecocokan token 2 digit santri secara instan.
  - `apps/convex/examSession/public/queries.ts`: Memperbarui `verifySessionToken` agar menerima argumen opsional `identifier` dan memvalidasi kecocokan 2 digit jika token 8 karakter dikirimkan.
  - `apps/app/ujian/page.tsx`:
    - Menambahkan utilitas `cleanErrorMessage` untuk membersihkan error Convex dari awalan teknis.
    - Memperketat `handleProceedToConfirm`: memvalidasi panjang 8 karakter, validitas token sesi, dan kecocokan 2 digit santri sebelum berpindah ke `step = 2`.
    - Merapikan visual banner error.
  - `apps/tests/student-entry.test.ts`: Menambahkan pengujian unit untuk menjamin penolakan token salah di Langkah 1 dan sanitasi pesan error.
- **Out-of-Scope**:
  - Mengubah skema database Convex (`schema.ts`).
  - Mengubah logika pembagian lembar soal ujian santri di `ExamWorksheet.tsx`.

## 3. Bukti & Berkas Terkait
- Tangkapan layar pengguna:
  - Gambar 1 (`media_1794154905311_413f6051.png`): Layar Langkah 2 "Periksa data Anda" yang tetap muncul meskipun token salah.
  - Gambar 2 (`media_1794154923980_63da9131.png`): Kotak banner error merah dengan teks mentah `[CONVEX M(...)] Server Error Uncaught Error: ...`.
- Berkas terkait:
  - `apps/convex/students/public/queries.ts`
  - `apps/convex/examSession/public/queries.ts`
  - `apps/app/ujian/page.tsx`
  - `apps/tests/student-entry.test.ts`

## 4. Kebutuhan Implementasi Terurut Dependensi
1. **Langkah 1**: Perbarui `apps/convex/students/public/queries.ts`:
   - Pada `studentGateProfile`, sertakan field `twoDigits: extractStudentTwoDigits(student)`.
2. **Langkah 2**: Perbarui `apps/convex/examSession/public/queries.ts`:
   - Pada `verifySessionToken`, terima `identifier: v.optional(v.string())`.
   - Jika token 8 karakter dan `identifier` diberikan, cari student dan verifikasi kecocokan 2 digit terakhir.
3. **Langkah 3**: Perbarui `apps/app/ujian/page.tsx`:
   - Definisikan fungsi `cleanErrorMessage`.
   - Gunakan `cleanErrorMessage` pada seluruh blok `catch` pemanggilan mutasi/aksi.
   - Perketat `handleProceedToConfirm` agar:
     - Memeriksa apakah `sessionVerification` selesai dimuat dan valid.
     - Memeriksa kecocokan 2 digit santri jika `lookedUpStudent?.twoDigits` ada.
     - Jika salah satu tidak valid, tampilkan `submitError` bersih dan batalkan perpindahan `step = 2`.
4. **Langkah 4**: Perbarui pengujian unit di `apps/tests/student-entry.test.ts`.
5. **Langkah 5**: Jalankan tes unit dan typecheck lokal.

## 5. Kriteria Penerimaan yang Terukur
1. Token yang salah (misal 2 digit terakhir tidak cocok dengan santri) langsung ditolak di Langkah 1 dengan pesan yang jelas.
2. Pengguna tidak dapat beralih ke Langkah 2 ("Periksa data Anda") jika token ujian tidak valid.
3. Seluruh pesan kesalahan yang tampil di antarmuka tidak memuat teks mentah `[CONVEX ...]` atau `Server Error Uncaught Error:`.
4. Seluruh pengujian di `apps/tests/student-entry.test.ts` lulus 100%.
5. `tsc --noEmit` lolos bersih tanpa kesalahan kompilasi.
6. Nihil kebocoran kode spesifikasi teknis dan nihil emoji di antarmuka.

## 6. Risiko, Kompatibilitas, & Mitigasi
- **Risiko**: Ada kemungkinan santri memasukkan token lama (6 karakter).
- **Mitigasi**: Pesan panduan di input token sudah menjelaskan format 6 huruf sesi + 2 digit nomor induk; jika santri baru mengetik 6 karakter, sistem mengingatkan bahwa token memerlukan 8 karakter.

## 7. Perintah Validasi Repositori
- `node --test apps/tests/student-entry.test.ts`
- `node apps/node_modules/typescript/bin/tsc --noEmit --project apps/tsconfig.json`

## 8. Ekspektasi Dokumentasi
- Pertahankan seluruh komentar kode yang ada.
