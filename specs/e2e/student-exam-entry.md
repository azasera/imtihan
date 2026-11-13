# Spesifikasi E2E: Pintu Gerbang Ujian Santri & Verifikasi Token (TASK-005 & TASK-010)

- **Target Kebutuhan**: `UJIAN-FR-001`, `UJIAN-FR-006`, `UJIAN-FR-007`
- **Cacat Terkait**: Halaman gerbang pernah memanggil `React.useMemo` setelah `return` lebih awal di `apps/app/ujian/page.tsx`, sehingga transisi ke lembar pengerjaan memicu error React "Rendered fewer hooks than expected". Perbaikan sudah diterapkan; spek ini membuktikannya di browser.
- **Rekomendasi E2E**: `Required` (cacat hanya muncul di batas browser, saat perubahan state client-side)
- **Status**: `Failed` (dieksekusi ulang 2026-11-05 setelah `BUG-002` diperbaiki; 6 `Passed`, 1 `Failed` — sisa kegagalan adalah aksi keluar dari lembar pengerjaan yang belum ada)
- **Lingkungan**: Local development (`http://localhost:3000`) dengan Convex dev deployment

## Prasyarat
1. Server lokal berjalan dan dibuka lewat `http://localhost:3000`. Alamat `http://127.0.0.1:3000` juga memuat halaman dan tetap aman untuk gerbang santri (fungsi ini anonim), tetapi jangan dipakai bila alur pengujian menyentuh login pengajar — better-auth menolaknya dengan `INVALID_ORIGIN` (terverifikasi 2026-11-03).
2. Minimal terdapat 1 sesi ujian dengan status `Sedang Aktif` dan memiliki token 6 digit yang valid (misal dari sesi yang dibuat di `TASK-004`).
3. Sesi ujian tersebut sudah dipasangi bank soal berisi minimal 2 butir soal, agar lembar pengerjaan memiliki konten untuk ditampilkan.
4. BukaDev browser pada mode jendela biasa (bukan device emulation) agar tata letak 3-panel teruji.
5. Isian form dikendalikan React: pengisian otomatis wajib memakai native value setter lalu event `input`, dan pilihan lembaga/kelas memakai Radix Select yang dirender lewat portal (bukan dropdown biasa).

## Skenario Pengujian Browser
1. **Membuka Halaman Gerbang Ujian Santri**:
   - Buka URL `/ujian` di browser (tanpa perlu login pengajar / mode penyamaran).
   - *Ekspektasi*: Tampil halaman gerbang ujian bertajuk "Ruang Ujian Santri" dengan logo resmi E-Imtihan At-Tauhid dan formulir terstruktur 6 tahap.

2. **Perilaku Pilihan Lembaga dan Kelas Dinamis**:
   - Periksa field kelas saat lembaga belum dipilih: dropdown kelas dalam keadaan dinonaktifkan (`disabled`).
   - Pilih Lembaga `SMPITA`: dropdown kelas menjadi aktif dan memuat pilihan kelas 7 sampai 9. Pilih salah satu kelas (misal `Kelas 7`).
   - Ubah Lembaga menjadi `MTA`: pilihan kelas sebelumnya otomatis dikosongkan (`reset`) dan kini memuat daftar kelas MTA 1 sampai 6.

3. **Validasi Token Tidak Valid**:
   - Masukkan token acak yang salah, misal: `999XYZ`.
   - *Ekspektasi*: Sistem menampilkan pesan kesalahan ramah bahwa token tidak dapat digunakan atau sesi belum aktif.

4. **Verifikasi Token Valid & Pratinjau Ujian**:
   - Masukkan token 6 digit dari sesi ujian yang aktif.
   - *Ekspektasi*: Kotak pratinjau ujian muncul menampilkan Judul Ujian, Mata Pelajaran, Tingkat Kelas, dan Durasi Ujian.

5. **Pengisian Data Santri & Masuk Sesi Ujian**:
   - Masukkan Nomor Induk Santri (NISN / NIS / ID Santri): `24.02.001`.
   - *Ekspektasi*: Nama santri, lembaga, dan kelas terisi otomatis dari basis data dan terkunci resmi.
   - Klik tombol "Konfirmasi & Masuk Ruang Ujian".
   - *Ekspektasi*: Sistem mencatat peserta ke database, menampilkan toast sukses, dan menyajikan ringkasan instruksi tata tertib pengerjaan ujian santri.

