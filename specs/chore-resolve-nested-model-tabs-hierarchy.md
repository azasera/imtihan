# Spesifikasi: Resolusi Hierarki Tab Model Soal dan Mode Tempel Naskah (Solusi 1)

## 1. Definisi Masalah & Perilaku yang Diharapkan
- **Masalah**:
  Saat ini terdapat kebingungan arsitektur informasi (*nested stacked tabs*) antara dua baris tab bertingkat:
  1. Baris atas (pada header kartu editor `apps/app/(main)/bank-soal/[id]/page.tsx`): Tab mode penulisan `[ Tulis satu per satu ]` vs `[ Tempel banyak sekaligus ]`.
  2. Baris bawah (pada mode manual): Tab model soal `[ Pilihan Ganda ] [ PG Kompleks ] [ Benar / Salah ] [ Essay ]`.
  3. Ketika pengguna berpindah ke tab `Tempel banyak sekaligus`, di dalam panel naskah (`apps/components/bank-soal/question-import-panel.tsx`) muncul lagi tab 4 model soal dengan gaya segmented baris yang mirip.
  Hal ini menciptakan kesan "tab di dalam tab" yang membingungkan: seolah-olah di mode tempel pengguna harus memilih satu model tertentu sebelum menempel, padahal penafsir naskah mendukung input campuran berbagai tipe soal sekaligus.

- **Perilaku yang Diharapkan (Solusi 1)**:
  1. **Tegaskan Mode sebagai Pengendali Tingkat Atas**:
     - Mode `Tulis satu per satu` mengendalikan form manual, di mana tab jenis soal (`PG`, `PG Kompleks`, `Benar / Salah`, `Essay`) berfungsi sebagai pengubah kontrol formulir aktif.
  2. **Ubah Tampilan di Mode Tempel Menjadi Legenda / Pill Penanda Naskah Campuran**:
     - Pada `apps/components/bank-soal/question-import-panel.tsx`, ubah tampilan panduan model soal agar tidak meniru tab segmented control formulir.
     - Sajikan sebagai **"Panduan Penanda Naskah Campuran"** dengan chip-pill yang jelas fungsinya sebagai referensi format (misal pill beraksen badge: `Pilihan Ganda`, `Benar / Salah`, `PG Kompleks`, `Essay / Uraian`).
     - Pengguna dapat mengklik chip untuk melihat contoh penanda dan aturan formatnya, dengan penegasan bahwa satu naskah tempel dapat memuat kombinasi semua model sekaligus.
  3. **Zero Regression & Kompatibilitas Pengujian**:
     - Mempertahankan seluruh teks wajib pengujian unit (`Pilihan Ganda`, `Benar / Salah`, `PG Kompleks`, `Essay / Uraian`, `(benar/salah)`, `(pg kompleks)`, `(essay)`, `Sisipkan Contoh Ini`, `handleInsertSnippet`).
     - Mempertahankan batasan tepat 4 komponen Shadcn `<Button` dan tepat 3 atribut `variant="(outline|ghost)"` di `question-import-panel.tsx`.
     - Mempertahankan seluruh ikon dan banner pada `apps/app/(main)/bank-soal/[id]/page.tsx` sesuai kontrak `bank-soal-editor-tabs.test.ts`.
     - Nihil kebocoran kode spesifikasi teknis dan nihil emoji.

## 2. In / Out of Scope
- **In-Scope**:
  - Penyesuaian visual dan semantik pada blok referensi model di `apps/components/bank-soal/question-import-panel.tsx`.
  - Penegasan status dan keterangan di `apps/app/(main)/bank-soal/[id]/page.tsx` bila diperlukan untuk memperjelas batas antara mode penulisan manual vs naskah campuran.
  - Verifikasi seluruh rangkaian pengujian di `apps/tests/`.
- **Out-of-Scope**:
  - Mengubah penafsir logika di `apps/lib/question-import.ts`.
  - Mengubah skema database atau mutasi Convex.

## 3. Bukti & Berkas Terkait
- Tangkapan layar dari pengguna (`media_1794004400048_0629a743.png`) menyoroti tab bertingkat antara "Tulis satu per satu / Tempel banyak sekaligus" dan "Pilihan Ganda / PG Kompleks / Benar / Salah / Essay".
- Berkas terkait:
  - `apps/components/bank-soal/question-import-panel.tsx`
  - `apps/app/(main)/bank-soal/[id]/page.tsx`
  - `apps/tests/bank-soal-editor-tabs.test.ts`
  - `apps/tests/question-import-model-selector.test.ts`
  - `apps/tests/question-import-teacher-friendly.test.ts`

## 4. Kebutuhan Implementasi Terurut Dependensi
1. **Langkah 1**: Perbarui blok panduan model soal pada `apps/components/bank-soal/question-import-panel.tsx` agar menggunakan identitas visual *Reference Chips / Syntax Badges* yang jelas berbeda dari tab formulir manual.
2. **Langkah 2**: Tambahkan teks penjelasan singkat bahwa naskah tempel dapat memuat campuran berbagai tipe soal sekaligus tanpa perlu menempel terpisah.
3. **Langkah 3**: Pertahankan tombol aksi *Sisipkan Contoh Ini*, pemanggilan `handleInsertSnippet`, dan 4 nama model soal.
4. **Langkah 4**: Jalankan pengujian unit lokal untuk memverifikasi kompatibilitas:
   - `node --test apps/tests/question-import-model-selector.test.ts`
   - `node --test apps/tests/bank-soal-editor-tabs.test.ts`
   - `node --test apps/tests/question-import-teacher-friendly.test.ts`
5. **Langkah 5**: Jalankan `npm test --prefix apps` dan `npm run typecheck --prefix apps`.

## 5. Kriteria Penerimaan yang Terukur
1. Di mode "Tulis satu per satu", tab tipe soal tetap menjadi pengatur form aktif yang intuitif.
2. Di mode "Tempel banyak sekaligus", referensi model soal tampil sebagai chip referensi sintaks/penanda naskah campuran, bukan tab switcher yang meniru formulir.
3. Seluruh 408 pengujian unit lulus 100%.
4. Hitungan `<Button` tetap tepat 4 dan `variant="(outline|ghost)"` tetap tepat 3.
5. Nihil kode spesifikasi teknis dan nihil emoji.

## 6. Risiko & Mitigasi
- **Risiko**: Mengubah kelas CSS atau struktur tombol model di panel tempel bisa melanggar pengujian `question-import-model-selector.test.ts`.
- **Mitigasi**: Pastikan elemen tombol tetap berupa `<button type="button">`, teks label model tidak berubah huruf, dan teks cuplikan format tetap persis sama.

## 7. Pertimbangan Kompatibilitas, Keamanan, & Migrasi
- Responsif di desktop dan mobile.
- Kompatibel dengan dark mode dan light mode.
- Tidak ada migrasi basis data.

## 8. Perintah Validasi Repositori
- `npm test --prefix apps`
- `npm run typecheck --prefix apps`
- `node --test apps/tests/question-import-model-selector.test.ts`
- `node --test apps/tests/bank-soal-editor-tabs.test.ts`

## 9. Ekspektasi Dokumentasi
- Spesifikasi disimpan di `specs/chore-resolve-nested-model-tabs-hierarchy.md`.
