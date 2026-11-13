# Spesifikasi E2E: Kelola Mata Pelajaran dan Jenjang Resmi pada Pembuatan Paket

- **Sumber Permintaan**: perubahan produk CHG-004 pada rencana eksekusi (layar `/mata-pelajaran` untuk menambah, mengganti nama, dan menonaktifkan mata pelajaran; pilihan tingkat pada form paket dibatasi jenjang lembaga resmi)
- **Rekomendasi E2E**: `Required`
- **Status**: `Passed` (2026-11-05; 11/11 skenario, dengan satu penyimpangan redaksi spek pada placeholder tingkat)
- **Lingkungan**: Local development (`http://localhost:3000`) dengan Convex dev deployment `quirky-rat-737`
- **Alasan**: layar baru dengan gerbang login dan transisi tulis pada daftar yang dipakai bersama seluruh pengajar; kriteria "perubahan langsung tercermin pada daftar paket dan filter", "mata pelajaran nonaktif hilang dari pilihan baru", dan "pengunjung tanpa login tidak dapat mengubah daftar" hanya terbukti sepenuhnya lewat interaksi browser. Validasi server (gerbang login, kode ganda, hapus yang masih dipakai, pasangan lembaga-tingkat, penolakan teks bebas) sudah terbukti lewat probe CLI dan tes unit.

## Prasyarat

1. Server lokal berjalan (`npm run dev` di `apps/`). **Wajib** `http://localhost:3000`; lewat `http://127.0.0.1:3000` login pengajar ditolak better-auth dengan `INVALID_ORIGIN`.
2. Login pengajar uji `pengajar.uji@example.com` / `UjiDev2026`.
3. Daftar mata pelajaran awal berisi enam baris berstatus aktif: `TAHFIDZ`, `AQIDAH`, `FIQIH`, `B_ARAB`, `HADITS`, `TARIKH`. `FIQIH` dipakai **2 paket**, sisanya nol paket. Angka pada kolom Paket dapat bergeser bila data dev berubah — yang diuji adalah relasi "terpakai tidak bisa dihapus, nol paket bisa".
4. Sediakan satu mata pelajaran khusus uji ("Seni Kaligrafi") yang dibuat dan dihapus di dalam perjalanan ini supaya data awal tetap bersih.
5. Buka dialog buat paket di `/bank-soal` (tombol "Buat Bank Soal") untuk skenario 8-10; paket tidak perlu benar-benar disimpan kecuali disebut.

## Skenario Pengujian Browser

1. **Pengunjung tanpa login tidak mendapat kontrol tulis**
   - Buka `http://localhost:3000/mata-pelajaran` tanpa sesi login (tab rahasia atau setelah keluar).
   - *Ekspektasi*: satu kartu dashed berisi keterangan bahwa daftar terbuka untuk pengajar yang sudah login, plus tautan Login. Tidak ada formulir tambah, tidak ada baris daftar, tidak ada tombol nonaktifkan/hapus, dan spinner tidak menggantung.
   - Klik tautan Login → halaman login tampil normal.

2. **Masuk ke layar dari daftar paket**
   - Login, buka `/bank-soal`.
   - *Ekspektasi*: di bawah judul/deskripsi halaman ada satu tautan sekunder "Kelola Mata Pelajaran" (ikon, gaya ghost — bukan tombol utama yang bersaing dengan "Buat Bank Soal"). Klik → URL `/mata-pelajaran`, judul "Kelola Mata Pelajaran", tabel dengan kolom Nama, Kode, Deskripsi, Paket, Status, Aksi.
   - *Ekspektasi tambahan*: status memakai label teks ("Aktif"/"Nonaktif"), bukan hanya warna; tidak ada nomor spesifikasi teknis (`*-FR-*`, `*-AC-*`, `TASK-*`, `Fase NN`, `.md`) dan tidak ada emoji.

3. **Tambah mata pelajaran**
   - Isi Nama "Seni Kaligrafi", biarkan Kode kosong, lalu isi Deskripsi "Khat dan hiasan mushaf".
   - *Ekspektasi*: kode terisi otomatis "SENI_KALIGRAFI" (huruf besar) selama kode belum disentuh sendiri; hanya ada satu tombol kirim pada kartu ini.
   - Kirim → baris "Seni Kaligrafi" muncul di daftar tanpa muat ulang halaman, Status "Aktif", Paket 0; toast keberhasilan muncul dan kolom terisi ulang menjadi kosong.

