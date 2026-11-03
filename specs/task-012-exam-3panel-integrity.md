# Specification: TASK-012 Layout 3-Panel Ruang Ujian, Proteksi Anti-Curang, Auto-Scoring Lanjutan, dan Pelaporan Pelanggaran Tab

## Problem & Desired Behavior
- **Problem**:
  1. Ruang pengerjaan ujian santri (`ExamWorksheet.tsx`) saat ini belum memiliki tata letak 3-panel independen untuk menampilkan wacana/stimulus panjang (seperti format ANBK/AKM).
  2. Belum ada dukungan antarmuka pengerjaan untuk tipe soal baru: Pilihan Ganda Kompleks (`pg_kompleks` multi-pilihan checkbox) dan Benar/Salah (`true_false`).
  3. Belum ada proteksi integritas anti-curang (deteksi perpindahan tab/jendela ujian dan pencegahan klik kanan/copy-paste).
  4. Penilaian otomatis (`submitStudentExam`) di backend belum menghitung skor instan untuk tipe `pg_kompleks` dan `true_false`.
  5. Dashboard rekapitulasi nilai pengajar (`rekap-nilai/page.tsx`) belum mencatat dan menampilkan metrik pelanggaran tab santri.
- **Desired Behavior**:
  1. Lembar ujian santri disajikan dalam tata letak responsif 3-Panel:
     - Panel 1 (Kiri): Panel Wacana / Stimulus scrollable mandiri yang menampilkan teks wacana bacaan dan media gambar pendukung jika soal memiliki stimulus.
     - Panel 2 (Tengah): Area Pertanyaan Soal, pilihan opsi interaktif (Radio untuk single choice, Checkbox untuk PG kompleks, Pill button untuk Benar/Salah), tombol status Ragu-Ragu, serta navigasi nomor.
     - Panel 3 (Kanan): Grid penjelajah nomor soal dengan status visual (Belum dijawab, Terjawab, Ragu-ragu, Nomor aktif) dan tombol pengumpulan ujian.
     - Pada mobile/tablet: Panel stimulus dan penjelajah nomor dapat dibuka melalui toggle sheet/drawer responsif.
  2. Proteksi Anti-Curang & Integritas:
     - Deteksi `visibilitychange` dan `blur`: Setiap kali santri berpindah tab atau meminimalkan jendela, mutasi `recordTabViolation` dipanggil untuk mengakumulasi jumlah pelanggaran di database, dan dialog modal peringatan keras muncul saat santri kembali.
     - Blokir klik kanan (`contextmenu`) dan shortcut copy-paste pada lembar ujian santri.
  3. Auto-Scoring Lanjutan di Backend:
     - Penilaian otomatis di `submitStudentExam` menghitung skor instan untuk `pg_kompleks` (mencocokkan set opsi yang dipilih santri dengan set kunci jawaban yang benar) dan `true_false` (mencocokkan opsi benar/salah).
  4. Pelaporan Pelanggaran di Rekap Nilai:
     - Tabel rekap nilai pengajar menyajikan kolom indikator pelanggaran tab dengan badge kode warna berjenjang (hijau/netral untuk 0, amber untuk 1-2, rose/merah untuk 3+), serta menyertakannya dalam unduhan ekspor CSV.
  5. Seluruh antarmuka bersih dari kode spesifikasi teknis (`*-FR-*`, `*-AC-*`, `TASK-*`, dll.) dan tanpa emoji.

## Scope
- **In Scope**:
  - `apps/convex/schema.ts`: Penambahan field `tabViolations` pada `examParticipants` dan `selectedOptionIds` pada `studentAnswers`.
  - `apps/convex/examSession/public/mutations.ts`: Mutasi `recordTabViolation`, pembaruan `saveStudentAnswer`, dan logika auto-scoring untuk `pg_kompleks` & `true_false` di `submitStudentExam`.
  - `apps/convex/examSession/public/queries.ts`: Eksposur `selectedOptionIds` dan `tabViolations` pada `getStudentExamSheet` dan rekapitulasi.
  - `apps/app/ujian/ExamWorksheet.tsx`: Tata letak 3-panel responsif, input `pg_kompleks` & `true_false`, event listener anti-curang, modal peringatan pelanggaran tab, dan proteksi clipboard/contextmenu.
  - `apps/app/(main)/rekap-nilai/page.tsx`: Penambahan kolom badge pelanggaran tab dan ekspor CSV.
  - `apps/tests/cbt-exam-3panel-integrity.test.ts`: Pengujian unit dan integritas fitur baru.
  - `specs/e2e/cbt-exam-3panel-integrity.md`: Spesifikasi pengujian E2E browser.
- **Out of Scope**:
  - Webcam proctoring berbasis AI atau lockdown browser OS khusus (out-of-scope Fase 1).

