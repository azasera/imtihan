# E-Rapor Kurikulum Merdeka & Diniyah Terintegrasi CBT

## Ringkasan

Modul E-Rapor adalah sistem pelaporan hasil belajar santri terpadu untuk lingkungan Pondok Pesantren At-Tauhid (mencakup jenjang SMPITA, SMAITA, dan MTA). Modul ini mengintegrasikan capaian evaluasi Computer-Based Assessment (CBT) yang sudah berjalan di App Imtihan (Penilaian Harian/PH, Sumatif Tengah Semester/STS/PTS, dan Sumatif Akhir Semester/SAS/PAS) langsung ke dalam lembar rekapitulasi nilai akhir rapor, penyusunan narasi capaian kompetensi otomatis, buku leger nilai kelas, hingga penerbitan lembar rapor digital dan fisik siap cetak.

KOP Rapor mengadopsi format baku KOP Rapor SiPAKSa yang secara dinamis menyesuaikan data lembaga santri di bawah naungan **Yayasan At-Tauhid Al Islamy Bangka Belitung**.

## Latar Belakang & Masalah

Sebelumnya, pengolahan rapor kurikulum merdeka dan rapor diniyah mengandalkan lembar kerja spreadsheet manual (`.xlsm`) yang kompleks. Proses ini menimbulkan beberapa hambatan nyata:
1. **Redundansi Input Nilai**: Pengajar harus menyalin ulang nilai dari platform ujian CBT ke lembar kerja Excel secara manual, memakan waktu berhari-hari dan rawan kesalahan transkripsi (*human error*).
2. **Formula Spreadsheet Rawan Rusak**: Rumus VLOOKUP, CONCATENATE narasi KD, dan tautan antar-sheet sering kali mengalami error `#REF!` atau tertimpa saat pengajar mengedit data.
3. **Pencetakan Rapor Terfragmentasi**: Wali kelas harus mengganti nomor urut santri satu demi satu untuk mencetak rapor per siswa, tanpa ada pratinjau batch yang andal dan aman page-break.
4. **Keseragaman Format Kop Lembaga**: Santri di Pondok Pesantren At-Tauhid terbagi ke dalam tiga lembaga (SMPITA, SMAITA, MTA). Format kepala surat (KOP) sering kali tidak konsisten jika dibuat secara manual. Diperlukan standarisasi KOP resmi yang identik dengan sistem induk SiPAKSa.

## Tujuan

1. **Integrasi CBT-ke-Rapor yang Mulus**: Menghubungkan sesi ujian CBT di App Imtihan langsung ke lembar nilai rapor (PH, STS, SAS) dengan satu klik tombol sinkronisasi.
2. **Dua Pilar Rapor Terpadu**:
   - **Rapor Umum (Kurikulum Merdeka)**: Nilai mata pelajaran nasional, Capaian Pembelajaran (CP/TP), Dimensi Profil Pelajar Pancasila (P5/Kokurikuler), Ekstrakurikuler, Absensi, dan Catatan Wali Kelas.
   - **Rapor Diniyah & Tahfidz**: Mata pelajaran diniyah kepesantrenan (Aqidah, Adab & Akhlak, Fiqih, Bahasa Arab, Nahwu, Shiroh), laporan target & capaian hafalan Hadits Arba'in, serta kemajuan Tahfidz Al-Qur'an.
3. **KOP Rapor Otomatis Sesuai Lembaga SiPAKSa**: Menampilkan KOP resmi lembaga (SMPITA, SMAITA, atau MTA) secara otomatis berdasarkan data jenjang santri yang tersinkronisasi dari SiPAKSa.
4. **Penyusunan Narasi Capaian Otomatis**: Menghasilkan deskripsi capaian kompetensi santri secara cerdas berdasarkan rentang skor nilai dan rujukan capaian pembelajaran.
5. **Leger Nilai Kelas & Cetak Standar A4**: Menyediakan tabel rekapitulasi satu kelas utuh (bisa diekspor ke Excel) dan cetak lembar rapor per santri siap tanda tangan (Wali Kelas, Kepala Sekolah, dan Orang Tua/Wali).

## Target Pengguna & Peran

