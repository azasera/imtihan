# Spesifikasi layar — Pelaksanaan sesi: token, penegakan, dan sesi lanjutan

Cakupan kebutuhan: `SESI-FR-006`, `SESI-FR-007`, `SESI-FR-008`, `SESI-FR-009`, `SESI-FR-010`, `SESI-AC-006`, `SESI-AC-007`, `SESI-AC-008`, `SESI-AC-009`, `UJIAN-FR-010`, `UJIAN-FR-011`, `UJIAN-FR-012`, `UJIAN-AC-008`, `UJIAN-AC-009`, `UJIAN-AC-010`, `NFR-SEC-008`.

Layar ini bukan rute baru. Pengaturan hidup pada formulir jadwal sesi yang sudah ada (`/sesi-ujian`), pengawasan hidup pada layar monitoring (`/monitoring-sesi`), dan dua keadaan baru pada ruang ujian santri.

## 1. Pengaturan pada formulir jadwal sesi

Tiga kelompok baru di bawah pengaturan durasi dan pengacakan yang sudah ada:

- **Batas nilai tuntas** — satu isian angka opsional dengan keterangan singkat bahwa angka ini dipakai menandai tuntas atau belum pada rekap dan analisis. Kosong berarti tidak ada penanda.
- **Penegakan integritas** — dua pilihan berbentuk segmen: "Catat saja" (bawaan) dan "Kunci setelah beberapa kali pindah tab", dengan isian ambang jumlah hanya aktif pada pilihan kedua. Keterangan di bawahnya menyatakan bahwa lembar yang terkunci hanya dapat dibuka pengajar dari layar monitoring.
- **Masa berlaku token** — segmen "Tetap sampai diganti" (bawaan) dan "Berganti berkala" dengan pilihan 5, 15, atau 30 menit. Saat "Berganti berkala" dipilih, formulir menampilkan perkiraan berapa kali token berganti sampai sesi berakhir, agar pengajar tidak memilih interval yang lebih panjang dari durasi ujian.

## 2. Kartu token pada layar monitoring

- Kartu token yang hari ini menampilkan token 6 karakter ditambah: tombol "Salin", tombol "Tayangkan layar penuh", dan — hanya bila rotasi aktif — keterangan "Berganti dalam 07:12" yang berjalan mundur tanpa memuat ulang halaman.
- Mode tayang layar penuh menutup seluruh area kerja dengan token berukuran sangat besar, judul sesi, dan tombol keluar. Tidak ada data santri pada mode ini, sehingga aman ditampilkan ke proyektor kelas.
- Tombol "Ganti token sekarang" tetap tersedia dan bekerja sama pada mode rotasi maupun token tetap; setiap pergantian memberi umpan balik singkat berisi token baru dan waktunya.
- Token yang tampil di layar pengajar tidak pernah dikirim ke perangkat santri selain sebagai isian yang mereka ketik sendiri.

## 3. Peserta terkunci pada daftar monitoring

- Baris peserta memakai label teks "Terkunci" (bukan hanya warna) begitu lembar santri dikunci oleh mode penegakan, dan badge pelanggaran tetap menghitung.
- Aksi pada baris tersebut berubah dari "Buka Koreksi" menjadi "Buka Kunci" sebagai aksi utama, dengan konfirmasi singkat yang menyebut nama santri dan jumlah jawabannya yang tersimpan.
- Setelah dibuka, baris kembali ke label "Sedang mengerjakan", dan peristiwa pembukaan tercatat waktunya pada detail peserta.
- Peserta yang sudah mengumpulkan tidak dapat dalam keadaan terkunci; statusnya tetap "Selesai".

## 4. Membuat sesi lanjutan (remedial atau susulan)

- Aksi "Buat Remedial / Susulan" tersedia pada kartu sesi yang sudah selesai di daftar sesi dan pada header layar monitoring.
- Formulirnya ringkas: jenis sesi (remedial atau susulan), judul yang terisi otomatis dari sesi sumber, dan daftar peserta yang memuat nama kelas santri yang pernah masuk sesi sumber dengan kotak centang kosong semua — tidak ada penyalinan peserta otomatis.
- Ringkasan pengaturan yang ikut tersalin ditampilkan dalam satu blok teks pendek: bank soal, durasi, pengacakan, batas tuntas, dan mode penegakan; masing-masing masih dapat diubah sebelum disimpan.
- Pada jenis remedial, sakelar "Nilai maksimal dibatasi sampai batas tuntas" aktif sebagai bawaan dan dapat dimatikan; pada susulan sakelar itu tidak ditampilkan.
- Sesi lanjutan tampil di daftar sesi dengan label jenisnya, dan nama sesi sumbernya hanya terbaca oleh pemilik.

## 5. Keadaan baru pada sisi santri

- **Token tidak berlaku lagi** — pada gerbang ujian, penolakan token yang sudah berganti menampilkan pesan singkat bahwa token terbaru perlu diminta ke pengawas. Nomor induk, lembaga, kelas, dan nama terverifikasi tetap terisi; santri cukup mengetik ulang token. Tidak ada pesan teknis dan tidak ada nomor sesi.
- **Lembar terkunci** — layar pengerjaan berganti ke panel terkunci yang memperlihatkan nama sesi, sisa waktu yang terus berjalan, dan jumlah jawaban tersimpan, dengan keterangan bahwa pengajar sedang dihubungi. Semua pilihan jawaban dinonaktifkan, klik kanan dan salin tetap diblokir, dan jawaban tersimpan tidak hilang ketika panel dibuka kembali.
- **Sisa waktu tetap berjalan saat terkunci** — pengumpulan otomatis saat waktu habis tetap berlaku atas jawaban terakhir yang tersimpan, dan santri menerima layar penutup seperti biasa.

## Keadaan kosong, muat, dan galat

- Sesi berstatus draft belum menampilkan kartu token hidup; yang tampil adalah token yang dapat disalin menjelang sesi dimulai, tanpa keterangan hitung mundur.
- Rotasi token berhenti sendiri ketika sesi mencapai status selesai, dan tidak pernah memicu pergantian baru.
- Kegagalan menyimpan pengaturan sesi mempertahankan isian formulir dan menyampaikan alasan dengan kalimat yang bisa dipahami.

## Responsif dan aksesibilitas

- Mode tayang layar penuh memakai ukuran token yang menyesuaikan lebar layar, minimal tetap terbaca dari jarak beberapa meter pada proyektor maupun gawai.
- Pada gawai, kelompok pengaturan sesi menumpuk satu kolom dan segmen pilihan berubah menjadi baris geser dengan penanda opsi aktif yang juga berupa label teks.
- Panel terkunci pada santri tidak mengandalkan warna merah saja: judul panel, ikon gembok, dan kalimat penyebabnya selalu tampil.
- Tidak ada kode spesifikasi teknis, nomor sesi, maupun istilah internal yang muncul pada teks antarmuka di keempat permukaan ini.
