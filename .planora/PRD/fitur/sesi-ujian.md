# Sesi dan Jadwal Ujian

## Tujuan

Memungkinkan panitia ujian dan pengajar untuk menjadwalkan pelaksanaan ujian, menentukan durasi waktu pengerjaan, mengontrol token akses santri, mengatur opsi keamanan seperti pengacakan urutan soal dan mode penegakan integritas, menetapkan batas nilai tuntas, serta membuka sesi lanjutan untuk remedial atau susulan.

## User stories

- Sebagai Pengajar/Panitia, saya ingin membuat sesi ujian dengan menentukan waktu mulai, waktu selesai, dan batas durasi (misal 60 menit) agar santri tertib waktu.
- Sebagai Pengajar, saya ingin menghasilkan token akses unik (misal 6 karakter alfanumerik) yang dapat diaktifkan menjelang ujian dimulai dan dinonaktifkan setelahnya.
- Sebagai Pengajar, saya ingin mengaktifkan fitur acak urutan soal agar setiap santri yang bersebelahan menerima urutan soal yang berbeda.
- Sebagai Pengajar/Panitia, saya ingin membuka halaman Monitoring Sesi dari menu utama untuk melihat santri yang sudah masuk ruang ujian, yang masih mengerjakan, yang sudah mengumpulkan, serta santri yang tercatat menambah pelanggaran tab, sehingga saya dapat menindaklanjuti saat ujian berlangsung.
- Sebagai Pengawas ruangan, saya ingin menampilkan token sesi dalam ukuran layar penuh dan mengatur agar token berganti secara berkala selama ujian berlangsung, sehingga santri dari kelas sebelah tidak dapat memakai token yang sama pada sesi berikutnya.
- Sebagai Pengajar, saya ingin menjadwalkan ujian remedial atau susulan dari sesi yang sudah berjalan dengan peserta tertentu saja, karena memanggil ulang seluruh kelas untuk beberapa santri saja tidak praktis.
- Sebagai Panitia, saya ingin menetapkan batas nilai tuntas per sesi ujian agar laporan menyatakan siapa yang tuntas dan siapa yang perlu remedial tanpa menghitung manual di luar aplikasi.

## Kebutuhan fungsional

- `SESI-FR-001` — Sistem harus menyediakan manajemen sesi ujian dengan parameter: judul sesi, bank soal rujukan, tanggal/jam mulai, tanggal/jam selesai, dan durasi menit pengerjaan.
- `SESI-FR-002` — Sistem harus menyediakan generator token akses acak 6 digit alfanumerik yang dapat di-generate ulang kapan saja oleh pengawas.
- `SESI-FR-003` — Sistem harus menyediakan toggle untuk mengaktifkan pengacakan urutan nomor butir soal dan pengacakan urutan opsi pilihan ganda.
- `SESI-FR-004` — Sistem harus menyediakan monitoring langsung (live monitor) status kehadiran peserta (belum mulai, sedang mengerjakan, telah selesai).
- `SESI-FR-005` — Sistem harus menyediakan layar Monitoring Sesi Ujian yang dapat dibuka dari menu utama pengajar. Layar tersebut memuat pemilihan sesi milik pengajar yang sedang login dan menampilkan per peserta: nama, nomor induk, kelas, status pengerjaan, waktu masuk, waktu pengumpulan, skor serta status koreksi, badge jumlah pelanggaran tab, dan tautan langsung ke lembar koreksi peserta.
- `SESI-FR-006` — Sistem harus menyediakan pengaturan masa berlaku token sesi: token tetap sampai diganti manual sebagai bawaan, dengan pilihan interval pergantian berkala (misal tiap 5, 15, atau 30 menit) selama sesi berstatus aktif.
- `SESI-FR-007` — Sistem harus menyediakan mode tampilan token layar penuh pada layar monitoring, disertai tombol salin, agar pengawas dapat menampilkan atau membacakan token kepada santri tanpa berpindah ke halaman lain.
- `SESI-FR-008` — Sistem harus menyediakan pengaturan batas nilai tuntas untuk tiap sesi ujian sebagai angka tunggal yang dapat diisi atau dibiarkan kosong.
- `SESI-FR-009` — Sistem harus menyediakan pembuatan sesi lanjutan (remedial atau susulan) yang berawal dari sesi yang sudah berjalan: menyalin bank soal, durasi, pengaturan pengacakan, batas tuntas, dan mode penegakan dari sesi sumber, dengan jenis sesi yang tercatat dan daftar peserta yang dipilih ulang per santri.
- `SESI-FR-010` — Sistem harus menyediakan pilihan mode penegakan integritas per sesi: mencatat pelanggaran tanpa mengganggu pengerjaan, atau mengunci lembar jawaban setelah jumlah pelanggaran melewati ambang yang ditentukan pengajar (misal 3 kali), dengan mode mencatat sebagai bawaan.

