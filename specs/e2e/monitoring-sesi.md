# Spesifikasi E2E: Layar Monitoring Sesi Ujian (CHG-001)

- **Target Kebutuhan**: `SESI-FR-004`, `SESI-FR-005`, `SESI-AC-004`, `SESI-AC-005`, `NFR-SEC-004`
- **Rekomendasi E2E**: `Recommended`
- **Status**: `Passed` (Dieksekusi `/e2e-tester` 2026-11-05; 9/9 skenario terpenuhi, dengan substitusi viewport dan catatan pada skenario 9 dan 7)
- **Lingkungan**: Local development (`http://localhost:3000`) dengan Convex dev deployment

## Prasyarat
1. Server lokal berjalan pada `http://localhost:3000` (`npm run dev` dari folder `apps/`).
2. Browser A login sebagai pengajar uji coba `pengajar.uji@example.com` melalui halaman login biasa.
   - Catatan: token sesi bawaan hasil seed (`HH4XC2`) dibuat oleh identitas CLI, bukan akun ini, jadi pengujian memakai sesi yang dibuat sendiri oleh akun pengajar uji coba.
3. Browser A: buat satu sesi di `/sesi-ujian` (pilih paket soal, durasi pendek 5 menit agar skenario habis waktu mudah diamati), lalu klik **Aktifkan**. Salin token 6 digit sesi tersebut.
4. Browser B ( janela/incognito tanpa login pengajar) dipakai sebagai santri di `/ujian` dengan NISN santri hasil sinkronisasi SiPAKSa, nama, dan token dari langkah 3.

## Skenario Pengujian Browser
1. **Entri menu dan tujuan layar**:
   - Di Browser A, periksa sidebar lalu klik "Monitoring Sesi".
   - *Ekspektasi*: entri berada setelah "Sesi Ujian" dan sebelum "Rekap Nilai"; rute `/monitoring-sesi` terbuka dengan judul "Monitoring Sesi Ujian"; entri menu lama (`/`, `/bank-soal`, `/sesi-ujian`, `/rekap-nilai`, `/santri`) tetap ada dan tetap berfungsi.

2. **Pemilih sesi dan meta sesi**:
   - Lihat dropdown "Pilih sesi ujian" beserta keterangan di sampingnya.
   - *Ekspektasi*: sesi berstatus aktif menjadi pilihan awal; token, durasi per santri, dan jumlah soal/poin sesi tampil; tidak ada kode spesifikasi teknis pada teks antarmuka.

3. **Keadaan kosong sebelum ada peserta**:
   - Buat sesi aktif kedua yang belum dipakai santri, lalu pilih dari dropdown.
   - *Ekspektasi*: muncul "Belum ada santri yang masuk ke sesi ini." disertai token sesi; kartu ringkasan menampilkan angka nol, bukan angka karangan, dan baris "Belum masuk" bertuliskan "Belum terhitung".

4. **Santri masuk terpantau tanpa muat ulang**:
   - Di Browser B, masuk sebagai santri dan mulai ujian. Tetap di Browser A tanpa menekan refresh.
   - *Ekspektasi*: baris santri muncul otomatis; badge "Sedang Mengerjakan"; kolom Masuk terisi jam; "Sisa Waktu" berkurang tiap detik dalam format `mm:ss` angka monospace; kartu "Sudah Masuk" dan "Sedang Mengerjakan" naik menjadi 1.

5. **Pelanggaran tab terlihat langsung**:
   - Di Browser B, pindah tab atau jendela minimal tiga kali lalu kembali ke ruang ujian.
   - *Ekspektasi*: kolom "Pelanggaran Tab" naik tanpa muat ulang; 1–2 kali tampil badge amber "Nx Waspada", 3 kali atau lebih tampil badge destruktif "Nx Pelanggaran"; kartu "Pelanggaran Tab" ikut bertambah.

6. **Pengumpulan jawaban dan tautan koreksi**:
   - Di Browser B, kumpulkan seluruh jawaban. Di Browser A, amati baris yang sama.
   - *Ekspektasi*: status berubah "Selesai", kolom Selesai terisi jam, Nilai PG tampil (tanda hubung bila belum terhitung), kolom Koreksi menampilkan badge status penilaian, dan tombol "Buka Koreksi" muncul; klik tombol tersebut membuka `/rekap-nilai/koreksi/<id peserta>` milik santri yang sama.

7. **Batas waktu selesai**:
   - Biarkan satu santri yang masih mengerjakan melewati durasi sesi (durasi 5 menit dari prasyarat).
   - *Ekspektasi*: "Sisa Waktu" berhenti di "Waktu habis" dengan warna destruktif, bukan angka negatif.

