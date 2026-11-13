# Spesifikasi E2E: Penjadwalan Sesi Ujian & Manajemen Token (TASK-004)

- **Target Kebutuhan**: `SESI-FR-001`, `SESI-FR-002`, `SESI-FR-003`
- **Rekomendasi E2E**: `Recommended`
- **Status**: `Passed` (dieksekusi 2026-11-05; 5/5 skenario)
- **Lingkungan**: Local development (`http://localhost:3000`) dengan Convex dev deployment

## Prasyarat
1. Server lokal berjalan pada `http://localhost:3000`.
2. Pengguna login sebagai pengajar/admin.
3. Minimal terdapat 1 paket bank soal tersimpan di sistem.

## Skenario Pengujian Browser
1. **Navigasi ke Halaman Sesi Ujian**:
   - Klik menu "Sesi Ujian" di sidebar navigasi.
   - *Ekspektasi*: Halaman `/sesi-ujian` terbuka, menampilkan judul "Jadwal & Sesi Ujian", tombol "Jadwalkan Sesi Ujian", dan filter status.

2. **Membuat Jadwal Sesi Ujian Baru**:
   - Klik tombol "Jadwalkan Sesi Ujian".
   - Isi formulir dialog:
     - Judul Sesi: "Ujian Fiqih Ibadah Kelas 7"
     - Pilih Paket Bank Soal
     - Durasi: 60 menit
     - Centang "Acak urutan butir soal"
   - Klik tombol "Simpan & Buat Sesi".
   - *Ekspektasi*: Dialog tertutup, toast sukses muncul, kartu sesi baru tampil di daftar dengan badge status "Draf" dan token 6 digit alfanumerik.

3. **Mengaktifkan Sesi Ujian**:
   - Pada kartu sesi yang baru dibuat, klik tombol "Aktifkan".
   - *Ekspektasi*: Status berubah menjadi "Aktif" (badge hijau), sesi kini siap digunakan santri.

4. **Regenerasi Token Ujian**:
   - Klik tombol acak ulang token (ikon Refresh) pada token sesi.
   - *Ekspektasi*: Token 6 digit berubah menjadi kombinasi baru, toast sukses konfirmasi pergantian token tampil.

5. **Menyalin Token ke Clipboard**:
   - Klik tombol salin (ikon Copy) pada token sesi.
   - *Ekspektasi*: Toast notifikasi "Token berhasil disalin ke clipboard" muncul.

## Bukti Eksekusi (2026-11-05)

### Lingkungan

- Aplikasi lokal `http://localhost:3000`, Convex dev `quirky-rat-737`, login pengajar `pengajar.uji@example.com`.
- Kanal otomasi: satu tab, viewport 474×569 px, tanpa tangkapan layar native (`NATIVE_BROWSER_VIEWPORT_UNAVAILABLE`).
- Prasyarat dibuat lewat UI: paket "E2E Sesi Bank" (Aqidah & Tauhid, SMPITA, Kelas 7, bobot total 100, KKM 75). Paket sengaja tanpa butir, sehingga kartu sesi menampilkan "0 Soal (100 Poin)".

### Hasil: `Passed` — 5/5 skenario

1. **Navigasi ke Halaman Sesi Ujian — `Passed`**
   - Menu sidebar "Sesi Ujian" membuka `/sesi-ujian` dengan judul "Jadwal & Sesi Ujian", tombol "Jadwalkan Sesi Ujian", dan filter "Semua Status".

2. **Membuat Jadwal Sesi Ujian Baru — `Passed`**
   - Dialog diisi: judul "Ujian Fiqih Ibadah Kelas 7", paket "E2E Sesi Bank" (terpilih otomatis karena satu-satunya paket), mulai `2026-11-05T00:00`, akhir `2026-11-06T23:59`, durasi 60 menit, acak urutan butir dalam keadaan tercentang.
   - Setelah "Simpan & Buat Sesi": toast `Sesi ujian berhasil dijadwalkan dengan Token: 7HLHMM`; kartu baru tampil di urutan teratas dengan badge "Draf (Belum Aktif)" dan token enam karakter `7HLHMM`. Dialog menutup (kode memanggil `setIsDialogOpen(false)` setelah mutasi sukses).

3. **Mengaktifkan Sesi Ujian — `Passed`**
   - "Aktifkan Sesi" mengubah badge menjadi "Sedang Aktif" dan memunculkan toast `Sesi ujian kini aktif dan dapat diakses santri menggunakan token.` Tombol berubah menjadi "Tutup Sesi".

4. **Regenerasi Token Ujian — `Passed`**
   - Tombol ikon `lucide-refresh-cw` berlabel "Acak ulang token ujian" mengganti token `7HLHMM` → `RXFZ66` dan menampilkan toast `Token baru berhasil dibuat: RXFZ66`.

5. **Menyalin Token ke Clipboard — `Passed`**
   - Tombol ikon `lucide-copy` berlabel "Salin token ke clipboard" menampilkan toast `Token RXFZ66 disalin ke clipboard!`.

### Pembersihan data uji

- Sesi dihapus lewat tombol "Hapus sesi ujian" pada kartu (konfirmasi diterima), lalu paket "E2E Sesi Bank" dihapus lewat "Hapus paket bank soal" (`Paket bank soal berhasil dihapus.`).
- Verifikasi CLI: `questionBanks` tanpa baris "E2E Sesi Bank" dan `examSessions` tanpa baris "Ujian Fiqih Ibadah Kelas 7" (0 kecocokan).

### Temuan

- Tidak ada cacat produk. Label status memakai teks "Draf (Belum Aktif)" dan "Sedang Aktif" — lebih panjang dari "Draf"/"Aktif" pada skenario, tetapi maknanya sama dan terbaca tanpa warna.
- Sesi uji tanpa butir tetap dapat dijadwalkan dan diaktifkan; kartu jujur menampilkan "0 Soal". Perilaku ini di luar lingkup skenario.
