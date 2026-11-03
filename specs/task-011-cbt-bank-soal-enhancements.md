# Specification: TASK-011 Tipe Soal Lanjutan, Stimulus, dan Form Live Preview Bank Soal

## Problem & Desired Behavior
- **Problem**:
  Saat ini modul Bank Soal E-Imtihan At-Tauhid baru mendukung dua tipe soal dasar (`multiple_choice` dengan 1 jawaban benar dan `essay`). Belum tersedia dukungan untuk butir soal berbasis wacana bacaan/infografis (stimulus), tipe soal Asesmen Kompetensi Minimum (AKM) seperti Pilihan Ganda Kompleks (`pg_kompleks` dengan multi-kunci jawaban) dan Benar/Salah (`true_false`), serta form pembuatan soal belum memiliki simulasi Live Preview real-time saat pengajar meracik butir soal.
- **Desired Behavior**:
  1. Skema Convex `questions` mendukung field opsional `stimulusText` (teks wacana/bacaan), `stimulusMediaUrl` (URL gambar/infografis), dan tipe soal `pg_kompleks` serta `true_false`.
  2. Mutasi `createQuestion` di Convex memvalidasi aturan integritas kunci jawaban:
     - `multiple_choice`: minimal 2 opsi terisi, tepat 1 opsi benar (`isCorrect: true`).
     - `pg_kompleks`: minimal 3 opsi terisi, minimal 2 opsi benar (`isCorrect: true`).
     - `true_false`: tepat 2 opsi terisi (Benar dan Salah), tepat 1 opsi benar.
     - `essay`: teks pertanyaan terisi, rubrik evaluasi opsional.
  3. Antarmuka editor bank soal di `apps/app/(main)/bank-soal/[id]/page.tsx` menyediakan:
     - Pemilih tipe soal (`multiple_choice`, `pg_kompleks`, `true_false`, `essay`).
     - Accordion/input konten stimulus (teks wacana bacaan dan tautan media gambar).
     - Checkbox seleksi kunci jawaban untuk PG Kompleks dan toggle Benar/Salah.
     - Tata letak responsif 2 kolom dengan **Live Preview** di sisi kanan yang secara langsung (real-time) merender tampilan soal, stimulus, opsi jawaban, dan badge bobot seperti yang akan dilihat oleh santri.
  4. Seluruh antarmuka bersih dari kode spesifikasi teknis (`*-FR-*`, `*-AC-*`, `TASK-*`, `Fase *`, dll.) dan tidak menggunakan emoji (menggunakan Lucide icons).

## Scope
- **In Scope**:
  - `apps/convex/schema.ts`: Perluasan tipe soal (`pg_kompleks`, `true_false`) dan field stimulus (`stimulusText`, `stimulusMediaUrl`).
  - `apps/convex/bank/public/mutations.ts`: Validasi dan penyimpanan butir soal `pg_kompleks`, `true_false`, dan konten stimulus.
  - `apps/app/(main)/bank-soal/[id]/page.tsx`: Formulir pembuatan butir soal dengan dukungan tipe baru, stimulus, dan panel Live Preview real-time.
  - `apps/tests/cbt-bank-soal.test.ts`: Pengujian unit dan validasi logika validasi tipe soal serta pencegahan kebocoran kode spesifikasi teknis di UI.
  - `specs/e2e/cbt-bank-soal-enhancements.md`: Spesifikasi E2E handoff pengujian browser interaktif.
- **Out of Scope**:
  - Ruang ujian pengerjaan santri 3-panel dan penilaian otomatis PG Kompleks/Benar-Salah saat ujian (dikerjakan pada `TASK-012`).
  - Fitur anti-curang dan deteksi perpindahan tab browser santri (dikerjakan pada `TASK-012`).

## Evidence & Relevant Files
- `apps/convex/schema.ts` — Skema tabel `questions` di Convex.
- `apps/convex/bank/public/mutations.ts` — Mutasi `createQuestion` yang mengatur validasi backend.
- `apps/app/(main)/bank-soal/[id]/page.tsx` — Komponen halaman editor butir soal pengajar.
- `apps/components/ui/` — Komponen Shadcn UI (`button.tsx`, `card.tsx`, `input.tsx`, `textarea.tsx`, `badge.tsx`, `checkbox.tsx`, `tabs.tsx`).

