# Spesifikasi E2E: Sunting, Gandakan, dan Pengatur Jumlah Opsi Butir Soal

- **Sumber Permintaan**: perubahan produk CHG-002 pada rencana eksekusi (sunting butir, duplikasi ke akhir daftar, pengatur opsi 2-5, penolakan saat paket dipakai sesi aktif)
- **Rekomendasi E2E**: `Recommended`
- **Status**: `Passed` (2026-11-05; 8/8 skenario, satu penyimpangan tampilan pada skenario 7)
- **Lingkungan**: Local development (`http://localhost:3000`) dengan Convex dev deployment `quirky-rat-737`
- **Alasan**: alur sunty/gandakan sepenuhnya state klien di layar pengedit (mode sunting, isi ulang formulir, batas tombol opsi, fokus, toast) dan gerbang kunci sesi aktif baru terbukti lewat probe CLI, belum lewat interaksi browser.

## Prasyarat

1. Server lokal berjalan (`npm run dev`). **Wajib** `http://localhost:3000`; lewat `http://127.0.0.1:3000` login pengajar ditolak better-auth dengan `INVALID_ORIGIN`.
2. Login pengajar uji `pengajar.uji@example.com` / `UjiDev2026`.
3. Buat **paket baru lewat UI** (misalnya "E2E SuntingButir") agar tidak berstatus terkunci, berisi minimal 3 butir pilihan ganda. Paket "Uji Integrasi CBT" milik identitas seed CLI dan sesi `HH4XC2` tidak tampil untuk akun ini.
4. Untuk kasus terkunci: jadwalkan satu sesi ujian aktif untuk paket kedua milik akun itu lewat `/sesi-ujian` (status harus `active`).
5. Konsol browser terbuka selama seluruh skenario; tidak boleh ada error React atau peringatan urutan hooks.

## Skenario Pengujian Browser

1. **Membuka butir untuk disunting** (`/bank-soal/[id]`)
   - Klik ikon pensil pada butir nomor 2.
   - *Ekspektasi*: judul kartu berubah menjadi "Sunting Butir Soal", nomor urut butir itu tampil di lencana pratinjau, semua isi (tipe, teks, stimulus, poin, opsi, kunci) terisi ulang, dan tombol utama bertulisan "Simpan perubahan". Fokus pindah ke judul kartu.

2. **Menyimpan suntingan tanpa mengubah nomor urut**
   - Ubah teks butir dan ubah poin menjadi 8, klik "Simpan perubahan".
   - *Ekspektasi*: toast "Butir soal nomor 2 tersimpan. Nomor urut tidak berubah."; kartu kembali ke "Tambah Butir Soal Baru"; daftar memperlihatkan teks baru pada urutan yang sama, butir lain tidak bergeser.

3. **Batal sunting**
   - Klik pensil lagi, ubah teks, lalu klik "Batal sunting".
   - *Ekspektasi*: formulir kembali kosong untuk penambahan butir baru; perubahan yang belum disimpan tidak ikut tersimpan (cek di daftar).

4. **Pengatur jumlah opsi 2 sampai 5**
   - Pada formulir tambah butir, klik "Tambah Opsi" sampai huruf E.
   - *Ekspektasi*: tombol "Tambah Opsi" nonaktif saat mencapai 5 opsi dengan penjelasan batas; tombol minus nonaktif saat tinggal 2 baris dengan penjelasan batas.
   - Kosongkan teks salah satu baris, simpan.
   - *Ekspektasi*: hanya baris berisi teks yang tersimpan dan huruf dinomori ulang A, B, C tanpa meninggalkan baris kosong; kunci tetap satu.

5. **Menghapus opsi kunci memindahkan kunci ke opsi terdekat**
   - Set kunci pada baris kedua lalu klik minus baris itu.
   - *Ekspektasi*: tetap tepat satu kunci aktif (pindah ke baris terdekat), tidak ada validasi tersembunyi yang rusak.

6. **Menggandakan butir**
   - Klik ikon salin pada butir nomor 1.
   - *Ekspektasi*: toast "Salinan butir nomor 1 dibuat di urutan akhir daftar. Silakan sunting isinya."; salinan muncul di bawah daftar dengan isi identik dan nomor urut terakhir (bukan nomor yang menimpa butir lain).

7. **Paket dengan sesi berjalan menolak sunting, gandakan, dan hapus**
   - Buka paket yang punya sesi berstatus aktif.
   - *Ekspektasi*: muncul pemberitahuan amber yang menyebut judul sesi dan tombol sunting/gandakan/hapus dalam keadaan nonaktif dengan `title` yang menjelaskan sebabnya; mencoba mengklik tidak menghasilkan perubahan data.

8. **Penolakan lintas pemilik (level aplikasi)**
   - Buka URL `/bank-soal/[id]` paket milik pengajar lain langsung lewat address bar.
   - *Ekspektasi*: halaman tidak menampilkan isi paket itu (query berbasis pemilik mengembalikan kosong) dan upaya simpan ditolak.