## Evidence & Relevant Files
- `apps/convex/schema.ts` — Skema tabel `examParticipants` dan `studentAnswers`.
- `apps/convex/examSession/public/mutations.ts` — Mutasi `recordTabViolation`, `saveStudentAnswer`, dan `submitStudentExam`.
- `apps/app/ujian/ExamWorksheet.tsx` — Komponen lembar pengerjaan ujian santri.
- `apps/app/(main)/rekap-nilai/page.tsx` — Halaman rekapitulasi nilai pengajar.
- `apps/components/ui/` — Komponen Shadcn UI (`dialog.tsx`, `badge.tsx`, `button.tsx`, `checkbox.tsx`, `card.tsx`).

## Dependency-Ordered Implementation Requirements
1. **Perluasan Skema Data Convex (`apps/convex/schema.ts`)**:
   - Tambahkan `tabViolations: v.optional(v.number())` pada `examParticipants`.
   - Tambahkan `selectedOptionIds: v.optional(v.array(v.string()))` pada `studentAnswers`.
2. **Pembaruan Mutasi & Logika Auto-Scoring Convex (`apps/convex/examSession/public/mutations.ts`)**:
   - Buat mutasi `recordTabViolation` yang menginkrementasi `tabViolations` santri.
   - Perbarui `saveStudentAnswer` agar dapat menyimpan `selectedOptionIds`.
   - Perbarui `submitStudentExam` untuk mengoreksi otomatis tipe `pg_kompleks` dan `true_false`.
   - Sinkronisasi dengan deployment cloud via `npx convex dev --once`.
3. **Pembaruan Query Convex (`apps/convex/examSession/public/queries.ts`)**:
   - Pastikan `selectedOptionIds` dan `tabViolations` tersedia di `getStudentExamSheet` dan query rekap nilai.
4. **Implementasi UI Lembar Ujian 3-Panel & Anti-Curang (`apps/app/ujian/ExamWorksheet.tsx`)**:
   - Susun grid 3-panel: Panel 1 (Stimulus), Panel 2 (Soal & Opsi PG, PG Kompleks, Benar/Salah), Panel 3 (Penjelajah Nomor).
   - Pasang proteksi `visibilitychange` & `blur` + modal dialog peringatan pelanggaran tab.
   - Blokir `contextmenu`, `copy`, dan `cut`.
5. **Pembaruan Dashboard Rekap Nilai (`apps/app/(main)/rekap-nilai/page.tsx`)**:
   - Tambahkan kolom Pelanggaran Tab pada tabel nilai dan file ekspor CSV.
6. **Pengujian Unit & Pencegahan Kebocoran (`apps/tests/cbt-exam-3panel-integrity.test.ts`)**:
   - Verifikasi skema, logika auto-scoring, mutasi `recordTabViolation`, dan 0 kebocoran kode teknis di UI.
7. **Penyusunan Spek E2E (`specs/e2e/cbt-exam-3panel-integrity.md`)**:
   - Skenario pengerjaan ujian 3-panel, interaksi soal beragam tipe, dan deteksi peringatan tab switch.

## Measurable Acceptance Criteria
- `UJIAN-FR-008` & `UJIAN-AC-007`: Tata letak 3-panel responsif beroperasi optimal di desktop dan mobile/tablet.
- `UJIAN-FR-009` & `UJIAN-AC-006`: Perpindahan tab/jendela memicu dialog peringatan keras dan menambah akumulasi `tabViolations` di server.
- `NILAI-FR-005` & `NILAI-AC-004`: Jawaban PG Kompleks dan Benar/Salah dinilai secara instan dan akurat oleh backend saat submit.
- `NILAI-FR-006` & `NILAI-AC-005`: Jumlah pelanggaran tab ditampilkan dengan badge berkode warna di rekap nilai dan disertakan dalam ekspor CSV.
- `npx convex dev --once` melaporkan `Convex functions ready!`.
- Seluruh tes otomatis passing dan 0 kebocoran regex spesifikasi teknis di UI.

## Risk, Compatibility, and Migration Considerations
- Data peserta yang sudah selesai mengerjakan ujian sebelumnya tetap valid (`tabViolations` bernilai undefined dianggap 0).
- Desain mobile fallback menggunakan sheet/drawer untuk memastikan layar smartphone tidak sesak.

## Repository-Appropriate Validation Commands
- `npx convex dev --once` (dijalankan dari `apps/`)
- `npm --prefix apps run test`
- `npm --prefix apps run typecheck`

## E2E Assessment
- **Recommendation**: Required.
- **Reason**: Melibatkan perjalanan pengguna kritis (critical user journey) pengerjaan ujian santri, proteksi anti-curang di browser, dan perhitungan skor kelulusan.
- **Handoff**: Disiapkan file spesifikasi E2E di `specs/e2e/cbt-exam-3panel-integrity.md`.
