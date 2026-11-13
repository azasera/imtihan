# E2E: CBT Bank Soal Enhancements & Live Preview

- Source: TASK-011 (BANK-FR-005, BANK-FR-006, BANK-FR-007)
- Recommendation: Recommended
- Status: Passed
- Environment: local Next.js development server with Convex dev deployment (`quirky-rat-737`)
- Base URL: http://localhost:3000
- Last updated: 2026-11-05

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

### Eksekusi 2026-11-05

- Result: Passed (4/4)
- Tested at: 2026-11-05, browser agent, viewport 474x570
- Tester: `/e2e-tester` (agent browser), tanpa Playwright/Cypress
- Fixture: paket "E2E Enhancements" (Fiqih Ibadah / SMPITA / Kelas 8), dibuat dan dihapus dalam perjalanan ini.

1. Navigasi ke Editor Bank Soal — Passed
   - Actual: `/bank-soal/j573pc5we78fjq0nmtbn5hxvbn8hn2mc` menampilkan formulir "Tambah Butir Soal Baru" dan panel "Live Preview" (pada viewport 474 px keduanya bertumpuk vertikal, bukan berdampingan).
2. Pembuatan Soal PG Kompleks — Passed
   - Actions: tab "PG Kompleks", buka wacana, isi stimulus "Seorang santri membaca Quran di atas kursi karena kakinya cedera.", pertanyaan, opsi A–D, centang A dan C, simpan.
   - Actual: toast "Butir soal berhasil ditambahkan!"; daftar menampilkan badge "#1", "PG Kompleks", "Stimulus", "5 Poin", wacana dan opsi. Pemeriksaan basis data: opsi A dan C `isCorrect: true`.
3. Pembuatan Soal Benar / Salah — Passed
   - Actions: tab "Benar / Salah", isi "Wudhu batal apabila keluar sesuatu dari dua jalan.", pilih "Pernyataan Benar", simpan.
   - Actual: daftar menampilkan badge "#2", "Benar / Salah", "5 Poin", teks pernyataan, dan opsi Benar/Salah. Pemeriksaan basis data: tepat satu `isCorrect: true` pada opsi "Benar".
4. Verifikasi Interaktivitas Live Preview — Passed
   - Actions: mengetik stimulus, pertanyaan, dan empat opsi tanpa menyimpan.
   - Actual: panel "Pratinjau Siswa" langsung menampilkan wacana, pertanyaan, badge "#1 / PG Kompleks / 5 Poin", dan keempat opsi tanpa refresh; setelah A dan C dicentang, label "Kunci" muncul pada kedua opsi itu secara real-time.

- **Temuan residual (bukan kegagalan skenario)**: dua klik centang yang berurutan sangat cepat (≈200 ms) pada dua opsi menyebabkan pilihan pertama hilang (state terkontrol sempat kembali), sehingga tombol simpan sempat menolak dengan "Soal pilihan ganda kompleks harus memiliki minimal 2 kunci jawaban yang benar." Pada kecepatan klik manusia (jeda ±0,9 detik) kedua kunci tersimpan benar. Perlu dipertimbangkan perbaikan terpisah bila ingin tahan klik cepat.
- Data uji: paket "E2E Enhancements" beserta dua butirnya dihapus; tidak ada baris yatim pada tabel `questions`.
- Media: tidak ada tangkapan layar native (`NATIVE_BROWSER_VIEWPORT_UNAVAILABLE`); bukti berupa observasi DOM dan pemeriksaan basis data.
