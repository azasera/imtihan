# Spesifikasi: Perampingan UI Aturan & Contoh pada Panel Impor Naskah Soal

## 1. Definisi Masalah & Perilaku yang Diharapkan
- **Masalah**:
  Panel impor naskah bank soal (`apps/components/bank-soal/question-import-panel.tsx`) saat ini memuat **6 lapis aturan dan contoh** yang bertumpuk secara vertikal sebelum pengguna mencapai kotak input `Textarea`:
  1. Banner 3 langkah cepat (*Siapkan Naskah*, *Tempel ke Kolom*, *Periksa & Simpan*) menggunakan kotak hijau tebal 3 kolom yang memakan banyak ruang vertikal.
  2. Dua kartu sumber naskah (*Word* dan *Excel*) ditaruh dalam kontainer terpisah dengan deskripsi panjang dan tombol masing-masing.
  3. Panel panduan 4 model soal memiliki border bertingkat (*box-in-a-box*) dengan tombol sisip yang berat.
  4. Baris bobot nilai terpecah antara label, input angka, dan tautan contoh latihan.
  5. Placeholder di dalam textarea menduplikasi contoh soal Word yang sudah ada di atas.
  6. Accordion di bagian bawah memuat 10 butir aturan tambahan.
  Akibatnya, layar menjadi sesak dan pengajar kesulitan menemukan area fokus utama untuk mulai menempel naskah.

- **Perilaku yang Diharapkan**:
  1. **Micro Steps Bar**: Tiga langkah alur (*Siapkan Naskah*, *Tempel ke Kolom*, *Periksa & Simpan*) dirampingkan menjadi baris indikator tipis/minimalis yang elegan tanpa blok latar tebal.
  2. **Unified Action Toolbar (Word & Excel)**: Sumber Word dan Excel digabungkan dalam satu kontainer ringkas yang menyajikan panduan satu baris dan tombol aksi berdampingan (*Salin contoh format* dan *Unduh template kolom*).
  3. **Panduan 4 Model yang Ramping & Terpadu**: Tab 4 model soal (*Pilihan Ganda*, *Benar / Salah*, *PG Kompleks*, *Essay / Uraian*) beserta cuplikan kode dan tombol *Sisipkan Contoh Ini* dikemas dalam panel referensi tunggal yang bersih tanpa border berulang.
  4. **Pembersihan Placeholder Textarea**: Placeholder textarea disederhanakan menjadi satu kalimat instruksi yang bersih (*Tempelkan naskah soal Anda di sini (Ctrl+V)...*), menghilangkan duplikasi naskah wudhu.
  5. **Konsolidasi Header Textarea**: Bobot bawaan dan tombol *Isi Contoh Latihan Langsung* diselaraskan di atas textarea sebagai toolbar input yang rapi.
  6. **Kompatibilitas Penuh (Zero Regression)**:
     - Mempertahankan seluruh teks wajib pengujian unit (`Siapkan Naskah`, `Tempel ke Kolom`, `Periksa & Simpan`, `Naskah Dokumen Word / Teks`, `Salin contoh format`, `Tabel Excel / Spreadsheet`, `Unduh template kolom`, `Isi Contoh Latihan Langsung`, `Sisipkan Contoh Ini`, 4 nama model, dan `SPREADSHEET_FORMAT_HINTS.map`).
     - Mempertahankan batasan tepat 4 komponen Shadcn `<Button` dan tepat 3 atribut `variant="(outline|ghost)"`.
     - Nihil emoji dan nol kebocoran kode spesifikasi teknis.

## 2. In / Out of Scope
- **In-Scope**:
  - Penataan ulang dan pembersihan antarmuka visual pada `apps/components/bank-soal/question-import-panel.tsx`.
  - Verifikasi seluruh rangkaian pengujian di `apps/tests/` (khususnya `question-import-teacher-friendly.test.ts`, `question-import-model-selector.test.ts`, `question-import-spreadsheet.test.ts`, dan `question-import.test.ts`).
