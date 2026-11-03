# TODO Eksekusi — E-Imtihan At-Tauhid

Dokumen ini adalah ledger hidup untuk pelaksanaan bertahap. Perbarui pada saat pekerjaan dimulai, diblokir, dan selesai.

## Legenda status

- `pending` — belum dimulai
- `in_progress` — sedang dikerjakan
- `blocked` — tidak dapat dilanjutkan sampai blocker terselesaikan
- `done` — selesai dan telah diverifikasi
- `skipped` — sengaja tidak dikerjakan dengan alasan tercatat

## Checklist eksekusi

- [x] `TASK-001` — Persiapan skema data Convex untuk Bank Soal dan Butir Soal
  - Status: `done`
  - Workflow: `feature`
  - Skill pendukung: none
  - Fase: `phase-01`
  - Requirements: `BANK-FR-001`
  - Pengalaman: `UI/screens/screen-inventory.md`
  - Dependensi: none
  - Validasi: Skema Convex tervalidasi via npx convex dev --once
  - Bukti: Skema tables subjects, questionBanks, dan questions sukses dipush ke cloud deployment dan tervalidasi via npx convex dev --once (Convex functions ready) serta 11/11 unit tests passing.

- [x] `TASK-002` — Implementasi antarmuka pembuatan paket Bank Soal dan input butir soal
  - Status: `done`
  - Workflow: `feature`
  - Skill pendukung: none
  - Fase: `phase-01`
  - Requirements: `BANK-FR-002`
  - Pengalaman: `UI/screens/screen-inventory.md`
  - Dependensi: `TASK-001`
  - Validasi: Pengajar dapat membuat paket soal dan menambahkan butir pilihan ganda
  - Bukti: Terverifikasi dengan spec specs/task-002-bank-soal-ui.md, pengujian otomatis apps/tests/bank-soal-ui.test.ts (14 pass), TypeScript compilation 0 error (npm run typecheck), dan spek E2E specs/e2e/bank-soal-management.md.

- [x] `TASK-003` — Skema Convex dan backend logic Sesi Ujian serta Generator Token
  - Status: `done`
  - Workflow: `feature`
  - Skill pendukung: none
  - Fase: `phase-02`
  - Requirements: `SESI-FR-001`
  - Pengalaman: `UI/screens/screen-inventory.md`
  - Dependensi: `TASK-001`
  - Validasi: Mutasi pembuatan sesi dan token acak 6 digit berhasil dibuat
  - Bukti: Terverifikasi dengan spec specs/task-003-session-backend.md, pengujian otomatis apps/tests/exam-session.test.ts (18 pass), Convex deployment sync ready (npx convex dev --once), dan spek E2E specs/e2e/exam-session-backend.md.

- [x] `TASK-004` — Antarmuka penjadwalan sesi ujian dan aktivasi token pengawas
  - Status: `done`
  - Workflow: `feature`
  - Skill pendukung: none
  - Fase: `phase-02`
  - Requirements: `SESI-FR-002`
  - Pengalaman: `UI/screens/screen-inventory.md`
  - Dependensi: `TASK-003`
  - Validasi: Pengajar dapat menjadwalkan ujian dan membagikan token aktif
  - Bukti: Terverifikasi dengan spec specs/task-004-session-ui.md, implementasi apps/app/(main)/sesi-ujian/page.tsx, pengujian unit apps/tests/sesi-ujian-ui.test.ts (21 pass total), TypeScript 0 error (npm run typecheck), dan spek E2E specs/e2e/sesi-ujian-management.md.

- [x] `TASK-005` — Pintu masuk ujian santri via NISN dan verifikasi Token
  - Status: `done`
  - Workflow: `feature`
  - Skill pendukung: none
  - Fase: `phase-03`
  - Requirements: `UJIAN-FR-001`
  - Pengalaman: `UI/screens/screen-inventory.md`
  - Dependensi: `TASK-003`
  - Validasi: Santri dapat masuk sesi ujian dengan token valid tanpa registrasi email
  - Bukti: Terverifikasi dengan spec specs/task-005-student-entry.md, implementasi apps/app/ujian/page.tsx, skema examParticipants dan mutasi enterExamSession di Convex, pengujian unit apps/tests/student-entry.test.ts (25 pass total), TypeScript 0 error (npm run typecheck), dan spek E2E specs/e2e/student-exam-entry.md.

