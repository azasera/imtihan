# E2E Specification: Sampling Acak & Komposisi Butir Soal (PG 70% & Esai 30%)

## Metadata
- **Source Requirement:** `specs/feat-sampling-acak-komposisi-bobot-soal.md`
- **Recommendation:** `Recommended`
- **Status:** `Pending`
- **Created Date:** 2026-11-18

## Environment & Prerequisites
- Lingkungan: Antarmuka Web E-Imtihan (`/sesi-ujian` dan `/exam/[token]`)
- Autentikasi: Akun Pengajar terautentikasi untuk manajemen sesi ujian
- Data Awal: Minimal satu paket Bank Soal yang memiliki butir Pilihan Ganda (>= 20) dan Esai (>= 5)

## Skenario Pengujian Peramban (Browser Scenarios)

### Skenario 1: Pembukaan Modal Penjadwalan Sesi Ujian dengan Kontrol Komposisi
1. Pengguna masuk ke halaman `/sesi-ujian` dan menekan tombol *"Jadwalkan Sesi Sekarang"*.
2. Modal dialog penjadwalan sesi ujian terbuka.
3. Pengguna memilih paket Bank Soal rujukan yang memiliki butir PG dan Esai.
4. **Hasil yang Diharapkan:**
   - Bagian *"Gunakan Komposisi & Pembobotan Soal"* tersedia dengan kontrol `Switch`.
   - Secara default switch dalam keadaan nonaktif (mode seluruh soal).

### Skenario 2: Mengaktifkan Komposisi Soal (20 PG 70% & 5 Esai 30%)
1. Pengguna mengaktifkan switch *"Gunakan Komposisi & Pembobotan Soal"*.
2. **Hasil yang Diharapkan:**
   - Panel konfigurasi komposisi terbuka di bawah switch.
   - Info ketersediaan butir di bank tampil (misal: *"Pilihan Ganda: X butir • Esai: Y butir"*).
   - Input kuota dan bobot terisi preset default:
     - Pilihan Ganda: Jumlah Butir = `20`, Bobot = `70%`.
     - Esai: Jumlah Butir = `5`, Bobot = `30%`.
   - Indikator total bobot menampilkan lencana hijau *"100% Pas"*.
   - Total butir diujikan menampilkan ringkasan *"25 butir"*.

### Skenario 3: Validasi Real-Time Total Bobot != 100%
1. Pengguna mengubah bobot Pilihan Ganda menjadi `60%` sementara Esai tetap `30%`.
2. **Hasil yang Diharapkan:**
   - Indikator total bobot berubah menjadi lencana merah *"90% (Harus 100%)"*.
   - Saat tombol submit ditekan, toast peringatan muncul: *"Total bobot nilai harus tepat 100%"*.

### Skenario 4: Penyimpanan Sesi Ujian dengan Komposisi Berhasil
1. Pengguna mengembalikan bobot Pilihan Ganda ke `70%` (total bobot kembali 100%).
2. Pengguna mengisi judul sesi (misal: "PTS Fiqih Kelas 7 Komposisi 70/30") dan menekan *"Jadwalkan Sesi Ujian"*.
3. **Hasil yang Diharapkan:**
   - Toast sukses muncul dengan kode token akses 6 digit.
   - Dialog tertutup dan kartu sesi baru muncul di daftar sesi ujian.
   - Kartu sesi memuat ringkasan durasi, jumlah soal (25 Soal), dan baris keterangan komposisi:
     *"Komposisi: 20 PG (70%) + 5 Esai (30%)"*.

### Skenario 5: Pengerjaan Santri dengan Lembar Ujian 25 Soal
1. Santri mengakses halaman pengerjaan ujian menggunakan token sesi tersebut.
2. Santri memasukkan nomor identitas dan menekan *"Mulai Ujian"*.
3. **Hasil yang Diharapkan:**
   - Lembar ujian santri memuat tepat 25 butir soal (bukan seluruh soal di bank).
   - Butir 1 s.d. 20 adalah soal objektif/PG, dan butir 21 s.d. 25 adalah soal Esai.
   - Poin maksimal untuk butir PG dinormalisasi ke porsi bobot 70%, dan butir Esai dinormalisasi ke porsi bobot 30%.
