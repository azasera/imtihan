# Spesifikasi Perbaikan Defek: Penafsiran 20 Soal Pilihan Ganda Menjadi 100 Soal

## 1. Identifikasi Masalah
Guru menempelkan 20 butir soal pilihan ganda hasil salinan dari dokumen (Word / Google Docs / PDF). Setiap butir terdiri dari 1 teks soal dan 4 baris opsi jawaban (A, B, C, D) sehingga total naskah berjumlah 100 baris.
Saat menekan tombol **Periksa tulisan**:
- Sistem sebelumnya secara keliru mendeteksi bentuk naskah sebagai **"baris lembar kerja" (spreadsheet)** alih-alih **"teks bernomor" (numbered)**.
- Setiap baris (termasuk baris opsi `a. 1.0000 J` hingga baris ke-100 `d. 0,3 N/m²`) dianggap sebagai 1 baris baris tabel mandiri.
- Dampaknya: 20 butir soal pilihan ganda membengkak menjadi **100 butir soal**, semuanya gagal validasi opsi ("0 butir siap disimpan | 100 butir perlu perbaikan").

## 2. Akar Masalah (Root Cause)
1. **Deteksi `isSpreadsheetPaste` Terlalu Longgar**:
   Fungsi `isSpreadsheetPaste` sebelumnya hanya memeriksa apakah ada 2 baris teks yang memuat karakter tab (`\t`):
   ```ts
   if (nonEmpty[0].includes("\t")) return true
   return nonEmpty.filter((line) => line.includes("\t")).length >= 2
   ```
   Padahal saat pengguna menyalin daftar bernomor dari Microsoft Word atau Google Docs, fitur auto-numbering secara otomatis menyisipkan karakter tab (`\t`) setelah angka (`18.\t`) dan huruf opsi (`a.\t`). Akibatnya, naskah bernomor biasa salah didiagnosis sebagai lembar kerja Excel/Sheets.
2. **Pencegatan Tab di Naskah Bernomor**:
   Di dalam perulangan penafsiran naskah bernomor, terdapat pemeriksaan awal `if (line.includes("\t"))` sebelum mencocokkan `ITEM_START_RE` dan `OPTION_RE`, sehingga baris bernomor yang membawa tab ditolak sebagai "baris bertab selip".

## 3. Solusi yang Diterapkan
1. **Memperketat Deteksi Lembar Kerja (`isSpreadsheetPaste`)**:
   - Jika baris pertama memuat baris judul tabel (`readSpreadsheetHeader(firstCells) !== null`), tetap dikenali sebagai spreadsheet.
   - Jika naskah memuat baris opsi terpisah (`a. `, `b. `, `A. `, `B. ` via `OPTION_RE`), naskah secara tegas diklasifikasikan sebagai **teks bernomor (numbered)**, bukan lembar kerja.
   - Untuk lembar kerja tanpa baris judul, baris harus memiliki minimal 3 kolom pemisah tab (`splitSpreadsheetCells(line).length >= 3`) dan mencakup mayoritas baris.
2. **Normalisasi Tab Hasil Salinan Word / Google Docs**:
   - Tab yang mengikuti nomor soal (`^\d{1,3}[.)]\t+`) dan huruf opsi (`^[A-Za-z][.)]\t+`) dinormalisasi menjadi spasi tunggal.
   - Nomor soal tanpa spasi seperti `1.Zat` tetap dikenali dengan baik.
3. **Pemberian Kunci Cepat**:
   - 20 butir soal pilihan ganda kini terbaca tepat sebagai 20 butir soal lengkap dengan 4 opsinya. Guru dapat langsung menempelkan deretan kunci (misal `A B C D...`) pada bilah *Tempel Kunci Jawaban Massal* atau memilih opsi kunci di pratinjau.

## 4. Validasi
- Unit test baru: `apps/tests/question-import-word-tabs.test.ts` (3 skenario: tab Word, 20 butir jadi 20, dan nomor tanpa spasi).
- Seluruh 490 unit test proyek lulus 100%.
- TypeScript check (`tsc --noEmit`) lulus tanpa galat.
