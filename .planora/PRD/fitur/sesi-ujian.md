# Sesi dan Jadwal Ujian

## Tujuan

Memungkinkan panitia ujian dan pengajar untuk menjadwalkan pelaksanaan ujian, menentukan durasi waktu pengerjaan, mengontrol token akses santri, serta mengatur opsi keamanan seperti pengacakan urutan soal.

## User stories

- Sebagai Pengajar/Panitia, saya ingin membuat sesi ujian dengan menentukan waktu mulai, waktu selesai, dan batas durasi (misal 60 menit) agar santri tertib waktu.
- Sebagai Pengajar, saya ingin menghasilkan token akses unik (misal 6 karakter alfanumerik) yang dapat diaktifkan menjelang ujian dimulai dan dinonaktifkan setelahnya.
- Sebagai Pengajar, saya ingin mengaktifkan fitur acak urutan soal agar setiap santri yang bersebelahan menerima urutan soal yang berbeda.

## Kebutuhan fungsional

- `SESI-FR-001` — Sistem harus menyediakan manajemen sesi ujian dengan parameter: judul sesi, bank soal rujukan, tanggal/jam mulai, tanggal/jam selesai, dan durasi menit pengerjaan.
- `SESI-FR-002` — Sistem harus menyediakan generator token akses acak 6 digit alfanumerik yang dapat di-generate ulang kapan saja oleh pengawas.
- `SESI-FR-003` — Sistem harus menyediakan toggle untuk mengaktifkan pengacakan urutan nomor butir soal dan pengacakan urutan opsi pilihan ganda.
- `SESI-FR-004` — Sistem harus menyediakan monitoring langsung (live monitor) status kehadiran peserta (belum mulai, sedang mengerjakan, telah selesai).

## Kriteria penerimaan

- `SESI-AC-001` — Token sesi ujian hanya dapat digunakan oleh santri selama rentang waktu sesi berstatus aktif.
- `SESI-AC-002` — Ketika pengawas menonaktifkan status sesi, seluruh santri yang sedang mengerjakan tidak dapat lagi mengubah jawaban.
- `SESI-AC-003` — Urutan soal yang diacak tetap konsisten untuk satu santri tertentu selama sesi ujian berlangsung meskipun halaman di-refresh.

## Edge cases

- Santri yang terlambat masuk ujian hanya mendapatkan sisa waktu sesi yang tersedia jika batas akhir sesi telah ditentukan.
