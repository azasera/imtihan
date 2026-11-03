# Spesifikasi komponen ruang ujian dan monitoring

## Komponen Utama

1. **Tombol (Button)**:
   - Variant default: Primary green background untuk aksi utama.
   - Variant outline / ghost: Untuk aksi sekunder seperti navigasi kembali.
2. **Kartu Nomor Soal (Question Number Grid)**:
   - Kotak nomor ukuran 40x40 px dengan status warna:
     - Hijau (Primary): Sudah dijawab.
     - Kuning/Amber: Ragu-ragu.
     - Abu-abu/Outline: Belum dijawab.
     - Ring Tebal: Nomor soal yang sedang aktif dibuka.
3. **Timer Display**:
   - Card kompak di sudut atas ruang ujian dengan ikon jam dan angka monospace hitung mundur. Peringatan visual warna oranye ketika sisa waktu < 10 menit.
4. **Pilihan Jawaban (Radio Option Card)**:
   - Kartu opsi jawaban pilihan ganda berukuran penuh yang dapat diklik pada seluruh area baris (bukan hanya lingkaran radio).
5. **Badge Status Peserta (Participant Status Badge)**:
   - Badge berlabel teks untuk layar monitoring: "Sedang mengerjakan" memakai amber, "Selesai" memakai hijau primary.
   - Badge jumlah pelanggaran tab hanya terpasang saat jumlahnya lebih dari nol; nol ditampilkan sebagai teks biasa agar tidak menarik perhatian palsu.
6. **Pemilih Sesi (Session Selector)**:
   - Dropdown satu layar untuk memilih sesi ujian milik pengajar yang sedang login, dengan sesi aktif sebagai pilihan awal.