## Dependency-Ordered Implementation Requirements
1. **Pembaruan Skema Data Convex (`apps/convex/schema.ts`)**:
   - Perluas union validator `type`: `v.union(v.literal("multiple_choice"), v.literal("pg_kompleks"), v.literal("true_false"), v.literal("essay"))`.
   - Tambahkan `stimulusText: v.optional(v.string())` dan `stimulusMediaUrl: v.optional(v.string())`.
2. **Pembaruan Backend Logic Mutasi (`apps/convex/bank/public/mutations.ts`)**:
   - Perbarui argumen `createQuestion` dengan tipe-tipe baru dan field stimulus.
   - Tambahkan validasi ketat untuk `pg_kompleks` (minimal 3 opsi, minimal 2 benar) dan `true_false` (tepat 2 opsi, tepat 1 benar).
   - Sinkronisasi dengan cloud deployment via `npx convex dev --once`.
3. **Penyempurnaan Antarmuka Editor & Live Preview (`apps/app/(main)/bank-soal/[id]/page.tsx`)**:
   - Sediakan tab/pilihan 4 jenis soal.
   - Sediakan bagian input stimulus wacana (teks dan gambar).
   - Sediakan panel Live Preview berdampingan (split-view desktop, stack mobile) yang interaktif dan responsif.
   - Sediakan representasi visual jenis soal pada daftar butir soal yang sudah dibuat.
4. **Pengujian Unit & Integritas (`apps/tests/cbt-bank-soal.test.ts`)**:
   - Uji validasi input masing-masing jenis soal (kasus sukses dan kasus pelanggaran aturan kunci).
   - Uji pemindaian regex kebocoran kode teknis pada file UI.
5. **Penyusunan Spek E2E (`specs/e2e/cbt-bank-soal-enhancements.md`)**:
   - Dokumentasikan skenario pengerjaan form dan interaksi Live Preview.

## Measurable Acceptance Criteria
- `BANK-AC-004`: Pada soal pilihan ganda kompleks, pengajar dapat menandai minimal 2 opsi sebagai kunci jawaban benar; pada soal benar/salah, pengajar dapat menentukan status pernyataan adalah benar atau salah.
- `BANK-AC-005`: Live preview memperbarui rendering teks pertanyaan, stimulus, dan opsi jawaban seketika pengajar mengetik di formulir.
- Skema Convex tersinkronisasi tanpa error (`Convex functions ready!`).
- Seluruh pengujian otomatis di `apps/tests/cbt-bank-soal.test.ts` berhasil (passing).
- Bebas dari kebocoran kode spesifikasi teknis (`/\b(SCR-[A-Z0-9\-]+|[A-Z]{2,10}-(FR|AC|NFR)-\d+|TASK-\d+|Fase\s+\d+)\b/`).

## Risk, Compatibility, and Migration Considerations
- **Kompatibilitas Bank Soal Lama**: Soal-soal yang sudah dibuat sebelumnya (`multiple_choice` dan `essay` tanpa stimulus) tetap valid dan berfungsi normal tanpa perlu migrasi data rumit karena field stimulus bersifat opsional (`v.optional(...)`).
- **Sanitasi Kunci Jawaban**: Kunci jawaban (`isCorrect`) tetap hanya diakses oleh pengajar dan tidak dibocorkan ke santri.

## Repository-Appropriate Validation Commands
- `npx convex dev --once` (dijalankan dari `apps/`)
- `npm --prefix apps run test`
- `npm --prefix apps run typecheck`

## E2E Assessment
- **Recommendation**: Recommended.
- **Reason**: Fitur melibatkan form builder interaktif dengan pembaruan tampilan Live Preview secara dinamis.
- **Handoff**: Disiapkan file spesifikasi E2E di `specs/e2e/cbt-bank-soal-enhancements.md`.
