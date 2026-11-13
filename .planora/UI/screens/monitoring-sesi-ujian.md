# Layar Monitoring Sesi Ujian

Spesifikasi layar pemantauan langsung untuk pengajar dan panitia. Memenuhi `SESI-FR-004` dan `SESI-FR-005`, dengan kriteria penerimaan `SESI-AC-004` dan `SESI-AC-005`. Sebagian kartu token dan aksi pada baris peserta diluaskan oleh revisi pelaksanaan sesi; bagian itu memakai `SESI-FR-006`, `SESI-FR-007`, `SESI-FR-010`, dan `SESI-AC-009` dan terperinci pada [spesifikasi pelaksanaan sesi](pelaksanaan-dan-penegakan-sesi.md).

## Tujuan

Pengawas yang mendampingi ujian di kelas perlu melihat, tanpa membuka halaman rekap nilai: santri mana yang sudah masuk, siapa yang masih mengerjakan, siapa yang sudah selesai, dan siapa yang tercatat keluar dari jendela ujian.

## Lokasi dan navigasi

- Entri baru pada sidebar pengajar: "Monitoring Sesi", diletakkan setelah "Sesi Ujian" dan sebelum "Rekap Nilai".
- Rute diusulkan `/monitoring-sesi`, berada di bawah kelompok halaman `(main)` yang dilindungi autentikasi pengajar.
- Tautan "Buka koreksi" pada baris peserta memakai rute koreksi yang sudah ada di `/rekap-nilai/koreksi/[id]`.

## Struktur layar

1. Header halaman berisi judul dan keterangan singkat kegunaan layar.
2. Pemilih sesi: daftar sesi milik pengajar yang sedang login, dengan sesi berstatus aktif sebagai pilihan awal.
3. Ringkasan hitung: jumlah peserta yang masuk, sedang mengerjakan, telah selesai, dan akumulasi pelanggaran tab pada sesi tersebut. Selama sesi belum ditautkan ke daftar kelas santri, baris "belum mulai" ditampilkan sebagai "belum terhitung" dan tidak dikarang angkanya.
4. Tabel peserta dengan kolom: Nama, Nomor induk, Kelas, Status, Waktu masuk, Waktu pengumpulan, Nilai, Status koreksi, Pelanggaran tab.
   - Status memakai badge berlabel teks: "Sedang mengerjakan" (amber), "Selesai" (hijau primary), dan "Terkunci" untuk sesi bermode kunci setelah ambang pelanggaran terlampaui.
   - Nilai hanya ditampilkan bila skor sudah terhitung; selain itu gunakan tanda hubung, bukan nol.
   - Badge jumlah pelanggaran tab hanya muncul bila lebih dari nol; nilai nol ditampilkan sebagai teks biasa.
5. Aksi per baris: tombol "Buka koreksi" aktif untuk peserta yang telah selesai, dinonaktifkan untuk peserta yang masih mengerjakan, dan digantikan tombol "Buka Kunci" sebagai aksi utama pada baris peserta yang terkunci.
6. Tautan "Analisis Butir" pada header menuju laporan mutu butir sesi ini; hanya tampil bila sesi sudah punya peserta yang nilainya lengkap.

## Perilaku dan sumber data

- Baris tabel bersumber dari daftar peserta sesi yang sedang dipilih, difilter berdasarkan kepemilikan sesi.
- Pemanggil tanpa login, atau sesi milik pengajar lain, hanya memperoleh daftar kosong; layar menampilkan keadaan kosong yang netral, bukan pesan galat teknis.
- Daftar bersifat langsung: santri yang masuk, mengumpulkan jawaban, atau menambah pelanggaran tab muncul tanpa pengajar memuat ulang halaman.
- Sisa waktu pengerjaan tiap peserta dihitung dari batas durasi sesi dan waktu masuk peserta, ditampilkan dalam format menit:detik dengan angka monospace mengikuti pola Timer Display.
- Saat sesi belum memiliki peserta, tampilkan keadaan kosong: "Belum ada santri yang masuk ke sesi ini." disertai token sesi agar pengawas dapat membagikan ulang.

## Responsif dan aksesibilitas

- Desktop dan laptop: tabel penuh. Tablet dan ponsel: kartu per peserta berisi nama, status, waktu masuk, dan badge pelanggaran.
- Badge status tidak boleh mengandalkan warna saja; label teks selalu ada agar terbaca oleh pembaca layar.
- Tabel harus dapat dinavigasi dengan keyboard, dan tombol "Buka koreksi" yang dinonaktifkan menjelaskan alasannya lewat tooltip atau teks pendamping.
- Tidak ada kode spesifikasi teknis yang muncul pada teks antarmuka.
