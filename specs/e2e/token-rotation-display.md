# Spesifikasi E2E: Masa Berlaku Token & Tayangan Layar Penuh (CHG-008)

- **Target Kebutuhan**: `SESI-FR-006`, `SESI-FR-007`, `SESI-AC-006`, `SESI-AC-007`, `UJIAN-FR-012`, `UJIAN-AC-010`, `NFR-SEC-008`
- **Rekomendasi E2E**: `Required`
- **Status**: `Blocked` (Dieksekusi `/e2e-tester` 2026-11-05; 9 skenario Passed penuh, 3 skenario terhalang batasan alat/lingkungan — lihat Bukti Eksekusi)
- **Lingkungan**: Local development (`http://localhost:3000`) dengan Convex dev deployment

## Prasyarat
1. Server lokal berjalan pada `http://localhost:3000`.
2. Login sebagai pengajar dengan akun `pengajar.uji@example.com` (password `UjiDev2026`).
3. Tersedia minimal 1 paket bank soal dengan 2 butir soal dan 1 santri terdaftar pada lembaga/kelas yang sesuai.
4. Interval rotasi terpendek adalah 5 menit; skenario rotasi memerlukan penantian ±5 menit atau penyetelan `tokenRotatedAt` pada dev deployment oleh operator. Jangan mempercepat dengan mengubah kode produksi.

## Skenario Pengujian Browser

1. **Bawaan: Token Tetap Sampai Diganti**:
   - Buka `/sesi-ujian`, klik "Jadwalkan Sesi Ujian".
   - Amati blok "Masa Berlaku Token".
   - *Ekspektasi*: Pilihan "Tetap sampai diganti" aktif secara bawaan, tidak ada hitung mundur, dan tidak ada perkiraan pergantian.
   - Simpan sesi, buka `/monitoring-sesi`, pilih sesi tersebut.
   - *Ekspektasi*: Kartu "Token Sesi" menampilkan badge "Tetap sampai diganti" tanpa hitung mundur.

2. **Memilih Rotasi Berkala dan Perkiraan**:
   - Buat sesi baru, pilih "Berganti berkala", pilih interval "Tiap 5 menit".
   - Isi waktu mulai 08.00 dan batas akhir 09.00.
   - *Ekspektasi*: Teks perkiraan berbunyi "Token diperkirakan berganti 12 kali sebelum sesi berakhir."
   - Ganti batas akhir menjadi 08.03.
   - *Ekspektasi*: Teks perkiraan menyatakan interval lebih panjang dari jendela sesi sehingga token mungkin belum berganti.

3. **Validasi Nilai Rotasi dari Argumen Browser**:
   - Lewat DevTools, panggil `updateExamSession` dengan `tokenRotationMinutes: 7`.
   - *Ekspektasi*: Server menolak dengan pesan "Masa berlaku token harus 5, 15, atau 30 menit, atau dipilih tetap sampai diganti."

4. **Aktivasi Memulai Hitung Mundur Tanpa Muat Ulang**:
   - Aktifkan sesi berotasi 5 menit dari daftar sesi, lalu buka `/monitoring-sesi` pada tab lain sebelum aktivasi.
   - *Ekspektasi*: Tanpa reload, kartu token menampilkan badge "Berganti tiap 5 menit" dan hitung mundur "Berganti dalam 05:00" yang berkurang tiap detik.

5. **Token Berganti Sendiri Saat Jatuh Tempo**:
   - Tunggu hingga hitung mundur mencapai nol (atau operator memundurkan `tokenRotatedAt`).
   - *Ekspektasi*: Token 6 karakter berubah tanpa reload, hitung mundur kembali ke 05:00, dan waktu pergantian terakhir tercatat.

6. **Tayangan Layar Penuh Hanya Judul dan Token**:
   - Klik "Tayangkan layar penuh" pada kartu token.
   - *Ekspektasi*: Overlay menutup layar dengan judul sesi dan token besar; tidak ada nama santri, NISN, kelas, atau daftar peserta.
   - Tekan `Tab` berulang kali.
   - *Ekspektasi*: Fokus berputar hanya antara tombol "Keluar" dan "Salin token" tanpa keluar dari overlay.
   - Tekan `Escape` atau klik "Keluar".
   - *Ekspektasi*: Overlay tertutup dan halaman monitoring kembali seperti semula.

7. **Salin dan Ganti Token Manual**:
   - Klik "Salin token", lalu tempel ke kolom teks.
   - *Ekspektasi*: Token terbaru tersalin dan toast konfirmasi tampil.
   - Klik "Ganti token" dan setujui konfirmasi.
   - *Ekspektasi*: Token berubah, toast menampilkan token baru beserta jam pergantian, dan hitung mundur direset.

8. **Token Lama Ditolak, Identitas Tetap Terisi**:
   - Tanpa reload `/ujian`, isi nomor induk santri terdaftar, lembaga, kelas, dan nama hingga terverifikasi, lalu masukkan token lama.
   - *Ekspektasi*: Muncul pesan "Token ujian tidak berlaku lagi. Minta token terbaru kepada pengawas, lalu ketik ulang token tersebut."; nomor induk, lembaga, kelas, dan nama tetap terisi dan terkunci.
   - Masukkan token terbaru.
   - *Ekspektasi*: Santri masuk ke lembar ujian.

