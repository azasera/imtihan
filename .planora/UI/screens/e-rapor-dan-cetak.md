# Spesifikasi Layar: E-Rapor & Cetak Rapor Santri

Dokumen ini mendefinisikan rancangan antarmuka pengguna, komponen, interaksi, dan tata letak cetak untuk modul E-Rapor Kurikulum Merdeka & Diniyah di App Imtihan, dengan KOP Rapor resmi mengikuti format SiPAKSa sesuai lembaga santri (`SMPITA`, `SMAITA`, `MTA`).

## 1. Arsitektur Menu & Navigasi E-Rapor

Pada sidebar aplikasi, ditambahkan grup navigasi **E-Rapor** dengan entri:
- **Nilai Rapor Mapel**: Untuk seluruh pengajar (mengisi nilai PH/Tugas, menarik nilai dari sesi ujian CBT, dan memilih Capaian Pembelajaran).
- **Wali Kelas**: Khusus untuk wali kelas yang ditugaskan (mengisi absensi, ekstrakurikuler, catatan wali kelas, hadits/tahfidz, dan tinjauan kenaikan kelas).
- **Leger Nilai**: Tampilan rekapitulasi nilai satu kelas utuh untuk evaluasi dan ekspor data ke Excel.
- **Cetak Rapor**: Pratinjau cetak lembar rapor per santri dan cetak massal (*batch print*) ke format A4.

---

## 2. Layar Input & Penarikan Nilai Rapor (Guru Mapel)

### A. Komponen & Filter Atas
- **Pilih Lembaga & Kelas**: Dropdown terfilter (misal `SMPITA` > `Kelas 7B`).
- **Pilih Mata Pelajaran**: Dropdown mata pelajaran aktif yang diampu guru.
- **Pilih Periode Semester**: Ganjil (Semester 1) / Genap (Semester 2), Tahun Ajaran aktif.
- **Tombol Aksi**:
  - `Tarik Nilai dari Sesi CBT`: Membuka modal pemetaan sesi ujian (misal Sesi PTS dipetakan ke kolom STS, Sesi PAS ke kolom SAS).
  - `Simpan Nilai`: Menyimpan perubahan nilai manual dan bobot.
  - `Pilih Capaian Pembelajaran (CP/TP)`: Membuka panel pemilihan materi untuk narasi otomatis.

### B. Tabel Nilai Santri
- Kolom Tabel:
  1. No & NISN
  2. Nama Santri
  3. Nilai Harian (Rata-rata PH & Tugas)
  4. Nilai STS / PTS (dengan label sesi CBT sumber bila ditarik)
  5. Nilai SAS / PAS (dengan label sesi CBT sumber bila ditarik)
  6. Nilai Akhir Rapor (NAR) - kalkulasi otomatis dengan badge predikat (A, B, C, D)
  7. Pratinjau Narasi Capaian (ikon tooltip atau teks ringkas yang dapat diedit guru)

---

## 3. Layar Asesmen Wali Kelas

### A. Tab Navigasi Khusus Wali Kelas
1. **Absensi & Kehadiran**: Input jumlah hari Sakit (S), Izin (I), dan Tanpa Keterangan/Alpa (A) untuk semester berjalan.
2. **Tahfidz & Hadits Arba'in**:
   - Target Hafalan Semester (misal `3 Hadits Arba'in` atau `1 Juz`).
   - Capaian Hafalan Murid (angka atau judul hadits yang tuntas).
   - Nilai / Predikat kelulusan hafalan.
3. **Ekstrakurikuler**: Pilihan ekskul yang diikuti santri (Agrobisnis, TIK, Jurnalis, Bulutangkis, Futsal, Panahan, dll.) beserta predikat (Sangat Baik / Baik / Cukup) dan deskripsi kegiatan.
4. **Dimensi Profil Pelajar Pancasila (P5)**: Checklist perkembangan 6 dimensi karakter dengan deskripsi yang terisi otomatis.
5. **Catatan Wali Kelas & Keputusan Kenaikan**:
   - Kolom teks bebas catatan motivasi dan pembinaan untuk santri dan orang tua.
   - Pilihan keputusan akhir (khusus Semester Genap): Naik ke kelas / Tinggal di kelas / Lulus.

