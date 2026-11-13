# Spesifikasi E2E: Penentuan Kunci Cepat Interaktif (Opsi 1) dan Kunci Massal (Opsi 2) pada Pratinjau Impor Bank Soal

- **Sumber Permintaan**: Permintaan pengguna untuk mempermudah dan mempercepat penentuan kunci jawaban naskah soal impor (Opsi 1: pemilih kunci interaktif per baris, dan Opsi 2: input kunci massal sekaligus).
- **Rekomendasi E2E**: `Recommended`
- **Status**: `Pending`
- **Lingkungan**: Local development (`http://localhost:3000`) dengan Convex dev deployment (`quirky-rat-737`)
- **Alasan**: Merupakan interaksi UI langsung pada layar pratinjau impor yang memperbarui state butir soal, status kelayakan ("Perlu perbaikan" -> "Siap disimpan"), dan penghitung ringkasan secara reaktif tanpa reload.

## Prasyarat

1. Server lokal aktif di `http://localhost:3000`.
2. Masuk sebagai pengajar uji (`pengajar.uji@example.com` / `UjiDev2026`).
3. Buka halaman bank soal (`/bank-soal`), pilih salah satu paket bank soal.
4. Masuk ke mode impor massal (`/bank-soal/<id>?mode=bulk`).
5. Siapkan naskah soal tanpa kunci (misal 5 butir pilihan ganda A-D atau berkas `soal/IPA 8A SOAL.docx`).

## Skenario Pengujian Browser

1. **Tampilan Bilah Kunci Massal & Tombol Kunci Interaktif per Baris**
   - Unggah naskah soal yang belum memiliki tanda bintang kunci.
   - Klik "Periksa tulisan".
   - *Ekspektasi*:
     - Di atas tabel pratinjau muncul kartu "Tempel Kunci Jawaban Massal (Opsional)" lengkap dengan kolom teks dan tombol "Terapkan Kunci".
     - Pada setiap baris soal pilihan ganda, di bawah teks soal muncul deretan tombol pilihan kunci `[ A ] [ B ] [ C ] [ D ]`.
     - Butir yang belum memiliki kunci berstatus "Perlu perbaikan".

2. **Penerapan Kunci Massal Sekaligus (Opsi 2)**
   - Pada kotak "Tempel Kunci Jawaban Massal", masukkan deretan kunci (misal: `A B C D A` atau `1.A 2.B 3.C 4.D 5.A`).
   - Klik tombol "Terapkan Kunci".
   - *Ekspektasi*:
     - Muncul notifikasi toast sukses bahwa kunci berhasil diterapkan.
     - Seluruh nomor soal 1–5 langsung memiliki tombol kunci aktif yang menyala hijau (misal nomor 1 aktif di `A`, nomor 2 di `B`, dst.).
     - Status butir seketika berubah menjadi "Siap disimpan".
     - Ringkasan di atas menampilkan "5 butir siap disimpan | 0 butir perlu perbaikan".
     - Tombol utama "Simpan 5 butir soal" menjadi aktif.

3. **Penyuntingan / Penggantian Kunci 1-Klik per Baris (Opsi 1)**
   - Pada baris nomor 2 yang sedang aktif di kunci `B`, klik tombol `[ D ]`.
   - *Ekspektasi*:
     - Tombol `B` kembali netral, dan tombol `D` menyala hijau tebal.
     - Keterangan teks opsi memperbarui teks kunci menjadi `D`.
     - Butir tetap berstatus "Siap disimpan".

4. **Kunci Interaktif untuk Soal Benar/Salah dan PG Kompleks**
   - Pada soal tipe Benar/Salah, klik tombol `[ Benar ]` atau `[ Salah ]`.
   - Pada soal PG Kompleks, klik 2 opsi kunci (misal `A` dan `C`).
   - *Ekspektasi*: Kunci terpilih menyala hijau dan status validasi terpenuhi.

5. **Penyimpanan ke Basis Data**
   - Klik tombol "Simpan N butir soal".
   - *Ekspektasi*: Seluruh butir soal tersimpan ke database Convex dengan kunci jawaban yang sudah ditentukan.

## Bukti Pengujian

*(Bagian ini akan diisi setelah eksekusi peramban via `/e2e-tester` selesai dijalankan).*
