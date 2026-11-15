# E2E Specification: Buku Nilai Harian Guru (PH 1-4 & Tugas)

## Metadata
- **Source Requirement:** `specs/feat-buku-nilai-harian-ph-tugas-berkala.md`
- **Recommendation:** `Recommended`
- **Status:** `Pending`
- **Created Date:** 2026-11-15

## Environment & Prerequisites
- Lingkungan: Antarmuka Web E-Imtihan / Rapor (`/rapor`)
- Autentikasi: Akun Pengajar terautentikasi (guru mata pelajaran)
- Data Awal: Minimal satu kelas terdaftar dengan santri yang sudah terhubung (misal: 7A)

## Skenario Pengujian Peramban (Browser Scenarios)

### Skenario 1: Akses Tombol Buku Nilai Harian di Lembar Nilai
1. Pengguna masuk ke halaman `/rapor` dan memilih tab **Nilai Mapel**.
2. Pengguna memilih mata pelajaran (misal: PAI) dan kelas (misal: 7A).
3. **Hasil yang Diharapkan:**
   - Tombol outline *"Buku Nilai Harian (PH & Tugas)"* tampil di bilah atas lembar nilai dengan ikon `BookOpenIcon`.
   - Header kolom tabel *"PH / Tugas"* memiliki ikon tombol pembuka buku nilai harian.

### Skenario 2: Input Bertahap PH 1 dan Remedial
1. Pengguna menekan tombol *"Buku Nilai Harian (PH & Tugas)"*.
2. Dialog modal terbuka dengan judul *"Buku Nilai Harian Guru: PAI (PAI)"*.
3. Pengguna memilih tab filter *"Fokus PH 1"*.
4. Pada baris santri pertama, pengguna menginput:
   - Nilai Murni (N): `60`
   - Nilai Remedial (R): `75`
5. **Hasil yang Diharapkan:**
   - Kolom Av. PH secara realtime menampilkan angka `75` (nilai remedial).
   - Kolom Nilai Harian secara realtime menampilkan `75`.

### Skenario 3: Input Bertahap PH 2 (Kalkulasi Rata-Rata Dinamis)
1. Pengguna memilih tab filter *"Fokus PH 2"*.
2. Pada baris santri pertama, pengguna menginput nilai murni: `85` (tanpa remedial).
3. Kolom PH 3 dan PH 4 dibiarkan kosong.
4. **Hasil yang Diharapkan:**
   - Kolom Av. PH otomatis terhitung `(75 + 85) / 2 = 80`.
   - Nilai tidak terbagi dengan 4, melainkan dibagi 2 (proporsional terhadap PH yang sudah ada).

### Skenario 4: Terapkan ke Lembar Nilai Utama
1. Pengguna menekan tombol *"Terapkan ke Lembar Nilai"*.
2. **Hasil yang Diharapkan:**
   - Modal tertutup dan toast notifikasi sukses *"Rincian penilaian harian berhasil diterapkan ke lembar nilai!"* muncul.
   - Kolom *PH / Tugas* pada santri tersebut di tabel utama terisi angka `80`.
   - Terdapat lencana kecil penanda `PH` di samping kolom nilai.
   - Kolom Nilai Akhir (NAR) dan Predikat terhitung otomatis sesuai formula rapor.

### Skenario 5: Simpan Perubahan ke Database
1. Pengguna menekan tombol *"Simpan Perubahan"* di bilah atas lembar nilai.
2. **Hasil yang Diharapkan:**
   - Mutasi Convex tersimpan sukses dan toast konfirmasi muncul.
   - Data tetap utuh dan tersinkronisasi saat halaman dimuat ulang.

---

## Evidence
*(Belum dijalankan — menunggu eksekusi oleh `/e2e-tester`)*
