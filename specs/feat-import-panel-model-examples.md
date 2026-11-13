# Spesifikasi: Kartu Contoh Interaktif 4 Model Soal pada Tempel Naskah Massal

## 1. Masalah & Perilaku yang Diharapkan
- **Latar Belakang & Masalah**:
  Pengajar madrasah yang membuka tab "Tempel banyak sekaligus" pada editor bank soal (`apps/components/bank-soal/question-import-panel.tsx`) masih merasa bingung bagaimana cara menulis berbagai model soal yang didukung oleh sistem (Pilihan Ganda standar, Benar/Salah, Pilihan Ganda Kompleks multi-kunci, dan Essay/Uraian). Kartu petunjuk sebelumnya hanya menyebutkan format pilihan ganda secara umum tanpa memperlihatkan cara menulis penanda tipe soal lainnya.
- **Perilaku yang Diharapkan**:
  1. **Tab Selektor Contoh 4 Model Soal**:
     - Tepat di atas kotak teks naskah, sediakan 4 tab / segmented pill interaktif untuk model soal:
       1. **Pilihan Ganda (PG)**: Menampilkan cara penulisan nomor, opsi A–E, dan kunci berbintang `*`.
       2. **Benar / Salah**: Menampilkan penanda `(benar/salah)` dan penulisan kunci `B` atau `S`.
       3. **PG Kompleks**: Menampilkan penanda `(pg kompleks)` dan multi-kunci berbintang `*` pada 2+ opsi.
       4. **Essay**: Menampilkan penanda `(essay)` dan pedoman penilaian `rubrik: ...`.
  2. **Aksi 1-Klik "Sisipkan Contoh Ini" (*Insert Sample Snippet*)**:
     - Setiap model soal dilengkapi tombol untuk menyisipkan cuplikan naskah model tersebut langsung ke dalam kotak naskah soal, sehingga guru dapat langsung mengedit teksnya tanpa harus menghafal sintaks penanda.
  3. **Penjelasan Kolom Excel Terpadu**:
     - Di samping kartu naskah Word, sertakan petunjuk ringkas pengisian kolom `tipe` dan `kunci` pada lembar kerja Excel/Spreadsheet.
  4. **Kompatibilitas Penuh (Zero Regression)**:
     - Tetap memenuhi aturan pengujian `question-import.test.ts` (jumlah elemen `<Button` dan `variant` tetap sesuai kontrak 4 `<Button` dan 3 variant).
     - Tetap mempertahankan seluruh fungsi penafsir `parseQuestionImport`, `buildImportTemplateText`, dan mutasi `importQuestions`.
     - Bebas kode spesifikasi teknis dan tidak menggunakan emoji.

## 2. In / Out of Scope
- **In-Scope**:
  - `apps/components/bank-soal/question-import-panel.tsx`: Penambahan kartu tab interaktif 4 model soal beserta tombol sisipkan cuplikan contoh.
  - `apps/tests/question-import-model-selector.test.ts`: Pengujian unit untuk memverifikasi keberadaan selektor model soal dan nihil kebocoran kode teknis.
- **Out-of-Scope**:
  - Mengubah logika penafsir di `apps/lib/question-import.ts`.
  - Mengubah skema database Convex di `apps/convex/schema.ts`.

## 3. Bukti & Berkas Terkait
- Keluhan pengguna: "masih bingung, model soal, PG, BENAR/SALAH/ESSAY dst" -> Disetujui "ya".
- Berkas terkait:
  - `apps/components/bank-soal/question-import-panel.tsx`
  - `apps/lib/question-import.ts`
  - `apps/tests/question-import-model-selector.test.ts` (baru)
  - `apps/tests/question-import.test.ts`

## 4. Kebutuhan Implementasi Terurut Dependensi
1. **Langkah 1**: Rancang komponen mini selektor contoh 4 model soal di dalam `apps/components/bank-soal/question-import-panel.tsx` menggunakan native `<button type="button">` agar tidak melanggar batas hitungan `<Button` di `question-import.test.ts`.
2. **Langkah 2**: Tambahkan fungsi untuk menyisipkan cuplikan format yang dipilih ke dalam naskah yang sedang diedit.
3. **Langkah 3**: Buat pengujian unit `apps/tests/question-import-model-selector.test.ts`.
4. **Langkah 4**: Jalankan validasi `npm run typecheck`, `npm test`, dan `npm --prefix apps run test:ui-leak`.

## 5. Kriteria Penerimaan yang Terukur
1. Terdapat 4 tab model soal (Pilihan Ganda, Benar / Salah, PG Kompleks, Essay) dengan pratinjau teks format yang akurat.
2. Terdapat tombol untuk menyisipkan cuplikan model soal ke dalam textarea.
3. Seluruh 401+ pengujian unit tetap lulus 100%.
4. Nol kebocoran kode spesifikasi teknis dan nihil emoji.
