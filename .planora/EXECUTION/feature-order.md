# Urutan fitur

Rencana tahapan implementasi fitur berdasarkan dependensi teknis:

1. **Pondasi Manajemen Bank Soal**:
   - Menjadi dependensi mutlak karena sesi ujian memerlukan paket butir soal yang telah tersedia.
2. **Sesi Ujian dan Token Akses**:
   - Mengatur parameter jadwal, durasi pengerjaan, dan generator token dari paket bank soal yang telah dibuat.
3. **Ruang Ujian Santri (CBA Interface)**:
   - Menggunakan token ujian untuk memberikan akses pengerjaan soal dan perekaman jawaban santri.
4. **Penilaian dan Rekapitulasi Nilai**:
   - Menghitung lembar jawaban santri yang telah terkumpul dan menyajikan laporan nilai bagi pengajar.
5. **Integrasi Data Santri SiPAKSa (SMP, SMA, MTA)**:
   - Menghubungkan platform dengan API SiPAKSa untuk menyinkronkan 346 santri nyata dan menyediakan auto-complete identitas ujian.
6. **Penyempurnaan Fitur CBT & Integritas Ujian**:
   - Menambahkan tipe soal PG Kompleks dan Benar/Salah, stimulus wacana/media, formulir pembuatan soal dengan Live Preview, ruang ujian 3-panel responsif, proteksi anti-curang (tab blur detection, clipboard blocker), serta metrik pelanggaran tab di rekap nilai.