4. **Kode ganda ditolak**
   - Isi Nama "Seni Ukir Kayu", ubah Kode manual menjadi `FIQIH`, kirim.
   - *Ekspektasi*: tidak ada baris baru; pesan gagal menyebut `FIQIH` sudah dipakai oleh "Fiqih Ibadah" dan menyarankan kode lain; formulir tetap terisi sehingga nama tidak perlu diketik ulang.

5. **Ganti nama, kode tetap**
   - Pada baris "Seni Kaligrafi", buka aksi "Ganti nama".
   - *Ekspektasi*: dialog memuat Nama + Deskripsi, kode tampil sebagai teks monospace yang tidak bisa disunting, dan keterangan bahwa kode adalah pengenal paket yang sudah ada.
   - Ganti nama menjadi "Kaligrafi Islam", simpan → daftar menampilkan nama baru, Kode tetap `SENI_KALIGRAFI`.
   - Buka `/bank-soal` dan `/bank-soal/[id]` untuk paket yang memakai mata pelajaran yang digantikan namanya pada skenario 6 → nama yang baru ikut tampil, bukan kode.

6. **Nonaktifkan hilang dari pilihan baru, tetap tampil pada paket lama**
   - Nonaktifkan satu mata pelajaran yang dipakai paket (mis. `AQIDAH` atau `FIQIH`) lewat aksi "Nonaktifkan".
   - *Ekspektasi*: Status menjadi "Nonaktif", tombol berubah menjadi "Aktifkan kembali", dan daftar paket lama yang memakainya tetap tampil dengan nama mata pelajaran tersebut (tidak ada baris paket yang hilang).
   - Buka dialog "Buat Bank Soal" → pilihan Mata Pelajaran **tidak** memuat mata pelajaran nonaktif itu. Tutup dialog, "Aktifkan kembali" → pilihan muncul lagi.
   - Kembalikan status ke Aktif sebelum lanjut.

7. **Hapus yang masih dipakai tidak bisa dijalankan**
   - Lihat baris `FIQIH` (Paket 2).
   - *Ekspektasi*: tombol "Hapus" dinonaktifkan dan alasannya tetap terbaca sebagai teks ("Belum bisa dihapus, masih dipakai 2 paket") — bukan hanya tooltip. Tidak ada dialog konfirmasi bila tombol diklik paksa lewat keyboard.

8. **Pilihan tingkat terbatas jenjang lembaga resmi**
   - Buka dialog "Buat Bank Soal" dan perhatikan baris Lembaga + Tingkat.
   - *Ekspektasi awal*: Tingkat dinonaktifkan dengan placeholder "Pilih lembaga terlebih dahulu" dan satu kalimat penjelas.
   - Pilih lembaga "SMPITA (SMP Islam Terpadu At-Tauhid)" → pilihan Tingkat hanya Kelas 7, Kelas 8, Kelas 9.
   - Ganti lembaga ke "MTA (Madrasah Tarbiyatul Aimmah)" → pilihan Tingkat menjadi **kosong** dan placeholder kembali "Pilih lembaga terlebih dahulu" (tingkat lama tidak tertinggal di form).
   - Kosongkan Mata Pelajaran lalu isi lengkap kecuali Tingkat dan kirim → validasi menolak dengan kalimat yang menyebut perlu memilih lembaga/tingkat, bukan error server mentah.
   - *Ekspektasi tambahan*: tidak ada lagi pilihan bebas ala lama seperti "Tarbiyah / Takhassus" atau "Kelas 7 / Ula 1", dan tidak ada `<select>` browser polos (semua memakai primitif shadcn).

9. **Paket tersimpan memakai pasangan resmi**
   - Lengkapi form: Mata Pelajaran "Fiqih Ibadah", lembaga MTA, Tingkat "MTA 3", judul "E2E Jenjang Resmi" → buat.
   - *Ekspektasi*: kartu paket baru tampil di `/bank-soal` dengan badge nama mata pelajaran dan tingkat "MTA 3"; filter mata pelajaran masih menampilkannya saat filter "Fiqih Ibadah" dipilih.
   - Hapus paket "E2E Jenjang Resmi" dari layar daftar setelah terbukti, supaya data dev bersih.

10. **Hapus mata pelajaran nol paket**
    - Kembali ke `/mata-pelajaran`, hapus "Kaligrafi Islam" (Paket 0).
    - *Ekspektasi*: ada konfirmasi sebelum hapus; setelah dikonfirmasi baris hilang dari daftar dan dari pilihan "Buat Bank Soal". Sisa daftar tetap enam mata pelajaran awal.

