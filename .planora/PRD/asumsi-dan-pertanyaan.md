# Asumsi, keputusan, dan pertanyaan terbuka

## Keputusan yang disepakati

1. **Akses Santri**: Santri tidak wajib mendaftarkan email pribadi. Santri masuk ruang ujian menggunakan NISN/Nomor Peserta dan Token Sesi yang dibagikan pengawas.
2. **Tipe Soal Fase 1**: Kombinasi Pilihan Ganda (koreksi nilai otomatis) dan Essay sederhana (koreksi penilaian oleh guru).
3. **Bahasa Antarmuka**: Bahasa Indonesia sebagai bahasa utama sistem, dengan dukungan teks Arab untuk soal-soal diniyyah dan bahasa Arab.
4. **Identitas Visual**: Menggunakan warna hijau zamrud (Islamic Pine/Teal) sesuai brand E-Imtihan At-Tauhid.
5. **Cara cepat menulis soal**: Jalur utama penulisan massal adalah menempelkan teks lalu meninjau pratinjau per butir. Sejak revisi pembanding pasar 2026-11-04, tempelan diterima dalam dua bentuk: teks berpola bernomor dan baris hasil salinan dari lembar kerja (satu butir per baris, kolom berpisahkan tab), lengkap dengan unduhan template kolom untuk diisi di lembar kerja. Unggah berkas melalui tombol pilih berkas dan pembuatan soal oleh kecerdasan buatan tetap tidak dipakai.
6. **Daftar mata pelajaran**: Mata pelajaran adalah daftar bersama madrasah yang dapat dikelola pengajar yang sudah masuk (menambah, mengganti nama, menonaktifkan). Yang masih dipakai paket soal tidak dihapus permanen, hanya dinonaktifkan, agar paket dan sesi lama tidak kehilangan labelnya.
7. **Media stimulus soal**: Gambar atau infografis stimulus tetap dipasang lewat tautan teks, bukan unggah berkas, sampai ada kebijakan penyimpanan berkas yang disepakati.
8. **Kosakata jenjang**: Tingkat pada paket bank soal mengikuti jenjang lembaga resmi yang sama dengan data santri hasil sinkronisasi (SMPITA, SMAITA, MTA), bukan teks bebas yang dibuat-buat.
9. **Pembahasan butir**: Pembahasan adalah milik pengajar. Santri tidak menerimanya, termasuk setelah ujian selesai, sampai ada keputusan terpisah tentang riset belajar pasca-ujian.
10. **Penanda mutu butir**: Tingkat berpikir dibatasi empat pilihan bernama dalam bahasa Indonesia (mengingat, memahami, mengaplikasikan, menganalisis) dengan bawaan belum ditandai; kode teknis tidak muncul di layar. Rujukan capaian materi berupa label pendek yang dikelola pengajar per mata pelajaran, bukan daftar kurikulum yang diimpor sistem.
11. **Masa berlaku token**: Token tetap berlaku sampai diganti manual sebagai bawaan. Rotasi berkala menjadi pilihan pengajar per sesi supaya perilaku ujian yang sudah berjalan hari ini tidak berubah diam-diam.
12. **Penegakan integritas**: Mode mencatat tanpa mengganggu pengerjaan adalah bawaan. Mengunci lembar setelah ambang pelanggaran tertentu adalah keputusan pengajar per sesi, dan pembukaannya hanya oleh pengajar pemilik sesi tanpa kehilangan jawaban yang sudah tersimpan.
13. **Nilai remedial**: Pada sesi berjenis remedial, nilai akhir dibatasi sampai batas tuntas secara bawaan dan pembatasan itu dapat dimatikan pengajar; sesi susulan tidak dibatasi.

## Asumsi

1. Santri mengerjakan ujian menggunakan laboratorium komputer madrasah atau gawai tablet/laptop yang disediakan sekolah.
2. Pengawas ruangan hadir secara fisik saat ujian berlangsung untuk memverifikasi kehadiran santri dan mengumumkan token ujian.
3. Perangkat memiliki browser modern berbasis Chromium, Safari, atau Firefox dengan JavaScript aktif.

## Pertanyaan terbuka

1. Apakah perlu batas maksimal perpindahan tab (misal 3 kali peringatan sebelum lembar ujian terkunci otomatis)?
2. Apakah bobot nilai pilihan ganda dan essay ditentukan per butir soal atau per persentase total ujian?
3. Untuk menampilkan status "belum mulai" pada monitoring sesi, sesi perlu ditautkan ke satu daftar kelas santri. Saat ini sesi hanya menyimpan bank soal, dan tingkat pada bank soal berupa teks bebas yang tidak selalu cocok dengan label kelas hasil sinkronisasi. Perlu keputusan produk: menautkan sesi ke jenjang dan kelas pada saat penjadwalan, atau menerima monitoring yang hanya menampilkan santri yang sudah masuk. Keputusan yang sama juga dibutuhkan agar pengawas dapat memastikan santri hanya masuk ke sesi yang sesuai kelasnya. Revisi mata pelajaran dan jenjang (`BANK-FR-011`) menyamakan kosakata tingkat, tetapi belum menautkan sesi ke daftar kelas.
4. Enam mata pelajaran bawaan saat ini ada di basis data karena diisi manual, bukan karena aplikasi yang mengisikannya. Perlu keputusan: apakah sistem mengisi ulang rujukan mata pelajaran bawaan ketika pengajar pertama kali membuka halaman pengelolaan mata pelajaran dan daftar masih kosong, atau pengajar yang menambah sendiri dari nol.
5. Apakah mata pelajaran umum sekolah (Matematika, IPA, Bahasa Indonesia, dan sejenisnya) perlu tersedia sejak awal sebagai rujukan bawaan untuk SMPITA dan SMAITA, atau cukup ditambahkan sendiri oleh pengajar lewat halaman pengelolaan.
6. Pengambilan butir acak menurut tingkat kesukaran untuk sesi remedial baru mungkin setelah analisis mutu butir tersedia dan tersimpan per sesi. Perlu keputusan: cukup menyaring menurut tingkat kesukaran, atau juga menurut rujukan capaian materi dan tingkat berpikir.
7. Ambang minimal jumlah peserta yang dinilai, ambang daya serap, dan ambang daya beda untuk penanda "perlu ditinjau" masih angka usulan teknis. Perlu persetujuan panitia agar penanda itu tidak dianggap vonis oleh pengajar.
8. Apakah pengawas perlu dapat memaksa lembar santri terkunci lebih awal (tanpa menunggu ambang pelanggaran) dari layar monitoring, misalnya karena gangguan yang terlihat di ruangan.
9. Apakah laporan capaian per tingkat berpikir dan per rujukan capaian materi perlu ikut terbawa ke ekspor rekap nilai yang selama ini dipakai pimpinan pesantren, atau cukup pada layar analisis saja.