- **Pengajar Mata Pelajaran**: Menentukan Capaian Pembelajaran (CP/TP) yang diujikan pada semester berjalan, menarik/memasukkan nilai PH, STS, dan SAS, serta memeriksa pratinjau deskripsi narasi.
- **Wali Kelas**: Mengelola absensi (Sakit, Izin, Alpa), nilai ekstrakurikuler, catatan motivasi wali kelas, capaian hadits/tahfidz santri kelasnya, meninjau Leger Nilai, dan mencetak rapor.
- **Kepala Sekolah / Panitia Ujian**: Memantau ketuntasan pengisian nilai seluruh kelas, mengesahkan tanggal pembagian rapor, dan mencetak dokumen leger nilai lembaga.
- **Santri / Wali Santri**: Melihat dan mengunduh lembar rapor digital secara transparan dan aman.

## Kebutuhan Fungsional

- `RAPOR-FR-001` — **Konfigurasi Periode & Identitas Rapor**: Sistem harus menyediakan pengaturan periode akademik aktif yang mencakup tahun ajaran (misal `2026/2027`), semester (Ganjil/1 atau Genap/2), tempat & tanggal pembagian rapor (misal `Pangkalpinang, 09 Oktober 2026`), nama dan NIY Kepala Sekolah per lembaga, serta penugasan Wali Kelas per rombel.
- `RAPOR-FR-002` — **KOP Rapor Dinamis Berbasis Lembaga SiPAKSa**: Sistem harus menerapkan format KOP resmi SiPAKSa pada setiap lembar cetak rapor yang secara otomatis menyesuaikan lembaga santri:
  - Header Induk: `YAYASAN AT-TAUHID AL ISLAMY BANGKA BELITUNG`
  - Nama Lembaga Resmi:
    - Jenjang SMPITA: `SMP ISLAM TAHFIDZ AL-QUR'AN AT-TAUHID` (NPSN & Izin Operasional resmi).
    - Jenjang SMAITA: `SMA ISLAM TAHFIDZ AL-QUR'AN AT-TAUHID`.
    - Jenjang MTA: `MANZHUMAH TAKHOSHUSH AL-QUR'AN AT-TAUHID`.
  - Alamat Lengkap: `Jl. Gerunggang Dalam Kel. Air Kepala Tujuh Kec. Gerunggang, Kota Pangkalpinang, Provinsi Kepulauan Bangka Belitung`.
  - Logo Resmi Yayasan/Lembaga pada sisi kiri kop dan garis ganda pemisah kop standar dokumen kedinasan.
- `RAPOR-FR-003` — **Katalog Capaian Pembelajaran (CP/TP)**: Sistem harus memungkinkan pengajar mendefinisikan Capaian Pembelajaran per mata pelajaran dan per semester untuk dua kelompok kurikulum:
  - Mupel Umum: PAI, Pendidikan Pancasila, Bahasa Indonesia, Matematika, IPA, IPS, Bahasa Inggris, PJOK, Informatika, Prakarya.
  - Mupel Diniyah: Aqidah, Adab & Akhlak, Fiqih, Bahasa Arab, Nahwu, Shiroh.
- `RAPOR-FR-004` — **Penarikan Nilai Otomatis dari CBT Imtihan**: Sistem harus menyediakan aksi satu-klik bagi guru mapel untuk menarik nilai rata-rata Tugas/PH, nilai STS/PTS, dan nilai SAS/PAS langsung dari data peserta ujian (`examParticipants`) yang sudah dinilai di App Imtihan, dengan opsi penyesuaian nilai manual bila ada ujian susulan non-CBT.
- `RAPOR-FR-005` — **Kalkulasi Nilai Akhir Rapor (NAR), Rerata, dan Peringkat**: Sistem harus menghitung Nilai Akhir Rapor (NAR) menggunakan pembobotan yang dapat dikonfigurasi (bawaan: $\text{NAR} = \frac{2 \times \text{PH} + \text{STS} + \text{SAS}}{4}$), menghitung predikat kelulusan (A/B/C/D), nilai rerata kelas, dan peringkat (*ranking*) santri di kelasnya.
- `RAPOR-FR-006` — **Otomatisasi Narasi Deskripsi Capaian Kompetensi**: Sistem harus menghasilkan kalimat deskripsi capaian secara otomatis:
  - Nilai $\ge 85.5$: `"Sangat baik dalam [deskripsi CP/TP]"`
  - Nilai $74.5 - 85.4$: `"Baik dalam [deskripsi CP/TP]"`
  - Nilai $64.5 - 74.4$: `"Cukup dalam [deskripsi CP/TP]"`
  - Nilai $< 64.5$: `"Perlu ditingkatkan dalam [deskripsi CP/TP]"`
  Pengajar tetap memiliki opsi untuk menyesuaikan kalimat narasi secara manual bila ada catatan khusus.
