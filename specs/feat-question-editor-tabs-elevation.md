# Spesifikasi: Desain Elevasi & Identitas Fungsional Tabs Editor Butir Soal

## 1. Masalah & Perilaku yang Diharapkan
- **Latar Belakang & Masalah**:
  Komponen penyusunan butir soal pada `apps/app/(main)/bank-soal/[id]/page.tsx` memiliki tampilan bilah tab yang datar (*flat*):
  1. Kontainer tab tidak memiliki kedalaman (*elevation/depth*), bayangan halus, atau lengkungan modern.
  2. Tab aktif (seperti "Benar / Salah") menyatu dengan latar belakang kartu tanpa kontras yang tegas atau aksen visual.
  3. Tab jenis soal ("Pilihan Ganda", "PG Kompleks", "Benar / Salah", "Essay") dan mode ("Tulis satu per satu", "Tempel banyak sekaligus") tidak memiliki ikon representatif yang mencerminkan fungsi masing-masing tipe soal.
- **Perilaku yang Diharapkan**:
  1. **Segmented Pill Controls**: Kontainer tab menggunakan gaya segmented modern (`rounded-lg bg-muted/80 p-1 border border-border/60 shadow-inner`).
  2. **Elevasi & Aksen Tab Aktif**: Tab aktif memiliki kedalaman nyata (`bg-background text-foreground shadow-sm font-semibold rounded-md border border-border/80 ring-1 ring-emerald-500/30 text-emerald-800 dark:text-emerald-300`).
  3. **Ikon Fungsional**:
     - Mode: `PenLineIcon` ("Tulis satu per satu") & `FileSpreadsheetIcon` ("Tempel banyak sekaligus").
     - Tipe Soal:
       - Pilihan Ganda: `CircleDotIcon` (Pilihan tunggal)
       - PG Kompleks: `ListChecksIcon` (Multi-kunci)
       - Benar / Salah: `CheckCheckIcon` (Biner)
       - Essay: `FileTextIcon` (Uraian)
  4. **Umpan Balik Kontekstual Responsif**: Banner panduan dan kontrol di bawah tab merespons aktif saat tab diklik, memperjelas aturan format dan kunci jawaban.
  5. **Zero Regression**: Mempertahankan semua pengujian eksisting (394 tes) dan bebas kebocoran kode spesifikasi teknis.

## 2. In / Out of Scope
- **In-Scope**:
  - `apps/app/(main)/bank-soal/[id]/page.tsx`: Penataan ulang bilah tabs, integrasi ikon Lucide, styling segmented pill, dan umpan balik aktif.
  - `apps/tests/bank-soal-editor-tabs.test.ts`: Pengujian unit untuk memvalidasi elemen tab terangkat, ikon representasi, dan tidak ada kebocoran kode teknis.
- **Out-of-Scope**:
  - Mengubah skema Convex (`schema.ts`).
  - Mengubah mutasi atau logika penilaian kuis.

## 3. Bukti & Berkas Terkait
- Permintaan pengguna: "baiklah, sekarang kita periksa modal ini. apa rencana anda agar terlihat tidak datar. tabs tampil sesuai fungsinya saat diklik" -> "ya, terapkan"
- Berkas terkait:
  - `apps/app/(main)/bank-soal/[id]/page.tsx`
  - `apps/components/ui/tabs.tsx`
  - `apps/tests/bank-soal-editor-tabs.test.ts` (baru)

## 4. Kebutuhan Implementasi Terurut Dependensi
1. **Langkah 1**: Perbarui `apps/app/(main)/bank-soal/[id]/page.tsx` dengan menambahkan ikon fungsional dan kelas styling segmented pill pada `TabsList` dan `TabsTrigger` untuk mode penulisan dan tipe soal.
2. **Langkah 2**: Perkaya kartu deskripsi/panduan tipe soal agar memiliki aksen visual interaktif sesuai tipe yang dipilih.
3. **Langkah 3**: Buat pengujian unit `apps/tests/bank-soal-editor-tabs.test.ts` untuk memverifikasi keberadaan ikon, tab terangkat, dan nihil kebocoran kode teknis.
4. **Langkah 4**: Jalankan validasi `npm run typecheck`, `npm test`, dan `npm --prefix apps run test:ui-leak`.

## 5. Kriteria Penerimaan yang Terukur
1. Bilah tab mode dan tipe soal memiliki bentuk segmented pill melengkung dengan bayangan halus dan pemisah visual.
2. Setiap tab tipe soal memuat ikon representasi yang tepat.
3. Tab aktif memiliki kontras tinggi dan aksen visual yang jelas dibandingkan tab tidak aktif.
4. Seluruh pengujian (394+ tes) lulus 100% dan bebas kebocoran kode teknis.
