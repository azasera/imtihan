# E2E Specification: Pengisian Manual Nilai Akhir Rapor (NAR) dengan Dukungan Kalkulasi Otomatis

## Metadata
- Target: `FEAT-RAPOR-MANUAL-NAR`
- Recommendation: `Recommended`
- Status: `Pending`
- Environment: Local Development (`http://localhost:3000`)
- Prerequisites:
  - Akun pengajar / wali kelas terautentikasi di aplikasi.
  - Data kelas aktif (misal `Kelas 7B`) dan mata pelajaran (misal `PAI`).

## Skenario Browser E2E

### Skenario 1: Kalkulasi Bawaan Otomatis dari Komponen Nilai
1. Pengajar login dan mengakses `/rapor`.
2. Memilih kelas dan mata pelajaran.
3. Mengisi nilai STS `80` dan SAS `80`.
4. Kolom Nilai Akhir otomatis menampilkan angka hasil formula `(2*0 + 80 + 80)/4 = 40`.
5. Tombol reset tidak muncul pada sel Nilai Akhir karena nilai sesuai dengan formula.

### Skenario 2: Override Manual Nilai Akhir
1. Pengajar mengklik input pada kolom Nilai Akhir untuk santri pertama.
2. Mengubah angka dari `40` menjadi `85`.
3. Predikat santri seketika terbarui (misal menjadi `B`), dan narasi capaian otomatis menyesuaikan rentang nilai 85.
4. Input Nilai Akhir menampilkan highlight oranye/amber lembut dan tombol reset (*RotateCcwIcon*) muncul di sampingnya.

### Skenario 3: Pembatalan / Reset Override Manual
1. Pengajar mengklik tombol reset (*RotateCcwIcon*) di samping input Nilai Akhir yang bernilai `85`.
2. Nilai Akhir seketika kembali ke nilai formula awal (`40`).
3. Highlight oranye dan tombol reset hilang kembali ke keadaan normal.

### Skenario 4: Penyimpanan dan Refleksi pada Leger & Cetak Rapor
1. Pengajar mengisi Nilai Akhir manual `88` untuk santri pertama.
2. Menekan tombol **Simpan Nilai Rapor**.
3. Toast notifikasi sukses muncul.
4. Pengajar berpindah ke tab **Buku Leger Nilai** dan memverifikasi bahwa kolom mapel tersebut mencantumkan angka `88`.
5. Pengajar berpindah ke tab **Cetak Rapor Santri** dan memverifikasi lembar cetak menampilkan nilai akhir `88`.

## Bukti Pengujian
<!-- Akan diisi oleh penguji E2E (/e2e-tester) -->
