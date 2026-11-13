# Spesifikasi Perubahan: Batas Nilai Tuntas dan Sesi Lanjutan Remedial/Susulan

- **ID**: `CHG-007`
- **Fase**: `phase-02`
- **Requirements**: `SESI-FR-008`, `SESI-FR-009`, `SESI-AC-008`
- **Dependensi**: `TASK-003` (backend sesi + peserta) dan `TASK-004` (layar jadwal sesi) — keduanya `done`.
- **Workflow**: `feature`, dengan dukungan `ui-design` dan `ui-review`.

## Masalah

Sesi ujian saat ini tidak menyimpan batas nilai tuntas sendiri. Rekap memakai angka 75 yang ditulis mati di

- `apps/app/(main)/rekap-nilai/page.tsx:87` dan `:138`, sementara `getExamSession` meminjam `passingScore` paket bank soal (`apps/convex/examSession/public/queries.ts:88`). Akibatnya pengajar tidak bisa menentukan atau mengosongkan batas tuntas per sesi, dan sesi tanpa batas tuntas tetap menampilkan penanda tuntas palsu.

Belum ada jalur membuat sesi remedial atau susulan. Sesi hanya bisa dibuat dari formulir jadwal kosong, sehingga pengajar harus menyalin pengaturan secara manual dan seluruh santri dapat masuk kembali. Tidak ada kolom jenis sesi, rujukan sesi sumber, maupun daftar peserta terpilih pada `examSessions` (`apps/convex/schema.ts:83-101`).

Mode penegakan integritas juga belum tersimpan, padahal `SESI-FR-009` meminta nilainya ikut tersalin ke sesi lanjutan. Pekerjaan ini menyimpan nilainya agar penyalinan benar-benar terjadi; pemilihan mode dan perilaku penguncian tetap milik `CHG-009`.

## Perilaku yang diinginkan

1. Formulir jadwal sesi memiliki isian angka opsional **Batas nilai tuntas**. Kosong berarti sesi tidak punya batas tuntas. Nilai yang sah adalah bilangan bulat 0–100.
2. Batas tuntas yang tersimpan pada sesi menjadi sumber tunggal untuk rekap. Sesi tanpa batas tuntas menampilkan nilai tanpa penanda tuntas; angka rata-rata, tertinggi, dan terendah tidak berubah karena pengisian batas tuntas.
3. Kartu sesi berstatus selesai menampilkan aksi **Buat Remedial / Susulan**. Layar monitoring juga menampilkan aksi yang sama saat sesi terpilih berstatus selesai.
4. Formulir sesi lanjutan berisi:
   - jenis sesi: remedial atau susulan;
   - judul terisi otomatis dari judul sesi sumber dan dapat diubah;
   - waktu mulai dan batas akhir;
   - pengaturan yang tersalin dan masih dapat diubah: bank soal, durasi, dua pengacakan, batas tuntas, serta mode penegakan beserta ambangnya;
   - daftar peserta dari santri yang pernah masuk sesi sumber, dengan semua kotak centang kosong;
   - pada jenis remedial, sakelar **Nilai maksimal dibatasi sampai batas tuntas** aktif sebagai bawaan dan dapat dimatikan; pada susulan sakelar tidak ditampilkan.
5. Sesi lanjutan dibuat sebagai `draft`, memakai token unik baru, dan menyimpan `kind`, `sourceSessionId`, serta `eligibleNisns` berisi santri yang dicentang. Minimal satu peserta harus dipilih.
6. Gerbang masuk santri (`enterExamSession`) menolak nomor induk yang tidak ada pada `eligibleNisns` sesi lanjutan dengan kalimat yang bisa dipahami. Sesi tanpa `eligibleNisns` tetap terbuka seperti sekarang.
7. Sesi sumber tidak diubah sama sekali: tidak ada patch, tidak ada penyalinan peserta otomatis, dan perubahan pada sesi lanjutan tidak menyentuh sesi sumber.
8. Jenis sesi dan nama sesi sumber hanya dikirim oleh query milik pengajar (`listExamSessions`, `getExamSession`). Payload santri (`verifySessionToken`, `getStudentExamSheet`) tidak memuat jenis, sumber, batas tuntas, maupun daftar peserta.
9. Sesi lanjutan dari sesi lanjutan menunjuk sesi sumber terdekat yang dipilih, bukan sesi asal pertama.
10. Pengunjung tanpa login dan pengajar lain tidak melihat sesi lanjutan milik orang lain karena daftar dan detail tetap disaring `creatorTokenIdentifier`.

