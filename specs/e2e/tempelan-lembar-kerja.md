# Spesifikasi E2E: Tempelan Baris Lembar Kerja dan Unduhan Template pada Impor Massal

- **Sumber Permintaan**: perubahan produk CHG-006 pada rencana eksekusi (impor massal menerima tempelan baris lembar kerja dari Excel/Google Sheets, bentuk dikenali otomatis, baris judul opsional, kolom tak dikenal diberi keterangan, unduhan template kolom)
- **Rekomendasi E2E**: `Required`
- **Status**: `Passed` (2026-11-05; 12/12 skenario, dengan catatan lingkungan unduhan dan tiga penyimpangan redaksi kecil)
- **Lingkungan**: Local development (`http://localhost:3000`) dengan Convex dev deployment `quirky-rat-737`
- **Alasan**: kriteria "tempelan lembar kerja menghasilkan pratinjau yang sama seperti tempelan bernomor", "berkas template dapat ditempel balik tanpa penyesuaian", "bentuk dikenali otomatis tanpa tombol pilihan", dan "dua ratus baris tetap responsif" adalah perilaku layar dan alur tempel yang tidak dapat dibuktikan oleh tes unit berbasis berkas. Penafsiran parser, aturan isi, dan kinerja di Node sudah terbukti lewat `tests/question-import-spreadsheet.test.ts`; bukti browser dibutuhkan untuk perilaku tempel, unduhan berkas, dan tampilan pratinjau.

## Prasyarat

1. Server lokal berjalan (`npm run dev` di `apps/`). **Wajib** `http://localhost:3000`; lewat `http://127.0.0.1:3000` login pengajar ditolak better-auth dengan `INVALID_ORIGIN`.
2. Login pengajar uji `pengajar.uji@example.com` / `UjiDev2026`.
3. Buat satu paket khusus uji "Probe E2E Lembar Kerja" dengan Mata Pelajaran `AQIDAH`, Lembaga `SMPITA`, Tingkat `Kelas 7`. Paket dan seluruh butirnya dihapus di akhir perjalanan supaya data dev tetap bersih.
4. Siapkan satu berkas teks di luar peramban (Notepad/editor) untuk menyusun tempelan berpisahkan tab; tab harus berupa karakter tab asli, bukan spasi.
5. Jangan memakai paket "Adab dan Akhlaq 1" milik akun pengajar uji untuk pengujian tulis — paket itu dipakai sebagai pembanding butir lama.

## Skenario Pengujian Browser

1. **Bentuk dikenali otomatis tanpa tombol pilihan**
   - Buka `/bank-soal`, buka paket "Probe E2E Lembar Kerja", buka layar penulisan cepat/impor massal. Tempel naskah bernomor dua butir dari tombol "Salin contoh format" (Ctrl+V).
   - *Ekspektasi*: setelah "Periksa tulisan" pratinjau menyebut "Bentuk: teks bernomor" dan menampilkan dua butir. Tidak ada pilihan mode/dropdown "teks bernomor vs lembar kerja" di layar. Kembali ke naskah, lalu tempel dua baris berpisahkan tab dengan baris judul.
   - *Ekspektasi kedua*: pratinjau menyebut "Bentuk: baris lembar kerja (baris judul dikenali)" tanpa pengajar memilih apa pun, dan ringkasan tetap menyatakan jumlah butir siap serta nomor urut awal.

2. **Unduh template kolom lalu tempel balik tanpa penyesuaian**
   - Tekan "Unduh template kolom". Buka berkas `template-impor-soal.tsv` di editor teks, salin seluruh isinya, tempel ke kolom naskah, lalu tekan "Periksa tulisan".
   - *Ekspektasi*: berkas berisi satu baris judul dan satu baris contoh. Pratinjau menampilkan tepat 1 butir siap tanpa alasan perbaikan, dengan opsi A–D, kunci A, bobot 5, pembahasan "Niat adalah rukun pertama wudhu…", tingkat berpikir "Memahami", dan capaian "Thaharah — rukun wudhu". Teks Arab pada contoh tidak berubah.

