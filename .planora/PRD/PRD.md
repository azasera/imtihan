# Product Requirements Document — E-Imtihan At-Tauhid

## Ringkasan

E-Imtihan At-Tauhid adalah platform evaluasi dan Computer-Based Assessment (CBA) berbasis web untuk madrasah dan pondok pesantren. Platform ini memungkinkan para pengajar (asatidzah) membuat bank soal, menjadwalkan sesi ujian berwaktu dengan token acak, serta memungkinkan santri mengikuti ujian secara tertib dan transparan tanpa birokrasi pendaftaran email yang rumit.

## Latar belakang dan masalah

Pelaksanaan ujian konvensional berbasis kertas (paper-based test) di pesantren seringkali menghadapi kendala biaya penggandaan kertas, proses perakitan soal yang memakan waktu, risiko kebocoran soal, serta lamanya proses koreksi manual ratusan lembar jawaban santri. Sementara itu, sistem ujian online umum sering kali mensyaratkan akun email pribadi yang tidak selalu dimiliki santri di lingkungan asrama pesantren.

## Tujuan

1. Menyediakan platform ujian berbasis komputer yang efisien, hemat biaya operasional, dan ramah lingkungan (paperless).
2. Memudahkan santri mengikuti ujian cukup dengan nomor induk santri (NISN) dan token sesi ujian.
3. Menyediakan koreksi instan otomatis untuk soal pilihan ganda serta memudahkan pengoreksian soal essay.
4. Menjaga integritas dan kejujuran ujian melalui mekanisme pengacakan soal, pengacakan opsi, dan deteksi fokus layar.

## Non-goals

1. Bukan Learning Management System (LMS) menyeluruh untuk penugasan harian atau forum diskusi materi belajar.
2. Tidak mencakup sistem pembayaran SPP atau administrasi keuangan pesantren.
3. Tidak mendukung proctoring berbasis rekaman video kecerdasan buatan (AI) pada rilis versi awal.

## Target pengguna

- **Ustadz / Pengajar / Penguji**: Menyusun butir soal, mengatur paket ujian, mengaktifkan token sesi, mengoreksi jawaban essay santri, dan mengelola nilai rapor mata pelajaran beserta Capaian Pembelajaran (CP/TP).
- **Wali Kelas**: Mengelola absensi santri, penilaian ekstrakurikuler, capaian hadits & tahfidz, catatan wali kelas, memvalidasi Leger Nilai Kelas, dan mencetak rapor santri.
- **Santri / Peserta Ujian**: Mengerjakan soal ujian melalui antarmuka bersih, responsif, dan mudah dipahami, serta mengakses pratinjau lembar rapor digital.
- **Admin Madrasah / Panitia Ujian / Kepala Sekolah**: Mengatur data mata pelajaran, kelompok kelas, kalender ujian semester, memantau pengisian rapor seluruh lembaga, mengesahkan tanggal rapor, dan mengekspor rekap nilai / leger.

## Scope