6. **Transisi ke Lembar Pengerjaan (skenario reproduksi cacat)**:
   - Pada ringkasan instruksi, klik tombol "Mulai Mengerjakan Ujian".
   - *Ekspektasi*: Lembar pengerjaan 3-panel tampil berisi daftar soal, timer hitung mundur berjalan, dan **tidak ada error React di console**. Sebelum perbaikan, langkah ini memicu crash "Rendered fewer hooks than expected".
   - Periksa console browser: harus bersih dari pesan berawalan `Warning:` atau `Error:` dari React.

7. **Regresi Sekitar: Keluar dan Masuk Ulang (mode lanjut ujian)**:
   - Di dalam lembar pengerjaan, jawab 1 soal lalu gunakan tindakan keluar untuk kembali ke ringkasan, kemudian klik "Mulai Mengerjakan Ujian" sekali lagi.
   - *Ekspektasi*: Transisi bolak-balik tetap mulus dan jawaban yang tersimpan masih tampil.
   - Muat ulang halaman `/ujian` dan masukkan token yang sama untuk santri yang sama.
   - *Ekspektasi*: Sistem menampilkan toast melanjutkan sesi yang sedang berlangsung, dan transisi ke lembar pengerjaan tetap berhasil.

## Bukti Eksekusi (Evidence)

### Lingkungan

- Tanggal eksekusi: 2026-11-05, aplikasi lokal `http://localhost:3000`, Convex dev `quirky-rat-737`.
- Data uji sementara: bank "E2E Gerbang Bank" (AQIDAH, SMPITA, Kelas 9) berisi 2 butir soal; sesi "E2E Gerbang Sesi" token `UAFBB3` (status aktif, 60 menit, acak soal dan opsi, batas tuntas 75, mode catat, tanpa daftar peserta terbatas); santri master `24.02.001` (Abdillah, SMPITA, 9A).
- Media: tangkapan layar native tidak tersedia pada kanal otomasi (`NATIVE_BROWSER_VIEWPORT_UNAVAILABLE`); bukti berupa snapshot aksesibilitas, teks halaman, hasil skrip evaluasi DOM, dan isi basis data dev.

### Hasil: `Failed` — 7 skenario, 5 `Passed`, 2 `Failed`

1. **Membuka Halaman Gerbang Ujian Santri — `Passed`**
   - Halaman `/ujian` dimuat tanpa login. Snapshot menampilkan gambar "Logo E-Imtihan At-Tauhid" (`/logo.png`), heading "Ruang Ujian Santri", badge "Pesantren Islamic Centre At-Tauhid", dan formulir bernomor 1–5 dengan tombol konfirmasi sebagai langkah ke-6.

2. **Perilaku Pilihan Lembaga dan Kelas Dinamis — `Passed`**
   - Sebelum lembaga dipilih, pemilih kelas berstatus `disabled` dengan teks "Pilihan kelas dinonaktifkan hingga lembaga dipilih".
   - Memilih `SMPITA` mengaktifkan pemilih kelas; opsi yang dimuat: `7A (SMPITA)` sampai `9C (SMPITA)`.
   - Memilih `7A (SMPITA)` berhasil. Setelah lembaga diubah ke `MTA`, pemilih kelas kembali ke "Pilih kelas santri..." (kosong) dan opsinya berganti menjadi `MTA 1 (MTA)` sampai `MTA 6 (MTA)`.

3. **Validasi Token Tidak Valid — `Passed`**
   - Token `999XYZ` ditolak dengan blok "Token Tidak Dapat Digunakan" dan pesan "Token ujian tidak berlaku lagi. Minta token terbaru kepada pengawas, lalu ketik ulang token tersebut." Isian NISN, lembaga, kelas, dan nama tetap terisi.

4. **Verifikasi Token Valid & Pratinjau Ujian — `Passed` dengan catatan**
   - Token `UAFBB3` memunculkan blok "Sesi Ujian Ditemukan & Siap Diakses" berisi Judul Ujian "E2E Gerbang Sesi", Mata Pelajaran "AQIDAH", Durasi Waktu "60 Menit", dan Jumlah Soal "2 Butir".
   - Catatan: pratinjau tidak memuat baris **Tingkat Kelas** seperti tertulis pada skenario; sebagai gantinya tampil "Jumlah Soal". `verifySessionToken` mengembalikan `gradeLevel`, tetapi panel pratinjau tidak merendernya (temuan rendah di bawah).

