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

## Pola membagikan token

1. Pengajar membuka kartu token pada layar monitoring, lalu memilih "Tayangkan layar penuh" sehingga token berukuran besar terlihat oleh seisi ruangan tanpa menampilkan nama santri mana pun.
2. Bila masa berlaku token diatur berganti berkala, hitungan mundur "Berganti dalam ..." berjalan pada kartu yang sama; pengajar tidak perlu memuat ulang halaman untuk melihat token terbaru.
3. Santri yang mengetik token yang baru saja berganti hanya perlu meminta token yang sedang tayang; isian nomor induk, lembaga, dan kelasnya tidak hilang.

## Pola menegakkan sesuai pilihan pengajar

1. Mode mencatat (bawaan) hanya memberi peringatan kepada santri dan mencatat pelanggarannya; tidak ada satu pun lembar yang berhenti.
2. Mode kunci baru bekerja setelah jumlah pelanggaran satu santri melewati ambang sesi. Lembar santri berhenti menerima isian, sementara sisa waktu dan jumlah jawaban tersimpan tetap terlihat.
3. Pembukaan kembali hanya dari baris peserta pada layar monitoring, memakai label "Terkunci" yang terbaca tanpa warna, dan peristiwa pembukaan tercatat waktunya.
4. Satu perpindahan jendela dihitung sekali sampai santri benar-benar kembali, sehingga gawai yang tidur sendiri atau notifikasi masuk tidak menumpuk menjadi pelanggaran berulang.

## Pola dari hasil analisis ke tindak lanjut

1. Setelah nilai sesi lengkap, pengajar membuka analisis mutu butir dari header rekap nilai.
2. Butir bertanda "perlu ditinjau" dibaca beserta alasannya, lalu pengajar membuka butir itu lewat sunting butir pada paketnya, atau menandainya untuk diajarkan ulang.
3. Santri yang masuk kelompok remedial dipanggil melalui sesi lanjutan berjenis remedial dengan peserta dipilih per santri, bukan dengan mengulang sesi untuk seluruh kelas.
