# Spesifikasi: Fitur Unggah Berkas Dokumen Word (.docx) dan Teks (.txt) pada Bank Soal

## 1. Masalah & Perilaku yang Diharapkan
- **Latar Belakang & Masalah**:
  Saat ini, pengajar harus menyalin dan menempel teks naskah soal secara manual ke dalam kotak textarea pada editor bank soal (`apps/components/bank-soal/question-import-panel.tsx`). Sebagian besar naskah soal guru di madrasah/sekolah tersimpan dalam format berkas Microsoft Word (`.docx`). Format pengetikan di Word sering kali tidak seragam: opsi jawaban A, B, C, D kerap kali menyatu dalam satu baris paragraf (misal: `Zat yang terkandung ... disebut ....a. Enzimb. Nutrien c. Hormond. Elektrolit`) tanpa pemisah enter, dan nomor soal tidak teratur. Mewajibkan guru merapikan teks secara manual atau meminta asisten luar untuk mengubahnya ke format khusus terbukti tidak praktis untuk alur kerja guru sehari-hari.
- **Perilaku yang Diharapkan**:
  1. **Zona Unggah Berkas Soal Langsung (File Picker & Drag-and-Drop)**:
     - Pada panel impor bank soal, sediakan zona unggah berkas yang jelas dan ramah pengajar, mendukung berkas Word (`.docx`) dan naskah teks (`.txt`).
     - Pengajar cukup memilih file atau menarik file langsung ke area unggah.
  2. **Ekstraksi Cerdas Dokumen Word (.docx)**:
     - Membaca dan mengekstrak dokumen `.docx` secara instan langsung di peramban (client-side) tanpa dependensi eksternal berat.
     - Mampu memecah opsi jawaban yang menempel dalam satu baris (misal opsi `a.`, `b.`, `c.`, `d.` yang ditulis bersambung).
     - Mampu mendeteksi pergantian ke bagian soal uraian/essay (misalnya baris `B. Jawablah pertanyaan...`).
  3. **Pengisian Otomatis & Pratinjau Siap Tinjau**:
     - Teks hasil ekstraksi otomatis mengisi kotak naskah dalam format bersih bernomor dan terstruktur.
     - Menampilkan notifikasi sukses yang ramah menginformasikan jumlah butir soal yang berhasil dibaca dari berkas.
     - Pengajar dapat langsung menekan "Periksa tulisan" untuk melihat kartu soal dan menentukan kunci jawaban sebelum disimpan.
  4. **Kompatibilitas Penuh (Zero Regression)**:
     - Mempertahankan semua fungsi penafsir `parseQuestionImport`, `buildImportTemplateText`, `chunkImportItems`, dan mutasi `importQuestions`.
     - Mempertahankan jumlah elemen `<Button` Shadcn (tepat 4) dan variant (tepat 3) di `question-import-panel.tsx` agar tidak memutus kontrak pengujian `question-import.test.ts`.
     - Bebas dari kebocoran kode spesifikasi teknis dan nihil penggunaan emoji.

## 2. In / Out of Scope
- **In-Scope**:
  - `apps/lib/docx-extractor.ts`: Modul pengurai berkas `.docx` client-side berbasis standard decompression stream, normalisasi spasi/tanda baca, pemecah opsi inline, dan pendeteksi essay.
  - `apps/components/bank-soal/question-import-panel.tsx`: Penambahan kartu aksi unggah berkas Word/Teks dengan input file tersembunyi dan tombol interaktif yang ramah pengajar.
  - `apps/tests/docx-import.test.ts`: Pengujian unit untuk memvalidasi akurasi ekstraksi dokumen Word riil (`IPA 8A SOAL.docx`) dan kasus batas (teks kosong, opsi bersambung, essay).
  - `specs/e2e/bank-soal-file-upload.md`: Spesifikasi E2E untuk serah terima verifikasi peramban.
- **Out-of-Scope**:
  - Mengubah skema database Convex (`apps/convex/schema.ts`).
  - OCR pada dokumen gambar/PDF hasil pindai (fokus pada dokumen teks asli `.docx` dan `.txt`).

## 3. Bukti & Berkas Terkait
- Keluhan dan permintaan pengguna: "apa semua guru harus seperti ini prosesnya?. anda yg memebuat teks siap copy. jelas ini tdk praktis. bagaimana kalau kita buat fitur upload file" -> Disetujui "ya, lanjut".
- Berkas acuan soal riil: `soal/IPA 8A SOAL.docx` (memuat 20 butir pilihan ganda dengan opsi bersambung dan 5 butir essay).
- Berkas terkait:
  - `apps/lib/docx-extractor.ts` (baru)
  - `apps/components/bank-soal/question-import-panel.tsx`
  - `apps/lib/question-import.ts`
  - `apps/tests/docx-import.test.ts` (baru)
  - `apps/tests/question-import.test.ts`
  - `apps/tests/question-import-teacher-friendly.test.ts`
  - `apps/tests/question-import-model-selector.test.ts`

## 4. Kebutuhan Implementasi Terurut Dependensi
1. **Langkah 1**: Buat utilitas `apps/lib/docx-extractor.ts` yang mengurai `word/document.xml` dari berkas buffer array `.docx`, mengekstrak paragraf, memecah opsi inline `a. ... b. ... c. ... d. ...`, mengenali bagian essay, dan menyusun teks bernomor bersih.
2. **Langkah 2**: Buat pengujian unit komprehensif di `apps/tests/docx-import.test.ts` yang menguji file `IPA 8A SOAL.docx` dan mengonfirmasi bahwa 25 butir soal (20 PG + 5 essay) berhasil diuraikan dengan benar.
3. **Langkah 3**: Perbarui `apps/components/bank-soal/question-import-panel.tsx` dengan menambahkan kartu "Unggah Berkas Soal (.docx / .txt)" yang memicu pemilihan berkas, membaca berkas secara asinkron, dan mengisi teks naskah secara otomatis.
4. **Langkah 4**: Jalankan validasi menyeluruh: `npm --prefix apps run typecheck`, `npm --prefix apps run test`, dan `npm --prefix apps run test:ui-leak`.
5. **Langkah 5**: Siapkan berkas serah terima E2E di `specs/e2e/bank-soal-file-upload.md`.

## 5. Kriteria Penerimaan yang Terukur
1. Berkas dokumen Word riil (`IPA 8A SOAL.docx`) dapat diunggah dan otomatis terurai menjadi 25 butir soal (20 PG dan 5 essay).
2. Opsi jawaban yang menempel tanpa enter (seperti `a. Enzimb. Nutrien c. Hormond. Elektrolit`) berhasil dipisahkan menjadi opsi A, B, C, D terpisah.
3. Pengajar mendapatkan notifikasi toast sukses saat berkas berhasil dimuat.
4. Seluruh pengujian unit eksisting (401+ tes) tetap lulus 100% tanpa regresi.
5. Nol kebocoran kode spesifikasi teknis dan nihil emoji di antarmuka pengguna.

## 6. Penilaian E2E
- **Rekomendasi**: `Recommended`
- **Alasan**: Merupakan interaksi antarmuka pengguna yang melibatkan pemilihan berkas di peramban, pembaruan state textarea, dan peninjauan pratinjau kartu soal.