## Di luar cakupan

- Pemilihan mode penegakan dan perilaku mengunci lembar setelah ambang pada formulir sesi reguler — tetap milik `CHG-009`. Pekerjaan ini hanya menyimpan nilai bawaan `record`/ambang 3 dan mengizinkan penyalinan serta penyuntingan di formulir sesi lanjutan.
- Pemotongan nilai remedial saat perhitungan akhir, analisis butir, kelompok remedial/pengayaan, dan kolom jenis pada rekap — milik `CHG-010`. Pekerjaan ini hanya menyimpan `capAtPassingScore`.
- Rotasi token berkala (`CHG-008`).
- Penyuntingan sesi setelah dibuat (layar sunting sesi belum ada).

## Keadaan saat ini (bukti)

- `apps/convex/schema.ts:83` — `examSessions` belum punya kolom batas tuntas, jenis, sumber, peserta terpilih, maupun mode penegakan.
- `apps/convex/examSession/public/mutations.ts:9` — `createExamSession` hanya menerima judul, bank, waktu, durasi, dan dua pengacakan.
- `apps/convex/examSession/public/mutations.ts:241` — `enterExamSession` memeriksa status sesi dan identitas santri, tetapi tidak memeriksa daftar peserta sesi lanjutan.
- `apps/convex/examSession/public/queries.ts:88` — batas tuntas diambil dari paket bank soal dengan bawaan 75.
- `apps/app/(main)/rekap-nilai/page.tsx:87` dan `:138` — KKM 75 ditulis mati.
- `apps/app/(main)/sesi-ujian/page.tsx:621` — kartu sesi selesai hanya punya "Buka Kembali" dan hapus.
- `apps/app/(main)/monitoring-sesi/page.tsx:237` — header hanya menampilkan badge status dan jenjang.
- `apps/tests/recap-export.test.ts:23` dan `apps/tests/exam-session.test.ts:23` — mengunci label dan bidang lama; keduanya harus tetap lolos dan diperluas.

## Urutan implementasi

1. `apps/convex/schema.ts`: kolom opsional `passingScore`, `kind`, `sourceSessionId`, `capAtPassingScore`, `eligibleNisns`, `enforcementMode`, `violationThreshold` pada `examSessions`.
2. `apps/convex/examSession/public/mutations.ts`:
   - `createExamSession` menerima dan memvalidasi `passingScore` serta menyimpan mode penegakan bawaan;
   - `createContinuationSession` baru (pemilik, sesi sumber selesai, penyalinan pengaturan, validasi peserta, token unik);
   - `enterExamSession` menegakkan `eligibleNisns`.
3. `apps/convex/examSession/public/queries.ts`: `listExamSessions` dan `getExamSession` memulangkan `kind`, `sourceTitle`, dan `passingScore` milik sesi; payload santri tidak berubah.
4. `apps/lib/session-continuation.ts`: label jenis, judul otomatis, dan penafsir isian batas tuntas yang murni dan dapat diuji.
5. `apps/components/sesi-ujian/session-continuation-dialog.tsx`: formulir sesi lanjutan lengkap dengan keadaan muat, kosong, galat, dan peserta kosong.
6. `apps/app/(main)/sesi-ujian/page.tsx`: isian batas tuntas, aksi sesi lanjutan pada kartu selesai, label jenis dan sumber.
7. `apps/app/(main)/monitoring-sesi/page.tsx`: aksi sesi lanjutan pada header saat sesi terpilih selesai.
8. `apps/app/(main)/rekap-nilai/page.tsx`: batas tuntas dari sesi, penanda hanya muncul bila batas tuntas terisi, CSV ikut menyesuaikan.
9. Tes baru `apps/tests/session-continuation.test.ts` dan perluasan tes sesi/rekap yang ada.
10. `specs/e2e/batas-tuntas-sesi-lanjutan.md`: handoff perjalanan browser.

