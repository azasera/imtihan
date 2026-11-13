# Spesifikasi Ergonomi Penempatan & Akses Praktis Tombol "Periksa Tulisan" (Question Import)

## 1. Definisi Masalah & Perilaku yang Diharapkan
### Masalah:
Pada antarmuka Impor Naskah Soal Massal (`QuestionImportPanel` di `apps/components/bank-soal/question-import-panel.tsx`), tombol aksi utama **"Periksa tulisan"** saat ini hanya terletak di bagian paling bawah (`CardFooter`). 
Struktur halaman yang ada memuat:
1. Panduan 3 Langkah Cepat Pengajar (~50px)
2. Zona Unggah Berkas Word / Teks (~75px)
3. 2 Kartu Sumber Naskah Word & Excel (~130px)
4. Panduan & Contoh Format 4 Model Soal (~240px)
5. Kotak Tempel Naskah Soal dengan Textarea setinggi 9 baris (~200px)
6. Petunjuk Format Lengkap (Bisa Dilipat) (~120px)
7. `CardFooter` berisi tombol "Periksa tulisan" di dasar kartu

Akibatnya, pengguna (guru/pengajar) yang mengunggah berkas di bagian atas atau menempelkan teks naskah soal di textarea harus menggulir layar sangat jauh ke bawah hanya untuk menekan satu tombol "Periksa tulisan". Bila ada bagian naskah yang perlu disunting kembali, guru harus menggulir ke atas untuk mengedit lalu menggulir ke bawah lagi untuk memeriksa ulang (*"terlalu dibawah periksa tulisan, bolak balik scrolll. buat lebih praktis"*).

### Perilaku yang Diharapkan:
1. **Tombol "Periksa tulisan" di Toolbar Atas Textarea:**
   - Disediakan tombol aksi utama "Periksa tulisan" langsung di bilah alat (*toolbar*) tepat di atas kotak textarea (sejajar dengan pengaturan "Bobot bawaan" dan tombol "Isi Contoh Latihan Langsung").
   - Begitu guru menempelkan naskah atau mengetik di textarea, tombol pemeriksaan sudah langsung berada di depan mata tanpa perlu menggulir satu piksel pun.
2. **Aksi Cepat di Zona Unggah Berkas:**
   - Ketika berkas Word (.docx) atau teks (.txt) selesai diunggah dan naskah terisi, zona unggah di bagian atas langsung menampilkan tombol aksi cepat *"Periksa tulisan"* di samping tombol *"Pilih Berkas Soal"*. Guru yang baru saja mengunggah file dapat langsung memeriksa kartu soal secara instan tanpa perlu turun ke bawah.
3. **Sticky Action Bar pada Bagian Bawah:**
   - `CardFooter` diubah menjadi sticky di bagian bawah (`sticky bottom-0 bg-background/95 backdrop-blur-xs z-10 border-t shadow-xs`), sehingga tombol pemeriksaan di bagian bawah tetap terlihat mengapung di viewport saat pengguna sedang menggulir naskah panjang.
4. **Pintasan Papan Ketik (Keyboard Shortcut Ctrl+Enter):**
   - Menambahkan event listener `onKeyDown` pada textarea: penekanan kombinasi `Ctrl+Enter` (atau `Cmd+Enter` pada macOS) langsung memicu fungsi pemeriksaan (`handleCheck`), memungkinkan alur kerja super cepat (Paste -> Ctrl+Enter -> Tinjau).
   - Terdapat label petunjuk pintasan kecil `(Ctrl+Enter)` pada tombol periksa.
5. **Petunjuk Format Teks Dilipat Secara Baku (Collapsed by Default):**
   - Mengubah status awal `showHints` menjadi `false` agar 19 butir panduan panjang (13 butir format teks + 6 butir format spreadsheet) tidak memenuhi layar secara default dan tidak mendorong tombol periksa hingga 600 piksel ke bawah. Pengajar yang membutuhkan panduan tetap dapat membukanya kapan saja dengan sekali klik.

---

## 2. Ruang Lingkup (In / Out of Scope)
- **In Scope:**
  - `apps/components/bank-soal/question-import-panel.tsx`:
    - Menambahkan tombol "Periksa tulisan" pada header toolbar tepat di atas `Textarea`.
    - Menambahkan tombol aksi instan "Periksa naskah ini" pada zona unggah dokumen bila naskah sudah terisi.
    - Menjadikan `CardFooter` berposisi sticky di bagian bawah kartu/viewport.
    - Menambahkan event handler shortcut `Ctrl+Enter` / `Cmd+Enter` pada `Textarea`.
    - Mengintegrasikan petunjuk tooltip/shortcut.
  - `apps/tests/question-import-teacher-friendly.test.ts` (atau tes unit terkait):
    - Memverifikasi keberadaan tombol periksa pada toolbar atas textarea.
    - Memverifikasi dukungan pintasan Ctrl+Enter dan sticky footer.
    - Memverifikasi kepatuhan terhadap aturan bebas emoji dan pencegahan kebocoran kode spesifikasi teknis.
- **Out of Scope:**
  - Logika parser `parseQuestionImport` di `apps/lib/question-import.ts` (sudah stabil).
  - Ekstraksi dokumen Word `apps/lib/docx-extractor.ts` (sudah stabil).
  - Skema database Convex dan mutasi backend (tidak ada perubahan API).

---

