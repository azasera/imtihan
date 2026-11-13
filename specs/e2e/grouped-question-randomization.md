# Spesifikasi Validasi E2E: Pengacakan Butir Soal Terkelompok (Pilihan Ganda di Awal, Esai di Akhir)

## 1. Klasifikasi E2E
- **Status**: `Recommended`
- **Fokus Pengujian**: Memastikan alur lembar kerja santri (`/ujian`) saat sesi ujian memiliki setelan `randomizeQuestions: true` selalu menyajikan soal-soal pilihan ganda pada nomor-nomor awal dan seluruh soal esai pada nomor-nomor akhir lembar kerja.

## 2. Skenario Uji

### Skenario 1: Paket Soal Campuran (20 PG + 5 Essay) dengan Opsi Acak Soal Aktif
1. Pengajar membuat sesi ujian baru dari paket bank soal 25 butir (20 PG dan 5 Essay).
2. Opsi "Acak Urutan Butir Soal" dibiarkan aktif (`checked`).
3. Santri A dan Santri B login dan memasuki ruang ujian (`/ujian`).
4. **Verifikasi**:
   - Kisi nomor soal (daftar butir 1 s.d. 25):
     - Butir nomor 1 s.d. 20 pada santri A semuanya bertipe pilihan ganda (memiliki opsi radio A-E).
     - Butir nomor 21 s.d. 25 pada santri A semuanya bertipe esai (memiliki kotak textarea jawaban uraian).
     - Tidak ada soal esai yang muncul di antara nomor 1 s.d. 20.
     - Butir nomor 1 s.d. 20 pada santri B juga semuanya bertipe pilihan ganda, namun urutan pertanyaannya berbeda dari santri A.
     - Butir nomor 21 s.d. 25 pada santri B juga semuanya bertipe esai di akhir lembar kerja.

### Skenario 2: Refresh Lembar Kerja Santri (Konsistensi Deterministik)
1. Santri A berada di lembar ujian pada nomor 3.
2. Santri A menekan tombol refresh browser (F5).
3. **Verifikasi**:
   - Seluruh urutan soal tetap persis sama seperti sebelum halaman di-refresh.
   - Jawaban yang telah dipilih atau diketik tetap tersimpan utuh.