---

## 4. Layar Leger Nilai Kelas

- **Header Kelas**: Menampilkan nama lembaga, kelas, semester, nama wali kelas, dan jumlah santri.
- **Tabel Matrix Lebar**:
  - Kolom Murid: No, NISN, Nama.
  - Kolom Mupel Umum (Kelompok A): PAI, PPKn, B.Indo, MTK, IPA, IPS, B.Inggris.
  - Kolom Mupel Umum (Kelompok B): PJOK, Informatika, Prakarya.
  - Kolom Mupel Diniyah: Aqidah, Adab & Akhlak, Fiqih, Bahasa Arab, Nahwu, Shiroh.
  - Kolom Ringkasan: Total Nilai, Rata-rata Kelas, Peringkat (*Rank* 1 s.d N).
- **Statistik Bawah**: Rata-rata nilai per mata pelajaran, nilai tertinggi, dan nilai terendah.
- **Tombol Ekspor**: Tombol `Unduh Leger Excel (.xlsx)` untuk arsip resmi madrasah.

---

## 5. Layar Lembar Cetak Rapor Santri (Print View A4)

Layar ini dirancang dengan standar `@media print` sehingga saat dicetak langsung melalui tombol cetak peramban (`Ctrl + P` / `Cmd + P`), halaman yang tercetak presisi berukuran A4 tanpa terpotong.

### A. Struktur KOP Resmi SiPAKSa Berdasarkan Lembaga

KOP berada di bagian paling atas lembar rapor, bergaris ganda tebal tipis:

```text
+-----------------------------------------------------------------------------------+
|  [LOGO]                     YAYASAN AT-TAUHID AL ISLAMY                           |
|                    KOTA PANGKALPINANG - BANGKA BELITUNG                           |
|                 [NAMA LEMBAGA RESMI SESUAI DATA SANTRI]                           |
|       Alamat: Jl. Gerunggang Dalam Kel. Air Kepala Tujuh Kec. Gerunggang          |
|                 Kota Pangkalpinang, Provinsi Kepulauan Bangka Belitung            |
+===================================================================================+
```

**Aturan Penamaan Lembaga Dinamis**:
- Bila santri dari lembaga **SMPITA**:
  - Baris Lembaga: `SMP ISLAM TAHFIDZ AL-QUR'AN AT-TAUHID`
  - NPSN: `69988220`
- Bila santri dari lembaga **SMAITA**:
  - Baris Lembaga: `SMA ISLAM TAHFIDZ AL-QUR'AN AT-TAUHID`
- Bila santri dari lembaga **MTA**:
  - Baris Lembaga: `MANZHUMAH TAKHOSHUSH AL-QUR'AN AT-TAUHID`

### B. Identitas Santri
Tabel dua kolom rapi tanpa garis tepi:
- Kiri: Nama Peserta Didik, NISN, Nama Sekolah, Alamat Sekolah.
- Kanan: Kelas, Fase (D untuk SMP, E/F untuk SMA), Semester, Tahun Ajaran.

### C. Tata Letak Presisi 4 Varian Format Rapor PDF Resmi

Sistem mengadopsi struktur visual yang identik dengan 4 berkas rujukan PDF resmi At-Tauhid (`Rapor KURMER PTS.pdf`, `Rapor KURMER PAS.pdf`, `Rapor DINIYAH SMP PTS.pdf`, `Rapor DINIYAH SMP PAS.pdf`), dengan warna header tabel abu-abu `#E0E0E0`, garis tabel hitam solid 1px, tipografi proporsional, dan penanganan pemisahan halaman yang rapi:

#### 1. Rapor KURMER PTS (1 Halaman A4)
- **Judul Terpusat**:
  ```text
  PENCAPAIAN KOMPETENSI MURID
  SUMATIF TENGAH SEMESTER
  ```