11. **Layout layar kecil**
    - Pada `http://localhost:3000/mata-pelajaran`, geser viewport ke 390 px.
    - *Ekspektasi*: tabel berubah menjadi kartu per mata pelajaran (bukan tabel yang bisa digeser horizontal), isi terbaca tanpa pemotongan, target sentuh cukup, dan aksi baris tetap dapat dijangkau.

## Bukti

### Eksekusi 2026-11-05

- Hasil: **Passed** (11/11)
- Tester: `/e2e-tester` (browser agent), viewport 474x570, tanpa Playwright/Cypress.
- Data awal saat uji: 6 mata pelajaran aktif. `AQIDAH` dipakai 2 paket milik akun lain, `FIQIH` dipakai 1 paket milik identitas seed CLI; akun uji `pengajar.uji@example.com` tidak memiliki paket. Untuk membuktikan ketercerminan lintas layar, paket uji dibuat sendiri lalu dihapus.

1. **Pengunjung tanpa login** — Passed
   - Actions: keluar sesi, buka `/mata-pelajaran`.
   - Actual: hanya kartu keterangan "Daftar mata pelajaran terbuka untuk pengajar yang sudah login" + tautan "Login Pengajar"; 0 form, 0 baris tabel, 0 spinner. Klik tautan → `/login`.
2. **Masuk dari daftar paket** — Passed
   - Actions: `/bank-soal` saat login, amati tautan sekunder lalu klik.
   - Actual: tautan "Kelola Mata Pelajaran" berikon dan bergaya ghost di bawah deskripsi, tidak bersaing dengan "Buat Paket Bank Soal". Klik → `/mata-pelajaran`; tabel berkolom Nama, Kode, Deskripsi, Paket, Status, Aksi; status berupa teks "Aktif"/"Nonaktif"; tidak ada kode spesifikasi teknis maupun emoji.
3. **Tambah mata pelajaran** — Passed
   - Actions: isi Nama "Seni Kaligrafi", biarkan Kode kosong, isi Deskripsi "Khat dan hiasan mushaf", kirim.
   - Actual: Kode terisi otomatis `SENI_KALIGRAFI`; hanya satu tombol kirim. Baris baru muncul tanpa muat ulang, Status Aktif, Paket 0; toast "Mata pelajaran ditambahkan ke daftar bersama."; ketiga kolom kosong kembali.
4. **Kode ganda ditolak** — Passed
   - Actions: isi Nama "Seni Ukir Kayu", ubah Kode manual menjadi `FIQIH`, kirim.
   - Actual: tidak ada baris baru; toast gagal memuat `Kode "FIQIH" sudah dipakai oleh mata pelajaran "Fiqih Ibadah". Pakai kode lain, atau ganti nama mata pelajaran yang sudah ada itu.`; Nama dan Kode tetap terisi.
5. **Ganti nama, kode tetap** — Passed
   - Actions: buka "Ganti nama" pada baris Seni Kaligrafi; periksa dialog; ganti nama menjadi "Kaligrafi Islam"; simpan; buka `/bank-soal` dan halaman paketnya.
   - Actual: dialog memuat Nama + Deskripsi, kode `SENI_KALIGRAFI` tampil sebagai teks monospace yang tidak bisa disunting, plus keterangan bahwa kode adalah pengenal paket. Setelah simpan, daftar menampilkan "Kaligrafi Islam" dengan kode tetap; toast "Nama mata pelajaran diperbarui."; kartu paket di `/bank-soal` dan judul di `/bank-soal/<id>` menampilkan "Kaligrafi Islam" (kode tidak muncul).
6. **Nonaktifkan** — Passed
   - Actions: nonaktifkan `AQIDAH` (dipakai 3 paket saat itu, termasuk paket uji); buka `/bank-soal` dan dialog buat paket; aktifkan kembali.
   - Actual: Status menjadi "Nonaktif", tombol berubah "Aktifkan kembali", toast "tidak lagi ditawarkan pada paket baru"; kartu paket lama tetap tampil dengan nama "Aqidah & Tauhid". Pilihan Mata Pelajaran pada dialog baru tidak memuat Aqidah. Setelah "Aktifkan kembali", toast "kembali tersedia untuk paket baru" dan pilihan muncul lagi.
7. **Hapus yang masih dipakai** — Passed
   - Actions: lihat baris `FIQIH` (1 paket); klik paksa tombol Hapus lewat skrip.
   - Actual: tombol Hapus `disabled`, alasan terbaca sebagai teks "Hapus belum tersedia karena masih dipakai 1 paket."; klik paksa tidak membuka dialog apa pun.