## Kriteria penerimaan

- `SESI-AC-001` — Token sesi ujian hanya dapat digunakan oleh santri selama rentang waktu sesi berstatus aktif.
- `SESI-AC-002` — Ketika pengawas menonaktifkan status sesi, seluruh santri yang sedang mengerjakan tidak dapat lagi mengubah jawaban.
- `SESI-AC-003` — Urutan soal yang diacak tetap konsisten untuk satu santri tertentu selama sesi ujian berlangsung meskipun halaman di-refresh.
- `SESI-AC-004` — Daftar monitoring hanya memuat sesi dan peserta milik pengajar yang sedang login; penanda kepemilikan diambil dari sisi server, bukan dari nilai yang dikirim browser, dan permintaan tanpa login hanya mendapat daftar kosong.
- `SESI-AC-005` — Saat santri masuk ruang ujian, mengumpulkan lembar jawaban, atau menambah pelanggaran tab, daftar monitoring ter-update tanpa pengajar perlu memuat ulang halaman.
- `SESI-AC-006` — Token yang sudah berganti atau kedaluwarsa ditolak pada gerbang santri dengan keterangan bahwa token tidak lagi berlaku dan arah untuk meminta token terbaru, tanpa menampilkan token pengganti kepada santri. Santri yang sudah masuk sebelum token berganti tetap dapat melanjutkan dan mengumpulkan jawabannya tanpa gangguan apa pun.
- `SESI-AC-007` — Interval pergantian token, tombol ganti token, dan mode tampilan layar penuh hanya tersedia bagi pengajar pemilik sesi; setiap pergantian token tercatat waktunya, dan layar monitoring selalu menampilkan token yang sedang berlaku tanpa perlu memuat ulang halaman.
- `SESI-AC-008` — Sesi lanjutan hasil penyalinan menampilkan jenisnya (reguler, remedial, atau susulan) dan sesi sumbernya hanya kepada pemilik; perubahan pada sesi lanjutan tidak mengubah sesi sumber, dan peserta sesi sumber tidak otomatis menjadi peserta sesi lanjutan.
- `SESI-AC-009` — Mode penegakan dan ambang pelanggaran berlaku untuk seluruh santri pada sesi tersebut, hanya pengajar pemilik sesi yang dapat mengubahnya, dan perubahan mode tidak menghapus catatan pelanggaran yang sudah terjadi.

## Edge cases

- Santri yang terlambat masuk ujian hanya mendapatkan sisa waktu sesi yang tersedia jika batas akhir sesi telah ditentukan.
- Status "belum mulai" hanya dapat dipastikan bila sesi terikat pada daftar kelas peserta. Sesi saat ini tidak menyimpan lembaga atau kelas, jadi monitoring menampilkan peserta yang sudah masuk, sementara jumlah santri yang belum masuk ditandai sebagai belum terhitung sampai penautan sesi ke daftar kelas diputuskan.
- Sesi yang berakhir sebelum interval rotasi token berikutnya tiba tidak boleh memicu pergantian token lagi, dan sesi berstatus selesai tidak menerima rotasi otomatis.
- Santri yang sedang mengetik nomor induk ketika token berganti tidak boleh kehilangan isian formulirnya; sistem cukup menolak token dan memintanya memasukkan token terbaru.
- Sesi tanpa batas nilai tuntas tetap dapat dinilai dan direkap; laporan tidak menampilkan penanda tuntas atau kolom remedial yang kosong membingungkan.
- Sesi remedial yang dibuat dari sesi remedial lain harus menunjuk sesi sumber terdekatnya, bukan menghasilkan rangkaian yang tidak terbaca pada laporan.
