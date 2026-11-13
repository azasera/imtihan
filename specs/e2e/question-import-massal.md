# Spesifikasi E2E: Impor Massal Butir Soal dari Tempelan Teks

- **Sumber Permintaan**: perubahan produk CHG-003 pada rencana eksekusi (tempel naskah berpuluh butir → pratinjau hasil tafsiran → simpan bertahap ke paket milik pengajar yang masuk)
- **Rekomendasi E2E**: `Required`
- **Status**: `Passed` (2026-11-05; 14/14 skenario, dengan dua penyimpangan redaksi dan satu temuan sisa). Dijulang 2026-11-06 untuk toleransi tempelan Markdown: 4/4 `Passed` (lihat "Bukti Ulang").
- **Lingkungan**: Local development (`http://localhost:3000`) dengan Convex dev deployment `quirky-rat-737`
- **Alasan**: jalur tulis utama baru yang mengubah state server (berpuluh butir masuk sekali jalan), memuat keputusan sadar "simpan sebagian", dan punya batas kinerja 200 butir. Penafsiran, validasi, penomoran, gerbang kepemilikan, dan gerbang sesi aktif sudah terbukti lewat tes unit dan probe CLI; yang **belum** terbukti adalah pratinjau, status per baris, dan penyimpanan bertahap lewat interaksi browser.

## Prasyarat

1. Server lokal berjalan (`npm run dev` di `apps/`). **Wajib** `http://localhost:3000`; lewat `http://127.0.0.1:3000` login pengajar ditolak better-auth dengan `INVALID_ORIGIN`.
2. Login pengajar uji `pengajar.uji@example.com` / `UjiDev2026`.
3. Buat **paket baru lewat UI** (misalnya "E2E Impor Massal") lalu masuk ke halamannya. Jangan pakai paket "Uji Integrasi CBT" — itu milik identitas seed CLI (`https://convex.test|-59396202`) dan tidak tampil untuk akun ini.
4. Untuk kasus terkunci: buat paket kedua ("E2E Impor Terkunci"), lalu jadwalkan satu sesi ujian berstatus `active` untuk paket itu lewat `/sesi-ujian`.
5. Siapkan naskah uji (tempel apa adanya ke kolom tempel):

   ```
   1. Niat dalam wudhu dilakukan pada saat?
   A. Sebelum basuhan pertama*
   B. Setelah basuhan ketiga
   C. Saat mengusap kaki
   D. Saat air mengenai wajah

   2. (benar/salah) Wudhu batal apabila keluar sesuatu dari dua jalan.
   B

   3. (essay) Jelaskan tiga hal yang membatalkan wudhu beserta dalilnya.
   rubrik: Nilai penuh bila santri menyebut tiga pembatal dan satu dalil yang tepat.
   poin: 10

   WACANA: Seorang santri membaca Quran di atas kursi karena kakinya cedera.
   4. Hukum membaca Quran di atas kursi bagi santri tersebut adalah?
   A. Boleh karena ada uzur*
   B. Makruh jika mampu berdiri
   C. Haram mutlak
   D. Wajib

   5. Perhatikan firman Allah: ﴿وَأَتِمُّوا الْحَجَّ وَالْعُمْرَةَ لِلَّهِ﴾ Lalu tentukan hukumnya?
   A. وَاجِبٌ على كل مسلم*
   B. سُنَّةٌ مُؤَكَّدَة
   C. مُبَاحٌ

   6. Manakah yang belum lengkap?
   A. satu
   B. dua

   7. (pg kompleks) Manakah yang termasuk sunnah wudhu?
   A. Membaca bismillah*
   B. Mengucap dua kalimat syahadat
   C. Membasuh anggota tiga kali
   D. Berbicara saat berwudhu
   ```

   Butir 6 sengaja tanpa kunci dan butir 7 hanya berkunci satu: keduanya harus berstatus perlu perbaikan. Penafsir teks membaca naskah ini sebagai **7 baris, 5 siap, 2 perlu perbaikan**, dan wacana pada butir 4 ikut melekat sampai akhir tempelan (butir 4, 5, 6, 7), sesuai aturan blok wacana.

## Skenario Pengujian Browser