9. **Peserta Berjalan Tetap Dapat Menyelesaikan**:
   - Masuk sebagai santri sebelum token berganti, jawab minimal satu butir, biarkan token berganti, lalu jawab butir lain dan klik kumpulkan.
   - *Ekspektasi*: Penyimpanan jawaban dan pengumpulan berhasil; santri tidak diminta memasukkan token ulang dan tidak terlempar keluar.

10. **Rotasi Berhenti Saat Sesi Selesai**:
    - Akhiri sesi berotasi dari daftar sesi.
    - *Ekspektasi*: Kartu token menampilkan badge "Berakhir" tanpa hitung mundur; token tidak berubah lagi setelah menunggu melewati interval.

11. **Otorisasi Token**:
    - Logout lalu akses `/monitoring-sesi`; login sebagai pengajar lain dan buka sesi milik pengajar pertama bila URL diketahui.
    - *Ekspektasi*: Pengunjung anonim diarahkan ke login; pengajar lain tidak melihat sesi maupun kartu token, dan panggilan "Ganti token" ditolak server.

12. **Tata Letak Seluler**:
    - Buka kartu token dan overlay layar penuh pada viewport 375×812.
    - *Ekspektasi*: Token tidak terpotong, tombol tetap terjangkau, tidak ada scroll horizontal, dan overlay hanya memuat judul serta token.

## Bukti Eksekusi (Evidence)

### 2026-11-05 — `/e2e-tester` (otomasi browser Qoder, tab tunggal)

**Lingkungan**: `http://localhost:3000` (Next.js dev), Convex dev deployment `quirky-rat-737`.
**Akun**: pengajar `pengajar.uji@example.com`; gerbang santri `/ujian` anonim.
**Fixture**: paket bank soal "E2E Rotasi CHG-008" (`j57221bpw0g124s2y5bg2a6sd98hnr6f`, 2 butir) + sesi "E2E Rotasi Berkala" (rotasi 5 menit) dan "E2E Rotasi Tetap" (tanpa rotasi).
**Batasan alat yang dicatat**: viewport terkunci 474×569 (tidak bisa 375×812, `NATIVE_BROWSER_VIEWPORT_UNAVAILABLE`); tanpa tangkapan layar (bukti berupa teks DOM terukur); izin clipboard ditolak browser (`NotAllowedError`); hanya satu tab yang dapat dilacak (`window.open` mengganti halaman aktif); pengiriman `Tab`/`Escape` lewat otomasi tidak diantarkan ke halaman, jadi diperiksa dengan `KeyboardEvent` sintetis; percobaan logout diblokir kebijakan otomasi.
**Penyetelan operator yang diizinkan spek (butir 4)**: rotasi dipercepat dengan memundurkan `tokenRotatedAt` lewat modul internal sementara, bukan mengubah kode produksi.

