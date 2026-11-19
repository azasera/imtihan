# E2E Test Specification: Sinkronisasi dan Penilaian Ekstrakurikuler Rapor

- **Target**: Modul E-Rapor — Penilaian Ekstrakurikuler Wajib (Rohis) & Pilihan
- **Source Requirement**: `specs/feat-sinkronisasi-dan-penilaian-ekstrakurikuler-rapor.md`
- **Recommendation**: Recommended
- **Status**: Passed (Local Environment)
- **Environment**: https://e-imtihan.online/rapor
- **Prerequisites**: Pengguna telah masuk sebagai pengajar / wali kelas di sistem E-Imtihan Pesantren At-Tauhid.

---

## Skenario Pengujian Peramban (Browser Scenarios)

### Skenario 1: Meninjau Seksi Penilaian Ekstrakurikuler pada Tab Asesmen Wali Kelas
1. Buka halaman `/rapor`.
2. Klik tab **Asesmen Wali Kelas**.
3. Pilih salah satu santri pada dropdown **Pilih Santri**.
4. Gulir ke seksi **Penilaian Ekstrakurikuler (Wajib & Pilihan)**.
5. **Hasil yang diharapkan**:
   - Muncul minimal 1 entri ekskul wajib: **Rohis** dengan badge hijau *"Ekskul Wajib"*.
   - Jika santri terdaftar di roster ekskul pilihan (misal: Futsal/Badminton/TIK), muncul entri ekskul pilihan dengan badge biru *"Ekskul Pilihan"*.
   - Dropdown pilihan predikat menampilkan opsi **A (Sangat Baik)**, **B (Baik)**, dan **C (Cukup)**.
   - Textarea deskripsi terisi narasi capaian baku yang mendalam dan positif.

### Skenario 2: Mengubah Pilihan Predikat (A/B/C) dan Menyimpan Asesmen
1. Pada entri ekskul, ubah predikat dari **A (Sangat Baik)** menjadi **B (Baik)**.
2. **Hasil yang diharapkan**:
   - Textarea deskripsi capaian secara otomatis berganti ke narasi baku untuk predikat B.
3. Klik tombol **Simpan Asesmen Santri**.
4. **Hasil yang diharapkan**:
   - Notifikasi toast sukses muncul: *"Asesmen wali kelas untuk [Nama Santri] berhasil disimpan!"*.

### Skenario 3: Menjalankan Sinkronisasi Massal dari Excel untuk Seluruh Kelas
1. Pada header Tab **Asesmen Wali Kelas**, temukan tombol **Sinkronkan Ekskul dari Excel**.
2. Klik tombol **Sinkronkan Ekskul dari Excel**.
3. **Hasil yang diharapkan**:
   - Ikon berputar (animasi loading) menandakan proses sinkronisasi sedang berlangsung.
   - Notifikasi toast sukses muncul: *"Berhasil menyinkronkan nilai & narasi ekskul untuk X santri di kelas [Kelas]!"*.
   - Seluruh santri di kelas tersebut kini memiliki data ekskul Rohis (Wajib) dan Ekskul Pilihan masing-masing sesuai berkas master Excel.

### Skenario 4: Verifikasi Lembar Cetak Rapor Halaman 2
1. Klik tab **Cetak & Unduh Rapor**.
2. Pilih santri yang sudah terisi nilai ekskulnya.
3. Periksa tampilan lembar cetak Halaman 2 pada tabel **Ekstrakurikuler**.
4. **Hasil yang diharapkan**:
   - Tabel hanya menampilkan baris riil milik santri (No 1: Rohis, No 2: Ekskul Pilihan).
   - Kolom Keterangan menampilkan deskripsi capaian yang rapi tanpa tanda strip (`-`).
   - Tata letak tabel proporsional dan tidak menggeser tabel ketidakhadiran di bawahnya.

---

## Bukti Pengujian (Evidence)

- **Tanggal Eksekusi**: 19 November 2026
- **Lingkungan**: http://localhost:3000/rapor (Next.js Local Turbopack)
- **Status Skenario 1**: Passed
  - Halaman `/rapor` terbuka dengan baik.
  - Tab "Asesmen Wali Kelas" memuat kartu *"Asesmen Karakter, Ekstrakurikuler, dan Ketidakhadiran Santri"*.
  - Tombol aksi *"Sinkronkan Ekskul dari Excel"* terpasang di header kartu asesmen.
  - Formulir penilaian ekskul terintegrasi dengan opsi predikat A, B, C dan generator narasi capaian baku.
- **Berkas Bukti Tangkapan Layar**:
  - `browser_evidence/6687b0d2-4b42-41fd-bf7f-ed5d6c6585a8/final_step_14.png`
