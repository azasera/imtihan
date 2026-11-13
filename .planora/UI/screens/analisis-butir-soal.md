# Spesifikasi layar — Analisis mutu butir soal

Cakupan kebutuhan: `NILAI-FR-007`, `NILAI-FR-008`, `NILAI-FR-009`, `NILAI-AC-006`, `NILAI-AC-007`, `NILAI-AC-008`, `NILAI-AC-009`, `NILAI-AC-010`, `NILAI-AC-011`, `NFR-PERF-005`, `NFR-SEC-007`.

## Rute dan jalan masuk

- Rute: `/rekap-nilai/analisis/[idSesi]`, satu layar untuk satu sesi ujian milik pengajar yang sedang login.
- Jalan masuk: tautan "Analisis Butir" pada header layar rekap nilai dan pada kartu ringkasan layar monitoring sesi. Tidak ada entri baru pada menu samping.
- Sesi yang nilainya belum lengkap (masih ada essay menunggu koreksi) tetap dapat dibuka; layar menyatakan berapa peserta belum ternilai dan bagian mana yang dihitung dari peserta yang sudah ternilai saja.

## Struktur layar

1. Header: judul sesi, jenis sesi (reguler, remedial, atau susulan) beserta sesi sumbernya bila ada, mata pelajaran dan tingkat, jumlah peserta dinilai, serta batas tuntas sesi bila diisi.
2. Baris ringkasan kelas: rata-rata nilai, nilai tertinggi dan terendah, jumlah dan persentase peserta tuntas. Angka tanpa ikon dekoratif; pakai label teks kecil.
3. Tabel mutu butir, satu baris per nomor soal: nomor, tipe, bobot, daya serap dalam persen, tingkat kesukaran (mudah, sedang, sulit), daya beda, sebaran pilihan opsi, dan status.
   - Sebaran pilihan ditampilkan sebagai deretan chip berlabel huruf opsi dengan angka pemilih; opsi kunci ditandai label "kunci", bukan hanya warna hijau.
   - Status memakai label teks "perlu ditinjau" atau "baik". Baris bertanda menampilkan alasannya pada sel berikutnya: "daya serap rendah", "daya pembeda negatif", "pengecoh tidak dipilih siapa pun", atau "daya pembeda tidak terdefinisi".
4. Blok "Capaian menurut tingkat berpikir" dan blok "Capaian menurut rujukan capaian materi": tabel dua kolom (pengelompok, jumlah butir, daya serap rata-rata). Blok hanya muncul bila ada butir bertanda; bila tidak, satu baris netral mengajak menandai lewat penulisan cepat butir, tanpa pesan galat.
5. Blok remedial dan pengayaan: dua daftar pendek. Tiap nama santri menyebut nomor butir yang banyak salah, dan tiap nomor dapat diklik menuju lembar koreksi butir tersebut pada sesi yang sama.
6. Aksi pada header: "Unduh tabel" dan "Cetak". Satu aksi utama per tampilan; unduhan memakai format tabel yang sama dengan ekspor rekap nilai yang sudah ada.

## Perilaku dan sumber data

- Daya serap, tingkat kesukaran, daya beda, dan sebaran pilihan dihitung di server dari lembar jawaban dan kunci tersimpan; layar tidak pernah menerima kunci untuk kebutuhan lain.
- Angka hanya terbaca oleh pengajar pemilik sesi dan admin. Sesi milik pengajar lain, dan permintaan tanpa login, menghasilkan keadaan kosong.
- Ambang minimal peserta dinilai berlaku sebelum metrik tampil. Di bawah ambang, bagian tabel butir diganti keterangan "Data belum cukup" disertai jumlah peserta yang sudah dinilai — bukan tabel berisi nol.
- Butir essay tidak memiliki sebaran pengecoh; kolom sebaran pada baris itu berisi tanda hubung dan statusnya tetap terhitung dari daya serap.
- Nilai sesi berjenis remedial memperlihatkan angka sebelum dan sesudah pembatas batas tuntas pada baris rekap, sehingga pengajar tidak menebak angka mana yang dipakai laporan.

## Keadaan kosong, muat, dan galat

- Sesi tanpa peserta: satu baris netral "Belum ada peserta pada sesi ini." tanpa ikon peringatan.
- Perhitungan sedang berjalan: baris skeleton pada tabel butir; tombol unduh dinonaktifkan dengan label proses.
- Sesi dengan seluruh jawaban benar atau seluruh jawaban salah pada suatu butir: tidak memicu pembagian nol; baris itu bertanda "perlu ditinjau" dengan alasan daya pembeda tidak terdefinisi.

## Responsif dan aksesibilitas

- Di bawah 900 px, tabel mutu butir berganti kartu per butir dengan nomor soal sebagai judul kartu dan metrik berbaris dua kolom; blok capaian menumpuk penuh lebar.
- Semua metrik punya label teks; warna amber dan destruktif hanya menambah bobot, tidak pernah satu-satunya penanda.
- Aksi "Cetak" menghasilkan dokumen hitam-putih yang tetap terbaca: status memakai teks, chip sebaran memakai angka.
- Tidak ada kode spesifikasi teknis yang muncul pada teks antarmuka, termasuk pada keterangan ambang dan alasan status.
