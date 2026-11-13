# E2E: Bank Soal Management & Question Editor

- Source: TASK-002 (BANK-FR-002)
- Recommendation: Recommended
- Status: Passed
- Environment: local Next.js development server with Convex dev deployment (`quirky-rat-737`)
- Base URL: http://localhost:3000
- Last updated: 2026-11-05

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

### Eksekusi 2026-11-05

- Result: Passed (4/4)
- Tested at: 2026-11-05, browser agent, viewport 474x570
- Tester: `/e2e-tester` (agent browser), tanpa Playwright/Cypress

1. Navigasi ke Bank Soal — Passed
   - Menus sidebar (diamati pada uji branding): Dashboard, Bank Soal, Sesi Ujian, Monitoring Sesi, Rekap Nilai, Data Santri, Ruang Ujian Santri. Membuka `/bank-soal` menampilkan judul "Bank Soal & Materi Ujian", tombol "Buat Paket Bank Soal", dan filter "Semua Mata Pelajaran".
2. Pembuatan Paket Bank Soal — Passed
   - Actions: buka "Buat Paket Bank Soal", isi judul "Ujian Fiqih Ibadah", pilih Fiqih Ibadah, SMPITA, Kelas 7, kirim.
   - Actual: dialog tertutup, toast "Paket bank soal berhasil dibuat!", browser pindah ke `/bank-soal/j57djf1ysyhw59b08r3nscacm58hm7fm` dengan header "Ujian Fiqih Ibadah / Fiqih Ibadah / Kelas 7".
3. Penambahan Soal Pilihan Ganda — Passed
   - Actions: tab "Pilihan Ganda", isi "Apa rukun pertama wudhu?", opsi A "Niat", B "Membasuh wajah", C "Membasuh kedua tangan", D "Mengusap kepala", radio B dipilih, "Simpan Butir Soal".
   - Actual: toast "Butir soal berhasil ditambahkan!"; daftar kanan "Daftar Soal (1)" menampilkan badge "#1", "Pilihan Ganda", "5 Poin", teks soal dan opsi A–D; opsi B (kunci) diberi sorotan `bg-primary/10 text-primary font-semibold` dan ikon centang — indikator kunci terbaca.
4. Penambahan Soal Essay — Passed
   - Actions: tab "Essay", isi "Jelaskan tiga hal yang membatalkan wudhu beserta dalilnya.", rubrik "Nilai penuh bila santri menyebut tiga pembatal dan satu dalil yang tepat.", poin 10, simpan.
   - Actual: toast sukses; "Daftar Soal (2)" menampilkan badge "#2", "Essay", "10 Poin", teks soal, dan "Rubrik: …".

- Failures or blockers: Tidak ada.
- Data uji: paket "Ujian Fiqih Ibadah" dihapus di akhir; tabel `questions` tidak menyisakan butir yatim (penghapusan paket mencakup butirnya).
- Media: tidak ada tangkapan layar native (`NATIVE_BROWSER_VIEWPORT_UNAVAILABLE`); bukti berupa observasi DOM dan teks toast.
