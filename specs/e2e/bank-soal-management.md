# E2E: Bank Soal Management & Question Editor

- Source: TASK-002 (BANK-FR-002)
- Recommendation: Recommended
- Status: Pending
- Environment: local Next.js development server with Convex dev deployment
- Base URL: http://localhost:3000
- Last updated: 2026-10-28

## Prerequisites

- Application running at `http://localhost:3000`.
- User logged in as teacher/pengajar.

## Scenarios

1. Navigasi ke Bank Soal
   - Actions: Klik menu "Bank Soal" di sidebar.
   - Expected: Halaman `/bank-soal` terbuka, menampilkan tombol "+ Buat Paket Bank Soal" dan filter mapel.

2. Pembuatan Paket Bank Soal
   - Actions: Klik "+ Buat Paket Bank Soal", isi judul "Ujian Fiqih Ibadah", pilih mata pelajaran "Fiqih Ibadah", kelas "Kelas 7", klik Simpan.
   - Expected: Dialog tertutup, toast sukses muncul, dan browser diarahkan ke halaman editor `/bank-soal/[id]`.

3. Penambahan Soal Pilihan Ganda
   - Actions: Di editor soal, pilih tab "Pilihan Ganda", isi teks soal, isi opsi A-D, tandai opsi B sebagai kunci jawaban benar, klik "Simpan Butir Soal".
   - Expected: Butir soal berhasil tersimpan dan langsung tampil di daftar sebelah kanan dengan badge "#1", "Pilihan Ganda", dan indikator kunci jawaban.

4. Penambahan Soal Essay
   - Actions: Pilih tab "Essay", isi teks soal uraian dan rubrik penilaian, klik "Simpan Butir Soal".
   - Expected: Butir soal kedua bertipe Essay muncul di daftar sebelah kanan dengan badge "#2".

## Evidence

- Result: Pending
- Tested at: Pending
- Scenario evidence: Pending
- Failures or blockers: None
