# E2E: CBT Bank Soal Enhancements & Live Preview

- Source: TASK-011 (BANK-FR-005, BANK-FR-006, BANK-FR-007)
- Recommendation: Recommended
- Status: Pending
- Environment: local Next.js development server with Convex dev deployment
- Base URL: http://localhost:3000
- Last updated: 2026-10-29

## Prerequisites

- Application running at `http://localhost:3000`.
- User logged in as teacher/pengajar.
- Minimal satu paket bank soal sudah tersedia di `/bank-soal`.

## Scenarios

1. Navigasi ke Editor Bank Soal
   - Actions: Buka salah satu paket bank soal di `/bank-soal/[id]`.
   - Expected: Halaman editor terbuka, menampilkan formulir tambah soal di kiri dan panel Live Preview di kanan.

2. Pembuatan Soal Pilihan Ganda Kompleks
   - Actions: Pilih tab "PG Kompleks", buka wacana stimulus dan isi teks stimulus, isi pertanyaan soal, isi opsi A-D, centang opsi A dan C sebagai kunci jawaban benar, klik "Simpan Butir Soal".
   - Expected: Butir soal berhasil tersimpan dan tampil di daftar soal tersimpan dengan badge "PG Kompleks" dan badge "Stimulus".

3. Pembuatan Soal Benar / Salah
   - Actions: Pilih tab "Benar / Salah", isi teks pertanyaan/pernyataan, pilih tombol "Pernyataan Benar" sebagai kunci, klik "Simpan Butir Soal".
   - Expected: Butir soal berhasil tersimpan dengan tipe "Benar / Salah" dan 1 kunci jawaban terverifikasi.

4. Verifikasi Interaktivitas Live Preview
   - Actions: Saat mengetik pertanyaan dan opsi, amati panel "Live Preview" di sebelah kanan.
   - Expected: Panel Live Preview memperbarui rendering teks, badge nomor, dan kartu opsi secara real-time tanpa perlu refresh halaman.

## Evidence

- Result: Pending
- Tested at: Pending
- Scenario evidence: Pending
- Failures or blockers: None