- **Out-of-Scope**:
  - Mengubah logika penafsir di `apps/lib/question-import.ts`.
  - Mengubah komponen pratinjau `apps/components/bank-soal/question-import-preview.tsx`.
  - Mengubah fungsi atau skema Convex backend.

## 3. Bukti & Berkas Terkait
- Tangkapan layar dari pengguna (`media_1793999118716_ec0088d0.png`) menunjukkan penumpukan vertikal 6 lapis aturan.
- Berkas terkait:
  - `apps/components/bank-soal/question-import-panel.tsx`
  - `apps/tests/question-import-teacher-friendly.test.ts`
  - `apps/tests/question-import-model-selector.test.ts`
  - `apps/tests/question-import-spreadsheet.test.ts`
  - `apps/tests/question-import.test.ts`

## 4. Kebutuhan Implementasi Terurut Dependensi
1. **Langkah 1**: Rancang ulang baris langkah 1-2-3 menjadi *compact micro-stepper* horizontal yang tipis namun tetap memuat teks `Siapkan Naskah`, `Tempel ke Kolom`, dan `Periksa & Simpan`.
2. **Langkah 2**: Gabungkan dua kartu sumber Word & Excel menjadi satu bilah alat aksi cepat (*quick actions toolbar*) yang memuat `Naskah Dokumen Word / Teks`, `Salin contoh format`, `Tabel Excel / Spreadsheet`, dan `Unduh template kolom`.
3. **Langkah 3**: Rampingkan kontainer 4 model soal (*Pilihan Ganda*, *Benar / Salah*, *PG Kompleks*, *Essay / Uraian*) dengan styling yang bersih dan terpadu.
4. **Langkah 4**: Rapikan baris kontrol textarea (mengintegrasikan `Bobot bawaan`, input angka, dan `Isi Contoh Latihan Langsung`) serta bersihkan placeholder dari naskah contoh panjang.
5. **Langkah 5**: Jalankan `npm test --prefix apps` dan `npm run typecheck --prefix apps` untuk memverifikasi tidak ada regresi.

## 5. Kriteria Penerimaan yang Terukur
1. Seluruh 6 tingkatan informasi tersusun secara hierarkis, bersih, dan hemat ruang vertikal (mengurangi tinggi area header aturan >40%).
2. Textarea langsung terlihat dan mudah dijangkau tanpa perlu scroll panjang di layar standar.
3. Tombol aksi pendukung (Salin contoh Word, Unduh template Excel, Sisipkan cuplikan, Contoh latihan) tertata rapi dan tidak mengaburkan tombol utama "Periksa tulisan".
4. Semua 408 pengujian unit lulus 100%.
5. Jumlah komponen Shadcn `<Button` tepat 4 dan `variant="(outline|ghost)"` tepat 3.
6. Nihil kode spesifikasi teknis dan nihil emoji.

## 6. Risiko & Mitigasi
- **Risiko**: Pengujian unit membaca string tertentu secara spesifik dari berkas sumber (misal `assert.ok(panelSource.includes("Siapkan Naskah"))`). Jika teks diubah atau dihilangkan, pengujian akan gagal.
- **Mitigasi**: Pertahankan seluruh teks kunci dalam elemen semantik HTML yang bersih (menggunakan `<span>`, `<p>`, atau `<button type="button">`), hanya menyesuaikan tata letak dan kelas CSS Tailwind-nya.

## 7. Pertimbangan Kompatibilitas, Keamanan, & Migrasi
- Kompatibel penuh dengan tema gelap (*dark mode*) dan tema terang (*light mode*).
- Responsif di layar seluler maupun desktop.
- Tidak ada perubahan skema data atau migrasi yang diperlukan.

## 8. Perintah Validasi Repositori
- `npm test --prefix apps`
- `npm run typecheck --prefix apps`
- `node --test apps/tests/question-import-teacher-friendly.test.ts`
- `node --test apps/tests/question-import-model-selector.test.ts`
- `node --test apps/tests/question-import-spreadsheet.test.ts`
- `node --test apps/tests/question-import.test.ts`

## 9. Ekspektasi Dokumentasi
- Spesifikasi disimpan di `specs/chore-streamline-question-import-rules-ui.md`.