1. **Kolom tempel dan satu ajakan utama**
   - Buka tab "Tempel banyak sekaligus" pada kartu "Tambah Butir Soal Baru".
   - *Ekspektasi*: judul kartu menjadi "Tempel Banyak Butir Sekaligus", kolom teks besar tampil, panel "Petunjuk format teks" terbuka dan memuat aturan penomoran, huruf opsi A-E, tanda bintang kunci, penanda tipe, baris `B`/`S`, `rubrik:`, `poin:`, dan blok `WACANA:`. Tombol utama hanya "Periksa tulisan" dan dinonaktifkan selama kolom kosong. Tidak ada nomor spesifikasi teknis pada teks layar.

2. **Menyalin contoh format**
   - Klik "Salin contoh format", lalu tempel ke kolom (atau klik periksa langsung setelah menempel dari papan klip).
   - *Ekspektasi*: toast menyebut contoh berhasil disalin (atau menolak akses papan klip dengan kalimat yang menjelaskan bahwa contoh tetap tampil di bawah); tombol "Periksa tulisan" menjadi aktif.

3. **Pratinjau dibuka sebelum ada yang tersimpan**
   - Tempel naskah uji di atas, tekan "Periksa tulisan", dan **jangan** menekan tombol simpan apa pun.
   - *Ekspektasi*: layar berganti ke pratinjau berisi tujuh baris dengan kolom nomor, tipe, bobot, teks dan opsi, serta status. Ringkasan atas menyatakan "5 butir siap disimpan" dan "2 butir perlu perbaikan". Muat ulang halaman dan **daftar butir masih kosong**: tidak ada satu butir pun tersimpan sebelum konfirmasi.

4. **Nomor urut paket dinyatakan lebih dulu**
   - Perhatikan keterangan di ringkasan pratinjau pada paket yang masih kosong.
   - *Ekspektasi*: tertulis "masuk mulai nomor urut #1" untuk paket kosong; bila paket sudah berisi 3 butir, keterangan menjadi "#4".

5. **Status per baris dan alasan yang menunjuk baris sumber**
   - Baca baris butir tanpa kunci (nomor 6) dan baris pg kompleks berkunci satu.
   - *Ekspektasi*: status berupa label teks "Siap" / "Perlu perbaikan" (bukan hanya warna), dan alasannya menyebut baris ke berapa, misalnya "belum ada kunci jawaban; tandai satu opsi dengan tanda bintang di akhir teksnya (baris ke-26)" untuk butir 6 dan "soal pg kompleks membutuhkan minimal 2 kunci jawaban, baru 1 ditandai (baris ke-30)" untuk butir 7. Tipe, bobot, dan opsi dengan kunci terbaca sesuai naskah; butir 2 memakai bobot bawaan layar dan butir 3 memakai `poin: 10`; butir 4 ikut membawa wacananya.

6. **Teks Arab berharakat lolos tanpa rusak**
   - Bandingkan teks butir 5 pada pratinjau dengan naskah aslinya.
   - *Ekspektasi*: harakat, huruf, dan tanda kutip ayat `﴿ ﴾` tampil utuh di pratinjau, lalu utuh pula di daftar butir setelah disimpan (buka butirnya lewat "Sunting"). Butir ini juga ikut membawa wacana dari blok `WACANA:` sebelumnya.

7. **Tombol utama menghitung butir dan menunggu naskah bersih**
   - *Ekspektasi*: tombol utama bertuliskan jumlah butir ("Simpan 7 butir soal"), dan tetap nonaktif selama ada baris bermasalah; penjelasannya terbaca bahwa menyimpan sebagian harus ditekan sengaja. Tekan "Periksa ulang naskah", perbaiki butir 6 dengan menambahkan `*` pada satu opsi, buang baris penanda tipe yang salah pada butir 7 atau tambahkan satu bintang lagi, lalu periksa ulang.
   - *Ekspektasi*: semua baris menjadi "Siap" dan tombol utama aktif.

8. **Menyimpan seluruh hasil tafsiran**
   - Klik tombol utama.
   - *Ekspektasi*: tombol menampilkan label proses "Menyimpan N dari N..." selama tahap berjalan; setelah selesai muncul toast "7 butir soal tersimpan dan sudah tampil di daftar.", kolom tempel kembali kosong, dan daftar butir terisi tanpa memuat ulang halaman dengan nomor urut 1 sampai 7 (atau melanjutkan nomor terakhir paket). Bobot, tipe, wacana, dan rubrik cocok dengan pratinjau.

