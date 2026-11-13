# Spesifikasi layar — Kelola Mata Pelajaran dan jenjang

Cakupan kebutuhan: `BANK-FR-010`, `BANK-FR-011`, `BANK-AC-012`, `BANK-AC-013`.

## Lokasi dan cara masuk

- Rute baru `/mata-pelajaran` di bawah kelompok halaman `(main)` yang memerlukan login pengajar.
- Pintu masuk berupa tautan sekunder "Kelola Mata Pelajaran" pada header halaman daftar bank soal, bukan entri menu baru di sidebar. Penambahan entri sidebar dibatasi sampai layar yang benar-benar menjadi alur utama.

## Struktur layar

1. Header halaman: judul dan satu kalimat kegunaan, misalnya bahwa daftar ini dipakai bersama oleh seluruh pengajar madrasah.
2. Kartu tambah mata pelajaran: nama, kode singkat, dan deskripsi opsional. Kode dipakai sebagai pengenal pada paket, jadi huruf besar dan tidak berubah setelah dipakai.
3. Daftar mata pelajaran dalam tabel: nama, kode, deskripsi, berapa paket yang memakai, dan status. Pada layar kecil berubah menjadi kartu per baris.
4. Aksi per baris: "Ganti nama", "Nonaktifkan" atau "Aktifkan kembali", dan "Hapus" yang hanya aktif bila tidak ada satu pun paket yang memakainya.

## Perilaku dan sumber data

- Hanya pengajar yang sudah masuk yang dapat mengubah daftar; perubahan berlaku untuk semua pengajar karena mata pelajaran adalah daftar bersama madrasah.
- Mata pelajaran yang masih dipakai paket tidak bisa dihapus permanen. Menonaktifkannya menghapus pilihan itu dari form pembuatan paket baru, tetapi paket dan sesi lama tetap menampilkan namanya.
- Nama yang diganti langsung tercermin pada daftar paket dan filter mata pelajaran.
- Sistem menolak kode yang sudah dipakai dan menjelaskan bahwa kode tersebut sudah ada, bukan menampilkan galat teknis.

## Jenjang pada pembuatan paket

- Pilihan "Tingkat / Kelas" pada form paket bank soal tidak lagi berupa teks bebas atau daftar karangan sendiri, melainkan mengikuti jenjang lembaga resmi yang sama dengan data santri:
  - SMPITA: kelas 7, 8, 9.
  - SMAITA: kelas 10, 11, 12.
  - MTA: tingkatan 1 sampai 6.
- Pengajar memilih lembaga lebih dulu, lalu pilihan tingkat menyesuaikan isi lembaga tersebut; mengganti lembaga mengosongkan tingkat yang sudah dipilih.
- Tingkat yang tersimpan memakai label yang sama dengan yang dibaca pada data santri, sehingga suatu saat sesi dapat ditautkan ke daftar kelas tanpa perlu menerjemahkan dua kosakata berbeda.

## Keadaan kosong, muat, dan galat

- Daftar kosong: tampilkan kalimat netral bahwa belum ada mata pelajaran, disertai ajakan menambahkan, bukan tabel kosong bergalat.
- Selama daftar dimuat, baris daftar menampilkan penanda proses yang tenang tanpa angka nol yang menyesatkan.
- Kegagalan menyimpan muncul sebagai umpan balik singkat dan formulir tetap berisi apa yang sudah diketik.

## Responsif dan aksesibilitas

- Baris daftar memakai label teks untuk status, bukan warna saja.
- Seluruh aksi dapat dijangkau keyboard dengan penanda fokus terlihat, dan kolom isian diberi label yang jelas.
- Tidak ada kode spesifikasi teknis yang muncul pada teks antarmuka.
