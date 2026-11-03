# E2E: CBT Exam 3-Panel Layout & Integrity Anti-Cheat

- Source: TASK-012 (UJIAN-FR-008, UJIAN-FR-009, NILAI-FR-005, NILAI-FR-006)
- Recommendation: Required
- Status: Pending
- Environment: local Next.js development server with Convex dev deployment
- Base URL: http://localhost:3000
- Last updated: 2026-10-29

## Prerequisites

- Application running at `http://localhost:3000`.
- Sesi ujian aktif dengan paket bank soal yang memuat soal PG biasa, PG Kompleks berstimulus, Benar/Salah, dan Essay.
- Santri telah terdaftar dan memiliki token ujian 6 digit yang valid.

## Scenarios

1. Memasuki Ruang Ujian dan Memeriksa Tata Letak 3-Panel
   - Actions: Santri memasukkan nomor induk, memilih lembaga dan kelas, memasukkan token 6 digit, lalu menekan tombol masuk.
   - Expected: Santri berhasil masuk ke lembar ujian. Di layar desktop, tampil tata letak 3-panel: Panel Wacana/Stimulus di kiri, Lembar Soal di tengah, dan Peta Nomor Soal di kanan.

2. Pengerjaan Soal Pilihan Ganda Kompleks
   - Actions: Navigasi ke nomor soal bertipe PG Kompleks. Centang 2 opsi jawaban yang benar.
   - Expected: Kedua opsi tercentang secara interaktif, indikator auto-save menampilkan status tersimpan, dan nomor pada peta soal berubah menjadi warna hijau (sudah dijawab).

3. Pengerjaan Soal Benar / Salah
   - Actions: Navigasi ke soal Benar/Salah. Klik tombol "Pernyataan Benar".
   - Expected: Kartu opsi "Benar" terpilih dengan highlight jelas, status tersimpan otomatis ke server.

4. Uji Deteksi Anti-Curang (Tab Blur / Visibility Change)
   - Actions: Pengguna beralih ke tab peramban lain atau membuka jendela lain di komputer, lalu kembali lagi ke tab ruang ujian.
   - Expected: Dialog "Peringatan Integritas Ujian" muncul di layar, memberitahukan bahwa perpindahan jendela telah dicatat oleh sistem pengawas dengan counter pelanggaran bertambah.

5. Pengumpulan Ujian dan Pemeriksaan Rekapitulasi Nilai
   - Actions: Klik tombol "Selesaikan Ujian", konfirmasi dialog pengumpulan final. Masuk sebagai pengajar dan buka halaman `/rekap-nilai`.
   - Expected: Ujian santri berstatus Selesai, nilai pilihan ganda (termasuk PG Kompleks dan Benar/Salah) terhitung otomatis secara instan, dan kolom "Pelanggaran Tab" menampilkan badge jumlah pelanggaran yang dilakukan santri.

## Evidence

- Result: Pending
- Tested at: Pending
- Scenario evidence: Pending
- Failures or blockers: None
