# Ruang Ujian Santri

## Tujuan

Menyediakan antarmuka pengerjaan ujian berbasis komputer (CBA) yang mudah digunakan, bersih, bebas distraksi, dan tahan terhadap gangguan koneksi internet lokal bagi para santri.

## User stories

- Sebagai Santri, saya ingin masuk ke ujian dengan memasukkan Nomor Induk (NISN/NIS/ID Santri), memilih Lembaga, memilih Kelas yang sesuai, melihat nama saya terverifikasi otomatis, dan memasukkan Token Ujian yang diberikan ustadz.
- Sebagai Santri, saya ingin pilihan kelas disesuaikan secara dinamis dengan lembaga yang saya pilih (SMPITA, SMAITA, atau MTA) agar tidak salah memilih kelas.
- Sebagai Santri, saya ingin melihat sisa waktu ujian yang berjalan mundur di layar agar saya dapat mengatur ritme pengerjaan soal.
- Sebagai Santri, saya ingin jawaban yang saya pilih langsung tersimpan otomatis agar tidak hilang jika komputer mati atau jaringan internet lambat.
- Sebagai Santri, saya ingin memiliki peta nomor soal untuk melompat ke nomor tertentu atau menandai soal yang masih ragu-ragu.
- Sebagai Santri, saya ingin tahu dengan jelas kalau token yang saya masukkan sudah tidak berlaku, tanpa kehilangan nomor induk dan pilihan kelas yang sudah saya isikan.
- Sebagai Pengawas, saya ingin menentukan sendiri apakah perpindahan tab hanya dicatat atau benar-benar menghentikan pengerjaan santri, karena aturan halaqah berbeda-beda dan mode mencatat adalah bawaan yang aman.

## Kebutuhan fungsional

- `UJIAN-FR-001` — Sistem harus menyediakan pintu gerbang login santri berbasis formulir terurut: (1) Nomor Induk Santri, (2) Pilih Lembaga (SMPITA, SMAITA, MTA), (3) Pilih Kelas dinamis sesuai lembaga, (4) Nama Lengkap Santri otomatis terisi, (5) Token Ujian 6 karakter, dan (6) Tombol Konfirmasi & Masuk Ruang Ujian.
- `UJIAN-FR-002` — Sistem harus menampilkan lembar soal dengan navigasi nomor (Grid Nomor Soal) yang membedakan status soal: belum dijawab, sudah dijawab, dan ragu-ragu.
- `UJIAN-FR-003` — Sistem harus menyimpan jawaban secara otomatis (auto-save) seketika santri memilih opsi atau mengetik jawaban essay.
- `UJIAN-FR-004` — Sistem harus menyediakan timer hitung mundur yang otomatis mengumpulkan lembar ujian saat waktu durasi habis.
- `UJIAN-FR-005` — Sistem harus menyediakan dialog konfirmasi pengumpulan sebelum santri menyelesaikan ujian secara sukarela.
- `UJIAN-FR-006` — Sistem harus menyediakan pilihan lembaga (SMPITA, SMAITA, MTA) dan pilihan kelas dinamis yang bersumber dari database master santri. Pilihan kelas harus dinonaktifkan sebelum lembaga dipilih, dan dikosongkan ketika lembaga diubah. Jika kelas belum tersedia di database, sistem menampilkan pesan jelas tanpa membuat kelas fiktif.
- `UJIAN-FR-007` — Sistem harus melakukan validasi server-side berlapis: memvalidasi nomor induk, mencocokkan lembaga dan kelas yang dipilih terhadap data santri di database, mengunci nama santri resmi dari database guna mencegah manipulasi identitas, dan memastikan token terkait dengan sesi aktif yang sesuai hak aksesnya.
- `UJIAN-FR-008` — Sistem harus menyajikan lembar ujian dalam tata letak responsif 3-Panel: Panel Stimulus mandiri (scrollable terpisah untuk wacana/tabel/gambar), Panel Soal & Opsi (mendukung radio button untuk PG/Benar-Salah dan checkbox untuk PG Kompleks), serta Panel Navigasi Grid Nomor Soal.
- `UJIAN-FR-009` — Sistem harus menerapkan perlindungan integritas ujian (anti-curang): mendeteksi perpindahan tab/jendela (visibilitychange/blur), memunculkan dialog peringatan keras, mengakumulasi frekuensi pelanggaran tab secara real-time ke database server, serta menonaktifkan klik kanan dan penyalinan teks (copy-paste).
- `UJIAN-FR-010` — Sistem harus menghormati mode penegakan yang dipilih pengajar pada sesi: pada mode mencatat, dialog peringatan tampil dan pengerjaan berjalan terus; pada mode kunci, lembar jawaban santri dikunci setelah jumlah pelanggaran melewati ambang sesi, dan hanya dapat dibuka kembali oleh pengajar pemilik sesi dari layar monitoring.
- `UJIAN-FR-011` — Sistem harus tetap menampilkan identitas sesi, sisa waktu, dan jumlah jawaban yang sudah tersimpan pada lembar yang terkunci; waktu pengerjaan tetap berjalan dan pengumpulan otomatis saat waktu habis berlaku atas jawaban terakhir yang tersimpan.
- `UJIAN-FR-012` — Sistem harus menolak token yang sudah berganti atau tidak berlaku lagi pada gerbang santri dengan keterangan bahwa santri perlu meminta token terbaru dari pengawas, tanpa mengosongkan nomor induk, lembaga, kelas, dan nama yang sudah terverifikasi pada formulir.

