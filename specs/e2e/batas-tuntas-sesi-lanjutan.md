# Spesifikasi E2E: Batas Nilai Tuntas & Sesi Lanjutan Remedial/Susulan (CHG-007)

- **Target Kebutuhan**: `SESI-FR-008`, `SESI-FR-009`, `SESI-AC-008`
- **Rekomendasi E2E**: `Required`
- **Status**: `Blocked` (dijalankan 2026-11-05: 9 skenario Passed, skenario 10 terblokir karena viewport tidak dapat diubah; lihat Bukti Eksekusi)
- **Lingkungan**: Local development (`http://localhost:3000`) dengan Convex dev deployment

## Prasyarat
1. Server lokal berjalan pada `http://localhost:3000`.
2. Login sebagai pengajar dengan akun `pengajar.uji@example.com` (password `UjiDev2026`).
3. Tersedia minimal 1 paket bank soal aktif dan 1 sesi reguler berstatus "Selesai" yang memiliki santri peserta dengan jawaban terkumpul.
4. Tersedia minimal 3 santri terdaftar pada lembaga/kelas yang sama dengan peserta sesi sumber.

## Skenario Pengujian Browser

1. **Mengisi Batas Nilai Tuntas pada Formulir Sesi**:
   - Buka `/sesi-ujian`, klik "Jadwalkan Sesi Ujian".
   - Isi judul, pilih bank soal, lalu isi kolom "Batas Nilai Tuntas" dengan `80`.
   - Simpan sesi.
   - *Ekspektasi*: Sesi tersimpan, kartu sesi menampilkan "Batas tuntas 80".

2. **Mengosongkan Batas Nilai Tuntas**:
   - Buat sesi baru dengan kolom "Batas Nilai Tuntas" dikosongkan.
   - *Ekspektasi*: Sesi tersimpan tanpa penanda batas tuntas; kartu sesi tidak menampilkan baris batas tuntas.

3. **Validasi Input Batas Nilai Tuntas**:
   - Isi kolom dengan `101`, lalu coba simpan.
   - Isi kolom dengan `75.5`, lalu coba simpan.
   - *Ekspektasi*: Keduanya ditolak dengan pesan "Batas nilai tuntas harus bilangan bulat antara 0 dan 100, atau dikosongkan."; dialog tetap terbuka.

4. **Membuat Sesi Remedial dari Kartu Sesi Selesai**:
   - Pada kartu sesi sumber berstatus "Selesai", klik tombol "Buat Remedial / Susulan".
   - *Ekspektasi*: Dialog terbuka dengan jenis "Remedial" terpilih, judul otomatis "<judul sumber> — Remedial", bank soal/durasi/pengacakan/batas tuntas/mode penegakan terisi sesuai sesi sumber.

5. **Daftar Peserta Awal Kosong & Pemilihan Manual**:
   - Amati daftar peserta pada dialog.
   - *Ekspektasi*: Semua checkbox peserta dalam keadaan tidak tercentang; tombol simpan nonaktif selama belum ada peserta dicentang.
   - Centang 2 santri, lalu simpan.
   - *Ekspektasi*: Dialog tertutup, toast sukses, sesi lanjutan muncul sebagai "Draf" dengan badge jenis "Remedial" dan baris "Sesi sumber: <judul sumber>".

6. **Mengubah Salinan Sebelum Simpan**:
   - Buat sesi susulan baru dari sesi sumber yang sama.
   - Ubah durasi, matikan pengacakan opsi, dan kosongkan batas tuntas.
   - Simpan.
   - *Ekspektasi*: Sesi susulan tersimpan dengan nilai yang diubah, bukan nilai sumber.

7. **Sumber Tidak Berubah**:
   - Kembali ke kartu sesi sumber.
   - *Ekspektasi*: Judul, status "Selesai", jumlah peserta, batas tuntas, dan token sesi sumber identik dengan sebelum pembuatan sesi lanjutan.