9. **Menyimpan sebagian adalah keputusan sadar**
   - Tempel ulang naskah yang masih menyisakan baris bermasalah, lalu klik "Simpan N butir yang siap" (tombol sekunder).
   - *Ekspektasi*: hanya butir siap yang masuk; jumlah butir di daftar bertambah persis sejumlah yang disebut label; baris bermasalah tetap ada di pratinjau dan tidak tersimpan.

10. **Kegagalan di tengah melaporkan berapa yang sudah masuk**
    - Skenario ini memakai paket yang sedang dipakai sesi `active` (lihat Prasyarat 4): tempel naskah yang sudah bersih, tekan tombol simpan utama.
    - *Ekspektasi*: penyimpanan berhenti dengan pesan yang menyebut sesi berjalan, misalnya `Butir soal paket ini tidak dapat diubah, digandakan, dihapus, atau ditambah lewat impor karena sedang dipakai pada sesi "..." yang masih berjalan.` Layar tetap pada pratinjau, memuat keterangan berapa butir yang sudah masuk dan daftar sisanya; menekan simpan sekali lagi **tidak** menggandakan butir yang sudah masuk (cek jumlah butir di daftar sebelum dan sesudah).

11. **Tempelan berpisahkan tab diberi keterangan**
    - Tempel dua baris hasil salinan lembar kerja (kolom berpisahkan tab).
    - *Ekspektasi*: keterangan satu baris muncul di bawah kolom ("Bentuk terbaca: teks bernomor — tempelan berpisahkan tab belum dipetakan, gunakan bentuk di atas") dan setelah "Periksa tulisan" tiap baris tab mendapat alasannya sendiri, tanpa ditolak sebagai layar error.

12. **Dua ratus butir tetap responsif**
    - Tempel naskah 200 butir bernomor (empat opsi, satu kunci, boleh dihasilkan skrip) lalu tekan "Periksa tulisan".
    - *Ekspektasi*: pratinjau 200 baris tampil tanpa membuat tab berhenti merespons; gulir dan klik tombol masih terasa lancar; penyimpanan berjalan bertahap dan laporan akhirnya menyatakan 200 butir tersimpan dengan nomor urut lanjutan yang benar tanpa duplikat.

13. **Layout layar kecil**
    - Ulangi skenario 3 dan 8 pada lebar viewport ponsel (≤ 480px).
    - *Ekspektasi*: kolom tempel melebar satu kolom, tabel pratinjau berganti kartu per butir, dan status serta alasannya tetap terbaca tanpa pemotongan.

14. **Konsol bersih**
    - Sepanjang seluruh skenario.
    - *Ekspektasi*: tidak ada error React, peringatan `set-state-in-effect`, peringatan urutan hooks, atau error Convex yang tidak tertangani.

## Bukti Eksekusi (2026-11-05)

**Lingkungan**: `http://localhost:3000`, Convex dev `quirky-rat-737`, akun `pengajar.uji@example.com`, viewport agen 474×569 (di bawah 480 px sepanjang perjalanan).
**Fixture**: paket "E2E Impor Massal" (FIQIH, MTA 1) dan "E2E Impor Terkunci" (FIQIH, MTA 2) dengan sesi `E2E Impor Sesi Aktif` (token `TGLG36`); keduanya dibuat dan dihapus dalam perjalanan ini.
**Hasil keseluruhan**: `Passed` — 14 dari 14 skenario dapat dijalankan sesuai maksud; terdapat penyimpangan redaksi pada skenario 11 (perilaku kini lebih maju dari naskah) dan temuan sisa pada skenario 10 (prefiks galat Convex mentah di layar).

1. **Kolom tempel dan satu ajakan utama** — Passed
   - Aksi: buka "Tempel banyak sekaligus" pada kartu "Tambah Butir Soal Baru".
   - Aktual: judul kartu "Tempel Banyak Butir Sekaligus", kolom teks besar (14 baris), panel "Petunjuk format teks" terbuka dan memuat aturan penomoran, opsi A-E, tanda bintang kunci, penanda tipe, baris `B`/`S`, `rubrik:`, `poin:`, dan blok `WACANA:`. Hanya tombol "Periksa tulisan" sebagai ajakan utama dan nonaktif saat kolom kosong. Tidak ada kode spesifikasi teknis pada teks layar.