3. **Tanpa baris judul memakai urutan kolom template**
   - Hapus baris judul dari tempelan template, lalu periksa lagi.
   - *Ekspektasi*: pratinjau menyebut "Bentuk: baris lembar kerja (tanpa baris judul, urutan kolom template)" dan tetap menampilkan 1 butir siap dengan nilai yang sama seperti skenario 2.

4. **Baris judul boleh berurutan lain dan tanpa peduli besar-kecil huruf**
   - Tempel baris judul `SOAL	KUNCI	tipe	B	A	Poin` diikuti satu baris isi yang urutannya sesuai judul tersebut.
   - *Ekspektasi*: baris judul dikenali; butir siap dengan opsi A dan B sesuai kolom, kunci menunjuk huruf yang benar, dan bobot terbaca dari kolom `Poin`.

5. **Kolom tak dikenal diabaikan dengan keterangan, bukan menggagalkan impor**
   - Tempel baris judul `soal	tipe	a	b	kunci	catatan` dengan satu baris isi yang mengisi `catatan`.
   - *Ekspektasi*: pratinjau menampilkan 1 butir siap dan satu keterangan "kolom diabaikan: catatan" pada ringkasan. Isi kolom `catatan` tidak muncul pada teks soal, opsi, maupun pembahasan.

6. **Baris dengan jumlah kolom berlebih menjadi baris bermasalah**
   - Tempel baris judul lima kolom (`soal	tipe	a	b	kunci`) lalu satu baris isi dengan enam sel (sel terakhir berisi catatan tambahan).
   - *Ekspektasi*: butir muncul sebagai "Perlu perbaikan" dengan alasan yang menyebut "baris ke-2 memuat 6 kolom, sedangkan bentuk yang dikenali 5 kolom". Tombol simpan utama tidak menyimpan baris bermasalah; butir siap lain (bila ada) dapat disimpan lewat tombol sekunder.

7. **Kunci dan tipe ditafsir dari sel, bukan posisi**
   - Satu tempelan berisi empat baris: pilihan ganda dengan kunci `b`, pg kompleks dengan kunci `A, C`, benar/salah dengan kunci `S`, dan essay tanpa kunci.
   - *Ekspektasi*: pratinjau menampilkan tipe "Pilihan Ganda", "PG Kompleks", "Benar/Salah", "Essay"; pg kompleks menandai dua kunci; benar/salah menampilkan baris Benar/Salah dengan kunci Salah; keempatnya siap. Baris essay yang mengisi kolom kunci tampil "Perlu perbaikan" dengan alasan kunci tidak dipakai untuk essay.

8. **Wacana berlaku ke baris sesudahnya sampai berubah**
   - Tempel tiga baris; baris pertama dan ketiga mengisi kolom `wacana` dengan kalimat berbeda, baris kedua membiarkannya kosong.
   - *Ekspektasi*: butir 1 dan 2 memakai wacana pertama, butir 3 memakai wacana kedua. Simpan, lalu buka butir 2 di editor → kolom wacana berisi wacana pertama.

9. **Dua ratus baris tetap responsif**
   - Susun 200 baris data (satu butir per baris) di editor teks, tempel ke kolom naskah, tekan "Periksa tulisan".
   - *Ekspektasi*: pratinjau muncul dalam hitungan detik tanpa membuat tab membeku; ringkasan menyatakan 200 butir siap dan nomor urut mulai; penggulungan tabel tetap lancar. Tidak ada permintaan jaringan ke server selama tahap periksa (cek panel Network peramban: tidak ada panggilan Convex baru saat "Periksa tulisan").

10. **Menyimpan butir hasil tempelan lembar kerja**
    - Dari skenario 2, simpan butir siap.
    - *Ekspektasi*: editor menampilkan satu butir baru dengan nomor urut sesuai paket, bobot 5, opsi A–D, kunci A, dan metadata pembahasan/berpikir/capaian yang sama seperti pratinjau. Panel pratinjau santri tidak menampilkan pembahasan, tingkat berpikir, maupun capaian.

