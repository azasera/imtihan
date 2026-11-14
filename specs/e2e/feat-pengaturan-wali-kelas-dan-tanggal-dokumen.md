# E2E Test Specification: Pengaturan Wali Kelas & Tanggal Dokumen

- **Target**: Modul E-Rapor — Pengaturan Wali Kelas & Tanggal Dokumen
- **Source Requirement**: `specs/feat-pengaturan-wali-kelas-dan-tanggal-dokumen.md`
- **Recommendation**: Recommended
- **Status**: Pending
- **Environment**: https://e-imtihan.online/rapor
- **Prerequisites**: Pengguna telah masuk sebagai pengajar / kurikulum di sistem E-Imtihan At-Tauhid.

---

## Skenario Pengujian Peramban (Browser Scenarios)

### Skenario 1: Membuka Dialog Pengaturan Wali Kelas & Tanggal Dokumen
1. Buka halaman `https://e-imtihan.online/rapor`.
2. Klik tab **Cetak & Unduh Rapor**.
3. Temukan dan klik tombol **Pengaturan Wali Kelas & Tanggal Dokumen**.
4. **Hasil yang diharapkan**:
   - Dialog muncul dengan judul *"Pengaturan Wali Kelas & Tanggal Dokumen"*.
   - Dropdown rombel/kelas menampilkan daftar rombel (contoh: 7A, 7B, 8A, dst.).
   - Isian Nama Wali Kelas, NIY, Tanggal Dokumen, dan Penandatangan Kepala Sekolah tampil secara lengkap.

### Skenario 2: Mengubah dan Menyimpan Data Wali Kelas Tertentu
1. Pada dialog, pilih rombel `7A`.
2. Ubah kolom **Nama Wali Kelas** menjadi `Muhammad Yasser, S.Pd.`.
3. Isi kolom **NIY / NIP Wali Kelas** menjadi `199512310120191027`.
4. Isi kolom **Tanggal Dokumen Rapor** menjadi `Pangkalpinang, 19 Desember 2025`.
5. Klik tombol **Simpan Kelas 7A**.
6. **Hasil yang diharapkan**:
   - Notifikasi toast sukses muncul: *"Pengaturan kelas 7A berhasil disimpan"*.
   - Pratinjau lembar rapor untuk santri kelas 7A langsung menampilkan nama `Muhammad Yasser, S.Pd.`, NIY `199512310120191027`, dan titimangsa `Pangkalpinang, 19 Desember 2025`.

### Skenario 3: Menerapkan Tanggal Dokumen ke Seluruh Kelas
1. Buka kembali dialog **Pengaturan Wali Kelas & Tanggal Dokumen**.
2. Masukkan tanggal dokumen baru pada kolom **Tanggal Dokumen Rapor**.
3. Klik tombol **Terapkan ke Semua Kelas**.
4. **Hasil yang diharapkan**:
   - Notifikasi toast sukses muncul: *"Tanggal dokumen dan kepala sekolah berhasil diterapkan ke seluruh rombel"*.
   - Seluruh kelas di database tersinkronisasi menggunakan tanggal cetak tersebut.

---

## Bukti Pengujian (Evidence)
*(Bagian ini akan diisi saat `/e2e-tester` dijalankan)*