2. **Menyalin contoh format** — Passed (dengan catatan)
   - Aksi: klik "Salin contoh format".
   - Aktual: peramban menolak akses papan klip; toast tampil: `Peramban menolak menyalin ke papan klip. Contoh formatnya tetap tampil di bawah.` Contoh format yang dapat dibaca tersedia sebagai placeholder kolom tempel (contoh teks bernomor lengkap); tidak ditemukan blok contoh terpisah yang dirender di bawah kolom.

3. **Pratinjau dibuka sebelum ada yang tersimpan** — Passed
   - Aksi: tempel naskah uji, tekan "Periksa tulisan", lalu muat ulang halaman tanpa menyimpan.
   - Aktual: pratinjau 7 baris dengan nomor, tipe, bobot, teks/opsi, dan status; ringkasan "5 butir siap disimpan | 2 butir perlu perbaikan". Setelah muat ulang "Daftar Soal (0)" dan Total Soal 0 — belum ada butir tersimpan.

4. **Nomor urut paket dinyatakan lebih dulu** — Passed
   - Aktual: paket kosong menampilkan "masuk mulai nomor urut #1"; setelah paket berisi 7 butir, pratinjau berikutnya menampilkan "masuk mulai nomor urut #8" (setelah 12 butir menjadi #13).

5. **Status per baris dan alasan yang menunjuk baris sumber** — Passed
   - Aktual: label teks "Siap"/"Perlu perbaikan". Butir 6: `belum ada kunci jawaban; tandai satu opsi dengan tanda bintang di akhir teksnya (baris ke-26)`; butir 7: `soal pg kompleks membutuhkan minimal 2 kunci jawaban, baru 1 ditandai (baris ke-30)`. Tipe, bobot (bawaan 5; essay `poin: 10`), opsi dan kunci sesuai naskah; butir 4 membawa wacana.

6. **Teks Arab berharakat lolos tanpa rusak** — Passed
   - Aktual: teks butir 5 pada pratinjau mempertahankan karakter asli, termasuk kurung ayat ornate `U+FD3E` dan `U+FD3F` (urutan kode titik terverifikasi) serta harakat; wacana ikut melekat. Setelah disimpan, teks yang sama tampil pada daftar butir.

7. **Tombol utama menghitung butir dan menunggu naskah bersih** — Passed
   - Aktual: tombol utama "Simpan 7 butir soal" nonaktif selama 2 baris bermasalah, dengan penjelasan "Tombol utama menunggu sampai semua baris valid. Menyimpan sebagian harus ditekan sengaja." Setelah "Periksa ulang naskah" (naskah tetap utuh) dan perbaikan dua baris, ringkasan menjadi "7 butir siap disimpan | 0 butir perlu perbaikan" dan tombol utama aktif.

8. **Menyimpan seluruh hasil tafsiran** — Passed
   - Aksi: klik "Simpan 7 butir soal".
   - Aktual: toast `7 butir soal tersimpan dan sudah tampil di daftar.`; kolom tempel kosong; "Daftar Soal (7)" dan Total Soal 7 tanpa muat ulang; urutan #1-#7; bobot, tipe, wacana, dan rubrik sesuai pratinjau.

9. **Menyimpan sebagian adalah keputusan sadar** — Passed
   - Aksi: tempel ulang naskah bermasalah, klik "Simpan 5 butir yang siap".
   - Aktual: toast `5 butir soal tersimpan...`; daftar menjadi 12 butir; dua baris bermasalah tetap ada di pratinjau dan tidak tersimpan.

10. **Kegagalan di tengah melaporkan berapa yang sudah masuk** — Passed (dengan temuan sisa)
    - Aksi: pada paket dengan sesi `active`, tempel naskah bersih (2 butir) lalu klik "Simpan 2 butir soal" dua kali.
    - Aktual: pesan tampil: `Butir soal paket ini tidak dapat diubah, digandakan, dihapus, atau ditambah lewat impor karena sedang dipakai pada sesi "E2E Impor Sesi Aktif" yang masih berjalan.` Pratinjau tetap terbuka dengan keterangan `0 butir sudah masuk ke paket. Sisa 2 butir bernomor tafsiran 1, 2 masih ada di pratinjau ini...`; toast `0 butir sudah masuk. 2 butir belum tersimpan.`; Total Soal tetap 0 setelah percobaan kedua (tidak ada penggandaan).
    - Temuan sisa: pesan di layar didahului prefiks mentah `[CONVEX M(bank/public/mutations:importQuestions)] [Request ID: ...] Server Error Uncaught Error:` sebelum kalimat yang ramah pengguna. Perilaku data benar; hanya kebocoran detail teknis pada teks galat.

11. **Tempelan berpisahkan tab diberi keterangan** — Passed (penyimpangan redaksi)
    - Aksi: tempel dua baris berpisahkan tab lalu "Periksa tulisan".
    - Aktual: keterangan yang tampil kini `Bentuk dikenali otomatis: teks bernomor atau baris lembar kerja berpisahkan tab.` dan pratinjau menyatakan `Bentuk: baris lembar kerja (tanpa baris judul, urutan kolom template)`. Tiap baris mendapat alasan sendiri (mis. `kunci "5" pada baris ke-1 tidak dikenal; gunakan huruf A sampai E.`) tanpa layar error. Naskah spek masih mengharapkan tempelan tab "belum dipetakan"; perilaku aplikasi kini lebih maju karena pemetaan kolom sudah tersedia — dicatat sebagai penyimpangan redaksi, bukan kegagalan.

12. **Dua ratus butir tetap responsif** — Passed
    - Aksi: tempel 200 butir bernomor (4 opsi, satu kunci) lalu "Periksa tulisan" dan simpan.
    - Aktual: ringkasan `200 butir siap disimpan | 0 butir perlu perbaikan`, nomor mulai #13; pratinjau tampil dan halaman tetap responsif (pemeriksaan selesai sekitar 5 detik). Saat menyimpan label proses terbaca `Menyimpan 50 dari 200...`; akhirnya toast `200 butir soal tersimpan...`; Total Soal 212. Pemeriksaan `npx convex data questions --limit 300` mengembalikan tepat 212 baris untuk paket tersebut — tanpa duplikat.

13. **Layout layar kecil** — Passed
    - Aksi: seluruh perjalanan dijalankan pada viewport 474×569.
    - Aktual: tabel pratinjau berlebar 0 (tersembunyi) dan kartu per butir (`.md:hidden`) tampil selebar 393 px; status dan alasan terbaca tanpa pemotongan; kolom tempel dan tombol simpan tetap dapat dipakai.

14. **Konsol bersih** — Passed (dengan catatan)
    - Aktual: hanya log info React DevTools dan `[HMR] connected` selama alur normal. Dua entri error Convex muncul persis dari dua percobaan simpan yang sengaja ditolak pada skenario 10 (sesi aktif) — keduanya ditangani aplikasi dan ditampilkan di layar, bukan kegagalan tak tertangani. Tidak ada error React, peringatan `set-state-in-effect`, atau peringatan urutan hooks.

**Kebersihan data**: sesi `E2E Impor Sesi Aktif` ditutup lewat `/sesi-ujian` (toast `Sesi ujian telah ditutup.`), paket "E2E Impor Massal" dan "E2E Impor Terkunci" dihapus lewat `/bank-soal` (dua toast `Paket bank soal berhasil dihapus.`). Pemeriksaan CLI menunjukkan 0 baris `questions` yang mereferensikan kedua id paket tersebut.

**Batasan media**: tangkapan layar native tidak tersedia (`NATIVE_BROWSER_VIEWPORT_UNAVAILABLE`); bukti diambil dari observasi DOM, teks status/toast, URL, dan hitungan Convex.

## Bukti Ulang (2026-11-06): tempelan dari editor Markdown

Perubahan pendukung (di luar 14 skenario di atas): penafsir teks kini melepas escape Markdown — nomor yang ditulis `1\.` dan garis miring di akhir baris (pemisah baris paksa) tidak lagi membuat butir tidak dikenali. Jalur lembar kerja berpisahkan tab tidak disentuh.

**Lingkungan**: `http://localhost:3000`, Convex dev `quirky-rat-737`, akun `pengajar.uji@example.com`, viewport agen 474×569.

1. **Tiga butir benar/salah ber-escape terpecah dan kuncinya terbaca** — Passed
   - Aksi: buat paket "Probe E2E Tempelan Markdown" (Fiqih Ibadah / SMPITA / Kelas 7), buka tab "Tempel banyak sekaligus", tempel naskah berisi `1\.` `(Benar/Salah)` dengan baris `B\` dan `poin: 5` pada tiap butir (tiga butir, dipisah baris kosong), tekan "Periksa tulisan".
   - Aktual: ringkasan `3 butir siap disimpan | 0 butir perlu perbaikan`, `masuk mulai nomor urut #1`, `Bentuk: teks bernomor`. Tiap kartu ditandai `Siap`, `Benar / Salah`, `5 poin`, dengan kunci berturut-turut `kunci: Benar`, `kunci: Salah`, `kunci: Benar`. Teks soal bersih dari angka dan garis miring (mis. "Menuntut ilmu wajib bagi setiap Muslim."). Tidak ada butir yang menyatu.
   - Status tidak disimpan sengaja (naskah berikut menimpa kolom tempel), jadi tidak ada fixture tersisa dari langkah ini.

2. **Kunci bintang dan garis miring di tengah teks** — Passed
   - Aksi: pada paket yang sama, tempel `1\.` Pilihan Ganda dengan opsi `B. 4*` dan `poin: 4`, lalu butir kedua yang teksnya memuat `\propto` di tengah kalimat, tekan "Periksa tulisan".
   - Aktual: `2 butir siap disimpan | 0 butir perlu perbaikan`; kedua kartu `Siap`/`Pilihan Ganda`/`4 poin` dengan `A, B — kunci B`. Teks butir dua tampil `Hitung luas bangun \propto ABC berikut.` — garis miring di tengah kalimat dipertahankan apa adanya, hanya escape di awal dan akhir baris yang dilepas.

3. **Hasil simpan di server** — Passed
   - Aksi: klik "Simpan 2 butir soal", lalu periksa `npx convex data questions`.
   - Aktual: "Total Soal 2 Butir"; dua baris `questions` untuk paket itu: `questionText "Berapakah 2 + 2?"` dan `questionText "Hitung luas bangun \\propto ABC berikut."` (escapes Markdown awal/akhir tidak ikut tersimpan), masing-masing `points 4`, `orderNumber 1` dan `2`, `type multiple_choice`, dengan `isCorrect true` hanya pada opsi B.

4. **Petunjuk format ikut menjelaskan** — Passed
   - Panel "Petunjuk format teks" memuat satu baris baru: `Naskah dari editor Markdown juga dikenali: nomor yang ditulis dengan garis miring dan garis miring di akhir baris diabaikan.` Tanpa kode spesifikasi teknis.

**Kebersihan data**: paket "Probe E2E Tempelan Markdown" dihapus lewat tombol "Hapus paket bank soal" di `/bank-soal` (daftar kembali ke "Belum Ada Paket Bank Soal"). `npx convex data questionBanks` = 3 baris dan tidak ada satu pun baris `questions` yang mereferensikan id paket fixture (0 baris), total `questions` kembali 6 baris. Akun pengajar uji keluar lewat `/api/auth/sign-out` (`{"success":true}`, status 200).

**Temuan lapangan (bukan kegagalan skenario)**: pada paket milik akun asli `j57a3ths…` ("Adab dan Akhlaq 1"), butir `orderNumber 1` masih berisi seluruh dokumen 15 butir benar/salah ber-escape Markdown yang menyatu menjadi satu teks soal — artefak dari penafsir sebelum perbaikan ini. Datanya biarkan apa adanya; kini dapat diimpor ulang dan akan terpecah menjadi 15 butir.

**Batasan media**: tetap tidak ada tangkapan layar native; bukti dari teks DOM, nilai kolom isian, dan keluaran CLI Convex.

## Bukti yang Diminta

- Tangkapan layar: kolom tempel dengan panel petunjuk; pratinjau dengan campuran status Siap/Perlu perbaikan beserta alasan bernomor baris; label tombol utama yang menghitung butir; toast hasil simpan; daftar butir terisi dengan wacana dan teks Arab utuh; laporan kegagalan bertahap; pratinjau 200 butir pada viewport ponsel.
- Catatan angka: jumlah butir di daftar sebelum/sesudah tiap penyimpanan, dan nomor urut pertama hasil impor.

## Perintah Mulai

```bash
cd apps && npm run dev
```

## Catatan Sisa

- Pemetaan kolom tempelan lembar kerja dan tombol unduh template bukan bagian perubahan ini; skenario 11 hanya menguji bahwa bentuk itu diberi alasan, bukan ditolak diam-diam.
- Kolom pembahasan, tingkat berpikir, dan rujukan capaian belum ada pada pratinjau; itu lingkup perubahan berikutnya, jadi kepala tabel saat ini hanya nomor, tipe, bobot, teks dan opsi, status.
