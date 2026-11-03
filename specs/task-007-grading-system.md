# Spesifikasi Implementasi: Penilaian Instan Pilihan Ganda & Antarmuka Koreksi Essay (TASK-007)

## 1. Masalah & Perilaku yang Diharapkan
- **Masalah**: Pengajar membutuhkan sistem penilaian yang efisien. Soal pilihan ganda harus langsung terhitung nilainya seketika santri mengumpulkan ujian tanpa campur tangan manual. Sedangkan untuk soal essay/uraian, pengajar membutuhkan antarmuka koreksi yang menyajikan panduan rubrik penilaian, teks jawaban santri, input skor per butir soal, dan catatan evaluasi, yang kemudian otomatis mengakumulasikan total nilai akhir santri.
- **Perilaku yang Diharapkan**:
  1. Skema Convex diperluas:
     - `examParticipants` ditambahkan atribut skor: `multipleChoiceScore`, `essayScore`, `totalScore`, `gradingStatus` (`"pending_essay"` | `"graded"`).
     - `studentAnswers` ditambahkan atribut evaluasi: `scoreAwarded` (skor butir soal), `teacherFeedback` (catatan ustadz).
  2. Logika Penilaian Instan Pilihan Ganda (di dalam mutasi `submitStudentExam`):
     - Membandingkan pilihan santri (`selectedOptionId`) dengan opsi kunci jawaban (`isCorrect: true`).
     - Jika benar, berikan poin penuh sesuai bobot butir (`points`). Jika salah atau kosong, berikan skor 0.
     - Simpan perolehan poin per butir ke `studentAnswers.scoreAwarded`.
     - Hitung akumulasi `multipleChoiceScore`.
     - Jika paket soal tidak memiliki essay, tandai status kelulusan/koreksi langsung menjadi `graded`. Jika ada essay, tandai `pending_essay`.
  3. Endpoint Pengajar untuk Koreksi Essay:
     - Query `getParticipantAnswersForGrading`: Mengambil rincian jawaban santri, kunci jawaban PG, teks jawaban essay, serta rubrik penilaian pengajar.
     - Mutasi `gradeEssayAnswer`: Pengajar memasukkan skor nilai untuk butir essay (divalidasi $0 \le \text{skor} \le \text{bobot}$), menghitung ulang `essayScore` dan `totalScore = multipleChoiceScore + essayScore`.
  4. Antarmuka Koreksi Pengajar (`apps/app/(main)/rekap-nilai/koreksi/[id]/page.tsx` atau dialog interaktif):
     - Menampilkan identitas santri, nama sesi ujian, skor PG yang telah dihitung sistem.
     - Daftar butir soal essay: Teks soal, panduan rubrik penilaian, jawaban santri, input nilai skor, dan textarea catatan perbaikan.
     - Tombol "Simpan Penilaian".
  5. Bebas emoji (menggunakan ikon Lucide) dan zero technical code leaks (`SCR-*`, `TASK-*`, dsb.).

## 2. In / Out of Scope
- **In-Scope**:
  - Penambahan field skor di `apps/convex/schema.ts` (`examParticipants`, `studentAnswers`).
  - Perhitungan otomatis nilai pilihan ganda pada mutasi `submitStudentExam`.
  - Mutasi `gradeEssayAnswer` dan query `getParticipantAnswersForGrading` di `apps/convex/examSession/`.
  - Antarmuka koreksi jawaban essay pengajar.
  - Unit tests di `apps/tests/grading-system.test.ts`.
  - Spek E2E di `specs/e2e/exam-grading.md`.
- **Out-of-Scope**:
  - Tabel rekapitulasi nilai seluruh kelas, statistik nilai rata-rata, dan ekspor CSV/Excel (cakupan `TASK-008`).

## 3. Berkas Terkait
- `apps/convex/schema.ts`
- `apps/convex/examSession/public/mutations.ts`
- `apps/convex/examSession/public/queries.ts`
- `apps/app/(main)/rekap-nilai/koreksi/[id]/page.tsx`
- `apps/tests/grading-system.test.ts`
- `specs/e2e/exam-grading.md`
- `.planora/EXECUTION/TODO.md`

## 4. Kebutuhan Implementasi Terurut Dependensi
1. **Pembaruan Skema (`apps/convex/schema.ts`)**:
   - `examParticipants`: `multipleChoiceScore`, `essayScore`, `totalScore`, `gradingStatus`.
   - `studentAnswers`: `scoreAwarded`, `teacherFeedback`.
2. **Logika Penilaian Otomatis (`apps/convex/examSession/public/mutations.ts`)**:
   - Pembaruan `submitStudentExam` untuk mengoreksi otomatis butir PG dan menghitung total nilai sementara.
   - Penambahan `gradeEssayAnswer` untuk input skor essay guru.
3. **Query Koreksi (`apps/convex/examSession/public/queries.ts`)**:
   - `getParticipantAnswersForGrading`: Membaca lembar jawaban lengkap dengan kunci & rubrik bagi pengajar terotentikasi.
4. **Antarmuka Koreksi Guru (`apps/app/(main)/rekap-nilai/koreksi/[id]/page.tsx`)**:
   - Menampilkan rincian soal, rubrik, jawaban santri, dan formulir input nilai essay.
5. **Sinkronisasi Convex Dev**:
   - Menjalankan `npx convex dev --once`.
6. **Pengujian & Validasi**:
   - Unit tests perhitungan nilai PG & validasi skor essay.
   - Pemindaian kebocoran teks spesifikasi teknis.

## 5. Kriteria Penerimaan Terukur (Acceptance Criteria)
- `NILAI-FR-001`: Nilai pilihan ganda terhitung instan saat santri melakukan submit ujian.
- `NILAI-FR-002`: Pengajar dapat membuka lembar koreksi dan memberi nilai essay berdasarkan rubrik.
- `NILAI-FR-003`: Akumulasi nilai akhir (PG + Essay) diperbarui seketika nilai essay disimpan.
- Validasi skor essay tidak boleh melebihi batas bobot butir soal atau bernilai negatif.
- TypeScript 0 error (`npm run typecheck`).
- Zero technical code leaks.

## 6. Risiko & Kompatibilitas
- Santri yang tidak menjawab butir PG tetap mendapatkan skor 0 secara aman tanpa error perhitungan.
- Otorisasi pengajar: Hanya pembuat sesi ujian atau pengajar terotentikasi yang dapat mengoreksi dan memberi nilai essay.
