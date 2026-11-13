# E2E Specification: Import Nilai Rapor dari Berkas Excel (`FEAT-RAPOR-IMPORT-EXCEL`)

## Metadata
- Feature: Import Nilai Rapor dari Excel (Guru Manual Tanpa CBT)
- Classification: `Recommended`
- Status: `Pending`
- Target Environment: Local Development (`http://localhost:3000/rapor`)
- Prerequisites:
  - Akun pengajar terautentikasi di aplikasi.
  - Daftar santri untuk rombel aktif sudah tersedia (misal `VII B`).
  - Berkas template Excel atau berkas rekap nilai format bebas (`.xlsx` atau `.csv`).

---

## User Journey & Skenario Browser E2E

### Skenario 1: Unduh Format Template Nilai Siap Pakai
1. Pengajar membuka menu **E-Rapor** (`/rapor`).
2. Pada tab **Nilai Mata Pelajaran**, pilih Kelas (misal `VII B`) dan Mata Pelajaran (misal `BA - Bahasa Arab`).
3. Pengajar mengklik tombol **Import dari Excel**.
4. Modal dialog terbuka dengan judul "Import Nilai dari Excel".
5. Pengajar memilih kolom target (misal `PH / Tugas`).
6. Pengajar mengklik tombol **Download Format Excel**.
7. Browser mengunduh berkas Excel dengan nama terformat (contoh: `Template_Nilai_VII B_BA_PH.xlsx`) yang telah memuat header `No`, `NISN`, `Nama Santri`, `Nilai` dan baris seluruh santri kelas tersebut.

### Skenario 2: Unggah Berkas & Verifikasi Pencocokan Santri (NISN & Nama)
1. Di dalam modal dialog import yang sama, pengajar mengunggah berkas Excel yang sudah diisi nilai.
2. Komponen otomatis melakukan parsing data:
   - Santri dengan NISN cocok ditandai status hijau (**Cocok (NISN)**).
   - Santri tanpa NISN atau NISN berbeda tetapi nama cocok ditandai status biru (**Cocok (Nama)**).
   - Santri yang ada di baris data tetapi nilainya kosong/NaN ditandai status kuning (**Tanpa Nilai**).
   - Santri yang tidak ditemukan di berkas Excel ditandai status abu-abu (**Tidak Ada di File**).
3. Tabel ringkasan menampilkan jumlah baris cocok vs total santri.
4. Pengajar meninjau pratinjau nilai sebelum disimpan.

### Skenario 3: Konfirmasi dan Simpan Nilai ke Database
1. Pengajar menekan tombol **Terapkan & Simpan Nilai**.
2. Nilai yang berhasil dicocokkan otomatis tersimpan ke backend.
3. Dialog tertutup dan toast sukses muncul (contoh: `Berhasil import 25 nilai PH / Tugas dari Excel!`).
4. Lembar nilai rapor pada antarmuka langsung diperbarui, formula Nilai Akhir Rapor (NAR) terhitung ulang seketika, dan predikat nilai (A/B/C/D) terpasang rapi.

### Skenario 4: Penanganan Berkas Tidak Valid / Kosong
1. Pengajar mengunggah berkas yang rusak atau tidak memiliki kolom yang dapat diidentifikasi.
2. Sistem menampilkan notifikasi toast peringatan ramah pengguna bahwa berkas tidak dapat diproses atau tidak ada data yang ditemukan.
3. Input berkas direset agar pengguna dapat mengunggah berkas yang benar tanpa memuat ulang halaman.