## Risiko dan mitigasi

- **Batas tuntas lama berubah diam-diam.** Sesi yang sudah ada tidak punya `passingScore`, sehingga rekapnya berhenti menampilkan penanda tuntas. Ini disengaja oleh `NILAI-AC-009`; kartu rekap menjelaskan "Batas tuntas sesi belum diisi" alih-alih menampilkan angka palsu.
- **NISN berbeda penulisan saat masuk ulang.** Perbandingan daftar peserta memakai trim dan huruf kecil; pesan penolakan menyebut nomor induk tidak termasuk daftar sehingga santri dapat meminta pengajar memeriksa ejaannya.
- **Peserta sesi sumber tidak lengkap.** Daftar peserta hanya berisi santri yang benar-benar sudah masuk sesi sumber; santri yang belum pernah masuk tidak dapat dipilih karena datanya tidak ada. Formulir menampilkan keadaan kosong dengan penjelasan.
- **Sesi sumber berubah status setelah formulir dibuka.** Mutasi memeriksa ulang status `ended` di server; kegagalan mempertahankan isian formulir.
- **Tabrakan token.** Token baru memakai pembangkit dan pengulangan yang sama dengan pembuatan sesi biasa.

## Kriteria penerimaan terukur

- `createExamSession` tanpa `passingScore` menyimpan sesi tanpa batas tuntas; dengan `passingScore: 80` tersimpan 80. Nilai negatif, desimal, atau di atas 100 ditolak dengan pesan yang bisa dipahami.
- Rekap untuk sesi tanpa batas tuntas menampilkan tanda hubung pada kartu ketuntasan dan kolom ketuntasan CSV; rekap sesi berbatas tuntas 80 memakai 80, bukan 75.
- `createContinuationSession` menyalin bank, durasi, pengacakan, batas tuntas, dan mode penegakan dari sesi sumber, lalu perubahan argumen mengalahkan salinan.
- Sesi lanjutan menyimpan `kind`, `sourceSessionId`, `capAtPassingScore` (true untuk remedial secara bawaan, false untuk susulan), dan `eligibleNisns` tanpa duplikat.
- Sesi sumber tidak berubah setelah pembuatan sesi lanjutan: judul, pengaturan, status, dan daftar peserta tetap sama.
- Mutasi menolak sesi sumber yang belum selesai, pengguna anonim, pengajar lain, daftar peserta kosong, dan nomor induk yang bukan peserta sesi sumber.
- `enterExamSession` menolak nomor induk di luar `eligibleNisns` dan tetap menerima peserta yang dicentang.
- `listExamSessions` hanya memulangkan sesi milik pemanggil dan menyertakan `kind`, `sourceTitle`, serta `passingScore`; `verifySessionToken` dan `getStudentExamSheet` tidak memuat ketiganya.
- Formulir sesi lanjutan menampilkan semua peserta dengan kotak centang kosong, menonaktifkan tombol simpan saat belum ada yang dicentang, dan menyembunyikan sakelar pembatasan nilai pada jenis susulan.
- Tidak ada kode spesifikasi teknis pada teks antarmuka yang diubah.

## Perintah validasi

- `node --test tests/session-continuation.test.ts` dan `node --test tests/exam-session.test.ts` dari `apps/`.
- `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`.
- `npx convex dev --once` dari `apps/`.
- Probe CLI pada deployment pengembangan untuk pemilik, pengajar lain, dan anonim; termasuk pemeriksaan sesi sumber tidak berubah dan gerbang peserta.
- Pemindaian regex kebocoran kode spesifikasi pada seluruh berkas UI yang diubah.

## E2E

`Required` — pemilihan peserta, penyalinan pengaturan, dan tampilan sesi lanjutan hanya terbukti penuh lewat peramban. Handoff ke `specs/e2e/batas-tuntas-sesi-lanjutan.md` dengan status `Pending`.
