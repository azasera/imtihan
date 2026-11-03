# Pola interaksi alur ujian

## Pola Alur Pengerjaan Ujian

1. **Masuk Ujian**:
   - Santri memasukkan NISN dan Token di layar pembuka -> Klik tombol Masuk Ujian -> Menampilkan konfirmasi identitas santri & mata pelajaran -> Klik Mulai Mengerjakan.
2. **Pengerjaan Soal**:
   - Memilih opsi jawaban langsung memicu status penyimpanan (Tersimpan) tanpa jeda halaman.
   - Tombol Ragu-ragu memberi tanda warna pada grid nomor soal untuk ditinjau ulang nanti.
3. **Pengumpulan Ujian**:
   - Tombol Kumpulkan Ujian membuka modal rekapitulasi: jumlah soal terjawab, belum terjawab, dan ragu-ragu.
   - Memerlukan konfirmasi centang pernyataan kesiapan sebelum tombol submit akhir aktif.

## Pola Pemantauan oleh Pengawas

1. **Mengawasi sesi berjalan**:
   - Pengajar membuka menu Monitoring Sesi, memilih sesi, lalu melihat daftar peserta yang berubah langsung tanpa memuat ulang halaman.
2. **Menindaklanjuti pelanggaran**:
   - Baris dengan badge pelanggaran tab dibuka lebih dulu; pengajar menekan "Buka koreksi" untuk melihat lembar peserta tersebut.
3. **Keadaan kosong**:
   - Sesi tanpa peserta menampilkan pesan singkat dan token sesi, bukan tabel kosong dengan pesan galat.
