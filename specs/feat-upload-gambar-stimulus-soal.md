# Spesifikasi: Fitur Unggah Berkas Gambar Stimulus Soal pada Bank Soal

## 1. Masalah & Perilaku yang Diharapkan
- **Latar Belakang & Masalah**:
  Saat ini, input stimulus gambar pada formulir butir soal Bank Soal (`apps/app/(main)/bank-soal/[id]/page.tsx`) hanya menyediakan input teks URL (`stimulusMediaUrl`). Sebagian besar pengajar madrasah memiliki berkas gambar (peta, grafik, diagram, foto) di komputer atau ponsel mereka dan tidak memiliki hosting gambar publik atau merasa tidak praktis jika harus mengunggah ke pihak ketiga terlebih dahulu untuk mendapatkan link URL.
- **Perilaku yang Diharapkan**:
  1. **Dua Pilihan Sumber Gambar (Dual Mode)**:
     - Sediakan opsi pemilihan sumber gambar yang fleksibel pada bagian Wacana/Stimulus:
       - **Unggah Berkas Gambar** (Unggah langsung dari perangkat pengajar ke penyimpanan awan Convex File Storage).
       - **Tautan URL Gambar** (Memasukkan link URL eksternal seperti sebelumnya).
  2. **Pengalaman Pengguna Ramah Guru**:
     - Mode Unggah Berkas menyediakan area dropzone / tombol pilih berkas yang jelas, mendukung format `.png`, `.jpg`, `.jpeg`, `.webp`, dan `.svg` dengan batas ukuran hingga 5MB.
     - Indikator progres/status unggah ("Mengunggah berkas gambar...") yang responsif dan aman dari eror jaringan.
     - Setelah berkas berhasil terunggah, URL penyimpanan langsung didapat via Convex Storage API (`ctx.storage.getUrl(storageId)`), tersimpan di butir soal, dan pratinjau langsung (*live preview*) langsung muncul.
     - Pengajar dapat mengganti atau menghapus gambar yang telah diunggah dengan mudah.
  3. **Kompatibilitas Penuh (Zero Regression)**:
     - Kolom `stimulusMediaUrl` tetap dipertahankan dan menjadi payload utama URL gambar yang dikonsumsi oleh Ruang Ujian Santri (`ExamWorksheet.tsx`) maupun Lembar Koreksi Guru (`rekap-nilai/koreksi/[id]/page.tsx`).
     - Menambahkan kolom opsional `stimulusMediaStorageId: v.optional(v.id("_storage"))` pada skema `questions` agar kepemilikan berkas di Convex Storage tercatat secara rapi.

## 2. In / Out of Scope
- **In-Scope**:
  - `apps/convex/schema.ts`: Penambahan kolom `stimulusMediaStorageId: v.optional(v.id("_storage"))` pada tabel `questions`.
  - `apps/convex/bank/public/mutations.ts`:
    - Mutasi `generateUploadUrl` untuk pengajar terautentikasi.
    - Pembaharuan mutasi `createQuestion` dan `updateQuestion` untuk menerima `stimulusMediaStorageId` serta menyelesaikan URL publik via `ctx.storage.getUrl`.
  - `apps/app/(main)/bank-soal/[id]/page.tsx`:
    - Pembaruan UI wacana stimulus dengan kontrol tab / toggle antara "Unggah Berkas" dan "Tautan URL".
    - Input file tersembunyi dengan tombol pemicu Shadcn UI, drag-and-drop, validasi ukuran (< 5MB) dan tipe berkas.
    - Status loading saat upload dan tombol hapus/ganti gambar.
  - `apps/tests/bank-soal-stimulus-image-upload.test.ts`: Pengujian unit untuk mutasi dan integrasi komponen.
  - `specs/e2e/upload-gambar-stimulus-soal.md`: Spesifikasi E2E untuk serah terima verifikasi peramban.
- **Out-of-Scope**:
  - Fitur crop/sunting gambar bawaan (pengajar mengunggah gambar yang sudah siap).
  - Ekstraksi gambar otomatis dari berkas Word `.docx` (fitur terpisah).

## 3. Bukti & Berkas Terkait
- Permintaan Pengguna: "saya mau upload juga tanpa link. jadi bisa ada pilihan."
- Berkas terkait:
  - `apps/convex/schema.ts`
  - `apps/convex/bank/public/mutations.ts`
  - `apps/convex/bank/public/queries.ts`
  - `apps/app/(main)/bank-soal/[id]/page.tsx`
  - `apps/app/ujian/ExamWorksheet.tsx`
  - `apps/app/(main)/rekap-nilai/koreksi/[id]/page.tsx`

