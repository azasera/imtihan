# Spesifikasi E2E: Dashboard Rekapitulasi Nilai & Ekspor Laporan (TASK-008)

- **Target Kebutuhan**: `NILAI-FR-003`, `NILAI-FR-004`
- **Rekomendasi E2E**: `Recommended`
- **Status**: `Passed` (dijalankan 2026-11-05: 3/3 skenario terverifikasi, plus 2 kasus tambahan; bukti skenario 3 memakai simulasi media cetak karena tab otomatisasi tidak dapat menampilkan dialog cetak native)
- **Lingkungan**: Local development (`http://localhost:3000`) dengan Convex dev deployment

## Prasyarat
1. Server lokal aktif pada `http://localhost:3000`.
2. Pengguna login sebagai pengajar/admin.
3. Terdapat minimal 1 sesi ujian dengan santri yang telah menyelesaikan ujian.

## Skenario Pengujian Browser
1. **Membuka Halaman Rekap Nilai & Memilih Sesi**:
   - Buka menu "Rekap Nilai" di sidebar.
   - Pilih sesi ujian pada dropdown sesi.
   - *Ekspektasi*: Kartu statistik kelas muncul menampilkan Rata-rata Nilai, Nilai Tertinggi, Nilai Terendah, dan Persentase Tuntas KKM.

2. **Ekspor Data Nilai ke Format CSV**:
   - Klik tombol "Ekspor CSV".
   - *Ekspektasi*: Browser mengunduh file `.csv` dengan nama `Rekap-Nilai-...csv`, berisi data santri, skor PG, skor essay, total nilai, dan status KKM.

3. **Pratinjau Cetak Laporan Resmi**:
   - Klik tombol "Cetak Laporan".
   - *Ekspektasi*: Halaman memicu dialog cetak browser dengan kop resmi Pondok Pesantren At-Tauhid tanpa elemen sidebar dan tombol website.

## Bukti Eksekusi (Evidence)

### 2026-11-05 — eksekusi `/e2e-tester`

Lingkungan: `http://localhost:3000` (dev), Convex dev deployment `quirky-rat-737`, login `pengajar.uji@example.com` (`/api/auth/get-session` → 200, email terkonfirmasi).

Keterbatasan alat (berlaku untuk seluruh bukti di bawah): surface browser in-app berjalan pada tab yang permanen `visibilityState: "hidden"` dengan `window.innerWidth = 0`, tidak ada tangkapan layar, dan `window.print()` native tidak dapat ditampilkan/diobservasi. Karena itu bukti skenario 3 memakai (a) pemanggilan fungsi cetak yang di-stub dan (b) simulasi kaskade media cetak pada iframe selebar 794 px (A4 @96 dpi) yang menyuntik stylesheet aplikasi dengan `@media print` dipromosikan menjadi `@media all`. Nilai computed style pada skenario 1-2 dibaca langsung dari DOM halaman asli.

Fixture yang dibuat (milik `pengajar.uji`, dibersihkan setelah tes — lihat Pembersihan):

- Paket bank soal "E2E Rekap Ekspor" `j57917mm56z6cp7bgp48prtkvn8hnhvw` — FIQIH / SMPITA / Kelas 7, `totalPoints 100`, `passingScore 70`, 4 butir pilihan ganda 25 poin (kunci opsi `a`), id butir `j97a69rbnydbdcf3j2vwdn66pn8hm3wk`, `j97fgc5pjtxs4n01qn0r4b63ms8hmxg0`, `j97b2pwgr7czmds8pk2c5433n18hnbwm`, `j978xb5393ww130ssdgg5yxa9x8hnw40`.
- Sesi "E2E Rekap Ekspor" `jh75wma3b4bknptbhqegjw1ea58hmwb7`, token `CHG5MD`, status `active` (via `examSession/public/mutations:setSessionStatus`), durasi 60 menit, batas tuntas 70.
- Tiga santri mengumpulkan lembar jawaban lewat gerbang anonim (`enterExamSession` → `saveStudentAnswer` → `submitStudentExam`) dengan jumlah butir benar divariasikan agar statistik kelas teruji: `26.02.082` Achmad Syafiq Al Baraja 4/4 → total **100**, `26.02.072` Muhammad Dzaky Ibadurrahman 3/4 → **75**, `26.02.017` Raihan Pasya Pratama 2/4 → **50**. Ketiganya `status: submitted`, `gradingStatus: graded`.
- Catatan metode: pembuatan fixture memakai klien Convex yang diekstrak dari fiber React halaman (identitas pengajar untuk bank/sesi) karena mutasi publik ini mewajibkan identitas; gerbang santri memang tanpa identitas sehingga jalurnya representatif. Tidak ada kode produk yang diubah selama tes.