8. **Isolasi data antar pengajar dan pengunjung tanpa login**:
   - Buka `/monitoring-sesi` di Browser C yang login sebagai pengajar lain (atau tanpa login sama sekali).
   - *Ekspektasi*: daftar peserta kosong dengan keadaan kosong netral, tidak ada nama, NISN, kelas, waktu, nilai, atau token sesi milik pengajar lain; bagi pengunjung tanpa login muncul kartu "Masuk sebagai pengajar…" dengan satu tombol "Login Pengajar".

9. **Tata letak layar kecil**:
   - Di Browser A, kecilkan jendela ke 390×844 pada sesi yang sudah punya peserta.
   - *Ekspektasi*: tabel berganti kartu per peserta (nama, nomor induk, kelas, status, masuk, sisa waktu, badge pelanggaran, nilai, status koreksi, tombol "Buka Koreksi"); tidak ada gulir horizontal pada halaman dan tidak ada teks terpotong.

## Bukti Eksekusi (Evidence)

### 2026-11-05 — `/e2e-tester` (otomasi browser Qoder, satu tab)

**Lingkungan**: `http://localhost:3000` (Next.js dev) + Convex dev deployment `quirky-rat-737`.
**Akun**: pengajar `pengajar.uji@example.com`; pengajar pembanding dibuat sementara `pengajar.dua@example.com`; pengunjung anonim = keadaan tanpa sesi.
**Fixture**: paket "E2E Monitoring CHG001" (`j575rrcbhtnmwga6r5n4sbnsfd8hny9a`, mapel Fiqih Ibadah, SMAITA Kelas 10, 2 butir PG hasil tempelan) + dua sesi aktif "E2E Monitoring Aktif" (token `VL6R8V`) dan "E2E Monitoring Kosong" (token `G6QET7`), durasi santri 5 menit, penegakan "Catat saja".
**Santri uji** (data SiPAKSa hasil sinkron): `0119755229` Nizam Fahrizi, `101884277` Muhammad Al Fathih, `0111713829` Zamzami — semuanya 10A/SMAITA.
**Batasan alat**: viewport terkunci 474×569 sehingga 390×844 tidak dapat diset (dipakai sebagai proksi layar kecil); tanpa tangkapan layar, bukti berupa teks/DOM terukur; hanya satu tab, jadi "Browser B" diwujudkan sebagai iframe `/ujian` di halaman monitoring (tetap satu tab, tetapi halaman monitoring tidak pernah dimuat ulang) dan "Browser C" diwujudkan dengan keluar sesi lalu masuk sebagai pengajar kedua.

