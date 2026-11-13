# Non-functional requirements

## Performa
- NFR-PERF-001: Waktu muat halaman awal dan halaman soal ujian santri harus di bawah 1.5 detik pada koneksi internet standar (10 Mbps).
- NFR-PERF-002: Operasi penyimpanan jawaban otomatis (auto-save) harus tuntas dalam waktu kurang dari 300 ms tanpa memblokir interaksi pengguna.
- NFR-PERF-003: Sistem harus mampu menangani setidaknya 200 santri yang mengerjakan ujian secara simultan dalam satu jaringan lokal madrasah.
- NFR-PERF-004: Impor massal butir soal harus tetap terpakai untuk satu paket besar sampai dua ratus butir dalam satu tempelan: penafsiran teks selesai ditampilkan tanpa membuat layar berhenti merespons, penyimpanan dilakukan bertahap, dan hasilnya dilaporkan per tahap sehingga kegagalan di tengah tidak meninggalkan daftar setengah jadi tanpa keterangan.
- NFR-PERF-005: Pemetaan tempelan lembar kerja dan unduhan template harus selesai seketika di perangkat pengajar sebelum ada panggilan ke server untuk tempelan sampai dua ratus baris, dan laporan analisis mutu butir untuk satu sesi dengan sampai dua ratus peserta harus tampil di bawah 3 detik tanpa memaksa pengajar menunggu perhitungan di layar.

## Keamanan
- NFR-SEC-001: Kunci jawaban tidak boleh dikirimkan ke browser santri sebelum santri resmi mengumpulkan lembar ujian.
- NFR-SEC-002: Token ujian dienkripsi dan diverifikasi di sisi server untuk mencegah injeksi akses ilegal.
- NFR-SEC-003: Seluruh data transmisi wajib menggunakan protokol HTTPS terenkripsi.
- NFR-SEC-004: Sesi ujian, daftar peserta, monitoring, dan lembar koreksi hanya terlihat oleh pengajar yang memiliki sesi tersebut. Penanda identitas pengajar diambil dari sisi server, tidak pernah dari parameter yang dikirim browser.
- NFR-SEC-005: Gerbang masuk ujian santri tetap dapat diakses tanpa akun login (nomor induk + token sesi). Fungsi yang melayani gerbang santri adalah satu-satunya pengecualian aturan autentikasi wajib dan harus terdaftar secara eksplisit sebagai pengecualian tersebut.
- NFR-SEC-006: Menambah, mengganti nama, menonaktifkan mata pelajaran, dan menulis butir soal hasil impor hanya dapat dilakukan oleh pengajar yang telah masuk, dan hanya untuk paket bank soal miliknya sendiri. Mata pelajaran adalah daftar bersama madrasah, sehingga perubahan namanya berlaku untuk semua pengajar sementara paket dan sesi lama tetap menampilkan label yang benar.

- NFR-SEC-007: Pembahasan butir, hasil analisis mutu butir, catatan pelanggaran, dan hubungan sesi sumber dengan sesi remedial atau susulan hanya terbaca oleh pengajar pemilik sesi dan admin. Perangkat santri tidak menerima kunci maupun pembahasan sebelum pengumpulan, dan tidak menerima data analisis sama sekali.
- NFR-SEC-008: Pergantian token sesi, perubahan mode penegakan integritas, dan pembukaan kembali lembar santri yang terkunci hanya dapat dilakukan pengajar pemilik sesi, tercatat waktunya, dan tidak dapat dipaksa lewat parameter yang dikirim browser.

## Keandalan & Ketahanan
- NFR-REL-001: Jika koneksi internet santri terputus sementara, browser tetap mempertahankan jawaban yang telah dipilih pada penyimpanan lokal perangkat.
- NFR-REL-002: Sesi ujian santri dapat dipulihkan kembali ke nomor soal terakhir tanpa kehilangan akumulasi jawaban sebelumnya.

## Kompatibilitas
- NFR-COMP-001: Antarmuka ujian santri harus kompatibel dengan browser desktop (Chrome, Edge, Firefox) dan browser gawai tablet/smartphone (Safari, Chrome Mobile).