1. **Membuka Halaman Rekap Nilai & Memilih Sesi** — *Lolos.*
   - Aksi: buka `/rekap-nilai`, klik pemicu dropdown sesi, baca daftar opsi, pilih opsi.
   - Ekspektasi: kartu statistik menampilkan Rata-rata Nilai, Nilai Tertinggi, Nilai Terendah, dan Persentase Tuntas KKM.
   - Aktual: dropdown terbuka berisi satu opsi berlabel **"E2E Rekap Ekspor (FIQIH - Kelas 7)"** (label manusiawi, bukan `_id` — regresi perbaikan `BUG-001` tetap bertahan). Setelah dipilih, trigger menampilkan label yang sama dan kartu statistik membaca: `Rata-rata Kelas 75 / Dari 3 santri selesai`, `Nilai Tertinggi 100`, `Nilai Terendah 50`, `Ketuntasan KKM 66.7% / 2 santri tuntas KKM (70)`. Tabel "Daftar Nilai & Evaluasi Santri" menampilkan `3 Data Santri` dengan kolom Nilai PG / Nilai Essay / Total Nilai / Ketuntasan sesuai (Belum tuntas untuk 50, Tuntas untuk 75 dan 100).
   - Deviasi kecil: dengan hanya satu sesi milik pengajar ini, halaman sudah menampilkan sesi tersebut sebelum dropdown dibuka (perilaku derived-state yang diuji pada spec `derived-state-forms-and-timer`); pemilihan manual lewat dropdown tetap dilakukan dan hasilnya identik.
   - 0 error konsol (`console.error` dan `window.onerror` dibungkus, tidak ada entri).

2. **Ekspor Data Nilai ke Format CSV** — *Lolos.*
   - Aksi: memasang kail pada `URL.createObjectURL` dan `HTMLAnchorElement.prototype.click` (agar nama file dan isi Blob tertangkap tanpa navigasi), lalu mengklik **"Ekspor CSV"**.
   - Ekspektasi: berkas `.csv` bernama `Rekap-Nilai-...csv` berisi data santri, skor PG, skor essay, total nilai, dan status KKM.
   - Aktual: 1 Blob MIME `text/csv;charset=utf-8;` ukuran 446 byte, `download = "Rekap-Nilai-E2E-Rekap-Ekspor.csv"`, jangkar benar-benar ditempel ke `document.body` sebelum diklik. Tiga byte pertama `EF BB BF` (BOM UTF-8 ada; `Blob.text()` memang menghapus BOM saat dekode, sehingga dibuktikan lewat `arrayBuffer`). Isi: 1 baris header + 3 baris data, kolom `No, Nomor Induk / NISN, Nama Santri, Kelas, Status Ujian, Jenis Sesi, Pelanggaran Tab, Nilai Pilihan Ganda, Nilai Essay, Nilai Sebelum Pembatasan, Total Nilai Akhir, Batas Tuntas, Ketuntasan`; contoh baris `1,"26.02.017","Raihan Pasya Pratama","7A",Selesai,Reguler,0,50,0,50,50,70,Belum Tuntas`. Toast sonner: **"Rekap nilai santri berhasil diunduh dalam format CSV!"**

3. **Pratinjau Cetak Laporan Resmi** — *Lolos (bukti tidak native, lihat metode di atas).*
   - Aksi: mengganti `window.print` dengan stub penghitung, mengklik **"Cetak Laporan"**, lalu membaca hasil simulasi media cetak pada iframe 794 px.
   - Ekspektasi: halaman memicu dialog cetak dengan kop resmi Pondok Pesantren At-Tauhid tanpa elemen sidebar dan tombol website.
   - Aktual: `window.print()` dipanggil tepat **1 kali** (tombol tidak `disabled` saat ada data). Blok kop `hidden print:block` yang pada layar biasa berhitung `display: none` berubah menjadi **`display: block`** dengan teks "Pondok Pesantren At-Tauhid / Laporan Rekapitulasi Hasil Evaluasi Ujian Santri / Mata Pelajaran: FIQIH • Kelas: Kelas 7 • Sesi: E2E Rekap Ekspor". `<header>` situs menjadi **`display: none`**, blok judul halaman + tombol web (memakai `print:hidden`) menjadi **`display: none`** sehingga "Cetak Laporan" dan "Ekspor CSV" tidak ikut tercetak (`Ekspor CSV` terselubung oleh ancestor `DIV.print:hidden`), teks "Toggle Sidebar" hilang dari `body.innerText` hasil simulasi, dan isi laporan tetap tercetak: 4 kartu statistik + tabel 3 baris santri (`table` → `display: table`), kolom `Aksi` `display: none` sementara kolom nilai tetap tampil.
   - Bukti struktural pelengkap untuk sidebar: `apps/components/site-header.tsx:12,40` dan `apps/components/ui/sidebar.tsx:225,245,268` memakai `print:hidden` (dijaga regression test `apps/tests/print-chrome.test.ts`). Pada lebar 0 px aplikasi merender varian ponsel sehingga kontainer sidebar desktop tidak ada di DOM, sehingga verifikasinya lewat sumber + regresi, bukan lewat render langsung.
   - CSS satu-satunya yang melayani halaman ini adalah `/_next/static/chunks/[root-of-the-server]__1uko1nx._.css` (234.162 byte, tanpa `@import`) dengan satu blok `@media print` berisi `.print\:block{display:block}`, `.print\:hidden{display:none}`, `.print\:max-w-none` — kaskadenya yang diuji pada simulasi.