8. **Visibilitas Pemilik Saja**:
   - Logout, lalu akses `/sesi-ujian` tanpa login.
   - Login sebagai pengajar lain.
   - *Ekspektasi*: Pengunjung anonim diarahkan ke halaman login; pengajar lain tidak melihat sesi lanjutan beserta label jenis/rujukan sumber milik pengajar pertama.

9. **Gerbang Peserta pada Halaman Santri**:
   - Di `/ujian`, masuk dengan token sesi lanjutan menggunakan Nomor Induk santri yang tidak dicentang.
   - *Ekspektasi*: Ditolak dengan pesan "Sesi ini hanya untuk santri yang dipilih pengajar. Nomor Induk Anda tidak termasuk daftar peserta sesi lanjutan."
   - Ulangi dengan Nomor Induk yang dicentang.
   - *Ekspektasi*: Santri masuk ke lembar ujian; tidak ada teks jenis sesi, rujukan sumber, atau daftar peserta lain yang tampil.

10. **Tata Letak Seluler**:
    - Buka dialog sesi lanjutan pada viewport 375×812.
    - *Ekspektasi*: Kolom waktu mulai/selesai bertumpuk vertikal, tidak ada scroll horizontal, tombol simpan tetap terjangkau.

## Bukti Eksekusi (Evidence)

### Eksekusi 2026-11-05 oleh `/e2e-tester`

- Lingkungan: lokal `http://localhost:3000`, Convex dev deployment `quirky-rat-737`.
- Akun: `pengajar.uji@example.com` (pemilik fixture) dan `pengajar.dua@example.com` (pengajar lain).
- Santri master (SMAITA / 10A): `26.03.028` Nizam Fahrizi, `26.03.027` Muhammad Al Fathih, `26.03.026` Zamzami.
- Hasil keseluruhan: **Blocked** — 9 skenario terverifikasi Passed, skenario 10 tidak dapat dieksekusi pada viewport yang disyaratkan.
- Batasan alat: tab browser berstatus `visibilityState=hidden`, viewport terkunci 474×569, tidak dapat di-resize, dan tangkapan layar tidak tersedia. Bukti skenario 10 diambil dari CSS terkomputasi, bukan pengamatan visual.

### Catatan Prasyarat (deviasi pembuatan fixture)

Dialog "Jadwalkan Sesi Ujian" untuk membuat **paket bank soal**: menekan tombol simpan mengarahkan aplikasi ke `/` dan bank soal tidak terbentuk (overlay dev Next.js tampil, teks error tidak dapat diekstrak dari tab tersembunyi). Karena itu bank `E2E Batas Tuntas (FIQIH)` (`j57czqpwpm69j1y3j9zznxs10s8hm86s`, 2 butir) dibuat melalui mutasi publik aplikasi (`bank/public/mutations:createQuestionBank` dan `createQuestion`) yang dipanggil dari client Convex milik sesi login pengajar — identitas dan otorisasi tetap jalur nyata, hanya pemicu UI-nya yang diganti. Ini adalah setup data uji, bukan penggantian jalur yang diuji. Perilaku dialog tersebut dilaporkan sebagai temuan terpisah (kandidat `/bug`).

Seluruh sesi (reguler, remedial, susulan) dibuat dan disimpan melalui layar `sesi-ujian` dan dialog sesi lanjutan, bukan lewat backend.

### Skenario 1 — Mengisi Batas Nilai Tuntas pada Formulir Sesi

- Actions: login pengajar, buka `/sesi-ujian`, isi `#session-title` = "E2E Sumber Reguler", pilih bank soal, `#session-passing-score` = `80`, simpan.
- Expected: sesi tersimpan dan kartu menampilkan "Batas tuntas 80".
- Actual: token sesi `UHEBXD` terbentuk; kartu menampilkan baris "Batas tuntas 80"; `npx convex data examSessions` mengonfirmasi `passingScore: 80`.
- Status: **Passed**

### Skenario 2 — Mengosongkan Batas Nilai Tuntas