## 3. Bukti (Evidence)
- Tangkapan layar pengguna memperlihatkan `CardFooter` terpisah di bagian paling bawah dengan teks `"Tempelkan naskah soal di atas untuk mulai memeriksa butir soal."` dan tombol hijau `"Periksa tulisan"`.
- Keluhan pengguna: *"terlalu dibawah periksa tulisan, bolak balik scrolll. buat lebih praktis."*
- Observasi kode pada `apps/components/bank-soal/question-import-panel.tsx`:
  - Tombol `<Button onClick={handleCheck}><ScanTextIcon /> Periksa tulisan</Button>` hanya ada satu kali di baris 624-634 di dalam `CardFooter`.
  - Di atas `Textarea` terdapat toolbar (baris 528-569) yang saat ini hanya berisi input bobot bawaan dan tombol contoh latihan, namun belum memiliki tombol aksi pemeriksaan.

---

## 4. Berkas Terkait (Relevant Files)
1. `apps/components/bank-soal/question-import-panel.tsx`
2. `apps/tests/question-import-teacher-friendly.test.ts`

---

## 5. Kebutuhan Implementasi Berurutan (Dependency-Ordered Implementation)
1. **Langkah 1: Penambahan Tombol di Toolbar Textarea**
   - Di baris 538 (`<div className="flex flex-wrap items-center gap-2.5">`), tambahkan tombol aksi utama "Periksa tulisan" dengan desain menonjol (`bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-xs`), ikon `ScanTextIcon`, status `disabled={text.trim() === ""}`, dan `onClick={handleCheck}`.
   - Tambahkan indikator shortcut visual `(Ctrl+Enter)` untuk kenyamanan guru.
2. **Langkah 2: Penambahan Aksi Langsung di Zona Unggah Berkas**
   - Di dalam zona unggah berkas (baris 387-405), jika `text.trim() !== ""`, tampilkan tombol pendamping *"Periksa naskah terunggah"* di sebelah tombol *"Pilih Berkas Soal"*, sehingga guru yang selesai mengunggah file .docx/.txt bisa langsung memeriksa tanpa perlu berpindah posisi.
3. **Langkah 3: Integrasi Pintasan Papan Ketik (Keyboard Shortcut)**
   - Pada komponen `Textarea` (baris 571-579), tambahkan handler `onKeyDown`:
     ```tsx
     onKeyDown={(e) => {
       if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
         e.preventDefault()
         if (text.trim() !== "") {
           handleCheck()
         }
       }
     }}
     ```
4. **Langkah 4: Sticky CardFooter**
   - Perbarui kelas `CardFooter` (baris 618) agar menempel di bagian bawah saat pengguna menggulir teks naskah yang sangat panjang:
     `className="pt-3 pb-3 border-t flex flex-wrap items-center justify-between gap-3 sticky bottom-0 bg-background/95 backdrop-blur-xs z-10 shadow-xs"`
5. **Langkah 5: Pembaruan & Penambahan Unit Test**
   - Tambahkan tes pada `apps/tests/question-import-teacher-friendly.test.ts` untuk memastikan tombol periksa di toolbar atas, sticky footer, dan listener shortcut `Ctrl+Enter` terimplementasi dengan benar dan bebas kebocoran teknis.

---

## 6. Kriteria Keberhasilan Terukur (Measurable Acceptance Criteria)
- [ ] Tombol "Periksa tulisan" dapat diakses langsung tepat di atas textarea tanpa memerlukan scroll.
- [ ] Tombol "Periksa naskah" muncul di zona unggah berkas setelah berkas dimuat.
- [ ] Menekan `Ctrl+Enter` atau `Cmd+Enter` di dalam textarea memicu fungsi pemeriksaan ketika naskah tidak kosong.
- [ ] Tombol "Periksa tulisan" di bagian bawah tetap ada dan bersifat sticky di bagian bawah kartu/layar saat menggulir.
- [ ] Bebas dari emoji pada antarmuka (hanya menggunakan ikon Lucide seperti `ScanTextIcon`, `CheckIcon`, `UploadIcon`).
- [ ] Bebas dari kebocoran kode spesifikasi teknis (`SCR-*`, `*-FR-*`, dll).
- [ ] Seluruh unit test lulus 100% (`npm --prefix apps test`).

---

## 7. Risiko, Kompatibilitas, & Keamanan (Risk & Considerations)
- **Risiko Regresi:** Sangat rendah. Logika penafsiran naskah (`handleCheck` dan `parseQuestionImport`) tidak diubah sama sekali, hanya titik pemicu (*trigger points*) yang dibuat lebih ergonomis dan mudah dijangkau.
- **Aksesibilitas & Keyboard Navigation:** Menambahkan shortcut `Ctrl+Enter` meningkatkan standar aksesibilitas keyboard tanpa mengganggu fungsi tombol `Enter` biasa untuk membuat baris baru di textarea.

---

## 8. Perintah Validasi Repositori (Repository-Appropriate Validation Commands)
- Jalankan test suite:
  ```bash
  npm --prefix apps test -- apps/tests/question-import-teacher-friendly.test.ts
  npm --prefix apps test
  ```
- Lakukan inspeksi perubahan:
  ```bash
  git diff apps/components/bank-soal/question-import-panel.tsx
  ```

---

## 9. Dokumentasi & Komitmen Preservasi
- Seluruh kode eksisting, termasuk penanganan impor Word/Excel, validasi opsi, dan tampilan pratinjau kartu soal tetap dipertahankan secara utuh.
