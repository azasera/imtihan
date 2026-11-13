# E2E Specification: Unggah Berkas Gambar Stimulus Soal

- **Target**: Bank Soal Editor (`/bank-soal/[id]`) dan Ruang Ujian Santri (`/ujian`)
- **Source Requirement**: `specs/feat-upload-gambar-stimulus-soal.md` (IMG-AC-001 s/d IMG-AC-005)
- **Recommendation**: `Recommended`
- **Status**: `Pending`
- **Environment**: Next.js peramban (Chrome / Chromium) dengan Convex Backend

## Prerequisites
1. Pengajar telah masuk (*logged in*) ke dalam aplikasi e-IMTIHAN.
2. Memiliki setidaknya satu paket Bank Soal aktif (misal: "IPA Terpadu Kelas 8").
3. Memiliki berkas gambar uji (`.png` atau `.jpg` berukuran < 5MB).

## Ordered Browser Scenarios

### Skenario 1: Beralih Antara Mode Unggah Berkas dan Tautan URL
- **Langkah**:
  1. Buka halaman detail Bank Soal (`/bank-soal/[id]`).
  2. Buka bagian wacana/stimulus dengan mengklik "+ Tambah Wacana / Stimulus".
  3. Amati pilihan dual-mode "Unggah Berkas" dan "Tautan URL".
  4. Klik tombol "Tautan URL" dan verifikasi kotak input URL teks muncul.
  5. Klik tombol "Unggah Berkas" dan verifikasi zona dropzone/tombol pilih gambar muncul.
- **Hasil yang Diharapkan**:
  - Perpindahan mode berjalan mulus tanpa error.

### Skenario 2: Mengunggah Berkas Gambar dan Live Preview
- **Langkah**:
  1. Pada mode "Unggah Berkas", klik area pilih berkas dan pilih berkas gambar lokal.
  2. Amati indikator pemuatan "Mengunggah berkas gambar...".
  3. Tunggu hingga muncul notifikasi "Gambar berhasil diunggah!".
  4. Periksa kartu pratinjau gambar pada formulir dan kartu *Live Preview* di sisi kanan.
  5. Masukkan teks soal, pilih kunci jawaban, lalu klik "Simpan Butir Soal".
- **Hasil yang Diharapkan**:
  - Gambar berhasil diunggah ke Convex storage, URL terisi otomatis, dan butir soal tersimpan dengan gambar stimulus.

### Skenario 3: Mengganti dan Menghapus Gambar Terunggah
- **Langkah**:
  1. Klik "Sunting" pada butir soal bergambar yang baru disimpan.
  2. Pada kartu gambar yang terpasang, klik tombol "Hapus".
  3. Verifikasi gambar terhapus dari pratinjau dan zona unggah kembali kosong.
- **Hasil yang Diharapkan**:
  - Status gambar ter-reset dengan bersih.

### Skenario 4: Tampilan 3-Panel pada Ruang Ujian Santri
- **Langkah**:
  1. Masuk sebagai santri ke sesi ujian yang menggunakan paket soal bergambar tersebut.
  2. Pada nomor soal bergambar, verifikasi Panel 1 (Wacana / Stimulus) menampilkan gambar secara tajam dan proporsional di sisi kiri.
  3. Pada panel tengah, verifikasi santri dapat membaca pertanyaan dan memilih jawaban / mengetik essay.
- **Hasil yang Diharapkan**:
  - Gambar stimulus tampil sempurna dan tidak terpotong.

## Evidence
*(Akan dilengkapi saat pengujian E2E dijalankan)*