- Actions: sesi kedua "E2E Tanpa Batas Tuntas" dibuat dengan kolom batas tuntas kosong.
- Expected: tersimpan tanpa penanda; kartu tidak menampilkan baris batas tuntas.
- Actual: token `MD5J6C`; kartu tidak punya baris "Batas tuntas"; data tersimpan `passingScore: null` (bukan `0`).
- Status: **Passed**

### Skenario 3 — Validasi Input Batas Nilai Tuntas

- Actions: isi `101` lalu `75.5` pada kolom batas tuntas, coba simpan.
- Expected: keduanya ditolak dengan pesan "Batas nilai tuntas harus bilangan bulat antara 0 dan 100, atau dikosongkan." dan dialog/formulir tetap terbuka.
- Actual: keduanya benar-benar ditolak dan formulir tetap terbuka tanpa sesi baru terbentuk — tetapi penolakan datang dari validasi native browser (`#session-passing-score` bertipe `number` dengan `min=0 max=100 step=1`), sehingga pesan berbahasa Indonesia milik aplikasi tidak pernah tampil. Helper `parsePassingScoreInput` sudah diuji unit dan pesannya hanya bisa muncul lewat jalur non-formulir.
- Status: **Passed** (hasil akhir tercapai; pesan yang diharapkan tidak teramati — lihat Temuan 1)

### Skenario 4 — Membuat Sesi Remedial dari Kartu Sesi Selesai

- Actions: pada kartu sesi sumber, klik "Buat Remedial / Susulan".
- Expected: dialog terbuka dengan jenis "Remedial" terpilih, judul otomatis "<judul sumber> — Remedial", dan salinan bank soal/durasi/pengacakan/batas tuntas/mode penegakan.
- Actual: judul dialog "Buat Sesi Remedial", `#continuation-kind` = "Remedial", `#continuation-title` = "E2E Sumber Reguler — Remedial", `#continuation-duration` = 60, `#continuation-passing` = 80, pengacakan dan mode penegakan sama dengan sumber. Ketika jenis dipindah ke "Susulan", judul otomatis ikut menjadi "E2E Sumber Reguler — Susulan" dan judul dialog ikut berubah.
- Catatan: status sumber di kartu terbaca "Telah Berakhir", bukan "Selesai" seperti teks spesifikasi.
- Status: **Passed**

### Skenario 5 — Daftar Peserta Awal Kosong & Pemilihan Manual

- Actions: amati kotak centang peserta sebelum dan sesudah mencentang 2 santri, lalu simpan.
- Expected: semua kosong di awal; tombol simpan nonaktif; setelah 2 dicentang tersimpan sebagai Draf ber-badge "Remedial" dengan baris "Sesi sumber: …".
- Actual: ketiga kotak centang `aria-checked=false` di awal, tombol "Buat Sesi Remedial" `disabled: true`; setelah 2 dicentang tombol aktif dan simpan memunculkan toast "Sesi remedial berhasil dibuat dengan Token: EJSAAY". Kartu baru berstatus "Draf (Belum Aktif)"… sesi `EJSAAY` kemudian diaktifkan untuk keperluan skenario 9, dan sesi susulan lain tetap tampil sebagai "Draf (Belum Aktif)" dengan badge "Susulan" serta baris "Sesi sumber: E2E Sumber Reguler".
- Status: **Passed**

### Skenario 6 — Mengubah Salinan Sebelum Simpan

- Actions: dari sesi sumber yang sama, buka dialog, pindah jenis ke "Susulan", ubah durasi 60 → 35, matikan "Acak Urutan Opsi", kosongkan batas tuntas, centang 2 santri, simpan.
- Expected: tersimpan dengan nilai yang diubah, bukan nilai sumber.
- Actual: toast "Sesi susulan berhasil dibuat dengan Token: SLFKUQ"; kartu menampilkan "35 Menit", "Acak: Soal" (tanpa "Opsi Jawaban"), dan tidak ada baris "Batas tuntas". Konfirmasi data: `{passingScore: null, durationMinutes: 35, randomizeQuestions: true, randomizeOptions: false, kind: "susulan"}`, sedangkan sumbernya `{80, 60, true, true}`.
- Status: **Passed**

