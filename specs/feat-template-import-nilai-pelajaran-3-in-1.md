# Spesifikasi Fitur: Template Import Excel Nilai Pelajaran 3-in-1 (PH, STS, SAS)

## 1. Definisi Masalah & Perilaku yang Diharapkan
- **Latar Belakang / Masalah**:
  Sebelumnya, fitur import nilai Excel pada menu rapor/nilai pelajaran (`GradeImportModal.tsx`) hanya mendukung pengunggahan satu jenis nilai per file (guru harus memilih salah satu kolom: PH, STS, atau SAS). Format template Excel yang dihasilkan juga hanya memiliki 4 kolom (`No`, `NISN`, `Nama Santri`, `Nilai [Target]`). Hal ini merepotkan guru karena harus mengunduh dan mengunggah berkas Excel sebanyak 3 kali terpisah untuk menginput nilai PH, STS, dan SAS santri dalam satu kelas.
- **Perilaku yang Diharapkan**:
  1. **Format Template Excel Sesuai Contoh Gambar**:
     - Kolom template Excel yang diunduh terdiri dari 6 kolom persis seperti contoh gambar pengguna:
       1. `No` (nomor urut santri: 1, 2, 3, ...)
       2. `NISN` (nomor induk siswa nasional dengan format teks agar angka nol di awal seperti `0143182548` tidak terpotong)
       3. `Nama Santri` (nama lengkap santri)
       4. `PH` (Penilaian Harian / Tugas, kosong untuk diisi guru)
       5. `STS` (Sumatif Tengah Semester / PTS, kosong untuk diisi guru)
       6. `SAS` (Sumatif Akhir Semester / PAS, kosong untuk diisi guru)
     - Baris header terkunci (*freeze header row*) dan lebar kolom proporsional rapi.
     - Nama file template yang diunduh informatif: `Template_Nilai_[KODE_MAPEL]_[KELAS].xlsx`.
  2. **Impor 1 File untuk 3 Nilai Sekaligus**:
     - Sistem mengenali kolom `PH`, `STS`, dan `SAS` secara otomatis dari berkas Excel yang diunggah.
     - Guru dapat mengisi ketiga nilai (PH, STS, SAS) sekaligus atau sebagian (misalnya hanya PH dan STS).
     - Nilai yang diisi akan otomatis dipetakan ke field masing-masing:
       - `PH` → `dailyScore`
       - `STS` → `midtermScore`
       - `SAS` → `finalExamScore`
     - Kolom yang dibiarkan kosong di Excel tidak akan menimpa nilai yang sudah ada sebelumnya di sistem.
  3. **Antarmuka Modal Import yang Diperbarui**:
     - Menghapus kewajiban memilih satu kolom target radio/button di awal untuk format 3-in-1.
     - Preview tabel menampilkan rincian nilai `PH`, `STS`, `SAS`, beserta status kecocokan (`✓ NISN`, `✓ Nama`, dll.).
     - Menampilkan ringkasan jumlah nilai yang akan disimpan per kategori (PH, STS, SAS).
     - Mendukung backward compatibility jika guru mengunggah file lama yang hanya berisi 1 kolom nilai.
  4. **Nihil Emoji & Bebas Kebocoran Kode Spesifikasi Teknis**:
     - Seluruh UI menggunakan ikon Lucide dan tidak memuat emoji atau kode spesifikasi teknis.

---

## 2. Ruang Lingkup (Scope)
- **In-Scope**:
  - `apps/lib/rapor-template.ts`:
    - Memperbarui fungsi `downloadGradeTemplate` agar menghasilkan tabel Excel dengan 6 kolom: `No`, `NISN`, `Nama Santri`, `PH`, `STS`, `SAS`.
    - Memastikan sel `NISN` bertipe teks (string) agar leading zeros tetap utuh.
  - `apps/lib/excel-grade-import.ts`:
    - Memperbarui `detectColumns` agar mendeteksi keberadaan kolom `PH`, `STS`, `SAS` (multi-column) di samping kolom nilai tunggal (single-column).
    - Memperbarui `parseExcelFile` agar mengekstrak `ph`, `sts`, dan `sas` untuk setiap baris.
    - Memperbarui `matchExcelToStudents` dan `filterMatchedResults` agar mendukung data 3 nilai sekaligus dengan tetap menjaga backward-compatibility.
  - `apps/components/rapor/GradeImportModal.tsx`:
    - Menyesuaikan UI modal agar fokus pada alur template 3-in-1 (PH, STS, SAS).
    - Menampilkan kolom PH, STS, SAS pada tabel pratinjau.
    - Menampilkan statistik perolehan nilai (berapa banyak nilai PH, STS, SAS yang terisi).
  - `apps/app/(main)/rapor/page.tsx`:
    - Menyesuaikan `handleImportConfirm` agar menyimpan nilai `dailyScore` (PH), `midtermScore` (STS), dan `finalExamScore` (SAS) sekaligus dari hasil impor.
  - `apps/tests/excel-grade-import.test.ts`:
    - Menambahkan pengujian untuk parsing template 3-in-1 (PH, STS, SAS), preservasi leading zero NISN, pencocokan santri, dan fallback.
  - `specs/e2e/feat-template-import-nilai-pelajaran-3-in-1.md`:
    - Membuat spesifikasi E2E untuk alur unduh template 3-in-1 dan impor nilai sekaligus.