## Kriteria penerimaan

- `UJIAN-AC-001` — Santri yang me-refresh browser atau mengalami putus koneksi jaringan dapat melanjutkan kembali pengerjaan dengan jawaban yang tetap utuh.
- `UJIAN-AC-002` — Pengumpulan lembar ujian hanya dapat dilakukan jika santri mengonfirmasi dialog peringatan pengumpulan akhir.
- `UJIAN-AC-003` — Setelah status ujian santri menjadi 'selesai', santri tidak dapat lagi mengakses atau mengubah jawaban pada sesi tersebut.
- `UJIAN-AC-004` — Pilihan kelas dinonaktifkan sebelum lembaga dipilih; saat lembaga diubah, pilihan kelas sebelumnya otomatis dikosongkan; jika kelas belum ada di database, sistem menampilkan informasi yang jelas.
- `UJIAN-AC-005` — Validasi server menolak upaya masuk ujian jika nomor induk tidak ditemukan di database atau jika lembaga dan kelas yang dipilih tidak cocok dengan data resmi santri.
- `UJIAN-AC-006` — Ketika santri beralih tab atau meminimalkan jendela ujian, sistem mencatat penambahan pelanggaran tab ke server dan menampilkan modal peringatan saat santri kembali ke jendela ujian.
- `UJIAN-AC-007` — Pada perangkat bergerak (mobile/tablet), panel stimulus dan panel penjelajah nomor dapat diciutkan/ditampilkan melalui tombol drawer agar tidak mengganggu keterbacaan soal.
- `UJIAN-AC-008` — Pada sesi bermode mencatat, tidak ada satu pun santri yang lembarannya terkunci, sementara setiap perpindahan tab tetap tercatat di server dan muncul pada monitoring serta rekap nilai.
- `UJIAN-AC-009` — Pada sesi bermode kunci, penguncian hanya terjadi setelah ambang pelanggaran sesi terlampaui; permintaan pembukaan kembali hanya diterima dari pengajar pemilik sesi, peristiwa pembukaan tercatat bersama waktunya, dan seluruh jawaban yang sudah tersimpan tetap utuh setelah lembar terbuka lagi.
- `UJIAN-AC-010` — Token yang ditolak karena sudah berganti tidak pernah membuat catatan peserta baru dan tidak mengubah status pengerjaan santri yang sudah masuk.

## Edge cases

- Jika waktu pengerjaan habis tepat saat santri sedang memilih jawaban, sistem secara otomatis mengunci seluruh pilihan dan mengirimkan seluruh jawaban terakhir yang tersimpan.
- Gawai santri terkunci layar atau berpindah aplikasi percakapan tetap dihitung sebagai perpindahan jendela; peristiwanya dicatat sekali per perpindahan, tidak dihitung berulang selama santri belum benar-benar kembali ke halaman ujian.
- Santri yang membuka kembali tab ujian setelah lembarannya terkunci tetap melihat status terkunci beserta sisa waktu, bukan halaman login atau lembar kosong.
- Mode kunci tidak boleh bergantung pada kemampuan layar penuh browser; bila browser menolak layar penuh, peringatan dan pencatatan pelanggaran tetap berjalan seperti biasa.
