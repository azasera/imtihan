# E2E Spec: Input dan Kustomisasi Catatan Kokurikuler di Tab Asesmen Wali Kelas

## Status: Pending
## Rekomendasi: Recommended
## Target & Sumber Kebutuhan:
- `specs/feat-input-catatan-kokurikuler-rapor.md`
- Kebutuhan wali kelas untuk dapat mengubah teks narasi capaian Kokurikuler pada Rapor Umum SAS (Kurikulum Merdeka).

## Lingkungan & Prasyarat:
1. Server aplikasi Next.js & Convex backend aktif.
2. Pengguna terautentikasi sebagai Guru/Wali Kelas/Admin.
3. Terdapat minimal 1 santri dalam kelas yang dipilih pada semester aktif.

## Skenario Pengujian Browser:

### Skenario 1: Tampilan Default Teks Baku Kokurikuler
1. Buka halaman `/rapor`.
2. Klik tab **Asesmen Wali Kelas**.
3. Pilih salah satu santri pada dropdown "Pilih Santri".
4. Verifikasi terdapat bagian kartu input bertajuk **Catatan Kokurikuler (Penguatan Karakter & P5)**.
5. Verifikasi isi `<textarea>` secara bawaan memuat teks:
   > *"Ananda sudah baik dalam keimanan dan ketakwaan terhadap Tuhan Yang Maha Esa, tercermin dari sikap religiusnya seperti melaksanakan sholat berjamaah di masjid, melakukan muroja'ah dan menghafal Al-Qur'an, serta menjaga adab terhadap teman dan guru."*

### Skenario 2: Kustomisasi Narasi dan Simpan Asesmen
1. Ubah teks pada textarea Catatan Kokurikuler dengan teks kustom:
   > *"Ananda menunjukkan perkembangan adab dan keistiqomahan yang sangat baik dalam ibadah harian."*
2. Klik tombol **Simpan Asesmen Santri**.
3. Amati toast notifikasi berhasil muncul.
4. Buka tab **Cetak Rapor Santri**.
5. Pilih santri yang sama, tipe **Rapor Umum**, periode **SAS**.
6. Amati kotak berbingkai **Kokurikuler** pada pratinjau lembar cetak: teks yang tampil adalah teks kustom yang baru saja disimpan.

### Skenario 3: Reset ke Teks Baku
1. Kembali ke tab **Asesmen Wali Kelas**.
2. Klik tombol **Kembalikan Teks Baku** di dekat judul Catatan Kokurikuler.
3. Verifikasi teks di textarea kembali menjadi teks bawaan awal.
4. Klik **Simpan Asesmen Santri**.

## Bukti Pengujian:
*(Akan dilengkapi saat pengujian E2E dijalankan)*