- [x] `TASK-006` — Lembar pengerjaan ujian santri dengan navigasi nomor dan auto-save
  - Status: `done`
  - Workflow: `feature`
  - Skill pendukung: none
  - Fase: `phase-03`
  - Requirements: `UJIAN-FR-002`
  - Pengalaman: `UI/screens/screen-inventory.md`
  - Dependensi: `TASK-005`
  - Validasi: Pilihan jawaban tersimpan otomatis dan timer hitung mundur aktif
  - Bukti: Terverifikasi dengan spec specs/task-006-exam-worksheet.md, implementasi apps/app/ujian/ExamWorksheet.tsx, skema studentAnswers, query getStudentExamSheet (dengan sanitasi kunci jawaban), mutasi saveStudentAnswer & submitStudentExam, pengujian unit apps/tests/exam-worksheet.test.ts (30 pass total), TypeScript 0 error (npm run typecheck), dan spek E2E specs/e2e/exam-worksheet.md.

- [x] `TASK-007` — Logika penilaian instan pilihan ganda dan antarmuka koreksi essay
  - Status: `done`
  - Workflow: `feature`
  - Skill pendukung: none
  - Fase: `phase-04`
  - Requirements: `NILAI-FR-001`
  - Pengalaman: `UI/screens/screen-inventory.md`
  - Dependensi: `TASK-006`
  - Validasi: Nilai pilihan ganda otomatis terakumulasi seketika ujian selesai
  - Bukti: Terverifikasi dengan spec specs/task-007-grading-system.md, implementasi skema skor examParticipants & studentAnswers, logika penilaian instan di submitStudentExam, mutasi gradeEssayAnswer, query getParticipantAnswersForGrading, halaman apps/app/(main)/rekap-nilai/page.tsx dan koreksi/[id]/page.tsx, unit tests apps/tests/grading-system.test.ts (35 pass total), TypeScript 0 error (npm run typecheck), dan spek E2E specs/e2e/exam-grading.md.

- [x] `TASK-008` — Dashboard rekapitulasi nilai kelas dan ekspor data laporan
  - Status: `done`
  - Workflow: `feature`
  - Skill pendukung: none
  - Fase: `phase-04`
  - Requirements: `NILAI-FR-003`
  - Pengalaman: `UI/screens/screen-inventory.md`
  - Dependensi: `TASK-007`
  - Validasi: Daftar nilai seluruh santri tampil lengkap dengan statistik rata-rata
  - Bukti: Terverifikasi dengan spec specs/task-008-recap-dashboard-export.md, implementasi dashboard statistik kelas dan ekspor CSV/cetak laporan di apps/app/(main)/rekap-nilai/page.tsx, penyempurnaan ringkasan eksekutif beranda di apps/app/(main)/page.tsx, unit tests apps/tests/recap-export.test.ts (39 pass total), TypeScript 0 error (npm run typecheck), dan spek E2E specs/e2e/recap-export.md.

- [x] `TASK-009` — Integrasi data santri nyata SiPAKSa untuk jenjang SMP, SMA, dan MTA
  - Status: `done`
  - Workflow: `feature`
  - Skill pendukung: none
  - Fase: `phase-05`
  - Requirements: `SANTRI-FR-001`, `SANTRI-FR-002`, `SANTRI-FR-003`, `SANTRI-FR-004`
  - Pengalaman: `UI/screens/screen-inventory.md`
  - Dependensi: `TASK-005`
  - Validasi: Penarikan data santri SiPAKSa tersimpan di Convex (hanya SMPITA/SMAITA/MTA tanpa SD/TK), antarmuka manajemen santri pengajar, dan auto-fill identitas di pintu masuk ujian santri.
  - Bukti: Terverifikasi dengan skema tabel students di Convex, action syncStudentsFromSipaksa dengan filter ketat SMP/SMA/MTA, query flexible lookupStudent, implementasi antarmuka apps/app/(main)/santri/page.tsx, integrasi auto-fill di apps/app/ujian/page.tsx, 45/45 unit tests pass (apps/tests/student-sync.test.ts), 0 TypeScript error (npm run typecheck), 0 kebocoran regex spesifikasi teknis di UI, dan spek E2E specs/e2e/student-sync-and-login.md.

