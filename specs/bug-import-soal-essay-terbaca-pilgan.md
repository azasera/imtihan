# Spesifikasi Perbaikan: Naskah Soal Essay Terbaca sebagai Pilihan Ganda pada Impor Naskah Bank Soal

## 1. Deskripsi Masalah & Perilaku yang Diharapkan
- **Masalah**:
  Pengajar telah membuat 20 soal pilihan ganda dan menyimpannya. Selanjutnya pengajar ingin membuat 5 butir soal essay tambahan. Pengajar mengeklik tab/pill "Essay" pada panel impor tempel naskah massal (`QuestionImportPanel`), menempelkan 5 butir soal essay (contoh: `1. Sebutkan organ-organ utama...`), lalu mengeklik "Periksa tulisan".
  Namun, kelima butir soal tersebut tetap dibaca sebagai "Pilihan Ganda" dan semuanya berstatus *"Perlu perbaikan: soal pilihan ganda membutuhkan minimal 2 opsi jawaban (baris ke-3), belum ada kunci jawaban..."* (0 butir siap disimpan, 5 butir perlu perbaikan).
- **Penyebab Akar (Root Cause)**:
  1. `parseQuestionImport(text, defaultPoints)` pada `apps/lib/question-import.ts` selalu menginisialisasi tipe butir baru sebagai `multiple_choice` secara baku.
  2. `applyTypeMarker()` hanya mengubah tipe ke `essay` bila teks soal secara eksplisit diawali penanda tanda kurung `(essay)`. Naskah soal essay biasa yang disalin pengajar umumnya hanya berupa teks bernomor tanpa embel-embel `(essay)`.
  3. `QuestionImportPanel` memiliki tombol model soal (`selectedModel`), namun nilainya tidak dioper ke `parseQuestionImport`, sehingga pilihan model "Essay" di antarmuka tidak memengaruhi hasil tafsiran.
  4. Pada tabel pratinjau `QuestionImportPreview`, kolom "Tipe" berupa teks statis murni tanpa selektor pengubah tipe dan tanpa tombol perbaikan cepat massal.
- **Perilaku yang Diharapkan**:
  1. **Penafsiran Berdasarkan Model Aktif**: Bila pengajar sedang memilih model "Essay" pada panel impor, naskah bernomor yang ditempelkan secara otomatis ditafsirkan sebagai tipe `essay`.
  2. **Deteksi Cerdas Soal Tanpa Opsi**: Soal bernomor yang tidak memiliki opsi A, B, C, D dan diawali kata tanya/perintah uraian (seperti *Sebutkan, Jelaskan, Mengapa, Bagaimanakah, Tuliskan, Uraikan*) secara otomatis disarankan/dikenali sebagai essay bila model essay aktif atau opsi tidak ditemukan.
  3. **Selektor Tipe Interaktif di Pratinjau**: Kolom "Tipe" pada tabel dan kartu pratinjau menyediakan tombol/menu untuk mengganti tipe butir soal (misal: dari Pilihan Ganda ke Essay). Mengganti tipe butir langsung menghitung ulang validasi (`problems`) sehingga butir seketika menjadi "Siap disimpan".
  4. **Aksi Perbaikan Cepat Massal**: Pada kotak peringatan ringkasan pratinjau, sediakan tombol cepat: *"Jadikan butir tanpa opsi sebagai Essay"* untuk mengubah seluruh butir bermasalah menjadi essay dalam 1 klik.

## 2. In / Out of Scope
- **In-Scope**:
  - `apps/lib/question-import.ts`:
    - Menambahkan parameter opsional `defaultType?: ImportQuestionType` pada `parseQuestionImport`.
    - Fungsi `setItemType(item: ParsedImportItem, newType: ImportQuestionType): ParsedImportItem` untuk memvalidasi ulang butir saat tipenya diubah.
    - Fungsi `convertItemsWithoutOptionsToEssay(items: ParsedImportItem[]): ParsedImportItem[]`.
  - `apps/components/bank-soal/question-import-panel.tsx`:
    - Mengirim `selectedModel` sebagai `defaultType` saat `handleCheck` dipanggil.
  - `apps/components/bank-soal/question-import-preview.tsx`:
    - Menambahkan tombol aksi cepat massal *"Jadikan Butir Bermasalah Sebagai Essay"* bila terdapat butir tanpa opsi.
    - Menambahkan selektor/tombol ubah tipe interaktif pada baris tabel desktop dan kartu mobile.
  - `apps/tests/question-import-essay-detection.test.ts`: Pengujian unit untuk memvalidasi penafsiran essay dengan defaultType dan konversi tipe.
  - `specs/e2e/import-soal-essay-detection.md`: Spesifikasi serah terima pengujian E2E peramban.