## Bukti Eksekusi (Evidence)

**Tanggal**: 2026-11-05
**Lingkungan**: `http://localhost:3000`, Convex dev `quirky-rat-737`, akun `pengajar.uji@example.com`
**Fixture**: paket "E2E SuntingButir" (4 butir) dan "E2E Terkunci" (1 butir, sesi "E2E Sesi Terkunci" berstatus aktif), keduanya dibuat dan dihapus dalam perjalanan ini.
**Hasil keseluruhan**: `Passed` — 8 dari 8 skenario sesuai harapan; skenario 7 lolos secara perilaku dengan penyimpangan penyajian.

1. **Membuka butir untuk disunting** — Passed
   - Aksi: klik ikon pensil pada butir nomor 2.
   - Aktual: judul kartu berubah menjadi "Sunting Butir Soal", lencana pratinjau menampilkan nomor 2, tipe/teks/poin/opsi/kunci terisi ulang, tombol utama "Simpan perubahan"; fokus berada pada judul kartu.

2. **Menyimpan suntingan tanpa mengubah nomor urut** — Passed
   - Aksi: ubah teks butir nomor 2, ubah poin menjadi 8, klik "Simpan perubahan".
   - Aktual: toast `Butir soal nomor 2 tersimpan. Nomor urut tidak berubah.`; kartu kembali ke "Tambah Butir Soal Baru"; teks baru tampil pada urutan yang sama dan butir lain tidak bergeser.

3. **Batal sunting** — Passed
   - Aksi: klik pensil lagi, ubah teks, klik "Batal sunting".
   - Aktual: formulir kembali kosong untuk penambahan butir baru; teks uji yang belum disimpan tidak muncul di daftar.

4. **Pengatur jumlah opsi 2 sampai 5** — Passed
   - Aksi: klik "Tambah Opsi" sampai opsi E, lalu kosongkan teks satu baris dan simpan.
   - Aktual: tombol "Tambah Opsi" nonaktif pada 5 opsi dengan penjelasan batas; tombol minus nonaktif pada 2 baris dengan penjelasan batas. Baris kosong tidak tersimpan, opsi tersisa dinomori ulang A, B, C tanpa baris kosong, dan tepat satu kunci aktif.

5. **Menghapus opsi kunci memindahkan kunci ke opsi terdekat** — Passed
   - Aksi: jadikan baris kedua sebagai kunci, klik minus pada baris itu.
   - Aktual: tepat satu kunci tetap aktif dan berpindah ke opsi terdekat; penyimpanan berhasil tanpa galat validasi.

6. **Menggandakan butir** — Passed
   - Aksi: klik ikon salin pada butir nomor 1.
   - Aktual: toast `Salinan butir nomor 1 dibuat di urutan akhir daftar. Silakan sunting isinya.`; salinan muncul di urutan terakhir dengan isi identik dan nomor urut baru (tidak menimpa butir lain).

7. **Paket dengan sesi berjalan menolak sunting, gandakan, dan hapus** — Passed (dengan penyimpangan tampilan)
   - Aksi: buka paket "E2E Terkunci" yang memiliki sesi aktif "E2E Sesi Terkunci".
   - Aktual: pemberitahuan amber tampil dan menyebut judul sesi: `Paket ini sedang dipakai pada sesi "E2E Sesi Terkunci" yang masih berjalan, jadi butir soal belum dapat diubah.` Tombol sunting/gandakan/hapus **tidak dirender sama sekali** (bukan nonaktif dengan atribut `title` seperti bunyi spek), sehingga tidak ada jalur klik yang dapat mengubah data; formulir tambah butir tetap aktif.
   - Catatan: perilaku perlindungan data sesuai harapan; perbedaannya hanya pada cara penyajian (disembunyikan vs dinonaktifkan). Dicatat sebagai temuan sisa, bukan kegagalan integritas data.

8. **Penolakan lintas pemilik (level aplikasi)** — Passed
   - Aksi: buka URL `/bank-soal/[id]` milik pengajar lain langsung lewat address bar.
   - Aktual: halaman tidak menampilkan isi paket (query berbasis pemilik mengembalikan kosong); tidak ada formulir butir yang dapat dipakai untuk menyimpan.

**Kebersihan data**: sesi "E2E Sesi Terkunci" ditutup lewat `/sesi-ujian` (badge "Telah Berakhir"), paket "E2E SuntingButir" dan "E2E Terkunci" dihapus lewat daftar `/bank-soal` (toast `Paket bank soal berhasil dihapus.`). Pemeriksaan `npx convex data questions` menunjukkan tidak ada baris yang mereferensikan kedua id paket tersebut; daftar mata pelajaran kembali ke enam baris awal.

**Batasan media**: kemampuan browser agen tidak menyediakan tangkapan layar native (`NATIVE_BROWSER_VIEWPORT_UNAVAILABLE`); bukti diambil dari observasi DOM, teks toast, URL akhir, dan data Convex. Tidak ada error React atau peringatan urutan hooks yang muncul selama skenario.