- **Out-of-Scope**:
  - Mengubah skema database Convex (tabel rapor sudah memiliki field `dailyScore`, `midtermScore`, dan `finalExamScore`).
  - Mengubah rumus kalkulasi NAR.

---

## 3. Bukti & Berkas Terkait
- **Contoh Gambar dari Pengguna**:
  Tabel Excel 6 kolom:
  `No` | `NISN` | `Nama Santri` | `PH` | `STS` | `SAS`
  Contoh baris: `1` | `3142990266` | `Abdullah Muhammad Roestam` | (kosong) | (kosong) | (kosong)
  Contoh NISN dengan angka 0 di depan: `0143182548`
- **Berkas yang Diubah/Dibuat**:
  - `apps/lib/rapor-template.ts`
  - `apps/lib/excel-grade-import.ts`
  - `apps/components/rapor/GradeImportModal.tsx`
  - `apps/app/(main)/rapor/page.tsx`
  - `apps/tests/excel-grade-import.test.ts`
  - `specs/e2e/feat-template-import-nilai-pelajaran-3-in-1.md`

---

## 4. Kebutuhan Implementasi Terurut Dependensi
1. **Langkah 1**: Perbarui `apps/lib/rapor-template.ts` untuk menghasilkan template Excel 6 kolom (`No`, `NISN`, `Nama Santri`, `PH`, `STS`, `SAS`) dengan format sel NISN sebagai string.
2. **Langkah 2**: Perbarui `apps/lib/excel-grade-import.ts` untuk mendukung parsing multi-kolom `PH`, `STS`, `SAS`, deteksi fleksibel, dan pencocokan santri multi-nilai.
3. **Langkah 3**: Perbarui unit test di `apps/tests/excel-grade-import.test.ts` dan jalankan `node --test apps/tests/excel-grade-import.test.ts` untuk memastikan fungsi parsing dan matching berjalan sempurna tanpa regresi.
4. **Langkah 4**: Perbarui `apps/components/rapor/GradeImportModal.tsx` untuk menampilkan UI template 3-in-1 dan pratinjau tabel multi-nilai.
5. **Langkah 5**: Perbarui `apps/app/(main)/rapor/page.tsx` pada fungsi `handleImportConfirm` untuk menyimpan ketiga nilai sekaligus ke `saveGradesMutation`.
6. **Langkah 6**: Buat spesifikasi E2E di `specs/e2e/feat-template-import-nilai-pelajaran-3-in-1.md` dengan klasifikasi `Recommended`.
7. **Langkah 7**: Jalankan verifikasi linting, typecheck, dan seluruh test suite untuk memastikan nihil error, nihil kebocoran kode spesifikasi teknis, dan nihil emoji.

---

## 5. Kriteria Penerimaan yang Terukur
1. Tombol "Unduh Template" di modal import menghasilkan file Excel dengan header persis:
   `No` | `NISN` | `Nama Santri` | `PH` | `STS` | `SAS`
2. NISN santri dengan awalan angka 0 (seperti `0143182548`) tetap mempertahankan angka nol di depannya dan tidak berubah menjadi numerik terpotong.
3. Pengunggahan file Excel yang memuat nilai pada kolom `PH`, `STS`, dan `SAS` berhasil membaca ketiga nilai tersebut secara bersamaan.
4. Pada pratinjau (preview), tabel menampilkan kolom `No`, `NISN`, `Nama Santri`, `PH`, `STS`, `SAS`, dan `Status`.
5. Saat tombol "Simpan Nilai" diklik, nilai PH (`dailyScore`), STS (`midtermScore`), dan SAS (`finalExamScore`) terbarui di lembar nilai rapor untuk semua santri yang cocok.
6. Santri yang hanya memiliki sebagian nilai terisi (misal hanya PH dan STS) hanya akan memperbarui nilai yang terisi, tanpa menghapus nilai lainnya.
7. File lama dengan 1 kolom nilai ("Nilai") tetap dapat dibaca tanpa crash (backward-compatible).
8. Komponen antarmuka bebas emoji dan bebas kebocoran kode spesifikasi teknis.

---

## 6. Pertimbangan Risiko & Kompatibilitas
- **Kompatibilitas Format**: Memastikan deteksi kolom mengenali variasi penulisan header case-insensitive ("ph", "PH", "sts", "STS", "sas", "SAS", "pts", "pas").
- **Preservasi Nilai Eksisting**: Jika seorang santri di Excel memiliki nilai PH tetapi STS kosong, sistem hanya memperbarui PH dan tidak mengosongkan STS yang sebelumnya sudah tersimpan di database.
- **Validasi Nilai**: Nilai harus berupa angka 0–100, mengabaikan teks atau karakter strip.

---

## 7. Perintah Validasi
- `node --test apps/tests/excel-grade-import.test.ts`
- `npm --prefix apps run typecheck`
- `npm --prefix apps test`
- `npm --prefix apps run test:ui-leak`
