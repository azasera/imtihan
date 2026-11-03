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

- **Ustadz / Pengajar / Penguji**: Menyusun butir soal, mengatur paket ujian, mengaktifkan token sesi, dan mengoreksi jawaban essay santri.
- **Santri / Peserta Ujian**: Mengerjakan soal ujian melalui antarmuka bersih, responsif, dan mudah dipahami.
- **Admin Madrasah / Panitia Ujian**: Mengatur data mata pelajaran, kelompok kelas, kalender ujian semester, dan mengekspor rekap nilai.

## Scope

### In-scope (Fase 1)
- Autentikasi pengajar dan admin menggunakan kredensial terverifikasi.
- Manajemen Bank Soal (Mata Pelajaran, Pilihan Ganda, PG Kompleks, Benar/Salah, Essay, dan Stimulus Wacana/Media).
- Live Preview formulir pembuatan butir soal santri secara real-time.
- Manajemen Sesi Ujian (Jadwal, Durasi menit, Token Akses 6 karakter, Pengacakan).
- Ruang Pengerjaan Ujian Santri 3-Panel Responsif (Login via NISN/NIS/ID Santri + Token, Panel Stimulus, Auto-save jawaban, Timer hitung mundur, Navigasi nomor soal).
- Mekanisme Anti-Curang Integritas Ujian (Deteksi perpindahan tab, blokir shortcut DevTools, blokir copy-paste, dan pencatatan metrik pelanggaran tab).
- Integrasi data santri nyata SiPAKSa iCentre Smart untuk lembaga SMPITA, SMAITA, dan MTA dengan pengecualian SD/TK.
- Penilaian instan untuk pilihan ganda, PG kompleks, dan benar/salah, serta koreksi manual untuk essay.
- Rekapitulasi nilai, metrik pelanggaran tab, dan ekspor data nilai per kelas.

### Out-of-scope (Fase mendatang)
- Ujian lisan / setoran hafalan audio.
- Integrasi otomatis dengan scanner lembar jawaban komputer fisik.

## Risiko

- **Konektivitas Jaringan**: Fluktuasi koneksi internet lokal di area pesantren dapat mengganggu transmisi jawaban santri.
  - *Mitigasi*: Mekanisme penyimpanan lokal sementara di browser dan auto-sync berkala saat koneksi pulih.
- **Kecurangan Peserta**: Santri membuka tab lain atau aplikasi lain saat ujian berlangsung.
  - *Mitigasi*: Peringatan keras saat perpindahan tab (visibilitychange/blur), counter akumulasi pelanggaran tab yang dilaporkan ke pengawas, pemblokiran klik kanan dan copy-paste, serta pengacakan urutan soal dan pilihan jawaban.

## Definition of done

1. Seluruh kebutuhan fungsional inti (FR) dan kriteria penerimaan (AC) pada setiap modul fitur terimplementasi dan lolos verifikasi.
2. Antarmuka web memenuhi standar aksesibilitas dan responsif di perangkat desktop, laptop, maupun tablet.
3. Pengujian unit dan validasi bebas kebocoran kode spesifikasi teknis lolos 100%.
4. Dokumentasi teknis dan alur pengguna lengkap dan terverifikasi.
