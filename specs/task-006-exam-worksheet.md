# Spesifikasi Implementasi: Lembar Pengerjaan Ujian Santri & Auto-Save (TASK-006)

## 1. Masalah & Perilaku yang Diharapkan
- **Masalah**: Santri membutuhkan antarmuka lembar pengerjaan ujian berbasis komputer (CBA) yang bersih, responsif, dan bebas gangguan. Santri harus dapat berpindah antar butir soal dengan peta navigasi nomor, menandai soal ragu-ragu, melihat timer hitung mundur yang akurat, serta memiliki kepastian bahwa setiap jawaban tersimpan seketika (auto-save) ke server tanpa risiko kehilangan data saat koneksi terputus. Kunci jawaban tidak boleh bocor ke client.
- **Perilaku yang Diharapkan**:
  1. Skema Convex memiliki tabel `studentAnswers` untuk merekam pilihan opsi santri, jawaban essay, dan status ragu-ragu.
  2. Endpoint query khusus santri `getStudentExamSheet`:
     - Memverifikasi `participantId`.
     - Mengambil butir soal dari bank soal terkait.
     - **Keamanan**: Kunci jawaban (`isCorrect`) dan rubrik penilaian mutlak dihapus dari payload santri.
     - Pengacakan urutan soal (jika `randomizeQuestions` aktif) bersifat konsisten per santri menggunakan deterministic shuffle berbasis `participantId`.
     - Menyertakan jawaban santri yang sudah pernah tersimpan sebelumnya.
  3. Mutasi `saveStudentAnswer`:
     - Menyimpan opsi pilihan ganda atau teks jawaban essay seketika santri memilih/mengetik.
     - Toggle status ragu-ragu (`isDoubtful`).
  4. Mutasi `submitStudentExam`:
     - Mengubah status peserta menjadi `submitted` dan mencatat `finishedAt`.
  5. Antarmuka Lembar Ujian Santri:
     - Header: Judul ujian, nama santri, NISN, indikator auto-save ("Tersimpan ke server"), dan timer hitung mundur real-time.
     - Area Pengerjaan Soal: Teks soal (dukungan teks Arab/Latin), radio opsi pilihan ganda A-D/E yang elegan, atau textarea untuk essay.
     - Tombol Navigasi: "Soal Sebelumnya", tombol toggle "Ragu-ragu", dan "Soal Berikutnya".
     - Peta / Grid Nomor Soal: Sidebar/drawer nomor soal dengan warna status (Belum Dijawab: Abu-abu, Sudah Dijawab: Biru/Hijau, Ragu-ragu: Kuning).
     - Dialog Konfirmasi Pengumpulan Akhir: Memberikan rekap jumlah soal yang sudah dijawab, belum dijawab, dan masih ragu-ragu sebelum submit final.
     - Auto-submit otomatis jika timer hitung mundur mencapai 00:00.
     - Layar Sukses / Penutup setelah pengumpulan berhasil.
  6. Nol kebocoran kode spesifikasi teknis (`SCR-*`, `TASK-*`, dsb.) dan bebas emoji (menggunakan ikon Lucide).

## 2. In / Out of Scope
- **In-Scope**:
  - Penambahan tabel `studentAnswers` di `apps/convex/schema.ts`.
  - Query aman `getStudentExamSheet` di `apps/convex/examSession/public/queries.ts`.
  - Mutasi `saveStudentAnswer` dan `submitStudentExam` di `apps/convex/examSession/public/mutations.ts`.
  - Komponen antarmuka lembar ujian lengkap dengan timer countdown dan grid navigasi di `apps/app/ujian/page.tsx` (atau subkomponen lembar pengerjaan).
  - Sinkronisasi Convex dev (`npx convex dev --once`).
  - Unit tests di `apps/tests/exam-worksheet.test.ts`.
  - Spek E2E di `specs/e2e/exam-worksheet.md`.
- **Out-of-Scope**:
  - Penilaian instan skor pilihan ganda dan antarmuka koreksi essay guru (cakupan `TASK-007`).

## 3. Berkas Terkait
- `apps/convex/schema.ts`
- `apps/convex/examSession/public/queries.ts`
- `apps/convex/examSession/public/mutations.ts`
- `apps/app/ujian/page.tsx`
- `apps/app/ujian/ExamWorksheet.tsx`
- `apps/tests/exam-worksheet.test.ts`
- `specs/e2e/exam-worksheet.md`
- `.planora/EXECUTION/TODO.md`

## 4. Kebutuhan Implementasi Terurut Dependensi
1. **Pembaruan Skema (`apps/convex/schema.ts`)**:
   - Menambahkan tabel `studentAnswers`:
     `participantId`, `questionId`, `selectedOptionId`, `essayAnswer`, `isDoubtful`, `updatedAt`.
   - Index: `by_participant`, `by_participant_and_question`.
2. **Backend Query & Mutasi Santri (`apps/convex/examSession/`)**:
   - `getStudentExamSheet`: Query aman (sanitized questions + existing answers).
   - `saveStudentAnswer`: Auto-save debounced / on-change mutation.
   - `submitStudentExam`: Mutasi pengumpulan final.
3. **Komponen Lembar Ujian (`apps/app/ujian/ExamWorksheet.tsx` atau modular)**:
   - Header status & countdown timer.
   - Grid nomor soal interaktif.
   - Form jawaban soal aktif & tombol ragu-ragu.
   - Dialog konfirmasi submit dengan rekap pengerjaan.
   - Tampilan konfirmasi selesai ujian.
4. **Pengujian & Validasi**:
   - Unit tests keamanan (memastikan `isCorrect` tidak bocor).
   - Unit tests timer & auto-save logic.
   - Pemindaian regex kebocoran kode spesifikasi teknis.

## 5. Kriteria Penerimaan Terukur (Acceptance Criteria)
- `UJIAN-FR-002`: Grid nomor soal membedakan status belum dijawab, sudah dijawab, dan ragu-ragu.
- `UJIAN-FR-003`: Pilihan opsi atau essay tersimpan otomatis ke database.
- `UJIAN-FR-004`: Timer hitung mundur berjalan dan memicu submit otomatis saat waktu habis.
- `UJIAN-FR-005`: Dialog konfirmasi menampilkan peringatan jika masih ada soal belum dijawab atau ragu-ragu.
- Kunci jawaban tidak pernah dikirim ke browser santri selama ujian berlangsung.
- TypeScript 0 error (`npm run typecheck`).
- Zero technical code leaks.

## 6. Risiko & Kompatibilitas
- Timer client-side bisa dimanipulasi jika hanya bergantung pada state lokal: backend menghitung sisa waktu berdasarkan `startedAt` + `durationMinutes * 60 * 1000`.
- Deterministic shuffle: menggunakan algoritma pseudo-random berdasar hash string ID peserta agar susunan soal tetap identik saat santri me-refresh halaman.
