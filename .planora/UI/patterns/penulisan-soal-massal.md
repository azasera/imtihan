# Pola interaksi penulisan soal massal dan penataan daftar

Pola ini dipakai pada penulisan cepat butir soal dan pengelolaan mata pelajaran.

## Pola periksa dulu, simpan kemudian

1. Pengajar menempelkan naskah soal, lalu menekan "Periksa tulisan".
2. Sistem menafsirkan seluruh teks di perangkat pengajar dan menampilkan pratinjau; belum ada satu butir pun yang masuk ke basis data.
3. Pengajar membaca ringkasan, memperbaiki naskah bila perlu, lalu menekan tombol simpan yang menyebut jumlah butir.
4. Umpan balik akhir menyatakan berapa butir tersimpan dan membawa pengajar ke daftar yang sudah terisi.

Alasan: penulisan massal tanpa peninjauan berisiko menyimpan kunci jawaban yang salah tafsir, dan soal adalah data yang tidak boleh salah.

## Pola bentuk tempelan dikenali, bukan dipilih

Tempelan teks bernomor dan tempelan baris lembar kerja masuk lewat satu kolom dan satu tombol periksa. Sistem mengenali bentuknya dan menuliskan bentuk yang terbaca pada keterangan satu baris. Pengajar tidak diminta memilih mode lebih dulu, karena naskah yang campuran tetap harus menghasilkan pratinjau dengan alasan per baris, bukan penolakan seluruh isi.

Naskah yang disalin dari editor Markdown atau percakapan tidak diperlakukan sebagai bentuk ketiga. Garis miring yang menempel pada nomor ("1\.") dan garis miring di ujung baris (penanda baris baru paksa) dibaca sebagai sisa pemformatan dan dilepas sebelum penafsiran, sementara garis miring di tengah kalimat tetap menjadi isi soal. Tanpa kelonggaran ini satu dokumen bernomor dapat menyatu menjadi satu butir raksasa, dan pengajar tidak diberi tahu bahwa yang salah hanyalah gaya salin.

## Pola lembar kerja tetap jadi ruang kerja

Alur cepatnya adalah unduh template, isi di Excel atau Google Sheets, lalu tempel hasilnya. Tidak ada unggah berkas: berkas tidak pernah meninggalkan perangkat pengajar, penafsiran tetap berjalan di sisi pengajar, dan hasil yang sama persis dapat ditempel ulang bila penyimpanan terhenti di tengah.

## Pola pembahasan tidak ikut ke santri

Kolom pembahasan, tingkat berpikir, dan rujukan capaian hanya hidup di sisi pengajar. Panel pratinjau santri pada editor tidak pernah menampilkannya, dan lembar koreksi adalah satu-satunya tempat pembahasan dibaca kembali.

Aturan yang sama berlaku untuk isi yang menentukan nilai: penanda jawaban benar pada opsi pilihan ganda dan PG kompleks, label "(Kunci)" pada pasangan benar/salah, maupun pedoman rubrik soal uraian. Pratinjau santri menampilkan opsi dalam bentuk netral persis seperti yang diterima santri dari server, sehingga simulasi tidak pernah membocorkan kunci. Kebutuhan pengajar untuk memeriksa kunci dilayani oleh formular di kolom kiri, bukan oleh panel simulasi.

## Pola perbaikan sebagian yang sadar

Bila masih ada butir bermasalah, tombol utama meminta pengajar menyelesaikan dulu. Menyimpan hanya butir yang siap tersedia sebagai tombol sekunder yang harus ditekan secara sadar, dan jumlah yang tersimpan selalu disebut pada labelnya.

## Pola lanjut dari yang sudah masuk

Penyimpanan bertahap. Bila proses terhenti di tengah, laporan menyatakan berapa butir yang sudah masuk dan daftar sisanya, sehingga pengajar menempel ulang bagian yang belum masuk saja, bukan mengulang semuanya.

## Pola nonaktifkan, bukan hapus

Data yang masih dirujuk tidak dimusnahkan. Mata pelajaran yang dipakai paket soal hanya dapat dinonaktifkan: hilang dari pilihan baru, tetap terbaca pada paket dan sesi lama.

## Pola satu ajakan per layar

Satu layar hanya punya satu aksi utama. Pada editor soal, aksi utamanya adalah menyimpan butir atau menyimpan hasil impor. Tautan ke kelola mata pelajaran dan aksi sunting atau gandakan berwujud aksi sekunder agar tidak ada dua tombol yang bersaing untuk tujuan yang sama.