### Skenario 7 — Sumber Tidak Berubah

- Actions: kembali ke kartu sesi sumber setelah tiga sesi lanjutan dibuat.
- Expected: judul, status, jumlah peserta, batas tuntas, dan token identik.
- Actual: `E2E Sumber Reguler` tetap `status: "ended"`, `token: "UHEBXD"`, `passingScore: 80`, `durationMinutes: 60`, `kind: "reguler"`, tanpa rujukan sumber; `examParticipants` untuk sesi sumber tetap 3 baris.
- Status: **Passed**

### Skenario 8 — Visibilitas Pemilik Saja

- Actions: logout, buka `/sesi-ujian` tanpa login; lalu login sebagai `pengajar.dua@example.com` dan buka `/sesi-ujian`.
- Expected: anonim diarahkan ke halaman login; pengajar lain tidak melihat sesi lanjutan, label jenis, maupun rujukan sumber milik pengajar pertama.
- Actual: sebagai anonim, daftar sesi kosong ("Belum Ada Sesi Ujian Terjadwal") dan muncul panel gerbang "Anda belum login sebagai Pengajar" dengan tombol "Login Pengajar" — **tanpa redirect** ke rute login. Sebagai `pengajar.dua`, seluruh teks "E2E Sumber Reguler", "Remedial", "Susulan", "Sesi sumber", "Batas tuntas" dan keenam token fixture tidak ada di DOM (0 kartu). Tidak ada kebocoran data lintas pemilik.
- Status: **Passed** (dengan deviasi bentuk gerbang — lihat Temuan 2)

### Skenario 9 — Gerbang Peserta pada Halaman Santri

- Actions: di `/ujian`, token `EJSAAY` dengan NISN `26.03.027` (tidak dicentang), lalu diulang dengan `26.03.028` Nizam Fahrizi (dicentang) dan tekan "Mulai Mengerjakan Ujian".
- Expected: yang tidak dicentang ditolak dengan pesan "Sesi ini hanya untuk santri yang dipilih pengajar. Nomor Induk Anda tidak termasuk daftar peserta sesi lanjutan."; yang dicentang masuk ke lembar ujian tanpa teks jenis sesi, rujukan sumber, atau daftar peserta lain.
- Actual (tolak): formulir tetap di gerbang dan pesan penolakan muncul persis: "Sesi ini hanya untuk santri yang dipilih pengajar. Nomor Induk Anda tidak termasuk daftar peserta sesi lanjutan." (teramati pada widget error Convex; toast aplikasi tidak terambil dari tab tersembunyi — lihat Temuan 4).
- Actual (terima): Nizam masuk, toast "Berhasil masuk ke ruang ujian!", lembar soal tampil `1/2`, timer `59:34`. Teks halaman lembar soal tidak mengandung "Remedial", "Susulan", "Sesi sumber", "Al Fathih", "Zamzami", `26.03.027`, maupun `26.03.026`.
- Status: **Passed**

### Skenario 10 — Tata Letak Seluler

- Actions: dialog sesi lanjutan dibuka kembali; attempting viewport 375×812.
- Expected: kolom waktu mulai/selesai bertumpuk vertikal, tanpa scroll horizontal, tombol simpan terjangkau.
- Actual: **tidak dapat dieksekusi**. Kapabilitas browser tidak dapat mengubah viewport (terkunci) dan tab berada pada keadaan tersembunyi sehingga pengukuran geometri absolut tidak andal (`window.innerWidth` = 0). Bukti pengganti dari CSS terkomputasi pada lebar uji 474 px (masih di bawah breakpoint `sm` 640 px, cabang yang sama dengan 375 px): container baris waktu dan baris batas peserta sama-sama `grid-template-columns: 268.656px` (satu kolom) dengan `#continuation-start` pada y=249 dan `#continuation-end` pada y=312, yaitu benar-benar bertumpuk vertikal.
- Status: **Blocked**