### Kasus tambahan (di luar daftar spek)

- **Ekspor mengikuti filter pencarian**: mengetik "Raihan" pada kolom "Cari nama santri atau NISN..." memperkecil tabel menjadi 1 baris dan CSV yang terunduh juga hanya 1 baris data (`filteredParticipants` dipakai ekspor) — perilaku konsisten, bukan bug.
- **Filter tanpa hasil**: mengetik `zzz-tidak-ada` membuat `tbody` kosong tanpa pesan keadaan-kosong, tombol "Ekspor CSV" tetap aktif, dan ekspor menghasilkan CSV header-saja tetap dengan toast sukses **"Rekap nilai santri berhasil diunduh dalam format CSV!"**. Penjaga di `apps/app/(main)/rekap-nilai/page.tsx:141` hanya memeriksa `participants.length === 0`, bukan hasil terfilter.
- Tidak ada kebocoran kode spesifikasi (`SCR-*`, `*-FR-*`, `TASK-*`, `CHG-*`, `Fase NN`) pada teks halaman, dan tidak ada `_id` Convex yang muncul sebagai teks (`/j[0-9a-z]{20,}/` tidak cocok).

### Temuan

- **R-1 (Low–Medium)** ekspor CSV saat hasil terfilter kosong tetap menyebut "berhasil" dan menghasilkan berkas tanpa baris data; tabel juga tidak menampilkan pesan keadaan-kosong untuk filter tanpa cocok. Saran: validasi `filteredParticipants.length === 0` (toast peringatan "Tidak ada santri yang cocok dengan pencarian.") dan baris empty-state di tabel.
- **R-2 (Low)** kolom "Status Koreksi" ikut tercetak sedangkan kolom "Aksi" disembunyikan; konsisten, tetapi pada laporan resmi teks "Selesai Dinilai" di kolom terakhir bisa membingungkan bila Kop laporan tidak menyebut batas tuntas. Tidak ada perilaku yang salah — catatan polish.
- **R-3 (Informasi)** bukti cetak tidak native (keterbatasan alat di atas). Dialog cetak dan hasil PDF riil masih belum teramati oleh manusia; `/e2e-tester` lain dengan browser yang terlihat perlu mengonfirmasi skenario 3 secara visual. Skenario 1 dan 2 tidak terpengaruh.

### Media Evidence

- Tidak ada tangkapan layar/rekaman: surface browser in-app berstatus `hidden` dengan viewport 0 px dan tidak menyediakan tangkapan layar. Bukti terkuat yang dipakai: teks DOM halaman asli, nilai `getComputedStyle` pada iframe simulasi media cetak, isi Blob CSV (byte array), toast `[data-sonner-toast]`, dan kueri `npx convex data` (`examParticipants`, `studentAnswers`, `questionBanks`, `questions`).

### Pembersihan data uji

Dijalankan 2026-11-05, tanpa modul sementara yang tersisa.

- `deleteExamSession` (`apps/convex/examSession/public/mutations.ts:408-428`) tidak men-cascade peserta/jawaban, jadi dipakai mutasi internal sementara `convex/tmpE2e/cleanup.ts` yang menelusuri `examParticipants.by_session` → `studentAnswers.by_participant` → sesi, lalu `questions.by_bank` → bank.
- Perintah: `npx convex dev --once` → `npx convex run tmpE2e/cleanup:cleanup '{"bankId":"j57917mm56z6cp7bgp48prtkvn8hnhvw","sessionIds":["jh75wma3b4bknptbhqegjw1ea58hmwb7"]}'`
- Hasil fungsi: `{ sessions: 1, participants: 3, answers: 12, questions: 4 }`.
- Verifikasi `npx convex data` kembali ke garis dasar sebelum tes: `examSessions=2`, `examParticipants=2`, `studentAnswers=1`, `questionBanks=3`, `questions=6`; pencarian id sesi fixture (`jh75wma3b4bknptbhqegjw1ea58hmwb7`) dan judul "E2E Rekap Ekspor" sama-sama **0 cocok**.
- `apps/convex/tmpE2e/` dihapus (`rm -rf`) dan push ulang menghasilkan `✔ 00:08:18 Convex functions ready! (7.8s)`.

## Hasil

- Overall: **Passed** — 3/3 skenario spek terverifikasi (skenario 3 dengan bukti tidak native, didokumentasikan sebagai R-3), 0 error konsol, fixture dibersihkan.