- **Identitas Santri (2 Kolom)**:
  - Kiri: `Nama Murid`, `NISN`, `Nama Sekolah`, `Alamat`
  - Kanan: `Kelas`, `Fase`, `Semester`, `Tahun Ajaran`
- **Tabel Nilai (10 Mapel Umum)**:
  - Kolom: `No` | `Mata Pelajaran` | `Nilai Akhir` | `Capaian Kompetensi`
  - Header: Latar `#E0E0E0`, teks tebal hitam.
- **Blok Tanda Tangan (3 Pihak)**:
  - Kiri: Mengetahui, Orang Tua/Wali
  - Kanan: Tempat, Tanggal (misal `Pangkalpinang, 09 Oktober 2026`), Guru Kelas, Nama & NIY
  - Tengah Bawah: Mengetahui, Kepala Sekolah, Nama & NIY

#### 2. Rapor KURMER PAS (2 Halaman A4)
- **Halaman 1**:
  - Judul Terpusat: `PENCAPAIAN KOMPETENSI MURID / SUMATIF AKHIR SEMESTER`
  - Identitas Santri 2 Kolom identik.
  - Tabel Nilai 10 Mapel Umum (`No`, `Mata Pelajaran`, `Nilai Akhir`, `Capaian Kompetensi`).
  - Bagian `Kokurikuler`: Kotak berbingkai dengan bar judul abu-abu `#E0E0E0` dan narasi perkembangan dimensi religius & adab santri.
- **Halaman 2**:
  - Rekap identitas ringkas di baris atas.
  - Bagian `Ekstrakurikuler`: Tabel 8 baris aktivitas (`No`, `Kegiatan Ekstrakurikuler`, `Predikat`, `Keterangan`).
  - Baris Berdampingan (2 Kolom):
    - Kiri: Kotak tabel `Ketidakhadiran` (Sakit, Izin, Tanpa Keterangan).
    - Kanan: Kotak `Catatan Wali Kelas` berlatar header `#E0E0E0` dengan narasi motivasi.
  - Kotak `Tanggapan Orang Tua/Wali Murid` dengan baris titik-titik.
  - Kotak `Keputusan : Naik ke kelas ...` (khusus Semester 2 / Akhir Tahun).
  - Blok Tanda Tangan 3 Pihak (Orang Tua/Wali, Guru Kelas, Kepala Sekolah).

#### 3. Rapor DINIYAH PTS (1 Halaman A4)
- **Judul Terpusat**:
  ```text
  LAPORAN HASIL SUMATIF TENGAH SEMESTER
  MATA PELAJARAN DINIYAH
  ```
- **Identitas Santri 2 Kolom**:
  - Kiri: `Nama Murid`, `NISN`, `Nama Sekolah`
  - Kanan: `Kelas`, `Semester`, `Tahun Ajaran`
- **Bagian A. Ketercapaian Hasil Belajar**:
  - Tabel 6 mata pelajaran diniyah (`No`, `Mata Pelajaran`, `Nilai Akhir`, `Capaian Kompetensi`).
- **Bagian B. Catatan Hafalan Hadits**:
  - Tabel: `No` | `Mata Pelajaran` | `Capaian Hafalan Murid` | `Target Hafalan Tengah Semester 1` | `KETERANGAN`
  - Baris: Hadits Arba'in, Capaian riil santri, Target 3 Hadits Arba'in, Keterangan Tuntas.
- **Blok Tanda Tangan 3 Pihak**.

#### 4. Rapor DINIYAH PAS (1 Halaman A4)
- **Judul Terpusat**:
  ```text
  LAPORAN HASIL SUMATIF AKHIR SEMESTER
  MATA PELAJARAN DINIYAH
  ```
- **Identitas Santri 2 Kolom**: Identik dengan Diniyah PTS.
- **Bagian A. Ketercapaian Hasil Belajar**: Tabel 6 mapel diniyah.
- **Bagian B. Catatan Hafalan Hadits**: Tabel dengan header `Target Hafalan Semester 1` (atau 2).
- **Blok Tanda Tangan 3 Pihak**.
