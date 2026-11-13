# Spesifikasi: Perbaikan Data Santri Kosong pada Layar Ujian Selesai & Terkumpul

## 1. Definisi Masalah & Perilaku yang Diharapkan
- **Masalah**:
  1. Pada saat santri menyelesaikan ujian dan lembar berhasil dikumpulkan (`participant.status === "submitted"`), layar antarmuka menampilkan kartu "Ujian Selesai & Terkumpul" (`apps/app/ujian/ExamWorksheet.tsx`).
  2. Namun, data pada kotak identitas tampil kosong (*blank*):
     - `Nama Santri: `
     - `NISN: `
     - `Mata Pelajaran: `
  3. Penyebabnya adalah fungsi query `getStudentExamSheet` di `apps/convex/examSession/public/queries.ts`: saat kondisi `participant.status === "submitted"`, query tersebut langsung mengembalikan `{ found: true, isSubmitted: true, message: ..., finishedAt: ... }` **tanpa menyertakan** objek `participant` dan `session`.
  4. Akibatnya, saat mutasi `submitStudentExam` sukses dan query `getStudentExamSheet` mengalami *reactive refetch*, nilai `sheet.participant` dan `sheet.session` menjadi `undefined`, sehingga informasi identitas santri di layar sukses menjadi kosong.

- **Perilaku yang Diharapkan**:
  1. Pada respon query `getStudentExamSheet` saat `participant.status === "submitted"`, query tetap menyertakan data aman identitas santri (`participant`: `studentName`, `nisn`, `className`, `startedAt`, `tabViolations`) dan data sesi (`session`: `title`, `subjectCode`, `gradeLevel`, `totalPoints`).
  2. Data sensitif (soal, opsi acak, kunci jawaban, rubrik) tetap tidak dikirimkan karena ujian telah selesai.
  3. Pada frontend `apps/app/ujian/ExamWorksheet.tsx`, gunakan referensi cache (`cachedParticipantRef` dan `cachedSessionRef`) sebagai fallback defensif sehingga data tidak pernah mengalami *flicker* atau tampil kosong selama proses transisi query.
  4. Layar "Ujian Selesai & Terkumpul" menampilkan Nama Santri, NISN, dan Mata Pelajaran secara lengkap dan jelas.

## 2. In / Out of Scope
- **In-Scope**:
  - `apps/convex/examSession/public/queries.ts`: Memperkaya payload balik `getStudentExamSheet` pada kondisi `participant.status === "submitted"` dan `session.status === "ended"` dengan objek `participant` dan `session`.
  - `apps/app/ujian/ExamWorksheet.tsx`: Menggunakan data aman dari query serta fallback cache lokal untuk merender data santri dan mata pelajaran pada layar selesai.
  - `apps/tests/exam-worksheet.test.ts`: Menambahkan uji unit untuk memastikan query `getStudentExamSheet` dan komponen `ExamWorksheet.tsx` menjamin ketersediaan data santri pada status submitted.
- **Out-of-Scope**:
  - Mengubah skema database Convex (`schema.ts`).
  - Mengubah logika penilaian ujian atau penyimpanan jawaban.

## 3. Bukti & Berkas Terkait
- Tangkapan layar pengguna (`media_1794145346501_a559721b.png`) memperlihatkan kartu "Ujian Selesai & Terkumpul" dengan Nama Santri, NISN, dan Mata Pelajaran yang kosong.
- Berkas terkait:
  - `apps/convex/examSession/public/queries.ts`
  - `apps/app/ujian/ExamWorksheet.tsx`
  - `apps/tests/exam-worksheet.test.ts`

## 4. Kebutuhan Implementasi Terurut Dependensi
1. **Langkah 1**: Perbarui `apps/convex/examSession/public/queries.ts`:
   - Pada blok `if (participant.status === "submitted")`, ambil dokumen `session` dan `bank`.
   - Sertakan objek `participant` dan `session` yang tersanitasi dalam objek kembalian.
2. **Langkah 2**: Perbarui `apps/app/ujian/ExamWorksheet.tsx`:
   - Tambahkan referensi `cachedParticipantRef` dan `cachedSessionRef`.
   - Gunakan `finalParticipant = sheet?.participant ?? cachedParticipantRef.current` dan `finalSession = sheet?.session ?? cachedSessionRef.current` pada kartu tampilan sukses/selesai.
3. **Langkah 3**: Perbarui pengujian unit di `apps/tests/exam-worksheet.test.ts`:
   - Uji payload kembalian `getStudentExamSheet` pada kondisi `submitted` mencakup `participant` dan `session`.
   - Uji perenderan data santri pada layar selesai di `ExamWorksheet.tsx`.
4. **Langkah 4**: Jalankan pengujian unit dan validasi Convex.

## 5. Kriteria Penerimaan yang Terukur
1. Query `getStudentExamSheet` mengembalikan objek `participant` (dengan `studentName`, `nisn`, `className`) dan `session` (dengan `subjectCode`, `title`) ketika `participant.status === "submitted"`.
2. Layar "Ujian Selesai & Terkumpul" merender nama santri, NISN, dan kode mata pelajaran secara lengkap tanpa ada baris yang kosong.
3. Seluruh pengujian unit di `apps/tests/exam-worksheet.test.ts` lulus 100%.
4. `tsc --noEmit` lulus tanpa kesalahan kompilasi.
5. Nihil kebocoran kode spesifikasi teknis dan nihil emoji.

## 6. Risiko, Kompatibilitas, & Mitigasi
- **Risiko**: Potensi kebocoran kunci jawaban jika query mengembalikan data soal setelah ujian dikumpulkan.
- **Mitigasi**: Array `questions` dan `answers` tetap TIDAK disertakan saat status `submitted`, hanya data identitas santri dan mata pelajaran yang dikembalikan.

## 7. Perintah Validasi Repositori
- `node --test apps/tests/exam-worksheet.test.ts`
- `node apps/node_modules/typescript/bin/tsc --noEmit --project apps/tsconfig.json`

## 8. Ekspektasi Dokumentasi
- Pertahankan struktur komentar kode yang sudah ada.
