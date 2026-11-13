# Spesifikasi Validasi E2E: Deteksi dan Pengalihan Tipe Soal Essay pada Impor Massal

## 1. Klasifikasi E2E
- **Status**: `Recommended`
- **Fokus Pengujian**: Verifikasi alur peramban (browser journey) pada panel Impor Massal Bank Soal ketika guru menempelkan butir soal bernomor pada tab Essay atau ketika butir tanpa opsi jawaban terdeteksi.

## 2. Latar Belakang & Masalah
Guru telah menyimpan 20 butir soal pilihan ganda, lalu beralih ke tab/model **Soal Esai** untuk membuat 5 butir soal essay. Ketika menempelkan teks 5 butir soal bernomor dan menekan tombol **Periksa tulisan**, sistem sebelumnya selalu menganggap soal bernomor sebagai **Pilihan Ganda** secara default, sehingga memunculkan 5 kesalahan (butuh minimal 2 opsi jawaban & belum ada kunci).

## 3. Prasyarat Pengujian
- Pengguna login sebagai guru/pengajar.
- Telah membuka halaman editor bank soal: `/bank-soal/[id]`.
- Membuka tab **Tulis Cepat (Tempel Massal)**.

## 4. Alur Perjalanan Pengguna (User Journey)

### Skenario 1: Penafsiran Otomatis Mengikuti Tab Aktif (Happy Path)
1. Guru memilih tab format/model **Soal Esai**.
2. Guru menempelkan teks 5 butir soal esai bernomor:
   ```text
   1. Sebutkan organ-organ utama yang menyusun saluran pencernaan manusia secara berurutan mulai dari rongga mulut hingga anus!
   2. Jelaskan fungsi enzim ptialin (amilase) yang terdapat di dalam rongga mulut dalam proses pencernaan karbohidrat!
   3. Lambung menghasilkan asam klorida (HCl). Jelaskan minimal dua fungsi penting asam lambung dalam proses pencernaan makanan!
   4. Mengapa usus halus memiliki struktur berupa vili (jonjot usus) dan mikrovili? Jelaskan kaitannya dengan fungsi penyerapan sari-sari makanan!
   5. Jelaskan perbedaan proses pencernaan mekanik dan pencernaan kimiawi, serta sebutkan contoh terjadinya kedua proses tersebut di dalam tubuh!
   ```
3. Guru menekan tombol **Periksa tulisan**.
4. **Verifikasi**:
   - Status header pratinjau menampilkan: **5 butir siap disimpan | 0 butir perlu perbaikan**.
   - Kolom Tipe pada seluruh 5 baris menunjukkan pilihan **Essay**.
   - Tidak ada pesan kesalahan "membutuhkan minimal 2 opsi" maupun "belum ada kunci jawaban".
   - Tombol utama **Simpan Semua (5 Butir)** aktif (tidak disabled).
5. Guru menekan **Simpan Semua (5 Butir)**.
6. **Verifikasi**:
   - Muncul notifikasi toast keberhasilan.
   - 5 butir soal tersimpan ke paket bank soal dengan nomor urut lanjutan (#21 s.d. #25).

### Skenario 2: Bantuan Banner Perbaikan Cepat (One-Click Quick Fix)
1. Guru berada di tab model bawaan (misal **Pilihan Ganda**).
2. Guru menempelkan 5 butir soal essay tanpa opsi jawaban A-E.
3. Guru menekan **Periksa tulisan**.
4. **Verifikasi**:
   - Muncul Banner Perbaikan Cepat berwarna kuning/amber:
     `Terdeteksi 5 butir tanpa opsi jawaban A-E. Apakah butir ini adalah soal essay / uraian?`
   - Tersedia tombol aksi cepat: `Jadikan 5 Butir Sebagai Soal Essay`.
5. Guru menekan tombol `Jadikan 5 Butir Sebagai Soal Essay`.
6. **Verifikasi**:
   - Banner hilang.
   - Status pratinjau berubah seketika menjadi: **5 butir siap disimpan | 0 butir perlu perbaikan**.
   - Seluruh butir berubah tipe menjadi **Essay**.
   - Muncul notifikasi toast hijau: `5 butir berhasil diubah menjadi soal Essay dan siap disimpan!`.

### Skenario 3: Pengubahan Tipe Interaktif per Butir (Dropdown Tipe)
1. Pada tabel pratinjau desktop atau kartu pratinjau mobile, setiap butir memiliki dropdown `<select>` tipe soal.
2. Guru dapat mengganti tipe soal butir tertentu secara mandiri (misal dari Pilihan Ganda ke Essay, Benar / Salah, atau PG Kompleks).
3. **Verifikasi**:
   - Validasi masalah (`problems`) diperbarui secara reaktif tanpa perlu memeriksa ulang seluruh naskah dari awal.
