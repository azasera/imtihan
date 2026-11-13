# Spesifikasi E2E: Manajemen Sesi Ujian & Validasi Token (TASK-003)

- **Target Kebutuhan**: `SESI-FR-001`, `SESI-FR-002`, `SESI-FR-003`
- **Rekomendasi E2E**: `Recommended`
- **Status**: `Passed` (2026-11-05; 3/3 skenario)
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

**Tanggal**: 2026-11-05
**Lingkungan**: `http://localhost:3000` + Convex dev `quirky-rat-737`
**Akun**: pengajar.uji@example.com; santri Achmad Syafiq Al Baraja (NISN 26.02.082, SMPITA 7A)
**Catatan media**: viewport otomatis 474×569; tangkapan layar native tidak tersedia (`NATIVE_BROWSER_VIEWPORT_UNAVAILABLE`), bukti berupa snapshot pohon aksesibilitas, teks toast, dan query basis data.

### Fixture
- Paket bank soal "E2E Session Backend" (`j578xf608np0jbtsnrn39ktvzh8hnj54`), mata pelajaran AQIDAH, SMPITA Kelas 7, 100 poin, 1 butir "Apa hukum niat dalam wudhu?" (kunci A).
- Sesi "E2E Session Backend Sesi", durasi 60 menit, 2026-11-05 s/d 2026-11-06.

### Hasil Skenario

1. **Pembuatan Sesi Ujian Baru** — `Passed`
   - Aksi: buka `/sesi-ujian`, klik "Jadwalkan Sesi Ujian", isi judul, pilih paket, atur rentang waktu & durasi 60, aktifkan acak nomor soal, simpan.
   - Hasil: sesi tersimpan, dialog tertutup, token 6 karakter alfanumerik `A3S3G6` tampil pada kartu sesi berstatus "Draf (Belum Aktif)".

2. **Regenerasi Token Ujian** — `Passed`
   - Aksi: klik tombol "Acak ulang token ujian" (judul tombol ikon Refresh).
   - Hasil: dialog konfirmasi tampil verbatim — `Apakah Anda yakin ingin mengacak ulang token untuk sesi "E2E Session Backend Sesi"? Token sebelumnya tidak akan berlaku lagi.` Setelah diterima, token berubah menjadi `56VXMW` dan toast `Token baru berhasil dibuat: 56VXMW` muncul.

3. **Aktivasi Sesi & Verifikasi Token Santri** — `Passed`
   - Aksi: klik "Aktifkan" pada kartu sesi; toast `Sesi ujian kini aktif dan dapat diakses santri menggunakan token.`; buka `/ujian` di tab yang sama, isi NISN `26.02.082` (lembaga, kelas, dan nama terkunci otomatis dari master santri), masukkan token `56VXMW`.
   - Hasil: blok "Sesi Ujian Ditemukan & Siap Diakses" menampilkan `Judul Ujian: E2E Session Backend Sesi`, `Mata Pelajaran: AQIDAH`, `Durasi Waktu: 60 Menit`, `Jumlah Soal: 1 Butir`. Pemindaian teks DOM: tidak ada teks butir soal ("niat"), tidak ada penanda "kunci jawaban", dan tidak ada opsi jawaban pada halaman verifikasi.
   - Catatan: gerbang kini memakai 5 isian (NISN, lembaga, kelas, nama, token). Lembaga/kelas/nama terisi dan terkunci otomatis setelah NISN dikenali, berbeda dari deskripsi lama "pilih lembaga/kelas" — perilaku ini lebih ketat dan bukan defek.

### Pembersihan
- Sesi, butir, dan paket dihapus lewat internal mutation sementara (`sessions: 1, participants: 0, answers: 0, questions: 1, banks: 1`), modul sementara dihapus dan deployment di-deploy ulang (`Convex functions ready!`).
- Verifikasi residu: `npx convex data questionBanks` → 0 baris cocok; `npx convex data examSessions` → 0 baris "E2E Session Backend".

### Temuan
- Tidak ada cacat produk pada ketiga skenario.
- Rendah: label UI memakai istilah lebih panjang dari spesifikasi ("Acak ulang token ujian" vs "Acak Ulang Token"), makna tetap sama.
