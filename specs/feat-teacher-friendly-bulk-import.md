# Spesifikasi: Antarmuka Tempel Naskah Soal Massal yang Ramah Guru Awam

## 1. Masalah & Perilaku yang Diharapkan
- **Latar Belakang & Masalah**:
  Pengguna merasa bingung saat membuka tab "Tempel banyak sekaligus" pada editor bank soal (`apps/components/bank-soal/question-import-panel.tsx`).
  1. Tata letak saat ini berpusat pada penafsir teknis (*parser*): langsung menyajikan textarea kosong setinggi 14 baris tanpa alur kerja berurutan.
  2. Guru awam tidak mengetahui apa yang harus disiapkan dan dari mana sumber naskah (Word atau Excel).
  3. Tombol penting seperti "Unduh template kolom", "Salin contoh", dan tombol aksi utama "Periksa tulisan" tersembunyi di bawah textarea sehingga luput dari pandangan pengajar.
  4. Istilah teknis seperti "Bobot bawaan dipakai bila butir tidak menulis baris 'poin:' sendiri" dan format teks tanpa penjelasan makna tanda bintang (`*`) membingungkan pengajar awam.
- **Perilaku yang Diharapkan**:
  1. **Alur 3 Langkah yang Jelas (Guided 3-Step Wizard)**:
     - **Langkah 1**: Pilih Sumber Naskah (Kartu Word / Teks Bernomor vs Kartu Spreadsheet Excel).
     - **Langkah 2**: Tempel Naskah & Tentukan Poin Bawaan.
     - **Langkah 3**: Periksa & Simpan Butir Soal.
  2. **Dua Kartu Sumber Naskah di Bagian Atas**:
     - *Sumber Word / Teks*: Tombol "Salin Contoh Format Word" dengan petunjuk jelas mengenai nomor, opsi, dan penanda bintang (`*`) untuk kunci jawaban.
     - *Sumber Excel / Tabel*: Tombol "Unduh Template Kolom" (menghasilkan TSV/Excel kompatibel) dengan petunjuk kolom yang mudah dibaca.
  3. **Aksi Percobaan Cepat (Demo / Contoh)**:
     - Guru dapat mengklik "Isi Contoh Latihan" untuk langsung mengisi teks contoh dan menguji alur tanpa harus mengetik manual dari awal.
  4. **Tata Letak Proporsional & Tombol Terlihat**:
     - Tombol aksi utama "Periksa tulisan" / "Periksa naskah soal" selalu tampak jelas dengan styling menonjol dan kontras tinggi.
  5. **Kompatibilitas Penuh (Zero Regression)**:
     - Mempertahankan semua fungsi penafsir `parseQuestionImport`, `buildImportTemplateText`, `chunkImportItems`, dan mutasi `importQuestions`.
     - Mempertahankan semua string dan pola yang diuji oleh `apps/tests/question-import-spreadsheet.test.ts` dan `apps/tests/question-import.test.ts`.

## 2. In / Out of Scope
- **In-Scope**:
  - `apps/components/bank-soal/question-import-panel.tsx`: Penataan ulang antarmuka menjadi 3 langkah berurutan, kartu pilihan sumber Word vs Excel, tombol aksi terangkat, istilah yang ramah guru.
  - `apps/tests/question-import-teacher-friendly.test.ts`: Pengujian unit untuk memvalidasi elemen ramah pengajar dan nihil kebocoran kode teknis.
- **Out-of-Scope**:
  - Mengubah fungsi logika parser di `apps/lib/question-import.ts`.
  - Mengubah skema Convex di `apps/convex/schema.ts`.

## 3. Bukti & Berkas Terkait
- Keluhan pengguna: "saya klik tempel banyak sekaligus. tampil malah saya jadi bingung... bagaiomana agar benar-benar berfungsi dgn baik dan difahami guru yg awam" -> Disetujui "lanjut".
- Berkas terkait:
  - `apps/components/bank-soal/question-import-panel.tsx`
  - `apps/components/bank-soal/question-import-preview.tsx`
  - `apps/lib/question-import.ts`
  - `apps/tests/question-import-spreadsheet.test.ts`
  - `apps/tests/question-import.test.ts`
  - `apps/tests/question-import-teacher-friendly.test.ts` (baru)

## 4. Kebutuhan Implementasi Terurut Dependensi
1. **Langkah 1**: Periksa dan catat seluruh string kunci yang diwajibkan oleh unit test eksisting pada `question-import-panel.tsx`.
2. **Langkah 2**: Perbarui `apps/components/bank-soal/question-import-panel.tsx` dengan tata letak 3 langkah ramah guru, kartu sumber naskah Word & Excel, proporsi textarea yang pas, dan tombol aksi terangkat.
3. **Langkah 3**: Buat pengujian unit `apps/tests/question-import-teacher-friendly.test.ts`.
4. **Langkah 4**: Jalankan `npm run typecheck`, `npm test`, dan `npm --prefix apps run test:ui-leak`.

## 5. Kriteria Penerimaan yang Terukur
1. Terdapat panduan 3 langkah visual yang memandu alur kerja pengajar.
2. Kartu pilihan naskah dari Word dan dari Excel tersedia di bagian atas dengan tombol salin/unduh yang siap digunakan.
3. Seluruh 397+ tes yang ada tetap lulus 100% tanpa regresi.
4. Nol kebocoran kode spesifikasi teknis dan tidak menggunakan emoji.