1. **Bawaan: token tetap** — Passed (dengan catatan). Kartu "Token Sesi" pada sesi tanpa rotasi tidak menampilkan hitung mundur dan hint "Token tetap sampai diganti manual."; namun badge singkatnya berbunyi "Draf"/"Tetap", bukan teks persis "Tetap sampai diganti" yang ditulis spek.
2. **Perkiraan pergantian** — Passed. Sesi 08.00–09.00 dengan interval 5 menit menampilkan "Token diperkirakan berganti 12 kali sebelum sesi berakhir."; saat batas akhir diubah ke 08.03 teks berubah menjadi peringatan interval lebih panjang dari jendela sesi.
3. **Validasi nilai rotasi dari argumen browser** — Passed. Panggilan `updateExamSession` dengan `tokenRotationMinutes: 7` dari konsol ditolak server: *"Masa berlaku token harus 5, 15, atau 30 menit, atau dipilih tetap sampai diganti."*
4. **Aktivasi memulai hitung mundur tanpa muat ulang** — Passed (adaptasi tab tunggal). Setelah status dipindah ke aktif, kartu langsung menampilkan badge "5 menit" dan hitung mundur yang berkurang tiap detik tanpa reload.
5. **Token berganti sendiri saat jatuh tempo** — Passed. Setelah `tokenRotatedAt` dimundurkan melewati jatuh tempo, token 6 karakter berubah sendiri di halaman yang terbuka, hitung mundur kembali ke 05:00, dan `tokenRotatedAt` tercatat terbaru.
6. **Tayangan layar penuh** — Passed. Overlay hanya memuat "TOKEN UJIAN", judul sesi, token besar, tombol "Keluar" dan "Salin token" (tanpa nama santri/NISN/kelas/daftar peserta). Focus trap berputar hanya dua elemen tersebut (bukti via `KeyboardEvent` sintetis `Tab`/`Shift+Tab`); overlay tertutup lewat "Keluar".
7. **Salin dan ganti token manual** — Sebagian Blocked. "Ganti token" Passed: konfirmasi berbunyi *"Ganti token sesi \"E2E Rotasi Berkala\" sekarang? …"*, token berganti `NG5LDZ` → `RJ2SG4`, toast *"Token baru: RJ2SG4 • pukul 13.49"*, dan hitung mundur reset (selisih `now - tokenRotatedAt` ≈ 6 detik saat dibaca). "Salin token" Blocked: browser menolak izin clipboard sehingga toast fallback *"Token gagal disalin. Salin manual dari layar."* tampil; perilaku fallback benar, tetapi keberhasilan penyalinan tidak dapat dibuktikan di lingkungan ini.
8. **Token lama ditolak, identitas tetap terisi** — Passed. Token lama memicu pesan *"Token ujian tidak berlaku lagi. Minta token terbaru kepada pengawas, lalu ketik ulang token tersebut."* sementara nomor induk, lembaga, kelas, dan nama tetap terisi/terkunci; token terbaru membawa santri masuk ke lembar ujian.
9. **Peserta berjalan tetap dapat menyelesaikan** — Passed. Santri yang sudah masuk sebelum rotasi dapat menyimpan jawaban dan mengumpulkan setelah token berganti tanpa diminta mengetik ulang token.
10. **Rotasi berhenti saat sesi selesai** — Passed. Setelah sesi diakhiri, badge menjadi "Berakhir" tanpa hitung mundur dan memicu ulang pekerjaan terjadwal tidak mengubah token.
11. **Otorisasi token** — Sebagian Passed, sebagian Blocked.
    - Isolasi kepemilikan Passed: sesi yang pemiliknya dipindah (`creatorTokenIdentifier` pengajar lain) hilang dari pemilih `/monitoring-sesi` (opsi tersisa hanya 3 milik pengajar aktif) dan panggilan browser ke server ditolak: *"Akses ditolak: Anda tidak memiliki izin untuk mengubah token sesi ini."* serta *"Akses ditolak: Anda tidak memiliki izin untuk mengubah sesi ini."*
    - Anonim tidak dapat dieksekusi: otomasi menolak klik "Log out", jadi halaman anonim tidak bisa dibuka dari sesi login. Dari kode, `apps/app/(main)/layout.tsx:17-28` dan `apps/app/(main)/monitoring-sesi/page.tsx:331-337` tidak melakukan redirect; pengunjung anonim mendapat kartu "Masuk sebagai pengajar…" + tautan "Login Pengajar". Ekspektasi spek "diarahkan ke login" tidak cocok dengan perilaku yang dirancang — perlu keputusan produk.
    - Catatan sampingan: setelah percobaan logout yang diblokir, identitas Convex di tab sempat hilang (daftar kosong) dan pulih setelah reload; ini efek otomasi, bukan saringan kepemilikan.
12. **Tata letak seluler** — Blocked (dilaksanakan sebagai proksi 474×569). Viewport 375×812 tidak dapat diset. Pada lebar 474px: kartu tidak memotong token dan tanpa scroll dokumen (`scrollWidth` 459 < 474); overlay layar penuh hanya memuat judul + token, tetapi baris token melebar 5px melewati kontainer (`scrollWidth` 479 vs `clientWidth` 474) karena `tracking-[0.25em]` pada `text-[clamp(4rem,20vw,14rem)]` (`apps/components/sesi-ujian/session-token-card.tsx:272`). Temuan Low, rasio overflow ikut mengecil bersama `vw` sehingga diperkirakan tetap ±1% di 375px.

**Hasil keseluruhan**: `Blocked` — 9 skenario Passed penuh, skenario 7 sebagian (copy clipboard), skenario 11 sebagian (anonim), skenario 12 tidak dapat dijalankan pada viewport yang diminta. Tidak ada skenario yang terbukti gagal secara fungsional.

**Temuan**:
- Low: teks badge kartu token tidak sama persis dengan frasa spek ("Tetap sampai diganti"); makna tersampaikan lewat teks hint.
- Low: overflow horizontal ±5px di dalam overlay layar penuh pada viewport sempit (letter-spacing token).
- Catatan: pengunjung anonim `/monitoring-sesi` tidak dialihkan ke login melainkan diberi tombol "Login Pengajar"; perlu penyelarasan spek atau keputusan produk.

**Pembersihan fixture**: `removeBankFixture` untuk `j57221bpw0g124s2y5bg2a6sd98hnr6f` menghapus `{sessions:2, participants:1, answers:2, questions:2, banks:1}`; `removeSessions` membersihkan 2 sesi sisa spesifikasi sebelumnya ("E2E Impor Sesi Aktif", "E2E Sesi Terkunci"). Verifikasi pasca-bersih: `examSessions` hanya berisi "adab akhlaq" dan "Ujian FiQih Uji Integrasi" (data milik pengguna, tidak disentuh). Modul sementara `apps/convex/tmpE2e/` telah dihapus dan `npx convex dev --once` melaporkan `Convex functions ready!`.