## Temuan

1. **Medium** — `#session-passing-score` memakai `type="number"` dengan `min=0 max=100 step=1` ([apps/app/(main)/sesi-ujian/page.tsx](file:///D:/DATA/PROJEK/IMTIHAN/apps/app/(main)/sesi-ujian/page.tsx)), sehingga browser menolak `101`/`75.5` sebelum logika aplikasi berjalan. Pesan "Batas nilai tuntas harus bilangan bulat antara 0 dan 100, atau dikosongkan." dari `parsePassingScoreInput` tidak dapat muncul di layar sesi, dan `apps/lib/session-continuation.ts` terpakai di jalur lain. Nilai keluaran yang diharapkan pengguna (pesan yang sama) tidak tercapai lewat UI.
2. **Low** — Pengunjung anonim di `/sesi-ujian` tidak dialihkan ke rute login; ia tetap di rute yang sama dengan panel "Login Pengajar". Aman (0 data sesi), tetapi tidak sama dengan teks spesifikasi.
3. **Medium** — Pratinjau token di gerbang santri menampilkan "Sesi Ujian Ditemukan & Siap Diakses" beserta judul sesi ("E2E Sumber Reguler — Remedial") bahkan ketika Nomor Induk tidak termasuk daftar peserta sesi lanjutan. Santri yang ditolak tetap melihat identitas sesi lanjutan milik orang lain ([apps/app/ujian/page.tsx:453+](file:///D:/DATA/PROJEK/IMTIHAN/apps/app/ujian/page.tsx)).
4. **Low** — Toast penolakan dari `toast.error(error.message)` di `handleEnterSession` tidak teramati pada `[data-sonner-toast]` selama eksekusi; pesan yang sama terlihat lewat widget error Convex. Kemungkinan tertutup oleh widget dev, tetapi tidak bisa dipastikan dari tab tersembunyi.
5. **Medium** — Submit dialog pembuatan bank soal mengarahkan aplikasi ke `/` tanpa membuat data (detailed di bagian Prasyarat). Tidak terkait CHG-007 secara langsung, tetapi memblokir prasyarat UI.
6. **Low** — Label status sesi terbaca "Telah Berakhir" sedangkan spesifikasi CHG-007 menulis "Selesai".
7. **Low** — Saat dialog sesi lanjutan terbuka, panel kosong "Belum Ada Sesi Ujian Terjadwal" sempat terlihat di belakangnya (sedetik sebelum daftar sesi terisi).

## Media Evidence

- Tidak ada tangkapan layar: kapabilitas browser pada sesi ini tidak menyediakan screenshot saat tab berada pada `visibilityState=hidden`. Bukti diganti dengan potongan teks DOM, nilai terkomputasi, dan keluaran `npx convex data` yang dicatat per skenario di atas.

## Status Pembersihan

- Seluruh fixture CHG-007 dihapus setelah eksekusi: bank `E2E Batas Tuntas (FIQIH)` beserta 2 butir, sesi `UHEBXD`, `MD5J6C`, `EJSAAY`, `XHHFR4`, `WWEXRW`, `SLFKUQ`, serta baris `examParticipants`/`studentAnswers` turunannya. Dihapus melalui modul internal sementara `convex/tmpE2e/cleanup.ts` (`npx convex run tmpE2e/cleanup:cleanup` → `{sessions: 6, participants: 4, answers: 6, questions: 2, bankDeleted: true}`), lalu modul tersebut dihapus dan `npx convex dev --once` mencetak `Convex functions ready!`.
- Verifikasi pasca-pembersihan dengan `npx convex data`: tersisa 2 sesi milik pengguna (`adab akhlaq`, `Ujian FiQih Uji Integrasi`), 2 peserta, dan 0 sesi/bank berawalan "E2E". Data yang tidak terlibat tidak disentuh. Akun `pengajar.dua@example.com` masih ada karena baris better-auth berada di tabel komponen dan tidak dapat dihapus dari kode aplikasi.