## 4. Kebutuhan Implementasi Terurut Dependensi
1. **Langkah 1 (Backend - Skema)**:
   Perbarui `apps/convex/schema.ts` pada tabel `questions` untuk menambahkan kolom `stimulusMediaStorageId: v.optional(v.id("_storage"))`.
2. **Langkah 2 (Backend - Mutasi Storage & Bank Soal)**:
   - Buat mutasi `generateUploadUrl` di `apps/convex/bank/public/mutations.ts` dengan otentikasi pengajar.
   - Buat helper/mutasi untuk menyimpan berkas storage dan mendapatkan URL publik `ctx.storage.getUrl(storageId)`.
   - Perbarui mutasi `createQuestion`, `updateQuestion`, dan `duplicateQuestion` agar mendukung `stimulusMediaStorageId` dan `stimulusMediaUrl`.
3. **Langkah 3 (Frontend - Antarmuka Bank Soal)**:
   - Pada `apps/app/(main)/bank-soal/[id]/page.tsx`, ubah bagian input media wacana dengan Tabs / Toggle:
     - Opsi A: "Unggah Berkas" (Tombol Unggah, drag-and-drop, pesan status, indikator loading, tombol hapus).
     - Opsi B: "Tautan URL" (Input teks link seperti saat ini).
   - Pastikan live preview menampilkan gambar baik dari hasil unggah maupun dari link URL.
4. **Langkah 4 (Pengujian & Validasi)**:
   - Buat pengujian unit di `apps/tests/bank-soal-stimulus-image-upload.test.ts`.
   - Jalankan `npx convex dev --once`.
   - Jalankan `npm --prefix apps run typecheck`.
   - Jalankan `npm --prefix apps run test`.
   - Jalankan `npm --prefix apps run test:ui-leak`.
5. **Langkah 5 (Dokumentasi & E2E Hand-off)**:
   - Siapkan berkas spesifikasi pengujian peramban di `specs/e2e/upload-gambar-stimulus-soal.md`.

## 5. Kriteria Penerimaan Terukur (Acceptance Criteria)
- `IMG-AC-001`: Tersedia pilihan (Tabs/Toggle) antara "Unggah Berkas" dan "Tautan URL" pada bagian Wacana/Stimulus Butir Soal.
- `IMG-AC-002`: Pengajar dapat mengunggah berkas gambar lokal (`.png`, `.jpg`, `.jpeg`, `.webp`, `.svg`) berukuran hingga 5MB secara langsung ke Convex File Storage.
- `IMG-AC-003`: Setelah unggah berhasil, pratinjau gambar langsung tampil di editor dan tersimpan ke butir soal tanpa error.
- `IMG-AC-004`: Pengajar tetap dapat menggunakan opsi tautan URL eksternal tanpa adanya perubahan perilaku negatif (*zero regression*).
- `IMG-AC-005`: Gambar hasil unggahan tampil dengan sempurna di lembar ujian santri (`ExamWorksheet`) dan lembar koreksi nilai guru (`rekap-nilai/koreksi/[id]`).

## 6. Risiko, Kompatibilitas & Keamanan
- **Keamanan**: Mutasi `generateUploadUrl` mewajibkan otentikasi pengajar (`requireAuthenticatedUser`).
- **Validasi Klien**: Validasi ukuran maksimal (5MB) dan MIME type (`image/png`, `image/jpeg`, `image/webp`, `image/svg+xml`) dilakukan sebelum berkas dikirim ke server.
- **Kompatibilitas**: Kolom `stimulusMediaUrl` tetap diisi dengan URL publik yang dihasilkan Convex (`ctx.storage.getUrl(storageId)`), sehingga komponen ujian santri dan cetak rekap tidak memerlukan perubahan protokol.

## 7. Perintah Validasi
- `npx convex dev --once`
- `npm --prefix apps run typecheck`
- `npm --prefix apps run test`
- `npm --prefix apps run test:ui-leak`

## 8. Ekspektasi Dokumentasi & E2E
- Rekomendasi E2E: **Recommended** (fitur visual interaktif pada UI editor Bank Soal dan Ruang Ujian Santri).
- Berkas serah terima: `specs/e2e/upload-gambar-stimulus-soal.md`.