1. **Entri menu dan tujuan layar** — Passed. Sidebar: Dashboard, Bank Soal, Sesi Ujian, **Monitoring Sesi**, Rekap Nilai, Data Santri, Ruang Ujian Santri — persis setelah "Sesi Ujian" dan sebelum "Rekap Nilai". Rute `/monitoring-sesi` membuka judul "Monitoring Sesi Ujian" + subjudul "Pantau santri yang sedang mengikuti ujian Anda tanpa menunggu ujian berakhir." Rute lama tetap berfungsi dan diperiksa satu per satu: `/` (dashboard CBA), `/bank-soal`, `/sesi-ujian`, `/rekap-nilai` ("Rekap Nilai & Koreksi Ujian"), `/santri` ("Data Master Santri", 346 santri aktif).
2. **Pemilih sesi dan meta sesi** — Passed. Saat dua sesi sama-sama aktif, pilihan awal pemilih adalah sesi berstatus aktif; keterangan menampilkan "Sedang Aktif", "Kelas 10", "5 menit per santri", "2 soal (100 poin)", dan kartu token dengan token sesi. Teks antarmuka bersih dari kode spesifikasi teknis (tidak ada `SCR-*`, `*-FR-*`, `TASK-*`, `Fase NN`, atau path dokumen).
3. **Keadaan kosong sebelum ada peserta** — Passed. Pada sesi aktif kedua: "Belum ada santri yang masuk ke sesi ini." + "Bagikan token G6QET7 kepada santri di ruang ujian.", kartu ringkasan semuanya 0 (Sudah Masuk 0, Sedang Mengerjakan 0, Telah Selesai 0, Pelanggaran Tab 0 / "0 santri terindikasi"), dan baris "Belum masuk: **Belum terhitung**".
4. **Santri masuk terpantau tanpa muat ulang** — Passed. Setelah Nizam konfirmasi di gerbang, baris muncul sendiri di halaman yang tetap terbuka: "Nizam Fahrizi / 0119755229 • 10A / Sedang Mengerjakan / Masuk 14.03 / 04:56", kartu "Sudah Masuk" dan "Sedang Mengerjakan" naik ke 1. Hitung mundur berkurang tiap detik (`04:56 → 04:26`) dancomputed font family-nya `"Geist Mono"` (monospace, format `mm:ss`).
5. **Pelanggaran tab terlihat langsung** — Passed. Satu siklus pindah-fokus (`blur` → `focus`) menampilkan badge amber **"1x Waspada"**; tiga siklus pada santri lain menampilkan badge destruktif **"3x Pelanggaran"** dan kartu "Pelanggaran Tab" ikut naik menjadi 3 dengan keterangan "1 santri terindikasi" — semuanya tanpa muat ulang.
6. **Pengumpulan jawaban dan tautan koreksi** — Passed. Dialog konfirmasi santri mencatat "Catatan Pelanggaran Layar: 3 kali"; setelah "Ya, Kumpulkan Jawaban", baris monitoring berubah sendiri menjadi "Selesai / Masuk 14.03 / Selesai 14.05 / 3x Pelanggaran / 10 / Selesai Dinilai / Buka Koreksi". Tombol tersebut adalah tautan `/rekap-nilai/koreksi/jn7abr4zvpknfqzhr57a4g6dmh8hmzyn` dan halamannya membuka lembar koreksi santri yang sama ("Lembar Koreksi: Nizam Fahrizi", NISN 0119755229, Sesi: E2E Monitoring Aktif, Nilai PG 10).
7. **Batas waktu selesai** — Passed. Santri ketiga (Zamzami) masuk dan mulai mengerjakan, lalu meninggalkan ruang ujian sebelum mengumpulkan (tab diarahkan kembali ke monitoring), sehingga lembarannya tetap berstatus berjalan. Setelah melewati 5 menit, sel "Sisa Waktu" berubah menjadi teks **"Waktu habis"** dengan class `font-mono font-bold text-destructive` (dua renderer: baris tabel dan kartu) — tidak ada angka negatif. Catatan: ketika lembar santri masih terbuka, tepat pada jatuh tempo santri **otomatis** menjadi "Selesai" (auto-submit sisi klien, `Masuk 14.07 → Selesai 14.12`), jadi state "Waktu habis" hanya tampak saat santri menutup ruang ujian; tidak ditemukan cron auto-submit di server.
8. **Isolasi data antar pengajar dan pengunjung tanpa login** — Passed. Pengunjung tanpa sesi di `/monitoring-sesi` tidak melihat data apa pun (daftar "Belum ada sesi untuk dipantau.", nol nama/NISN/kelas/nilai/token) dan mendapat kartu "Masuk sebagai pengajar untuk melihat daftar peserta sesi ujian Anda." dengan satu tombol "Login Pengajar". Pengajar kedua yang baru dibuat hanya melihat keadaan kosong netral ("Anda belum punya sesi ujian.") tanpa pemilih sesi; sesi, token, dan peserta pengajar pertama tidak muncul.
9. **Tata letak layar kecil** — Passed (proksi 474×569). Pada lebar ini tabel peserta disembunyikan (`display`/bounding rect nol) dan tampilan beralih ke kartu per peserta yang memuat nama, nomor induk • kelas, status, Masuk, Sisa Waktu, badge pelanggaran, Nilai, status koreksi, dan tombol "Buka Koreksi"; `document.documentElement.scrollWidth` 459 ≤ 474 sehingga tidak ada gulir horizontal dan tidak ada teks terpotong. Viewport 390×844 tidak dapat diset oleh otomasi, jadi angka persis spek belum terbukti langsung.

**Temuan / catatan**:
- Low: pada satu pengamatan pertama, "Sisa Waktu" sempat terbaca `05:43` (lebih panjang dari durasi 5 menit) lalu menyatu kembali dengan hitungan yang benar; kemungkinan selisih jam perangkat uji dengan `startedAt` dari server. Tidak berhasil direproduksi secara deterministik.
- Low: layar ini tidak melakukan redirect ke `/login` untuk pengunjung anonim (menampilkan kartu ajakan login). Untuk spesifikasi ini perilaku tersebut cocok dengan ekspektasi skenario 8; hanya spesifikasi rotasi token yang menuliskan "diarahkan ke login" — perlu penyelarasan dokumen.
- Residual: akun pengajar uji kedua (`pengajar.dua@example.com`) tertinggal di deployment dev karena data autentikasi berada di komponen `better-auth` dan tidak dapat dihapus dari kode aplikasi.

**Pembersihan fixture**: modul internal sementara menghapus kedua sesi beserta peserta/jawaban → `{sessions: 2, participants: 3, answers: 2}`, lalu paket soal → `{questions: 2, bank: 1}`. Verifikasi pasca-bersih: `examSessions` hanya berisi "adab akhlaq" dan "Ujian FiQih Uji Integrasi" (data milik pengguna, tidak disentuh). `apps/convex/tmpE2e/` sudah dihapus dan `npx convex dev --once` kembali melaporkan `Convex functions ready!`. Tidak ada error aplikasi yang muncul di halaman selama perjalanan (tanpa badge error overlay Next.js dan tanpa toast kesalahan).

