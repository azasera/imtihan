# Spesifikasi: Penyempurnaan Visual Tab & Contoh Model Soal pada Panel Impor Naskah

## 1. Definisi Masalah & Perilaku yang Diharapkan
- **Masalah**:
  Bagian selektor "Tab & Contoh" pada panel impor naskah bank soal (`apps/components/bank-soal/question-import-panel.tsx`) saat ini memiliki beberapa masalah visual:
  1. **Hirarki Visual Terbalik**: Tombol "Sisipkan Contoh Ini" menggunakan warna hijau pekat yang sangat mencolok (`bg-emerald-600`), sehingga mencuri perhatian dari aksi utama halaman (menempel naskah dan memeriksa hasil).
  2. **Penumpukan Kontainer (*Box-in-a-box*)**: Kontainer contoh dibungkus berlapis-lapis dengan border dan latar tebal, membuat UI terasa padat dan berat.
  3. **Kemiripan Kotak Cuplikan dengan Input**: Kotak cuplikan `<pre>` ber-border dan berlatar belakang putih mirip dengan kotak `Textarea` di bawahnya, sehingga berpotensi membingungkan pengguna mengenai kotak mana yang harus diisi.
- **Perilaku yang Diharapkan**:
  1. **Tab Selektor Lebih Bersih & Ringan**: Tab 4 model soal (Pilihan Ganda, Benar / Salah, PG Kompleks, Essay / Uraian) memiliki tampilan segmented control yang elegan, bersih, dengan kontras yang nyaman dan transisi halus.
  2. **Tombol Sisipkan Lebih Selaras (*Low-Emphasis Action*)**: Tombol "Sisipkan Contoh Ini" diubah menjadi gaya sekunder/subtle (outline beraksen hijau lembut atau ghost-border), tetap mudah diklik namun tidak mengintimidasi visual halaman.
  3. **Kotak Cuplikan (*Code Callout*) yang Jelas Sebagai Referensi**: Tampilan cuplikan format naskah ditata sebagai blok referensi dokumentasi/cheat-sheet yang tenang (`bg-muted/40`, teks rapi dengan syntax highlight subtle, tanpa border tebal menyerupai input form).
  4. **Kompatibilitas Penuh**:
     - Mempertahankan teks "Sisipkan Contoh Ini", teks 4 nama model soal, dan handler `handleInsertSnippet` agar pengujian `apps/tests/question-import-model-selector.test.ts` tetap lulus.
     - Tetap mempertahankan batasan jumlah elemen Shadcn `<Button` (tepat 4) dan variant (tepat 3) di `question-import-panel.tsx` dengan menggunakan native `<button type="button">`.
     - Bebas kebocoran kode spesifikasi teknis dan nihil emoji.

## 2. In / Out of Scope
- **In-Scope**:
  - Penyesuaian styling dan tata letak bagian tab 4 model soal dan kotak contoh/aturan di `apps/components/bank-soal/question-import-panel.tsx`.
  - Verifikasi kompatibilitas dengan pengujian unit `apps/tests/question-import-model-selector.test.ts` dan `apps/tests/question-import.test.ts`.
- **Out-of-Scope**:
  - Mengubah fungsi penafsir naskah di `apps/lib/question-import.ts`.
  - Mengubah logika penyimpanan mutasi Convex `importQuestions`.
  - Mengubah bagian pratinjau hasil impor `apps/components/bank-soal/question-import-preview.tsx`.

## 3. Bukti & Berkas Terkait
- Tangkapan layar dari pengguna menyoroti bagian Tab 4 model dan kotak cuplikan contoh dengan tombol hijau menonjol.
- Permintaan pengguna: "Tab & Contoh" untuk membuat tampilan lebih bersih.
- Berkas terkait:
  - `apps/components/bank-soal/question-import-panel.tsx`
  - `apps/tests/question-import-model-selector.test.ts`
  - `apps/tests/question-import.test.ts`

## 4. Kebutuhan Implementasi Terurut Dependensi
1. **Langkah 1**: Refaktor styling blok Tab 4 model soal pada `apps/components/bank-soal/question-import-panel.tsx`:
   - Gunakan latar `bg-muted/50` atau border halus terpadu.
   - Sederhanakan status tab aktif agar lebih bersih dan kontrasnya pas.
2. **Langkah 2**: Refaktor blok kotak cuplikan dan tombol aksi:
   - Sederhanakan kontainer aturan penulisan dan cuplikan naskah.
   - Ubah tombol "Sisipkan Contoh Ini" dari `bg-emerald-600 text-white` menjadi tombol outline beraksen lembut (`border border-emerald-600/30 bg-emerald-50/50 text-emerald-800 hover:bg-emerald-100/60 dark:bg-emerald-950/20 dark:text-emerald-300 dark:border-emerald-800/40`).
   - Ubah kotak `<pre>` menjadi tampilan code callout dengan padding dan tipografi monospace yang bersih.
3. **Langkah 3**: Validasi terhadap aturan pengujian unit:
   - Pastikan teks "Sisipkan Contoh Ini" tetap ada.
   - Pastikan hitungan `<Button` tetap 4 dan variant tetap 3.
   - Pastikan nihil emoji dan nihil kode teknis.
4. **Langkah 4**: Jalankan seluruh pengujian repositori untuk memastikan *zero regression*.

## 5. Kriteria Penerimaan yang Terukur
1. Bagian tab 4 model soal tampil lebih rapi dan bebas dari kesan *box-in-a-box* berlapis tebal.
2. Tombol "Sisipkan Contoh Ini" berpenampilan subtle namun jelas dapat diklik dan berfungsi menyisipkan cuplikan ke textarea.
3. Kotak cuplikan naskah jelas berkarakter dokumentasi/referensi, tidak menyerupai input form yang aktif.
4. Semua pengujian `npm test --prefix apps` lulus 100% tanpa kegagalan (408+ tes lulus).
5. Pengujian pencegahan kebocoran kode teknis `test:ui-leak` lulus.

## 6. Risiko & Mitigasi
- **Risiko**: Mengubah elemen `<button>` menjadi `<Button>` Shadcn akan memicu kegagalan pada pengujian `apps/tests/question-import-model-selector.test.ts` (yang membatasi jumlah elemen `<Button` tepat 4).
- **Mitigasi**: Tetap menggunakan native `<button type="button" className="...">` dengan styling utility Tailwind/Shadcn untuk tab dan tombol sisipkan contoh.

## 7. Pertimbangan Kompatibilitas, Keamanan, & Migrasi
- Tidak ada migrasi database atau perubahan API backend.
- Kompatibel penuh dengan tema terang (light mode) dan tema gelap (dark mode).
- Aksesibilitas: Tab dan tombol tetap mempertahankan atribut `type="button"`, kontras warna teks yang memadai, dan fokus ring.

## 8. Perintah Validasi Repositori
- `npm test --prefix apps`
- `npm run typecheck --prefix apps`
- `node --test apps/tests/question-import-model-selector.test.ts`
- `node --test apps/tests/question-import.test.ts`

## 9. Ekspektasi Dokumentasi
- Pembaruan spesifikasi ini tersimpan di `specs/chore-refine-import-model-tabs-and-examples.md`.
