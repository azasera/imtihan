# Spesifikasi E2E: Manajemen Sesi Ujian & Validasi Token (TASK-003)

- **Target Kebutuhan**: `SESI-FR-001`, `SESI-FR-002`, `SESI-FR-003`
- **Rekomendasi E2E**: `Recommended`
- **Status**: `Pending` (Handoff untuk `/e2e-tester`)
- **Lingkungan**: Local development (`http://localhost:3000`) dengan Convex dev deployment

## Prasyarat
1. Server lokal aktif pada port 3000 (`npm run dev`).
2. Pengguna pengajar login dengan akun terdaftar.
3. Minimal terdapat 1 paket bank soal aktif.

## Skenario Pengujian Browser
1. **Pembuatan Sesi Ujian Baru**:
   - Pengajar membuka menu jadwal sesi ujian.
   - Mengisi formulir: Judul Sesi, memilih Paket Bank Soal, menentukan rentang waktu, durasi pengerjaan (misal 60 menit), serta opsi acak nomor soal.
   - Menekan tombol "Simpan Sesi".
   - *Ekspektasi*: Sesi berhasil dibuat dan muncul di daftar dengan token 6 digit alfanumerik.

2. **Regenerasi Token Ujian**:
   - Pengajar memilih sesi ujian dan menekan tombol "Acak Ulang Token".
   - Mengonfirmasi tindakan.
   - *Ekspektasi*: Token lama tergantikan dengan kombinasi 6 karakter baru, dan notifikasi sukses muncul.

3. **Aktivasi Sesi & Verifikasi Token Santri**:
   - Pengawas mengubah status sesi menjadi "Aktif".
   - Menggunakan mode incognito/santri, masukkan token 6 digit ke halaman verifikasi ujian santri.
   - *Ekspektasi*: Sistem mengenali sesi, menampilkan judul ujian, mata pelajaran, dan durasi tanpa membocorkan jawaban.

## Bukti Eksekusi (Evidence)
*(Akan dilengkapi saat /e2e-tester dijalankan)*