- `RAPOR-FR-007` — **Pengisian Asesmen Karakter & Dimensi P5**: Sistem harus menyediakan lembar pengisian penilaian 6 Dimensi Profil Pelajar Pancasila bagi wali kelas:
  1. Beriman, bertakwa kepada Tuhan YME, dan berakhlak mulia
  2. Berkebinekaan global
  3. Bergotong-royong
  4. Mandiri
  5. Bernalar kritis
  6. Kreatif
  Lengkap dengan pilihan predikat (Mulai Berkembang, Berkembang Sesuai Harapan, Sangat Berkembang) dan deskripsi capaian otomatis.
- `RAPOR-FR-008` — **Asesmen Tahfidz & Hadits Arba'in**: Sistem harus menyediakan lembar pencatatan khusus santri untuk capaian hafalan Hadits Arba'in (target semester vs realisasi hafalan santri) dan capaian Tahfidz Al-Qur'an pada Rapor Diniyah.
- `RAPOR-FR-009` — **Absensi, Ekstrakurikuler, Catatan Wali Kelas, dan Kenaikan Kelas**:
  - Rekap absensi semester: Sakit (hari), Izin (hari), Tanpa Keterangan/Alpa (hari).
  - Nilai Ekstrakurikuler (Agrobisnis, TIK, Jurnalis, Bulu Tangkis, Futsal, Panahan, Bela Diri, dll.) beserta predikat dan keterangan kegiatan.
  - Catatan motivasi wali kelas per santri.
  - Status keputusan semester genap: `"Naik ke kelas [X]"`, `"Tinggal di kelas [X]"`, atau `"Lulus"`.
- `RAPOR-FR-010` — **Buku Leger Nilai Terpadu**: Sistem harus menyediakan tampilan Leger Nilai menyeluruh yang menampilkan seluruh santri dalam satu kelas beserta nilai seluruh mata pelajaran (Umum dan Diniyah), jumlah nilai, rata-rata, dan peringkat.
- `RAPOR-FR-011` — **Lembar Cetak Rapor Standar A4 (Print View & PDF) 4 Format Resmi**: Sistem harus menyediakan format cetak bersih dan presisi pada kertas ukuran A4 yang identik dengan 4 berkas rujukan PDF resmi At-Tauhid:
  1. **Rapor KURMER PTS (1 Halaman)**: Judul `PENCAPAIAN KOMPETENSI MURID / SUMATIF TENGAH SEMESTER`, identitas santri 2 kolom, tabel 10 mata pelajaran umum (`No`, `Mata Pelajaran`, `Nilai Akhir`, `Capaian Kompetensi` dengan header abu-abu `#E0E0E0`), dan 3 blok tanda tangan di bagian bawah (Orang Tua/Wali di kiri, Guru Kelas dengan tanggal di kanan, Kepala Sekolah di tengah bawah).
  2. **Rapor KURMER PAS (2 Halaman)**:
     - *Halaman 1*: Judul `PENCAPAIAN KOMPETENSI MURID / SUMATIF AKHIR SEMESTER`, identitas santri 2 kolom, tabel 10 mata pelajaran umum, dan kotak berbingkai `Kokurikuler` dengan bar judul abu-abu `#E0E0E0`.
     - *Halaman 2*: Tabel `Ekstrakurikuler` (8 kegiatan: Agrobisnis, TIK, Jurnalis, Bulu Tangkis, Tenis Meja, Futsal, Panahan, Bola Voli), tabel berdampingan `Ketidakhadiran` (Sakit, Izin, Alpa) dan `Catatan Wali Kelas`, kotak `Tanggapan Orang Tua/Wali Murid`, kotak `Keputusan Kenaikan Kelas` (pada semester 2 / akhir tahun), dan 3 blok tanda tangan resmi.
  3. **Rapor DINIYAH PTS (1 Halaman)**: Judul `LAPORAN HASIL SUMATIF TENGAH SEMESTER / MATA PELAJARAN DINIYAH`, identitas santri 2 kolom ringkas, `A. Ketercapaian Hasil Belajar` (6 mapel Diniyah: Aqidah, Adab & Akhlak, Fiqih, Bahasa Arab, Nahwu, Shiroh), `B. Catatan Hafalan Hadits` (tabel capaian dan `Target Hafalan Tengah Semester 1`), serta 3 blok tanda tangan.
  4. **Rapor DINIYAH PAS (1 Halaman)**: Judul `LAPORAN HASIL SUMATIF AKHIR SEMESTER / MATA PELAJARAN DINIYAH`, identitas santri 2 kolom ringkas, `A. Ketercapaian Hasil Belajar` (6 mapel Diniyah), `B. Catatan Hafalan Hadits` (tabel capaian dan `Target Hafalan Semester 1/2`), serta 3 blok tanda tangan.
  Seluruh format menggunakan palet warna aman (hex/rgb murni tanpa fungsi `oklch`/`lab`) untuk menjamin rendering PDF instan via `html2canvas-pro` bebas crash, serta opsi toggle pratinjau KOP resmi lembaga.