8. **Pilihan tingkat terbatas jenjang resmi** — Passed (dengan penyimpangan redaksi)
   - Actions: buka dialog baru; pilih SMPITA; ganti lembaga ke MTA; kosongkan Tingkat lalu kirim.
   - Actual: Tingkat awalnya `disabled` dengan placeholder "Pilih lembaga terlebih dahulu" + kalimat penjelas. SMPITA → hanya Kelas 7, Kelas 8, Kelas 9; tidak ada pilihan bebas lama dan tidak ada `<select>` polos (0 elemen). Setelah ganti ke MTA, pilihan Tingkat yang sudah dipilih (Kelas 7) terhapus dan placeholder berubah menjadi **"Pilih tingkat..."**, bukan "Pilih lembaga terlebih dahulu" seperti tertulis di spek — sebab MTA memang punya jenjang resmi (MTA 1–MTA 6), sehingga lembaga sudah terpilih. Kirim tanpa Tingkat → toast "Silakan pilih tingkat / kelas resmi lembaga ini." (bukan error server mentah).
9. **Paket tersimpan memakai pasangan resmi** — Passed
   - Actions: buat paket "E2E Jenjang Resmi" dengan lembaga MTA dan Tingkat "MTA 3" (mata pelajaran "Kaligrafi Islam" agar sekaligus menguji skenario 5); amati kartu dan filter; hapus paket.
   - Actual: navigasi ke `/bank-soal/<id>`; kartu di `/bank-soal` menampilkan badge "Kaligrafi Islam", tingkat "MTA 3", judul, 100 Poin, KKM 75; memilih filter "Kaligrafi Islam" tetap menampilkan kartu tersebut. Paket dihapus setelah terbukti.
10. **Hapus mata pelajaran nol paket** — Passed
    - Actions: hapus "Kaligrafi Islam" (0 paket) lewat aksi Hapus.
    - Actual: konfirmasi native "Hapus \"Kaligrafi Islam\" dari daftar mata pelajaran?" muncul; setelah dikonfirmasi baris hilang, toast "Mata pelajaran dihapus dari daftar.", daftar kembali 6 mata pelajaran, dan pilihan pada dialog buat paket tidak lagi memuat "Kaligrafi Islam".
11. **Layout layar kecil** — Passed (viewport 474 px, bukan 390 px)
    - Actions: buka `/mata-pelajaran` pada lebar viewport browser agent 474 px.
    - Actual: tabel tersembunyi (lebar 0, 0 baris terlihat) dan tampilan berganti kartu per mata pelajaran selebar 427 px; tidak ada gulir horizontal (`scrollWidth` 459 ≤ 474); tombol Ganti nama/Nonaktifkan/Hapus tetap terlihat. Keterbatasan: browser agent tidak menyediakan pengubah viewport, jadi 390 px persis tidak dapat diuji; perilaku di bawah breakpoint `md` sudah terbukti.

- **Penyimpangan spek**: placeholder setelah memilih MTA adalah "Pilih tingkat..." (bukan "Pilih lembaga terlebih dahulu") karena MTA memiliki jenjang resmi MTA 1–6. Perilaku yang diminta (tingkat lama tidak tertinggal) tetap terpenuhi.
- **Temuan residual (bukan kegagalan skenario)**: toast kegagalan kode ganda menampilkan awalan mentah `[CONVEX M(bank/public/mutations:addSubject)] ... Server Error` sebelum kalimat yang ramah pengguna. Sebaiknya dipetakan menjadi pesan bersih; perlu `/bug` terpisah bila ingin dirapikan.
- **Data uji**: subjek "Seni Kaligrafi/Kaligrafi Islam" dan dua paket uji sudah dihapus; daftar kembali 6 mata pelajaran. Tidak ada sisa data dari spek ini.
- **Media**: tidak ada tangkapan layar native (`NATIVE_BROWSER_VIEWPORT_UNAVAILABLE`); bukti berupa observasi DOM dan teks toast.

## Catatan sisa

- Gerbang tulis di sisi server (anonim dan pengajar lain ditolak, pasangan lembaga-tingkat divalidasi ulang, mata pelajaran nonaktif ditolak untuk paket baru) sudah dibuktikan lewat probe CLI `npx convex run` dan tes unit `apps/tests/subject-management.test.ts`; perjalanan browser ini menutup sisi tampilan dan ketercerminan lintas layar.
- Nilai `gradeLevel` lama yang bukan jenjang resmi (mis. "Tarbiyah / Takhassus") masih dapat dibaca pada paket lama dan sengaja tidak dimigrasi; hanya penyimpanan baru yang menuntut pasangan resmi.
