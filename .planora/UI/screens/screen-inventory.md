# Inventaris screen

Daftar seluruh layar antarmuka pengguna pada platform E-Imtihan At-Tauhid.

## 1. Antarmuka Manajemen (Pengajar & Panitia)

- **Layar Beranda / Dashboard**: Ringkasan jumlah bank soal aktif, jadwal ujian mendatang, dan daftar ujian yang perlu dikoreksi.
- **Layar Bank Soal**: Tabel paket bank soal, filter mata pelajaran, dan tombol tambah paket soal baru.
- **Layar Editor Soal**: Formulir split-view pembuatan soal pilihan ganda, PG kompleks, benar/salah, essay, input wacana stimulus dan media, serta panel Live Preview simulasi tampilan santri secara real-time.
- **Layar Jadwal & Sesi Ujian** (`SESI-FR-001`, `SESI-FR-002`, `SESI-FR-003`): Pengaturan tanggal ujian, batas durasi, tombol generate token, dan kontrol acak soal.
- **Layar Monitoring Sesi Ujian** (`SESI-FR-004`, `SESI-FR-005`): Menu pemantauan per sesi milik pengajar yang sedang login — daftar peserta dengan nama, nomor induk, kelas, status (sedang mengerjakan / selesai), waktu masuk dan pengumpulan, skor beserta status koreksi, badge jumlah pelanggaran tab, dan tautan langsung ke lembar koreksi. Detail pada [spesifikasi layar monitoring](monitoring-sesi-ujian.md).
- **Layar Koreksi & Rekap Nilai**: Formulir penilaian essay santri dan tabel rekapitulasi nilai akhir kelas yang dilengkapi badge indikator pelanggaran tab santri.
- **Layar Data Santri & Sinkronisasi SiPAKSa**: Daftar santri aktif per lembaga (SMP, SMA, MTA) dan tombol penarikan data sinkronisasi dari SiPAKSa.

## 2. Antarmuka Santri (Ruang Ujian CBA)

- **Layar Masuk Ujian (Gate)**: Formulir terstruktur 6 tahap: (1) Nomor Induk Santri (NISN / NIS / ID Santri), (2) Pilih Lembaga (SMPITA, SMAITA, MTA), (3) Pilih Kelas dinamis bergantung lembaga (dinonaktifkan sebelum lembaga dipilih, dikosongkan saat lembaga berganti), (4) Nama Lengkap Santri (terverifikasi otomatis dari master database), (5) Token Ujian 6 karakter, dan (6) Tombol Konfirmasi & Masuk Ruang Ujian.
- **Layar Instruksi Ujian**: Petunjuk tata tertib pengerjaan ujian, durasi waktu, dan tombol mulai.
- **Layar Lembar Pengerjaan Ujian 3-Panel**: Tata letak terintegrasi 3 panel yang responsif: Panel 1 (kiri: wacana/stimulus scrollable), Panel 2 (tengah: butir soal, opsi radio/checkbox, tombol navigasi), dan Panel 3 (kanan: grid penjelajah nomor soal dan tombol kumpul akhir). Dilengkapi dialog modal peringatan anti-curang saat deteksi perpindahan tab.
- **Layar Konfirmasi Selesai**: Dialog rekap status pengerjaan soal dan tombol pengumpulan final.
- **Layar Penutup**: Ucapan terima kasih dan konfirmasi bahwa lembar jawaban santri telah berhasil terekam aman di sistem.
