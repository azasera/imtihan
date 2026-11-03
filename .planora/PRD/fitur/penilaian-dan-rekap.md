# Penilaian dan Rekap Nilai

## Tujuan

Mempercepat proses pengolahan hasil ujian santri melalui koreksi otomatis butir pilihan ganda, antarmuka periksa cepat untuk soal essay, dan lembar rekapitulasi nilai yang rapi dan mudah diunduh.

## User stories

- Sebagai Pengajar, saya ingin nilai soal pilihan ganda dihitung secara otomatis seketika santri mengumpulkan ujian agar saya tidak perlu mengoreksi manual satu per satu.
- Sebagai Pengajar, saya ingin membuka lembar periksa essay santri dan memberikan skor nilai per butir soal dengan cepat.
- Sebagai Panitia/Admin, saya ingin mengunduh rekapitulasi daftar nilai seluruh santri dalam satu kelas untuk dicetak atau dilaporkan kepada pimpinan pesantren.

## Kebutuhan fungsional

- `NILAI-FR-001` — Sistem harus secara instan menghitung skor nilai pilihan ganda berdasarkan kunci jawaban dan bobot masing-masing butir soal.
- `NILAI-FR-002` — Sistem harus menyediakan antarmuka khusus koreksi essay bagi pengajar untuk memasukkan skor penilaian dan catatan evaluasi.
- `NILAI-FR-003` — Sistem harus menghitung akumulasi skor total akhir santri (Pilihan Ganda + Essay) secara otomatis.
- `NILAI-FR-004` — Sistem harus menyediakan tabel rekap nilai kelas lengkap dengan statistik nilai tertinggi, terendah, dan rata-rata kelas.
- `NILAI-FR-005` — Sistem harus menghitung skor otomatis untuk butir soal Pilihan Ganda Kompleks dan Benar/Salah secara instan di backend seketika santri mengumpulkan ujian.
- `NILAI-FR-006` — Sistem harus mencatat dan menampilkan metrik pelanggaran tab (tab violations) pada tabel rekapitulasi nilai kelas, serta menyertakannya dalam ekspor laporan rekapitulasi.

## Kriteria penerimaan

- `NILAI-AC-001` — Skor pilihan ganda santri langsung tampil di dashboard pengajar dalam waktu maksimal 2 detik setelah santri melakukan submit ujian.
- `NILAI-AC-002` — Nilai akhir santri diperbarui secara otomatis setelah pengajar selesai mengisi skor nilai butir essay.
- `NILAI-AC-003` — Data rekap nilai dapat diekspor ke format tabel CSV/Excel yang rapi dan siap cetak.
- `NILAI-AC-004` — Skor butir soal PG Kompleks dan Benar/Salah langsung terakumulasi ke dalam total skor santri tanpa memerlukan intervensi koreksi manual.
- `NILAI-AC-005` — Kolom rekapitulasi ujian menampilkan jumlah pelanggaran tab dengan badge visual agar pengajar/pengawas dapat segera mengidentifikasi indikasi kecurangan.

## Edge cases

- Santri yang tidak menjawab satu pun soal pilihan ganda mendapatkan skor 0 untuk bagian pilihan ganda secara valid tanpa menyebabkan pembagian dengan nol.
