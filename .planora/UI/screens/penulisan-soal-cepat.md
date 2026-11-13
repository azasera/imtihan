# Spesifikasi layar — Penulisan cepat butir soal (impor teks, sunting, gandakan)

Cakupan kebutuhan: `BANK-FR-002`, `BANK-FR-008`, `BANK-FR-009`, `BANK-FR-012`, `BANK-FR-013`, `BANK-FR-014`, `BANK-FR-015`, `BANK-AC-006`, `BANK-AC-007`, `BANK-AC-008`, `BANK-AC-009`, `BANK-AC-010`, `BANK-AC-011`, `BANK-AC-014`, `BANK-AC-015`, `BANK-AC-016`, `BANK-AC-017`, `BANK-AC-018`, `NFR-PERF-005`.

Layar ini bukan rute baru. Seluruhnya menempel pada editor paket bank soal yang sudah ada di `/bank-soal/[id]`.

## Struktur layar

1. Header paket (judul, mata pelajaran, tingkat, bobot, jumlah butir) — tidak berubah.
2. Dua cara menambah butir, dipilih lewat tab pada kartu "Tambah Butir Soal Baru":
   - **Tulis satu per satu** — formulir yang sudah ada hari ini, ditambah tombol tambah/kurang opsi sampai maksimal lima (A sampai E), kolom "Pembahasan (tidak dilihat santri)", pilihan "Tingkat berpikir" (mengingat, memahami, mengaplikasikan, menganalisis; bawaan belum ditandai), dan isian "Rujukan capaian materi" yang sarannya diambil dari label milik mata pelajaran paket ini.
   - **Tempel banyak sekaligus** — satu kolom teks besar tempat pengajar menempelkan naskah soal, di bawahnya panel petunjuk format, tombol "Salin contoh format", dan tombol "Unduh template kolom" untuk mengisi di lembar kerja terlebih dahulu. Bentuk tempelan dikenali otomatis: teks berpola bernomor atau baris hasil salinan lembar kerja.
3. Setelah menekan "Periksa tulisan" pada mode tempel, layar berganti ke **pratinjau hasil tafsiran**: tabel per butir berisi nomor, tipe, bobot, ringkasan teks, ringkasan opsi beserta kunci, pembahasan, tingkat berpikir, rujukan capaian, dan status. Baris yang tidak valid memakai warna amber atau destruktif beserta alasan yang menyebutkan baris ke berapa teksnya bermasalah.
4. Ringkasan di atas tabel pratinjau menyatakan berapa butir siap simpan dan berapa yang bermasalah. Tombol utama bertuliskan jumlah, misalnya "Simpan 24 butir soal". Selama masih ada baris bermasalah, tombol sekunder "Simpan 24 butir yang siap" memerlukan klik sadar, bukan jalan otomatis.
5. Aksi per baris pada daftar butir yang sudah tersimpan: "Sunting" dan "Gandakan". Sunting mengisi formulir dengan isi butir tersebut, judul kartu berubah menjadi "Sunting Butir Soal", nomor urut tidak berubah, dan tombol kembali ke "Simpan perubahan". Gandakan membuat salinan utuh di akhir daftar tanpa membuka formulir, lalu memunculkan umpan balik singkat bahwa salinan siap disunting.

## Format teks yang ditafsirkan

Aturan penafsiran harus pasti, sederhana, dan tertulis apa adanya pada panel petunjuk:

- Satu baris kosong memisahkan satu butir dari butir berikutnya.
- Baris yang diawali angka dan tanda titik memulai butir baru, misalnya `1.`. Angka itu hanya penanda pemisah; nomor urut tersimpan mengikuti urutan paket.
- Tanpa penanda tipe, butir dianggap Pilihan Ganda.
- Opsi jawaban ditulis `A. teks opsi`, `B. teks opsi`, dan seterusnya sampai `E.`.
- Kunci jawaban ditandai tanda bintang di akhir teks opsi: `B. Tiga*`. Pada PG kompleks, beberapa opsi boleh dibintangi.
- Penanda tipe ditulis setelah nomor: `(pg kompleks)`, `(benar/salah)`, `(essay)`.
- Pada soal benar/salah, kunci ditulis pada baris sendiri berisi `B` atau `S`.
- Pada soal essay, baris `rubrik: ...` setelah teks soal menjadi pedoman penilaian.
- Baris `poin: 3` menentukan bobot butir itu; bila tidak ditulis, bobot memakai nilai bawaan yang dapat diubah pengajar pada layar tempel.
- Blok `WACANA: ...` berlaku untuk butir-butir sesudahnya sampai blok wacana berikutnya atau akhir tempelan.

