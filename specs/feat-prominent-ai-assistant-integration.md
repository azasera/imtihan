# Spesifikasi: Integrasi Menonjol & Desain Premium Asisten AI pada Halaman Bank Soal

## 1. Masalah & Perilaku yang Diharapkan
- **Latar Belakang & Masalah**:
  Pengguna merasa tombol "Asisten AI" pada halaman detail bank soal (`apps/app/(main)/bank-soal/[id]/page.tsx`) hampir tidak terlihat:
  1. Tombol diletakkan di pojok toolbar atas dengan garis border oranye pudar tanpa latar belakang kontras, tenggelam di sebelah metrik "Total Soal & Target Nilai".
  2. Bilah tab mode penyusunan soal pada kartu utama hanya menampilkan dua opsi (`Tulis satu per satu` dan `Tempel banyak sekaligus`), mengabaikan opsi pembuatan dengan bantuan AI.
  3. Ketika bank soal masih kosong (0 butir), tidak ada ajakan ramah yang memandu pengajar untuk memanfaatkan Asisten AI dalam menyusun kisi-kisi atau butir soal awal.
- **Perilaku yang Diharapkan**:
  1. **Integrasi Asisten AI ke Tab Mode Pembuatan Soal**:
     - Menjadikan Asisten AI sebagai tab ke-3 di kanan atas kartu editor:
       1. `Tulis satu per satu` (`PenLineIcon`)
       2. `Tempel banyak sekaligus` (`FileSpreadsheetIcon`)
       3. `Bantuan AI` (`SparklesIcon` dengan penanda visual khusus).
     - Mengklik tab ini langsung memicu pembukaan generator AI dialog tanpa menghambat alur penulisan yang lain.
  2. **Tombol Header Atas Premium & Kontras Tinggi**:
     - Mengubah tombol di bilah atas dari border pudar menjadi tombol aksi bergradien elegan (`bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white shadow-sm font-semibold`), dengan ikon `SparklesIcon` dan label tegas "Asisten AI Generator".
  3. **Banner Ajakan AI pada Lembar Soal Kosong**:
     - Saat paket soal masih `0 butir`, tampilkan banner sambutan ramah di atas lembar kerja yang menawarkan pembuatan soal otomatis dengan tombol aksi instan.
  4. **Zero Regression Guarantee**:
     - Mempertahankan kompatibilitas terhadap seluruh unit test eksisting (404 tes).
     - Bebas kebocoran kode spesifikasi teknis dan tidak menggunakan emoji.

## 2. In / Out of Scope
- **In-Scope**:
  - `apps/app/(main)/bank-soal/[id]/page.tsx`: Penataan ulang tombol header AI, penambahan tab Asisten AI di bilah mode kartu, dan banner ajakan saat soal masih kosong.
  - `apps/tests/ai-assistant-prominence.test.ts`: Pengujian unit untuk memverifikasi keterlihatan tombol AI, tab mode, dan nihil kebocoran kode teknis.
- **Out-of-Scope**:
  - Mengubah algoritma generator prompt AI di `apps/lib/ai-question-generator.ts`.
  - Mengubah skema Convex di `apps/convex/schema.ts`.

## 3. Bukti & Berkas Terkait
- Keluhan pengguna: "asisten ai. coba lihat. saya hampir tdk lihat ada asisten ai. bagaiamana rencana anda" -> Disetujui "lanjut".
- Tangkapan layar pengguna: Tombol outline oranye pudar di samping metrik 0 butir.
- Berkas terkait:
  - `apps/app/(main)/bank-soal/[id]/page.tsx`
  - `apps/components/bank-soal/ai-question-generator-dialog.tsx`
  - `apps/tests/ai-assistant-prominence.test.ts` (baru)

## 4. Kebutuhan Implementasi Terurut Dependensi
1. **Langkah 1**: Perbarui tombol header Asisten AI di `apps/app/(main)/bank-soal/[id]/page.tsx` menjadi tombol aksi bergradien emerald-teal kontras tinggi dengan bayangan halus.
2. **Langkah 2**: Tambahkan tab pemicu "Bantuan AI" pada bilah mode kartu editor soal di samping mode single dan bulk.
3. **Langkah 3**: Tambahkan banner kartu sambutan ramah pemanfaatan AI saat paket soal masih berjumlah 0 butir.
4. **Langkah 4**: Tulis pengujian unit `apps/tests/ai-assistant-prominence.test.ts` untuk memverifikasi perubahan tampilan dan nihil kebocoran kode teknis.
5. **Langkah 5**: Jalankan `npm run typecheck`, `npm test`, dan `npm --prefix apps run test:ui-leak`.

## 5. Kriteria Penerimaan yang Terukur
1. Tombol Asisten AI di header atas tampil menonjol dengan latar bergradien dan teks kontras tinggi.
2. Bilah mode di kartu editor memuat opsi "Bantuan AI" yang memicu generator saat diklik.
3. Tersedia banner pengenalan AI saat paket soal masih kosong.
4. Seluruh 404+ pengujian unit lulus 100% dan bebas kebocoran kode teknis.