5. **Pengisian Data Santri & Masuk Sesi Ujian — `Failed`**
   - NISN `24.02.001` memunculkan "Santri Terverifikasi: Abdillah"; lembaga `SMPITA` dan kelas `9A` terkunci "Terkunci Otomatis (Master Santri)", isian nama `Abdillah` menjadi `readOnly`.
   - Menekan "Konfirmasi & Masuk Ruang Ujian" menampilkan layar "Terhubung ke Sesi Ujian" berisi judul sesi, durasi 60 menit, nama santri, nomor induk, dan lima butir tata tertib.
   - Pencatatan peserta terbukti di basis data: `examParticipants` memuat baris `jn70fmm70en9x1ww5jsdnbvpch8hmqfr` (NISN `24.02.001`, nama `Abdillah`, kelas `9A`, status `in_progress`, `tokenUsed` `UAFBB3`).
   - **Gagal**: toast sukses tidak pernah tampil. Tidak ada elemen `[data-sonner-toast]` maupun wadah notifikasi di DOM setelah aksi; penyebabnya temuan tinggi di bawah.

6. **Transisi ke Lembar Pengerjaan — `Passed`**
   - "Mulai Mengerjakan Ujian" membuka lembar pengerjaan: mata pelajaran `AQIDAH`, penanda `1/2`, timer hitung mundur `59:43`, butir "Iman kepada Allah termasuk rukun iman yang ke berapa?" dengan opsi A–D, tombol Sebelumnya/Ragu-ragu/Berikutnya, serta grid nomor `Soal Nomor 1` dan `Soal Nomor 2`.
   - Console browser hanya berisi pesan `info` React DevTools dan `log` HMR; **tidak ada** pesan `Warning:`/`Error:` React maupun crash "Rendered fewer hooks than expected". Cacat historis tidak kembali.
   - Batasan: viewport otomasi 474×570 px, sehingga tata letak 3-panel desktop tidak dapat dilihat langsung. DOM memuat panel-panelnya dengan kelas `hidden lg:block` (Wacana/Stimulus, Soal, navigasi), konsisten dengan perilaku responsif UJIAN-AC-007.

7. **Regresi Sekitar: Keluar dan Masuk Ulang — `Failed`**
   - **Gagal**: tidak ada tindakan keluar di dalam lembar pengerjaan. Header hanya memuat tombol grid `1/2`, timer, dan "Selesaikan Ujian"; prop `onExit` diberikan pada `ExamWorksheet` tetapi tidak pernah dipanggil di dalam komponen.
   - Pengganti yang diuji: memuat ulang `/ujian`, memasukkan kembali NISN `24.02.001` + token `UAFBB3`. Peserta yang sama dilanjutkan (`isResumed`), layar ringkasan tampil, lalu "Mulai Mengerjakan Ujian" membuka lembar dengan jawaban sebelumnya utuh: opsi A masih terpilih dan grid nomor 1 berwarna hijau "terjawab" sementara nomor 2 masih abu-abu. `studentAnswers` memuat baris untuk peserta `jn70fmm...` dengan `selectedOptionId` `a`. Transisi bolak-balik tidak menghasilkan error console.
   - **Gagal**: toast "Melanjutkan kembali sesi ujian Anda yang sedang berlangsung." tidak tampil (penyebab sama dengan skenario 5).

### Pengulangan Setelah Perbaikan `BUG-002` — 2026-11-05

