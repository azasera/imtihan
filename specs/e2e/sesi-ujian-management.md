# Spesifikasi E2E: Penjadwalan Sesi Ujian & Manajemen Token (TASK-004)

- **Target Kebutuhan**: `SESI-FR-001`, `SESI-FR-002`, `SESI-FR-003`
- **Rekomendasi E2E**: `Recommended`
- **Status**: `Pending` (Handoff untuk `/e2e-tester`)
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

## Bukti Eksekusi (Evidence)
*(Akan diisi setelah /e2e-tester dijalankan)*