- **Out-of-Scope**:
  - Mengubah skema database Convex (`apps/convex/schema.ts`).
  - Mengubah mutasi penyimpanan backend `importQuestions`.

## 3. Bukti & Berkas Terkait
- Tangkapan layar pengguna: 5 butir soal essay ("Sebutkan organ-organ utama...") terbaca sebagai Pilihan Ganda dan ditolak karena tidak ada opsi jawaban.
- Berkas terkait:
  - `apps/lib/question-import.ts`
  - `apps/components/bank-soal/question-import-panel.tsx`
  - `apps/components/bank-soal/question-import-preview.tsx`
  - `apps/tests/question-import.test.ts`
  - `apps/tests/docx-import.test.ts`

## 4. Kebutuhan Implementasi Terurut Dependensi
1. **Langkah 1 (Utilitas Pengurai & Validasi)**:
   Perbarui `apps/lib/question-import.ts`:
   - Tambahkan parameter `defaultType?: ImportQuestionType` pada `parseQuestionImport` dan `parseNumberedImport`.
   - Implementasikan fungsi `validateItemProblems(item: ParsedImportItem): string[]` yang dapat dipakai ulang saat tipe butir berubah.
   - Buat fungsi `setItemType(item: ParsedImportItem, newType: ImportQuestionType): ParsedImportItem` yang memperbarui tipe, menyesuaikan opsi/rubrik, dan membersihkan error opsi pilgan jika diubah ke essay.
   - Buat fungsi `convertNoOptionItemsToEssay(items: ParsedImportItem[]): ParsedImportItem[]`.
2. **Langkah 2 (Panel Impor Naskah)**:
   Perbarui `apps/components/bank-soal/question-import-panel.tsx`:
   - Pada `handleCheck()`, panggil `parseQuestionImport(text, defaultPoints, mappedDefaultType)`.
3. **Langkah 3 (Antarmuka Pratinjau Interaktif)**:
   Perbarui `apps/components/bank-soal/question-import-preview.tsx`:
   - Tampilkan tombol perbaikan cepat *"Jadikan Semua sebagai Soal Essay"* di bawah pesan ringkasan bila terdeteksi butir tanpa opsi yang bermasalah.
   - Berikan pemilih tipe interaktif di kolom tabel "Tipe" sehingga pengajar bisa beralih tipe soal kapan saja.
4. **Langkah 4 (Pengujian & Validasi)**:
   - Buat pengujian unit di `apps/tests/question-import-essay-detection.test.ts`.
   - Jalankan `npm --prefix apps run typecheck`.
   - Jalankan `npm --prefix apps run test`.
   - Jalankan `npm --prefix apps run test:ui-leak`.
5. **Langkah 5 (Deploy & E2E Hand-off)**:
   - Siapkan berkas serah terima di `specs/e2e/import-soal-essay-detection.md`.
   - Deploy ke Cloudflare Worker.

## 5. Kriteria Penerimaan Terukur (Acceptance Criteria)
- `IMP-AC-001`: Saat pengajar memilih tab/model "Essay" di panel impor, naskah soal bernomor yang ditempelkan (meski tanpa tulisan `(essay)`) langsung dikenali sebagai tipe `essay`.
- `IMP-AC-002`: Butir soal essay tanpa opsi jawaban langsung berstatus *"Siap disimpan"* (0 masalah).
- `IMP-AC-003`: Pada tabel pratinjau, pengajar dapat mengubah tipe soal per butir (Pilihan Ganda $\leftrightarrow$ Essay) secara langsung dan status validasinya langsung diperbarui seketika.
- `IMP-AC-004`: Tersedia tombol aksi cepat satu klik untuk mengubah seluruh butir bermasalah tanpa opsi menjadi soal Essay.
- `IMP-AC-005`: Bebas kebocoran kode spesifikasi teknis dan nihil penggunaan emoji.

## 6. Perintah Validasi
- `npm --prefix apps run typecheck`
- `npm --prefix apps run test`
- `npm --prefix apps run test:ui-leak`
