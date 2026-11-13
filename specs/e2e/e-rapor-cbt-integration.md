# E2E Specification: Modul E-Rapor Kurikulum Merdeka & Diniyah Terintegrasi CBT (`CHG-012`)

## Metadata
- Target: `CHG-012`
- Recommendation: `Recommended`
- Status: `Pending`
- Environment: Local Development (`http://localhost:3000`)
- Prerequisites:
  - Akun pengajar / wali kelas terautentikasi di aplikasi.
  - Minimal 1 sesi ujian CBT terisi nilai (misal sesi STS atau SAS) dan minimal 1 rombel santri aktif (misal `Kelas 7B`).

## Skenario Browser E2E

### Skenario 1: Navigasi dan Keterbukaan Halaman E-Rapor
1. Pengajar login dan melihat tautan navigasi **E-Rapor** di bilah sisi (*AppSidebar*).
2. Pengajar mengklik menu **E-Rapor** dan diarahkan ke rute `/rapor`.
3. Halaman memuat bilah filter (Lembaga, Rombel/Kelas, Mata Pelajaran, Tahun Ajaran, Semester) dan empat tab utama:
   - *Nilai Mata Pelajaran*
   - *Asesmen Wali Kelas*
   - *Buku Leger Nilai*
   - *Cetak Rapor Santri*

### Skenario 2: Penarikan Nilai CBT ke Lembar Nilai Rapor Guru Mapel
1. Pada tab *Nilai Mata Pelajaran*, pengajar memilih kelas `VII B` dan mapel `PAI`.
2. Pengajar mengklik tombol **Tarik Nilai dari Sesi CBT**.
3. Dialog modal terbuka, pengajar memilih sesi CBT yang tersedia, memetakan ke kolom `STS / PTS`, dan mengisi Capaian Pembelajaran.
4. Pengajar menekan **Tarik Nilai Sekarang**.
5. Nilai peserta dari sesi CBT terisi ke kolom STS, Nilai Akhir Rapor (NAR) terhitung otomatis dengan formula `(2 * PH + STS + SAS) / 4`, predikat (A/B/C/D) terpasang, dan toast sukses muncul.

### Skenario 3: Asesmen Karakter, Ketidakhadiran, dan Hadits oleh Wali Kelas
1. Wali kelas berpindah ke tab *Asesmen Wali Kelas*.
2. Memilih santri dari daftar dropdown.
3. Mengisi angka Sakit (2 hari), Izin (1 hari), Alpa (0 hari).
4. Memverifikasi target dan realisasi capaian hafalan Hadits Arba'in & Tahfidz.
5. Memasukkan catatan motivasi wali kelas dan keputusan kenaikan kelas.
6. Menekan **Simpan Asesmen Santri**, toast notifikasi sukses muncul.

### Skenario 4: Tinjauan Buku Leger Nilai Kelas
1. Wali kelas berpindah ke tab *Buku Leger Nilai*.
2. Tabel matriks memuat daftar seluruh santri kelas beserta nilai seluruh mata pelajaran (Umum dan Diniyah).
3. Kolom total nilai, rerata, dan peringkat (*rank*) terisi secara matematis tanpa nilai NaN atau error.
4. Tombol **Ekspor Leger Excel** dapat diklik dan memberikan umpan balik toast.

### Skenario 5: Pratinjau Cetak Rapor Santri Ber-KOP SiPAKSa Resmi
1. Pengguna berpindah ke tab *Cetak Rapor Santri*.
2. Memilih santri (misal santri jenjang `SMPITA`).
3. Memilih jenis lembar: **Rapor Umum (Kurmer)**:
   - KOP menampilkan `YAYASAN AT-TAUHID AL ISLAMY BANGKA BELITUNG`, `SMP ISLAM TAHFIDZ AL-QUR'AN AT-TAUHID`, NPSN `69988220`, dan alamat Pangkalpinang.
   - Tabel capaian nilai Kurikulum Merdeka dan tabel Dimensi Profil Pelajar Pancasila (P5) tampil proporsional.
   - Kolom tanda tangan Orang Tua, Wali Kelas, dan Kepala Sekolah tampil rapi.
4. Mengganti jenis lembar ke **Rapor Diniyah & Tahfidz**:
   - Lembar menampilkan nilai mata pelajaran kepesantrenan (Aqidah, Fiqih, Nahwu, dll.) dan Laporan Capaian Hadits Arba'in & Tahfidz.
5. Mengklik tombol **Cetak Rapor Santri (A4)** memicu dialog cetak peramban (`window.print()`).

## Bukti Eksekusi (Evidence)
*(Bagian ini akan diisi setelah eksekusi oleh `/e2e-tester`)*
- Status: `Pending`
- Browser: Menunggu eksekusi
