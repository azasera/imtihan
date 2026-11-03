# Non-functional requirements

## Performa
- NFR-PERF-001: Waktu muat halaman awal dan halaman soal ujian santri harus di bawah 1.5 detik pada koneksi internet standar (10 Mbps).
- NFR-PERF-002: Operasi penyimpanan jawaban otomatis (auto-save) harus tuntas dalam waktu kurang dari 300 ms tanpa memblokir interaksi pengguna.
- NFR-PERF-003: Sistem harus mampu menangani setidaknya 200 santri yang mengerjakan ujian secara simultan dalam satu jaringan lokal madrasah.

## Keamanan
- NFR-SEC-001: Kunci jawaban tidak boleh dikirimkan ke browser santri sebelum santri resmi mengumpulkan lembar ujian.
- NFR-SEC-002: Token ujian dienkripsi dan diverifikasi di sisi server untuk mencegah injeksi akses ilegal.
- NFR-SEC-003: Seluruh data transmisi wajib menggunakan protokol HTTPS terenkripsi.
- NFR-SEC-004: Sesi ujian, daftar peserta, monitoring, dan lembar koreksi hanya terlihat oleh pengajar yang memiliki sesi tersebut. Penanda identitas pengajar diambil dari sisi server, tidak pernah dari parameter yang dikirim browser.
- NFR-SEC-005: Gerbang masuk ujian santri tetap dapat diakses tanpa akun login (nomor induk + token sesi). Fungsi yang melayani gerbang santri adalah satu-satunya pengecualian aturan autentikasi wajib dan harus terdaftar secara eksplisit sebagai pengecualian tersebut.

## Keandalan & Ketahanan
- NFR-REL-001: Jika koneksi internet santri terputus sementara, browser tetap mempertahankan jawaban yang telah dipilih pada penyimpanan lokal perangkat.
- NFR-REL-002: Sesi ujian santri dapat dipulihkan kembali ke nomor soal terakhir tanpa kehilangan akumulasi jawaban sebelumnya.

## Kompatibilitas
- NFR-COMP-001: Antarmuka ujian santri harus kompatibel dengan browser desktop (Chrome, Edge, Firefox) dan browser gawai tablet/smartphone (Safari, Chrome Mobile).