`<Toaster />` sekarang dipasang sekali di [apps/app/layout.tsx:55](file:///D:/DATA/PROJEK/IMTIHAN/apps/app/layout.tsx#L55) dan dijaga `tests/toaster-mount.test.ts`. Validasi statis: 345/345 tes lolos, `tsc --noEmit` bersih, lint 0 error.

- Data uji sementara: bank "E2E Toaster Bank" (AQIDAH, SMPITA, Kelas 9) berisi 2 butir soal; sesi "E2E Toaster Sesi" token `TST002` (aktif, 60 menit, tanpa acak); santri master `24.02.001` (Abdillah, SMPITA, 9A).
- Skenario 4 (`Passed`): token `TST002` memunculkan "Sesi Ujian Ditemukan & Siap Diakses" berisi Judul "E2E Toaster Sesi", Mata Pelajaran "AQIDAH", Durasi "60 Menit", Jumlah Soal "2 Butir". Tingkat kelas tetap tidak dirender (temuan rendah di bawah).
- Skenario 5 (`Passed`): "Konfirmasi & Masuk Ruang Ujian" mencatat peserta dan menampilkan toast `Berhasil masuk ke ruang ujian! Silakan baca instruksi berikut.` — `MutationObserver` menangkap node `[data-sonner-toast]` dan wadah `[data-sonner-toaster]` muncul di DOM.
- Skenario 6 (`Passed`): "Mulai Mengerjakan Ujian" menampilkan lembar pengerjaan (AQIDAH, timer `59:46`, dua butir) dengan toast `Mempersiapkan lembar soal ujian...`. Console hanya berisi info React DevTools dan log HMR; tidak ada `Warning:`/`Error:`.
- Skenario 7 (`Failed` pada bagian aksi keluar, `Passed` pada bagian lanjut sesi): tombol keluar dari lembar pengerjaan tetap tidak ada (`onExit` hanya dipakai pada keadaan terminal), sehingga langkah "keluar ke ringkasan lalu mulai lagi" tidak dapat dijalankan. Jalur pengganti terbukti: jawab opsi B pada butir 1 → `studentAnswers` menyimpan `selectedOptionId: "b"` → muat ulang `/ujian` dan masukkan kembali NISN `24.02.001` + token `TST002` → toast `Melanjutkan kembali sesi ujian Anda yang sedang berlangsung.` tampil → lembar pengerjaan dibuka dengan opsi B masih terpilih dan timer berjalan `58:53`.
- Pembersihan: peserta, jawaban, sesi, butir, dan bank uji dihapus lewat modul sementara; `npx convex data` tidak lagi menemukan baris uji, berkas modul dihapus, dan `npx convex dev --once` → `Convex functions ready!`.

### Temuan

- **Tinggi — seluruh notifikasi toast senyap.** (Selesai 2026-11-05; diverifikasi ulang di browser.) `components/ui/sonner.tsx` mengekspor `Toaster`, tetapi tidak ada satu pun berkas yang mengimpornya — `app/layout.tsx` dan `app/(main)/layout.tsx` tidak memasangnya. Akibatnya `toast.success/info/error` di 16 berkas (termasuk [apps/app/ujian/page.tsx:179](file:///D:/DATA/PROJEK/IMTIHAN/apps/app/ujian/page.tsx#L179), [:181](file:///D:/DATA/PROJEK/IMTIHAN/apps/app/ujian/page.tsx#L181), [:596](file:///D:/DATA/PROJEK/IMTIHAN/apps/app/ujian/page.tsx#L596)) tidak pernah dirender. Bukti DOM: tidak ada `section[aria-label*="Notifications"]` maupun `[data-sonner-toast]` setelah aksi sukses dan aksi lanjutkan sesi. Dampaknya melampaui gerbang santri: umpan balik galat pada layar pengajar juga tidak terlihat.
- **Sedang — tidak ada jalan kembali ke ringkasan dari lembar pengerjaan.** Prop `onExit` diteruskan pada [apps/app/ujian/page.tsx:208](file:///D:/DATA/PROJEK/IMTIHAN/apps/app/ujian/page.tsx#L208) tetapi `ExamWorksheet` tidak memanggilnya. Skenario 7 bagian pertama tidak dapat dijalankan sebagaimana tertulis; alur yang terbukti adalah muat ulang halaman. Ini perlu keputusan produk: menambah aksi keluar atau menghapus langkah tersebut dari spek.
- **Rendah — pratinjau token tidak menampilkan tingkat kelas.** `verifySessionToken` mengirim `gradeLevel` ([apps/convex/examSession/public/queries.ts:168](file:///D:/DATA/PROJEK/IMTIHAN/apps/convex/examSession/public/queries.ts#L168)), tetapi panel pratinjau di [apps/app/ujian/page.tsx:459](file:///D:/DATA/PROJEK/IMTIHAN/apps/app/ujian/page.tsx#L459) tidak merendernya dan memilih menampilkan jumlah soal.
- **Batasan alat (bukan cacat produk).** Kanal otomasi hanya menyediakan satu tab dengan viewport 474×570 px dan tidak menyediakan tangkapan layar native; tata letak 3-panel desktop diverifikasi lewat struktur DOM, bukan visual.

### Pembersihan data uji

- Modul sementara `apps/convex/tmpE2e/cleanup.ts` menghapus peserta, jawaban, sesi "E2E Gerbang Sesi", butir, dan bank "E2E Gerbang Bank" secara berantai (karena `deleteExamSession` tidak menghapus turunannya).
- Panggilan pertama menghapus semua baris; panggilan kedua mengembalikan `{answers:0, banks:0, participants:0, questions:0, sessions:0}`. Pemeriksaan `npx convex data` pada `examSessions`, `questionBanks`, `studentAnswers`, dan `examParticipants` menunjukkan 0 kecocokan. Berkas modul sementara dihapus dan `npx convex dev --once` → `Convex functions ready!`.

### Langkah berikutnya

- Temuan tinggi toast sudah diperbaiki (`BUG-002`) dan skenario 5 serta bagian lanjut sesi pada skenario 7 kini `Passed`.
- Putuskan temuan sedang (aksi keluar dari lembar pengerjaan) sebelum skenario 7 dapat dinyatakan `Passed` penuh.
- Temuan rendah tingkat kelas pada pratinjau token masih terbuka.
