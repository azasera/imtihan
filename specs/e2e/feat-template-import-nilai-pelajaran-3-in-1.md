# Spesifikasi E2E: Impor Nilai Pelajaran 3-in-1 (PH, STS, SAS)

## Klasifikasi E2E: Recommended

## Skenario Utama: Alur Unduh Template & Impor 3 Nilai Sekaligus
1. **Navigasi ke Menu Rapor**:
   - Pengguna membuka halaman `/rapor`.
   - Memilih kelas (misalnya kelas 7A) dan mata pelajaran (misalnya Fiqih atau Matematika).
   - Membuka tab "Nilai Pelajaran" / "Nilai Mata Pelajaran".
2. **Buka Modal Impor Excel**:
   - Klik tombol "Import dari Excel".
   - Dialog "Import Nilai dari Excel" terbuka.
3. **Unduh Template 3-in-1**:
   - Klik tombol "Unduh Template".
   - File Excel `Template_Nilai_[KODE]_[KELAS].xlsx` terunduh.
   - Header berkas memuat kolom: `No`, `NISN`, `Nama Santri`, `PH`, `STS`, `SAS`.
4. **Unggah Berkas Nilai**:
   - Pengguna mengunggah berkas Excel yang telah diisi nilai pada kolom `PH`, `STS`, dan `SAS`.
   - Sistem membaca berkas dan menampilkan pratinjau data.
5. **Verifikasi Pratinjau**:
   - Tabel pratinjau menampilkan kolom `No`, `NISN`, `Nama Santri`, `PH`, `STS`, `SAS`, dan `Status`.
   - Nilai PH, STS, dan SAS tampil sesuai isi file.
   - Status menampilkan indikator kecocokan santri berdasarkan NISN atau Nama.
6. **Simpan Nilai**:
   - Klik tombol "Simpan Nilai".
   - Notifikasi sukses muncul.
   - Tabel nilai rapor terbarui dengan nilai PH, STS, dan SAS yang diimpor.