11. **Tata letak ponsel**
    - Dengan lebar ±390 px, ulangi tempelan template dan buka pratinjau.
    - *Ekspektasi*: tombol "Unduh template kolom" dapat disentuh tanpa terpotong; keterangan bentuk dan kolom diabaikan membungkus tanpa gulir horizontal; tabel pratinjau berganti menjadi kartu yang tetap memuat tipe, bobot, teks/opsi, dan metadata.

12. **Pembersihan**
    - Hapus paket "Probe E2E Lembar Kerja" beserta seluruh butirnya; tutup berkas template yang diunduh bila tidak diperlukan.
    - *Ekspektasi*: daftar paket kembali seperti semula dan tidak ada baris probe tersisa.

## Bukti Eksekusi (2026-11-05)

**Lingkungan**: `http://localhost:3000`, Convex dev `quirky-rat-737`, akun `pengajar.uji@example.com`, viewport agen tetap 474×569.
**Fixture**: paket "Probe E2E Lembar Kerja" (AQIDAH, SMPITA, Kelas 7), dibuat dan dihapus dalam perjalanan ini.
**Hasil keseluruhan**: `Passed` — seluruh 12 skenario dapat dijalankan sesuai maksud, dengan catatan lingkungan pada unduhan berkas dan beberapa perbedaan redaksi yang tidak mengubah hasil.

1. **Bentuk dikenali otomatis tanpa tombol pilihan** — Passed
   - Aksi: tempel naskah bernomor dua butir lalu "Periksa tulisan"; kembali dan tempel dua baris berpisahkan tab dengan baris judul.
   - Aktual: bentuk pertama menghasilkan `Bentuk: teks bernomor` dengan 2 butir siap dan nomor mulai #1. Tidak ada dropdown pemilih mode (0 combobox mode di layar). Bentuk kedua menghasilkan `Bentuk: baris lembar kerja (baris judul dikenali)` dengan ringkasan jumlah siap dan nomor urut awal, tanpa memilih apa pun.

2. **Unduh template kolom lalu tempel balik tanpa penyesuaian** — Passed (dengan catatan lingkungan)
   - Aksi: klik "Unduh template kolom"; baca berkas hasil unduhan; tempel isinya ke kolom naskah lalu periksa.
   - Aktual: elemen unduhan memakai nama `template-impor-soal.tsv` (atribut `download` terverifikasi pada anchor blob). Agen peramban menyimpan unduhan sebagai berkas sementara bernama UUID di folder Downloads; isi berkas tervalidasi: satu baris judul (13 kolom template) + satu baris contoh. Pratinjau: `Bentuk: baris lembar kerja (baris judul dikenali)`, 1 butir siap, opsi A–D, kunci A, 5 poin, pembahasan "Niat adalah rukun pertama wudhu, dilakukan bersamaan dengan basuhan pertama.", tingkat berpikir "Memahami", capaian "Thaharah — rukun wudhu". Catatan: template aktual tidak memuat teks Arab, berbeda dari kalimat spek.

3. **Tanpa baris judul memakai urutan kolom template** — Passed
   - Aktual: setelah baris judul dihapus, pratinjau menyebut `Bentuk: baris lembar kerja (tanpa baris judul, urutan kolom template)` dan tetap 1 butir siap dengan opsi, kunci, bobot, pembahasan, berpikir, dan capaian yang sama.

4. **Baris judul boleh berurutan lain dan tanpa peduli besar-kecil huruf** — Passed
   - Aksi: tempel judul `SOAL	KUNCI	tipe	B	A	Poin` + satu baris isi.
   - Aktual: judul dikenali; butir siap dengan opsi A dan B sesuai kolom, kunci menunjuk B, dan bobot terbaca 7 dari kolom `Poin`.

5. **Kolom tak dikenal diabaikan dengan keterangan, bukan menggagalkan impor** — Passed
   - Aktual: pratinjau menampilkan 1 butir siap dan keterangan `kolom diabaikan: catatan`; teks isi kolom catatan tidak muncul pada soal, opsi, maupun pembahasan.

