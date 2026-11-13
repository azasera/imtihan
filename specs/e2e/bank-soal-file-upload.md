# Spesifikasi E2E: Unggah Berkas Dokumen Word (.docx) dan Teks (.txt) pada Bank Soal

- **Sumber Permintaan**: Perbaikan bug deadlock stream pada ekstraksi berkas Word (.docx) dan fitur unggah berkas naskah soal langsung pada panel impor bank soal (`specs/feat-upload-file-bank-soal.md`).
- **Rekomendasi E2E**: `Recommended`
- **Status**: `Pending`
- **Lingkungan**: Local development (`http://localhost:3000`) dengan Convex dev deployment (`quirky-rat-737`)
- **Alasan**: Melibatkan interaksi pemilihan berkas di peramban (file picker input dan drag-and-drop), dekompresi file `.docx` client-side, pengisian otomatis naskah soal, dan pratinjau kartu butir soal sebelum disimpan ke database.

## Prasyarat

1. Server lokal berjalan (`npm run dev:web` atau `npm run dev` pada direktori `apps/`). Akses melalui `http://localhost:3000`.
2. Masuk sebagai pengajar uji (`pengajar.uji@example.com` / `UjiDev2026`).
3. Buka halaman bank soal atau buat satu paket baru (misalnya "Uji Unggah Berkas").
4. Masuk ke halaman editor paket tersebut (`/bank-soal/<id>`), lalu buka tab "Tempel banyak sekaligus" (atau navigasi dengan `?mode=bulk`).
5. Siapkan berkas uji:
   - `soal/IPA 8A SOAL.docx` (berkas dokumen Word riil memuat 20 soal PG dengan opsi bersambung dan 5 soal essay).
   - Naskah teks biasa `.txt` dengan format soal bernomor.

## Skenario Pengujian Browser

1. **Tampilan Zona Unggah Berkas**
   - Buka panel impor bank soal.
   - *Ekspektasi*: Area zona unggah berkas tampil dengan bingkai putus-putus (*dashed border*), ikon berkas, judul "Unggah Berkas Dokumen Word (.docx) atau Teks (.txt)", serta tombol "Pilih Berkas Soal". Tidak ada kode teknis atau emoji yang bocor ke teks UI.

2. **Unggah Berkas Microsoft Word (.docx) Riil**
   - Klik tombol "Pilih Berkas Soal" dan pilih berkas `soal/IPA 8A SOAL.docx`.
   - *Ekspektasi*: 
     - Tombol menampilkan status membaca sebentar ("Membaca berkas...").
     - File terbaca dalam hitungan detik (tanpa freeze/hang).
     - Muncul notifikasi toast sukses yang menginformasikan bahwa berkas berhasil dimuat beserta jumlah butir soal yang terbaca (20 pilihan ganda dan essay).
     - Kotak teks naskah soal otomatis terisi dengan naskah bernomor bersih dan opsi jawaban terpisah rapi (A, B, C, D).

3. **Peninjauan Kartu Soal Hasil Ekstraksi**
   - Setelah teks naskah terisi dari berkas Word, klik tombol "Periksa tulisan".
   - *Ekspektasi*: 
     - Layar beralih ke pratinjau kartu soal.
     - Soal nomor 1–20 terpetakan sebagai Pilihan Ganda dengan opsi A, B, C, D terpisah.
     - Soal essay terpetakan sebagai tipe Essay dengan nilai bobot poin dan kolom rubrik.

4. **Unggah Berkas Teks (.txt)**
   - Unggah berkas berformat `.txt`.
   - *Ekspektasi*: Teks dari berkas langsung dimuat ke dalam kotak naskah soal dengan notifikasi sukses.

5. **Penolakan Format Tidak Didukung**
   - Coba unggah berkas selain `.docx` dan `.txt` (misalnya `.pdf` atau `.png`).
   - *Ekspektasi*: Muncul toast galat ramah yang menyatakan format berkas belum didukung.

## Bukti Pengujian

*(Bagian ini akan diisi setelah eksekusi peramban via `/e2e-tester` selesai dijalankan).*