### In-scope (Fase 1 & Fase Terpadu)
- Autentikasi pengajar dan admin menggunakan kredensial terverifikasi.
- Manajemen Bank Soal (Mata Pelajaran, Pilihan Ganda, PG Kompleks, Benar/Salah, Essay, dan Stimulus Wacana/Media).
- Impor massal butir soal dari teks yang ditempelkan, lengkap dengan pratinjau penafsiran dan validasi per butir, agar penyusunan satu paket ujian tidak perlu ditulis butir demi butir melalui formulir.
- Penulisan cepat dari tempelan lembar kerja: baris yang disalin dari Excel atau Google Sheets (satu butir per baris, kolom berpisahkan tab) ditafsirkan ke kolom yang sudah baku, disertai unduhan template kolom untuk diisi di lembar kerja.
- Pembahasan butir soal, penanda tingkat berpikir, dan rujukan capaian materi per butir sebagai milik pengajar dan tidak ditampilkan kepada santri.
- Pengelolaan mata pelajaran oleh pengajar (menambah, mengganti nama, menonaktifkan) dan pilihan jenjang yang mengikuti kosakata lembaga resmi yang sama dengan data santri.
- Live Preview formulir pembuatan butir soal santri secara real-time.
- Manajemen Sesi Ujian (Jadwal, Durasi menit, Token Akses 6 karakter, Pengacakan).
- Masa berlaku token sesi yang dapat diatur (token tetap sebagai bawaan atau berganti berkala), mode tampilan token layar penuh untuk pengawas, dan batas nilai tuntas per sesi.
- Sesi lanjutan berjenis remedial atau susulan yang menyalin pengaturan sesi sumber dengan peserta yang dipilih ulang, termasuk pembatasan nilai remedial sampai batas tuntas.
- Mode penegakan integritas yang dipilih per sesi: mencatat pelanggaran tanpa mengganggu pengerjaan (bawaan) atau mengunci lembar setelah ambang pelanggaran tertentu dengan pembukaan kembali oleh pengajar.
- Monitoring Sesi Ujian dari menu utama (daftar peserta per sesi, status sedang mengerjakan/selesai, waktu masuk dan pengumpulan, metrik pelanggaran tab, tautan koreksi).
- Ruang Pengerjaan Ujian Santri 3-Panel Responsif (Login via NISN/NIS/ID Santri + Token, Panel Stimulus, Auto-save jawaban, Timer hitung mundur, Navigasi nomor soal).
- Mekanisme Anti-Curang Integritas Ujian (Deteksi perpindahan tab, blokir shortcut DevTools, blokir copy-paste, dan pencatatan metrik pelanggaran tab).
- Integrasi data santri nyata SiPAKSa iCentre Smart untuk lembaga SMPITA, SMAITA, dan MTA dengan pengecualian SD/TK.
- Penilaian instan untuk pilihan ganda, PG kompleks, dan benar/salah, serta koreksi manual untuk essay.
- Rekapitulasi nilai, metrik pelanggaran tab, dan ekspor data nilai per kelas.
- Analisis mutu butir soal per sesi (daya serap, tingkat kesukaran, daya beda, dan sebaran pilihan pengecoh) beserta laporan capaian menurut tingkat berpikir dan rujukan capaian materi, kelompok remedial dan pengayaan, serta jalur unduhan dan pencetakan.
- **Modul E-Rapor Kurikulum Merdeka & Diniyah Terintegrasi CBT**:
  - Penarikan nilai PH/Tugas, STS/PTS, dan SAS/PAS otomatis dari data sesi ujian CBT App Imtihan ke lembar nilai rapor guru mapel.
  - Otomatisasi deskripsi narasi Capaian Pembelajaran (CP/TP) berdasarkan perolehan skor nilai dan katalog capaian kompetensi.
  - Penilaian karakter 6 Dimensi Profil Pelajar Pancasila (P5), kegiatan ekstrakurikuler, absensi (S/I/A), dan capaian hafalan Hadits Arba'in & Tahfidz.
  - KOP Rapor resmi SiPAKSa dinamis sesuai lembaga santri (`SMPITA`, `SMAITA`, `MTA`) di bawah naungan Yayasan At-Tauhid Al Islamy Bangka Belitung.
  - Buku Leger Nilai Kelas terpadu (ekspor `.xlsx`) dan Lembar Cetak Rapor Standar A4 siap cetak dan tanda tangan (Wali Kelas, Kepala Sekolah, Orang Tua).

### Out-of-scope (Fase mendatang)
- Ujian lisan / setoran hafalan audio.
- Integrasi otomatis dengan scanner lembar jawaban komputer fisik.
- Unggah berkas CSV/Excel langsung dari tombol pilih berkas dan impor dari arsip sistem ujian lain. Yang diadopsi pada revisi ini adalah menempelkan baris yang disalin dari lembar kerja beserta unduhan template kolomnya, karena keduanya memakai penafsir yang sama tanpa membuka jalur unggah berkas.
- Pembuatan butir soal otomatis oleh kecerdasan buatan.
- Unggah berkas gambar untuk stimulus soal; stimulus media tetap berupa tautan teks sampai ada kebutuhan dan kebijakan penyimpanan berkas yang jelas.

## Risiko

- **Konektivitas Jaringan**: Fluktuasi koneksi internet lokal di area pesantren dapat mengganggu transmisi jawaban santri.
  - *Mitigasi*: Mekanisme penyimpanan lokal sementara di browser dan auto-sync berkala saat koneksi pulih.
- **Kecurangan Peserta**: Santri membuka tab lain atau aplikasi lain saat ujian berlangsung.
  - *Mitigasi*: Peringatan keras saat perpindahan tab (visibilitychange/blur), counter akumulasi pelanggaran tab yang dilaporkan ke pengawas, pemblokiran klik kanan dan copy-paste, serta pengacakan urutan soal dan pilihan jawaban.
- **Penegakan yang Salah Sasaran**: Mode penguncian lembar dapat menghukum santri bukan karena curang, melainkan karena gawainya tidur sendiri, notifikasi masuk, atau browser memindahkan fokus saat santri menyalin jawaban antar-tab yang sah.
  - *Mitigasi*: Mode mencatat dipakai sebagai bawaan, ambang pelanggaran ditentukan pengajar per sesi, lembar yang terkunci tetap memperlihatkan sisa waktu dan jawaban tersimpan, pembukaan kembali hanya oleh pengajar pemilik sesi, dan satu perpindahan hanya dihitung sekali sampai santri benar-benar kembali.

## Definition of done

1. Seluruh kebutuhan fungsional inti (FR) dan kriteria penerimaan (AC) pada setiap modul fitur terimplementasi dan lolos verifikasi.
2. Antarmuka web memenuhi standar aksesibilitas dan responsif di perangkat desktop, laptop, maupun tablet.
3. Pengujian unit dan validasi bebas kebocoran kode spesifikasi teknis lolos 100%.
4. Dokumentasi teknis dan alur pengguna lengkap dan terverifikasi.