6. **Baris dengan jumlah kolom berlebih menjadi baris bermasalah** — Passed
   - Aksi: tempel judul lima kolom, satu baris valid, lalu satu baris enam sel.
   - Aktual: baris bermasalah berstatus "Perlu perbaikan" dengan alasan `baris ke-3 memuat 6 kolom, sedangkan bentuk yang dikenali 5 kolom; periksa sel tergabung atau tab di tengah teks.` Nomor baris menghitung baris judul (lebih tepat untuk tempelan lembar kerja; spek mencontohkan baris ke-2). Tombol utama nonaktif; tombol sekunder "Simpan 1 butir yang siap" aktif.

7. **Kunci dan tipe ditafsir dari sel, bukan posisi** — Passed
   - Aktual: empat baris terbaca sebagai Pilihan Ganda (kunci B), PG Kompleks (kunci A, C), Benar / Salah (kunci Salah), dan Essay. Baris essay yang mengisi kolom kunci menjadi "Perlu perbaikan" dengan alasan `kunci "A" pada baris ke-5 tidak dipakai untuk soal essay; kosongkan kolom kunci.` Ringkasan 3 siap + 1 perlu perbaikan; tombol sekunder "Simpan 3 butir yang siap" tersedia.

8. **Wacana berlaku ke baris sesudahnya sampai berubah** — Passed
   - Aksi: tiga baris; wacana hanya diisi pada baris 1 dan 3; simpan; buka butir 2 di editor.
   - Aktual: pratinjau memakai wacana pertama untuk butir 1 dan 2, wacana kedua untuk butir 3. Setelah disimpan, editor butir 2 menampilkan kolom wacana berisi `Wacana pertama tentang rukun wudhu`.

9. **Dua ratus baris tetap responsif** — Passed
   - Aksi: tempel 200 baris data + baris judul, tekan "Periksa tulisan".
   - Aktual: ringkasan `200 butir siap disimpan | 0 butir perlu perbaikan`, nomor mulai #4; halaman tetap merespons. Penghitungan resource `performance` untuk pola `convex|api/` tetap 3 sebelum dan sesudah pemeriksaan — tidak ada panggilan jaringan baru saat tahap periksa.

10. **Menyimpan butir hasil tempelan lembar kerja** — Passed
    - Aksi: simpan 1 butir dari tempelan template.
    - Aktual: daftar menjadi 4 butir; butir baru di urutan #4 dengan bobot 5, opsi A–D, kunci A. Saat dibuka lewat "Sunting": pembahasan, tingkat berpikir "Memahami", dan capaian `Thaharah — rukun wudhu` terisi. Panel "Pratinjau Siswa" di layar editor tidak menampilkan pembahasan, tingkat berpikir, maupun capaian.

11. **Tata letak ponsel** — Passed (viewport 474 px)
    - Aktual: tombol "Unduh template kolom" tampil utuh (171×28 px, tidak terpotong); keterangan bentuk/kolom diabaikan membungkus dalam lebar 393 px tanpa gulir horizontal; tabel pratinjau berlebar 0 dan kartu per butir (`md:hidden`) selebar 393 px memuat tipe, bobot, teks/opsi, dan metadata. Spek meminta ±390 px; agen peramban terkunci pada 474 px sehingga diuji pada lebar terdekat.

12. **Pembersihan** — Passed
    - Aktual: paket "Probe E2E Lembar Kerja" dihapus lewat `/bank-soal` (toast `Paket bank soal berhasil dihapus.`); daftar paket untuk akun ini kembali kosong. Pemeriksaan CLI menunjukkan 0 baris `questions` yang mereferensikan id paket tersebut.

**Temuan sisa**: berkas template diunduh dengan nama sementara UUID oleh lapisan otomasi peramban (bukan oleh aplikasi); atribut `download` aplikasi sudah benar `template-impor-soal.tsv`. Teks Arab yang disebut pada skenario 2 tidak ada pada template aktual.

**Batasan media**: tangkapan layar native tidak tersedia (`NATIVE_BROWSER_VIEWPORT_UNAVAILABLE`); bukti diambil dari observasi DOM, atribut unduhan, isi berkas, teks pratinjau/toast, dan hitungan Convex.