Teks Arab berharakat, tanda kutip ayat, dan hadits boleh muncul di mana saja dan harus tetap utuh.

## Format tempelan dari lembar kerja

Bentuk kedua ini dipakai bila pengajar menyusun naskahnya di Excel atau Google Sheets. Satu baris lembar kerja menjadi satu butir, dan kolom dipisahkan tanda tab hasil salinan:

| Kolom | Isi | Wajib |
| --- | --- | --- |
| soal | teks butir | ya |
| tipe | pg, pg kompleks, benar/salah, essay; kosong berarti pg | tidak |
| a, b, c, d, e | teks opsi jawaban | untuk butir pilihan |
| kunci | huruf kunci; beberapa dipisah koma untuk pg kompleks; `B` atau `S` untuk benar/salah | ya kecuali essay |
| poin | bobot butir | tidak |
| pembahasan | penjelasan untuk pengajar | tidak |
| berpikir | mengingat, memahami, mengaplikasikan, menganalisis | tidak |
| capaian | label rujukan capaian materi | tidak |
| wacana | teks stimulus yang berlaku untuk baris itu sampai baris berikutnya berubah | tidak |

- Baris judul boleh ada atau tidak; nama kolom dikenali tanpa peduli besar-kecil huruf, dan kolom yang tidak dikenal diabaikan dengan keterangan pada ringkasan pratinjau.
- Urutan kolom tidak harus sama dengan tabel di atas selama baris judul ikut ditempel; tanpa baris judul, urutan bawaan template yang dipakai.
- Kolom `wacana` dianggap berubah setiap kali isinya berbeda dari baris sebelumnya, sehingga satu wacana untuk sepuluh butir cukup disalin pada baris pertama.
- Baris kosong di antara data dilewati, bukan dianggap butir rusak.
- Tombol "Unduh template kolom" menghasilkan berkas tabel berisi baris judul di atas plus satu contoh butir lengkap, supaya pengajar dapat mengisi di lembar kerja lalu menempel hasilnya apa adanya.
- Kedua bentuk tempelan memakai layar pratinjau, tombol simpan berhitung, dan penyimpanan bertahap yang sama; tidak ada dua alur yang berbeda untuk dipelajari.

## Perilaku dan sumber data

- Penafsiran berjalan di perangkat pengajar sebelum ada panggilan ke server; pengajar dapat memperbaikinya dengan menyunting teks tempelan tanpa menyimpan apa pun.
- Penyimpanan menulis ke paket yang sedang dibuka dan hanya boleh dilakukan pemilik paket; penolakan disampaikan dengan kalimat yang bisa dipahami, bukan pesan teknis.
- Penyimpanan bertahap: bila sebagian berhasil dan sebagian gagal, layar menyatakan berapa butir yang sudah masuk dan daftar butir yang belum, agar pengajar tidak menulis ulang yang sudah tersimpan.
- Setelah simpan, daftar butir menampilkan hasil baru tanpa perlu memuat ulang halaman, dan kolom tempelan dikosongkan.
- Pembahasan, tingkat berpikir, dan rujukan capaian hanya terbaca di sisi pengajar; ketiganya tidak pernah ikut terkirim ke perangkat santri, baik sebelum maupun sesudah santri mengumpulkan.
- Tempelan tanpa baris judul dan tanpa satu pun kolom yang terbaca tidak membuka pratinjau; pesannya menyebut contoh kolom yang diharapkan dan menawarkan tombol unduh template.

## Keadaan kosong, muat, dan galat

- Kolom tempelan kosong: tombol periksa dinonaktifkan dan panel petunjuk tetap tampil.
- Tempelan tidak mengandung satu pun butir yang terbaca: pratinjau tidak dibuka; muncul pesan singkat yang mengajak memeriksa kembali penomoran dan baris opsi.
- Saat menyimpan, tombol utama memakai label proses dan aksi lain dinonaktifkan sementara.
- Paket tanpa butir sama sekali: daftar kosong menampilkan ajakan memakai mode tempel bagi pengajar yang sudah punya naskah, dan tetap satu ajakan utama saja.

## Responsif dan aksesibilitas

- Tablet dan ponsel: kolom tempelan melebar satu kolom, tabel pratinjau berganti kartu per butir dengan status dan alasan yang tetap terbaca.
- Status pratinjau tidak mengandalkan warna saja; tiap baris memuat label teks "siap" atau "perlu perbaikan" beserta alasannya.
- Navigasi keyboard pada tab, tombol periksa, dan aksi sunting/gandakan mengikuti pola tombol yang sudah dipakai di layar lain, dengan penanda fokus terlihat.
- Tidak ada kode spesifikasi teknis yang muncul pada teks antarmuka, termasuk pada panel petunjuk format.