- `RAPOR-FR-012` — **Ekspor Data Nilai**: Sistem harus mendukung ekspor lembar leger nilai ke format file spreadsheet Excel (`.xlsx`) dan CSV untuk keperluan pelaporan resmi ke dinas/kemenag atau arsip offline sekolah.

## Kriteria Penerimaan

- `RAPOR-AC-001` — KOP Rapor pada lembar cetak santri SMPITA menampilkan nama `SMP ISLAM TAHFIDZ AL-QUR'AN AT-TAUHID`, santri SMAITA menampilkan `SMA ISLAM TAHFIDZ AL-QUR'AN AT-TAUHID`, dan santri MTA menampilkan `MANZHUMAH TAKHOSHUSH AL-QUR'AN AT-TAUHID` di bawah header `YAYASAN AT-TAUHID AL ISLAMY BANGKA BELITUNG`.
- `RAPOR-AC-002` — Saat guru mapel mengklik *"Tarik Nilai dari CBT"*, sistem memetakan skor santri dari sesi ujian yang dipilih ke kolom nilai rapor santri yang bersangkutan dalam waktu kurang dari 2 detik untuk 40 santri per kelas.
- `RAPOR-AC-003` — Nilai Akhir Rapor dan Predikat otomatis terhitung saat nilai PH, STS, atau SAS diisi atau diubah, dengan pembulatan 2 desimal.
- `RAPOR-AC-004` — Deskripsi capaian kompetensi terisi otomatis mengikuti aturan rentang nilai tanpa menghasilkan teks kosong atau karakter error.
- `RAPOR-AC-005` — Peringkat (*rank*) kelas terurut secara benar berdasarkan nilai rata-rata santri, menangani nilai kembar (*tie breaker*) secara konsisten.
- `RAPOR-AC-006` — Wali kelas dapat mengisi absensi, ekstrakurikuler, hafalan hadits, dan catatan wali kelas dengan penyimpanan otomatis (*auto-save*) atau tombol simpan yang responsif.
- `RAPOR-AC-007` — Lembar cetak rapor A4 memisahkan halaman secara proporsional (*page-break-inside: avoid* pada tabel nilai) sehingga tanda tangan kepala sekolah dan wali kelas tidak terpotong di tepi kertas.
- `RAPOR-AC-008` — Pengajar hanya dapat mengedit nilai mata pelajaran yang diampunya, sedangkan wali kelas dapat melengkapi data kepribadian, ekskul, dan mencetak seluruh rapor kelasnya.
- `RAPOR-AC-009` — Ekspor Leger Nilai menghasilkan file `.xlsx` yang memuat nama santri, NISN, nilai seluruh mapel, total nilai, rerata, dan predikat yang sesuai dengan data di layar.

## Batasan & Pengecualian (Out of Scope)

- Tidak mencakup pencetakan ijazah kelulusan formal negara (hanya buku rapor semester dan leger nilai).
- Tidak mencakup pengelolaan mutasi santri antar-pesantren (data mutasi mengikuti sinkronisasi SiPAKSa).
- Tidak menggantikan sistem pendaftaran santri baru (PSB/PPDB).