- [x] `TASK-010` — Pilihan lembaga dan kelas dinamis serta validasi identitas terverifikasi pada gerbang ujian santri
  - Status: `done`
  - Workflow: `feature`
  - Skill pendukung: none
  - Fase: `phase-03`
  - Requirements: `UJIAN-FR-006`, `UJIAN-FR-007`, `UJIAN-AC-004`, `UJIAN-AC-005`
  - Pengalaman: `UI/screens/screen-inventory.md`
  - Dependensi: `TASK-005`, `TASK-009`
  - Validasi: Urutan formulir masuk ujian (Nomor Induk, Lembaga, Kelas Dinamis, Nama Otomatis, Token 6 Karakter, Tombol Masuk). Pilihan lembaga mencakup SMPITA, SMAITA, MTA. Pilihan kelas bergantung pada lembaga dan bersumber dari database tanpa kelas fiktif. Kelas dinonaktifkan sebelum lembaga dipilih, dan dikosongkan ketika lembaga berganti. Validasi identitas dan token di server memastikan santri tidak dapat memanipulasi nama/kelas untuk mengakses ujian santri lain.
  - Bukti: Terverifikasi dengan spesifikasi specs/task-010-student-entry-institution-class.md, implementasi query getClassesByLembaga di apps/convex/students/public/queries.ts, validasi server-side mutasi enterExamSession di apps/convex/examSession/public/mutations.ts, formulir terstruktur 6 tahap di apps/app/ujian/page.tsx, 47/47 unit tests passing di apps/tests/student-entry.test.ts, TypeScript 0 error (npm run typecheck), 0 kebocoran regex spesifikasi teknis, dan spek E2E specs/e2e/student-exam-entry.md.

- [x] `TASK-011` — Tipe Soal PG Kompleks, Benar/Salah, Konten Stimulus, dan Form Live Preview (Bank Soal)
  - Status: `done`
  - Workflow: `feature`
  - Skill pendukung: none
  - Fase: `phase-06`
  - Requirements: `BANK-FR-005`, `BANK-FR-006`, `BANK-FR-007`, `BANK-AC-004`, `BANK-AC-005`
  - Pengalaman: `UI/screens/screen-inventory.md`
  - Dependensi: `TASK-001`, `TASK-002`
  - Validasi: Pengajar dapat membuat butir soal tipe PG Kompleks (multi-kunci) dan Benar/Salah dengan stimulus teks/media serta melihat simulasi Live Preview real-time.
  - Bukti: Terverifikasi dengan spec specs/task-011-cbt-bank-soal-enhancements.md, skema Convex tervalidasi via npx convex dev --once (Convex functions ready), implementasi editor split-view & live preview di apps/app/(main)/bank-soal/[id]/page.tsx, 55/55 unit tests passing (apps/tests/cbt-bank-soal.test.ts), 0 TypeScript error (npm run typecheck), 0 kebocoran regex spesifikasi teknis di UI, dan spek E2E specs/e2e/cbt-bank-soal-enhancements.md.

- [x] `TASK-012` — Layout 3-Panel Ruang Ujian, Proteksi Anti-Curang, Auto-Scoring Lanjutan, dan Pelaporan Pelanggaran Tab
  - Status: `done`
  - Workflow: `feature`
  - Skill pendukung: none
  - Fase: `phase-06`
  - Requirements: `UJIAN-FR-008`, `UJIAN-FR-009`, `UJIAN-AC-006`, `UJIAN-AC-007`, `NILAI-FR-005`, `NILAI-FR-006`, `NILAI-AC-004`, `NILAI-AC-005`
  - Pengalaman: `UI/screens/screen-inventory.md`
  - Dependensi: `TASK-006`, `TASK-007`, `TASK-011`
  - Validasi: Ruang ujian menampilkan tata letak 3-panel responsif, perpindahan tab memicu peringatan keras dan menambah akumulasi counter pelanggaran tab di server, tombol klik kanan dan shortcut inspect diblokir, penilaian otomatis menghitung skor PG Kompleks dan Benar/Salah, serta kolom rekap nilai menampilkan badge pelanggaran tab santri.
  - Bukti: Terverifikasi dengan spec specs/task-012-exam-3panel-integrity.md, skema Convex tervalidasi via npx convex dev --once (Convex functions ready), implementasi tata letak 3-panel responsif & proteksi anti-curang di apps/app/ujian/ExamWorksheet.tsx, mutasi recordTabViolation & auto-scoring instan di apps/convex/examSession/public/mutations.ts, kolom badge pelanggaran tab dan ekspor CSV di apps/app/(main)/rekap-nilai/page.tsx, 59/59 unit tests passing (apps/tests/cbt-exam-3panel-integrity.test.ts), 0 TypeScript error (npm run typecheck), 0 kebocoran regex spesifikasi teknis di UI, dan spek E2E specs/e2e/cbt-exam-3panel-integrity.md.

## Blocker aktif

Tidak ada blocker aktif saat ini. Seluruh pondasi autentikasi dan basis data telah siap.

## Catatan keputusan

- Keputusan: Santri mengakses ujian menggunakan NISN dan Token Sesi tanpa kewajiban registrasi email.
- Keputusan: Menggunakan warna tema identitas hijau zamrud terstandar (Islamic Pine/Teal).
