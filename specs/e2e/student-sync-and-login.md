# Spesifikasi Validasi E2E: Sinkronisasi Data Santri SiPAKSa & Ruang Ujian Santri

- **Status**: `Passed` (dijalankan 2026-11-06: skenario 1 dan 3 `Passed` sejak awal; skenario 2 semula `Failed`, diperbaiki lewat `/bug` S-1, lalu diulang dan `Passed`. Penarikan SiPAKSa terakhir — atas izin eksplisit pengguna — sudah menyimpan NISN bernol-depan, dan skenario 1 serta 2 diulang sekali lagi di atas data itu; keduanya `Passed`)
- **Lingkungan**: Local development `http://localhost:3000`, Convex dev deployment `quirky-rat-737`, akun `pengajar.uji@example.com`

## Klasifikasi E2E
- **Klasifikasi**: Recommended
- **Komponen Terkait**:
  - `apps/convex/students/` (Backend Actions, Queries, Mutations)
  - `apps/app/(main)/santri/page.tsx` (Dashboard Manajemen Santri & Trigger Sinkronisasi)
  - `apps/app/ujian/page.tsx` (Pintu Masuk Ruang Ujian Santri)

## Skenario Pengujian Alur Santri

### Skenario 1: Penarikan Data dari SiPAKSa
1. **Prasyarat**: Pengajar/Admin login dan membuka menu `/santri`.
2. **Aksi**: Pengguna menekan tombol "Tarik Data dari SiPAKSa".
3. **Ekspektasi**:
   - Sistem menampilkan status loading sinkronisasi.
   - Muncul notifikasi toast sukses yang merangkum jumlah santri terfilter (346 santri).
   - Kartu statistik menampilkan:
     - Total Santri: 346
     - SMPITA: 245
     - SMAITA: 78
     - MTA: 23
   - Filter tab SMPITA, SMAITA, dan MTA menampilkan daftar santri masing-masing tanpa ada data SDITA/TK.

### Skenario 2: Masuk Ujian dengan NISN (SMPITA / SMAITA)
1. **Prasyarat**: Sesi ujian aktif tersedia dengan token yang valid.
2. **Aksi**: Santri membuka `/ujian` dan memasukkan NISN (contoh: `0127121695`).
3. **Ekspektasi**:
   - Sistem secara instan mencocokkan master data santri.
   - Banner "Santri Terverifikasi: Abdillah (SMPITA - 9A)" muncul.
   - Bidang nama dan kelas terisi secara otomatis tanpa perlu diketik manual.
   - Santri memasukkan token ujian dan berhasil masuk ke lembar ujian.

### Skenario 3: Masuk Ujian Santri Ma'had Tahfidz (MTA) Tanpa NISN
1. **Prasyarat**: Santri MTA tidak memiliki nomor NISN resmi.
2. **Aksi**: Santri membuka `/ujian` dan memasukkan ID Santri (contoh: `21.04.001`).
3. **Ekspektasi**:
   - Sistem mengenali ID Santri dan melakukan verifikasi.
   - Banner "Santri Terverifikasi: Bilal Putra Wijaya (MTA - MTA 6)" muncul.
   - Santri tidak diblokir oleh validasi NISN dan dapat memulai pengerjaan ujian.

## Bukti Eksekusi (Evidence)

### 2026-11-06 — eksekusi `/e2e-tester`

Prasyarat & otorisasi: penarikan data SiPAKSa dilakukan atas izin eksplisit pengguna pada sesi ini (aksi disebut persis: "Tarik Data dari SiPAKSa"). Endpoint sumber tertanam di `apps/convex/students/public/actions.ts:7` — `https://sipaksa.azaseradigital.workers.dev/api/setoran?status=aktif&limit=3000` — dan aksinya hanya bisa dipanggil pengajar yang login (pengetatan authz sebelumnya).

Keterbatasan alat: tab otomatisasi berstatus `hidden` dengan `innerWidth = 0`, tanpa tangkapan layar; bukti berupa teks DOM, nilai field, toast `[data-sonner-toast]`, dan `npx convex data`.

Fixture sesi (dibuat oleh klien Convex halaman sebagai `pengajar.uji`, lalu dihapus — lihat Pembersihan):

- Paket "E2E Sync Login" `j575v0rtfw1ss14ycj72qqw4wh8hnt11` — FIQIH / SMPITA / Kelas 9, 2 butir PG 25 poin (`j972y94nm7fmnatfr2y3xg0r398hn8xa`, `j9739bb858pvtgmxexsc1rgpnd8hnmyg`).
- Sesi "E2E Sync Login" `jh7b0yp3dxx1fjxkjvsfeqez1x8hn0j5`, token `EX267L`, status `active`, durasi 60 menit.
- Browser diautentikasi keluar dari akun pengajar sebelum masuk `/ujian` (`/api/auth/sign-out` → 200 `{"success":true}`) agar perjalanan benar-benar lewat gerbang anonim santri.

1. **Penarikan Data dari SiPAKSa** — *Passed, dengan pembaruan angka.*
   - Aksi: login pengajar → `/santri` → klik "Tarik Data dari SiPAKSa".
   - Ekspektasi: status loading, toast sukses yang merangkum jumlah santri terfilter (346), kartu statistik Total 346 / SMPITA 245 / SMAITA 78 / MTA 23, dan tab filter hanya menampilkan SMPITA/SMAITA/MTA tanpa SDITA/TK.
   - Aktual: selama pemrosesan tombol berubah menjadi **"Sinkronisasi SiPAKSa..."** dalam keadaan `disabled` dengan 1 spinner (`svg.animate-spin`), dan blok "Mempersiapkan…" tampil. Setelah selesai: toast **"Sinkronisasi berhasil! 353 santri aktif (SMP: 246, SMA: 84, MTA: 23) siap digunakan."**; kartu membaca Total Santri Aktif **353**, SMPITA/SMP **246** ("10 Rombel (Kelas 7, 8, 9)"), SMAITA/SMA **84** ("4 Rombel (Kelas 10, 11, 12)"), MTA (Tahfidz) **23** ("6 Tingkatan (MTA 1 s.d. 6)"); tabel `tbody` berisi 353 baris.
   - Tab filter: "Semua Lembaga" 353 baris (jenjang unik = MTA, SMAITA, SMPITA), "SMPITA" 246 baris (hanya SMPITA; contoh kelas 7A, 7B, 7C, 8A–8D, 9A), "SMAITA" 84 baris (hanya SMAITA; 10A, 11A, 11B, 12A), "MTA" 23 baris (hanya MTA; MTA 1–MTA 6). **Tidak ada SDITA/TK.** 0 error konsol.
   - Deviasi: angka harapan spec (346/245/78/23) adalah snapshot lama; hasil penarikan langsung hari ini 353/246/84/23. Perbandingan sebelum/sesudah penarikan pada deployment yang sama: kartu semula 346/245/78/23 → sesudah 353/246/84/23 (perubahan berasal dari data sumber, bukan dari aplikasi). Jumlah baris `students` terverifikasi 353 melalui `npx convex data students --limit 500`.

2. **Masuk Ujian dengan NISN (SMPITA / SMAITA)** — *Failed persis seperti tertulis; Passed dengan bentuk yang tersimpan.*
   - Contoh spec (`0127121695` → Abdillah SMPITA 9A) ternyata **ada** di master data hasil sinkronisasi, tetapi tersimpan sebagai `nisn = "127121695"` (tanpa nol depan; penyebab hilangnya nol belum diverifikasi pada sumber SiPAKSa): baris tabel `[177, 24.02.001, Abdillah, SMPITA, 9A, 127121695, Non Asrama, Mahmudin, Aktif]`.
   - Aksi A (input spec harfiah `0127121695` pada `#nisn`, jeda 3 s): **tidak** muncul banner verifikasi, `#student-name` tetap kosong, dan pemilih lembaga/kelas tetap pada placeholder. `lookupStudent` (`apps/convex/students/public/queries.ts:100-139`) hanya membandingkan persis (`v.eq("nisn", clean)` dan fallback `toLowerCase()`, tanpa normalisasi nol depan), sehingga `0127121695` tidak cocok.
   - Aksi B (input `127121695`): banner **"Santri Terverifikasi: Abdillah"** muncul, field `#student-name` terisi otomatis "Abdillah", pemilih lembaga ter-setel **"SMPITA (SMP Islam Terpadu At-Tauhid)"** dan kelas **"9A (SMPITA)"** tanpa mengetik manual — perilaku yang diminta spec, kecuali banner tidak menyertakan "(SMPITA - 9A)" seperti teks harapan (lembaga/kelas terlihat pada dropdown-nya masing-masing).
   - Lanjutan: token `EX267L` → toast **"Berhasil masuk ke ruang ujian! Silakan baca instruksi berikut."**, layar "Terhubung ke Sesi Ujian / 60 Menit / E2E Sync Login" dengan baris "Nama Santri: Abdillah" dan "Nomor Induk (NISN/NIS): 127121695" (keduanya terisi, berbeda dari temuan layar akhir pada spec lembar kerja). Tombol "Mulai Mengerjakan Ujian" membuka lembar kerja: header FIQIH, "1/2", hitung mundur 59:40, butir "SYN-1 Butir uji masuk ruang ujian" dengan opsi A/B.
   - Catatan placeholder: bidang `#nisn` mencontoh **"Contoh: 0123456789 atau 24.02.001..."**, yaitu format bernol-depan yang justru gagal terverifikasi — ini yang membuat skenario 2 dinilai `Failed`, bukan sekadar data uji usang.

3. **Masuk Ujian Santri Ma'had Tahfidz (MTA) Tanpa NISN** — *Passed.*
   - `/ujian` dimuat ulang (identitas sebelumnya tidak mengikat), input `21.04.001` pada bidang nomor induk.
   - Banner **"Santri Terverifikasi: Bilal Putra Wijaya"**, `#student-name` = "Bilal Putra Wijaya", lembaga **"MTA (Madrasah Tarbiyatul Aimmah)"**, kelas **"MTA 6 (MTA)"** — cocok dengan harapan nama/jenjang/rombel spec.
   - Token `EX267L` → toast masuk ruang ujian, layar sesi tampil, dan "Mulai Mengerjakan Ujian" membuka lembar kerja (FIQIH 1/2, hitung mundur 59:54, butir SYN-1). Santri tidak diblokir validasi NISN: master data santri ini tidak punya `nisn` 10 digit (kolom NISN/NIS menampilkan `2223.03.0034` dari field `nis`), sehingga jalur pencocokan lewat `santriId` bekerja.
   - Deviasi penamaan: spec menulis "(MTA - MTA 6)" sedangkan UI menampilkannya lewat dua kontrol terpisah, dan UI gerbang menyebut MTA "Madrasah Tarbiyatul Aimmah" (`apps/convex/model/institutions.ts:16`, `apps/app/ujian/page.tsx:307,322`) sementara `/santri` menyebut "Ma'had Tahfidz (MTA)" (`apps/app/(main)/santri/page.tsx:89`).

- Catatan eksekusi pertama: tidak ada perubahan kode produk selama pengujian ini; perubahan baru dibuat pada bagian perbaikan S-1 di bawah.

### 2026-11-06 — perbaikan S-1 (`/bug`) dan pengulangan skenario 2
Keputusan pengguna: **NISN resmi memang bernol-depan** (kata pengguna: "NISN ada 0 didepan"), sehingga S-1 dinyatakan defect yang harus diperbaiki, bukan teks placeholder yang harus diubah.

Akar masalah (bukti, bukan dugaan):

- `GET https://sipaksa.azaseradigital.workers.dev/api/setoran?status=aktif&limit=3000` (dipanggil dari `node`, 1.152 baris) mengembalikan `{"nama":"Abdillah","nisn":"127121695","nisnType":"string","nis":"2538001120","santriId":"24.02.001"}`. Jadi **sumber SiPAKSa sendiri mengirim string tanpa nol depan** — sinkronisasi E-Imtihan tidak membuangnya (`apps/convex/students/public/actions.ts:56` hanya `String(s.nisn).trim()`).
- Yang gagal adalah pencocokan: `lookupStudent` (`apps/convex/students/public/queries.ts`) dan `enterExamSession` (`apps/convex/examSession/public/mutations.ts`) membandingkan string persis (trim + `toLowerCase()`), sehingga `0127121695` ≠ `127121695`. Daftar peserta sesi lanjutan lewat `normalizeNisn` (`apps/convex/examSession/private/helpers.ts`) punya lubang yang sama.

Perbaikan (normalizer satu sumber, `apps/convex/model/nisn.ts`):

1. `canonicalIdentifier()` — trim, huruf kecil, dan buang nol depan **hanya** untuk nilai yang seluruhnya digit, supaya ID non-numerik seperti `24.02.001` tidak berubah makna. `identifierMatches()` membandingkan dua nilai lewat bentuk kanonik itu.
2. `lookupStudent` memakai `identifierMatches` pada pemindaian fallback (`queries.ts:129-137`); `enterExamSession` memakai `identifierMatches` (`mutations.ts:509-517`) dan `normalizeNisn` kini meneruskan ke `canonicalIdentifier` (`helpers.ts:69-74`) sehingga roster sesi lanjutan ikut toleran.
3. Pencegahan regresi baru: peserta kini disimpan dengan **nomor induk resmi dari master** (`officialNisn`, `mutations.ts:563-566`, dipakai pada pencarian `by_session_and_nisn` dan `insert`). Tanpa langkah ini, santri yang sama bisa membuat dua baris peserta hanya karena berbeda format ketik.

Validasi non-browser:

- `node --test tests/nisn-identifier.test.ts` → 9 lulus (normalisasi nol depan, ID non-numerik utuh, nilai tepi `""`/`"0"`/`"000"`, nomor berbeda tetap tidak cocok, kolom `undefined` diabaikan, plus regression test pemasangan helper).
- `npm test` → 354 lulus / 0 gagal. `npx tsc --noEmit` → bersih. `npx eslint` → 0 error, 46 peringatan lama (tak tersentuh).
- `npx convex dev --once` → `✔ Convex functions ready!` tiga kali (12.08 s saat deploy perbaikan, 9.1 s saat pasang unduh-fixture, 7.9 s saat modul unduh dihapus).
- Uji integrasi langsung ke deployment dev: `npx convex run students/public/queries:lookupStudent '{"identifier":"0127121695"}'` → `{nama:"Abdillah", jenjang:"SMPITA", kelas:"9A", santriId:"24.02.001"}`; `127121695` → hasil identik; `99.99.999` → `null`.
- Satu perubahan konfigurasi ikut diperlukan agar tes dapat mengimpor modul TS backend: `"allowImportingTsExtensions": true` di `apps/tsconfig.json` (proyek sudah `noEmit`, bangun Next memakai SWC).

Fixture pengulangan (dibuat lewat klien Convex halaman sebagai `pengajar.uji@example.com`, lalu dihapus): paket "E2E S1 Nol Depan" `j574taznj64dkrw9vq4859kfqh8hp3hh` (FIQIH/SMPITA/Kelas 9, 2 butir PG 50 poin) dan sesi `jh72weegc5fa8ht014v5pydp6x8hpvrf` token `ALMRWY` status `active` 60 menit. Browser keluar login (`/api/auth/sign-out` → sesi `null`) agar lewat gerbang anonim.

2. **Masuk Ujian dengan NISN (SMPITA / SMAITA)** — *Passed setelah perbaikan.*
   - Aksi: `/ujian`, isi `#nisn` dengan bentuk spec harfiah `0127121695`, jeda 2,5 s.
   - Aktual: banner **"Santri Terverifikasi: Abdillah"** langsung muncul; `#student-name` terisi otomatis "Abdillah"; lembaga terkunci **"SMPITA (SMP Islam Terpadu At-Tauhid)"** dan kelas **"9A (SMPITA)"** — keduanya berlabel "Terkunci Otomatis (Master Santri)". Tidak ada pengetikan manual.
   - Aksi lanjut: token `ALMRWY` pada `#exam-token` → "Konfirmasi & Masuk Ruang Ujian" → toast **"Berhasil masuk ke ruang ujian!"**, layar "Terhubung ke Sesi Ujian / 60 Menit / E2E S1 Nol Depan", "Nama Santri: Abdillah", **"Nomor Induk (NISN/NIS): 127121695"** (bentuk resmi master tersimpan, meskipun santri mengetik nol depan). "Mulai Mengerjakan Ujian" membuka lembar kerja dengan hitung mundur berjalan (59:24).
   - Regresi identitas ganda: muat ulang `/ujian`, ketik ulang `0127121695` + token yang sama → sistem menyambung kembali peserta yang ada, dan `npx convex data examParticipants --limit 500` menghitung **1** baris untuk sesi fixture. Tidak ada baris peserta ganda.
   - Regresi ID non-numerik (skenario 3 diulang dengan kode yang sama): input `21.04.001` → banner **"Santri Terverifikasi: Bilal Putra Wijaya"**, gerbang berhasil dilewati. Perilaku sebelumnya tidak berubah.
   - Deviasi redaksi yang tersisa (bukan kegagalan fungsi): banner menyebut nama saja, tanpa "(SMPITA - 9A)" seperti teks harapan spec — lihat S-4.
   - Keterbatasan alat sama seperti eksekusi pertama: tab otomatisasi `hidden`, `innerWidth = 0`, tanpa tangkapan layar; bukti berasal dari teks DOM, nilai `input`, toast, dan kueri CLI.

### 2026-11-06 — lanjutan: pemulihan nol depan pada data master

Pengguna menyediakan ekspor identitas resmi pesantren (`Data_Identitas_Santri_Ringkas_{SMPITA,SMAITA,MTA}_Aktif_2026-2027_2026-10-29 (1).xlsx` di proyek "SiPAKSa iCentre", dibaca lewat `xlsx` milik proyek itu) dan memilih opsi **"Pulihkan nol di E-Imtihan"**.

Bukti dari ketiga berkas (dibaca dengan `XLSX.utils.sheet_to_json`, sel NISN bertipe string):

- Seluruh NISN yang terisi panjangnya **tepat 10 digit** (245/245 SMPITA, 78/78 SMAITA); 198 SMPITA dan 72 SMAITA berawalan `0`; 23 baris MTA kosong NISN-nya.
- Abdillah `24.02.001` tersimpan resmi sebagai **`0127121695`** — persis contoh yang tertulis di skenario 2, sedangkan API mengirim `127121695`.
- Padanan API ↔ ekspor atas 346 santri: 144 sama persis, **199 hanya berbeda nol depan**, 23 kosong di keduanya, 3 berbeda sungguhan (`24.04.005` API `12455677` vs ekspor kosong; `25.02.013` API kosong vs ekspor `0124074709`; `26.02.032` `0136665414` vs `0137412142`).
- Kode worker sumber (`cloudflare-worker/src/routes/students.ts:106`) hanya meneruskan kolom `nisn` dari D1, jadi nol hilang sebelum API — pada data induk/import iCentre, bukan pada E-Imtihan.

Perubahan: `officialNisn()` di [apps/convex/model/nisn.ts](../../apps/convex/model/nisn.ts) dan pemakaiannya di [apps/convex/students/public/actions.ts:57](../../apps/convex/students/public/actions.ts) — nilai seluruh-digit dipanjangkan ke 10 digit dengan nol depan, nilai ≥10 digit dan non-digit dibiarkan, nilai kosong jadi `undefined`. Pencocokan toleran dari perbaikan sebelumnya tetap dipertahankan sebagai pengaman.

Validasi: `node --test tests/nisn-identifier.test.ts` → 13 lulus (4 blok baru untuk `officialNisn`, termasuk sifat bahwa pemulihan ini tidak mengubah hasil `identifierMatches`); `npm test` → 358 lulus; `npx tsc --noEmit` bersih; `npx eslint` 0 error / 46 peringatan lama; `npx convex dev --once` → `✔ 13:40:08 Convex functions ready! (10.35s)`.

Verifikasi aturan terhadap data nyata (API → `officialNisn` → dibandingkan ekspor): **343 dari 346** santri kini sama persis dengan ekspor resmi, **199 di antaranya karena padding**; 3 sisanya tetap beda karena sumbernya memang berbeda nilai/kosong (lihat daftar), bukan karena format.

Status data: roster yang tersimpan di deployment dev **masih bentuk tanpa nol** sampai sinkronisasi dijalankan lagi, dan penarikan SiPAKSa adalah aksi ke sistem produksi sehingga memerlukan izin eksplisit pengguna (kata "Tarik Data dari SiPAKSa"). Setelah penarikan itu, skenario 1 dan 2 perlu diulang dan `nisn` pada baris Abdillah diperiksa kembali (`0127121695`).

### 2026-11-06 — penarikan SiPAKSa sesudah pemulihan nol (izin eksplisit pengguna)

Prasyarat & otorisasi: pengguna mengetik nama aksi persis **"Tarik Data dari SiPAKSa"**. Penarikan dijalankan dari browser sebagai `pengajar.uji@example.com` di `http://localhost:3000/santri`; sebelum itu tab `/ujian` keluar dari akun pengajar lewat `/api/auth/sign-out` (→ 200, `get-session` `null`) supaya perjalanan gerbang santri benar-benar anonim.

1. **Skenario 1 diulang pada kode dengan `officialNisn()` aktif** — *Passed.*
   - Sebelum penarikan, baris master Abdillah (dibaca `npx convex data students --limit 1000`, `_id jx73r2rk5dbq3zd7nfhy6yy9dn8h4pvz`) masih tersimpan `"127121695"`.
   - Aksi: klik tombol → selama pemrosesan label berubah menjadi **"Sinkronisasi SiPAKSa..."** dalam keadaan `disabled` dengan 1 spinner (`svg.animate-spin`); sesudah selesai label kembali ke "Tarik Data dari SiPAKSa" dan `enabled`.
   - Kartu statistik sesudah penarikan: Total Santri Aktif **353**, SMPITA/SMP **246**, SMAITA/SMA **84**, MTA **23** — tidak berubah terhadap penarikan sebelumnya, jadi pemulihan nol tidak menambah/mengurangi roster. Toast rangkuman tidak tercatat kali ini: `MutationObserver` dipasang sebelum klik tetapi mengembalikan `[]` (kemungkinan terpasang pada subtree yang diganti Fast Refresh); bukti pemrosesan diambil dari keadaan tombol.
   - Tab: "Semua Lembaga" 353 baris, "SMPITA" 246, "SMAITA" 84, "MTA" 23; jenjang yang muncul hanya rombel 7A–9C, 10A–12A, MTA 1–MTA 6 — **tidak ada SDITA/TK**. 0 error konsol.
   - **Sesudah penarikan**, baris Abdillah terbaca `"nisn": "0127121695"` (`syncedAt` 1793947747537, naik dari 1793916759510) — nol depan resmi kini tersimpan di data master, seperti yang diminta pengguna.

2. **Bentuk penyimpanan seluruh roster** — 353 baris `students` diperiksa kolom per kolom dari keluaran `npx convex data`: **330 baris ber-NISN** (seluruh SMPITA+SMAITA; 23 baris MTA kosong, sesuai ekspor resmi), **330/330 panjangnya tepat 10 digit**, **276 di antaranya berawalan `0`**, dan **0 baris** yang tidak konform (tidak ada NISN 9 digit atau non-digit tersisa). Angka 276 muncul juga pada kolom NISN/NIS tabel `/santri` (198 SMPITA + 77 SMAITA + 1 MTA dari kolom `nis`).

3. **Perbandingan ulang terhadap ekspor identitas resmi** (`Data_Identitas_Santri_Ringkas_{SMPITA,SMAITA,MTA}_Aktif_2026-2027_2026-10-29 (1).xlsx`, dibaca `XLSX.utils.sheet_to_json`, dipasangkan lewat ID Santri): dari 346 baris ekspor, **346 ada padanannya di roster**, **343 sama persis**, **0 hanya berbeda nol depan** (sebelum padding: 199), **3 berbeda nilai sungguhan** (daftar pada lanjutan sebelumnya), dan **7 baris roster** tidak ada di ekspor karena terdaftar setelah tanggal ekspor. Selisih format benar-benar habis; yang tersisa hanya perbedaan nilai dari sumber.

4. **Skenario 2 diulang terhadap data bernol-depan** — *Passed.*
   - Kueri CLI `students/public/queries:lookupStudent`: `0127121695` → Abdillah `24.02.001` / SMPITA / 9A; `127121695` → baris yang sama (toleransi tetap berfungsi sebagai pengaman); `21.04.001` → Bilal Putra Wijaya / MTA 6; dan contoh yang kini tersimpan bernol-depan `0105493451` → Reisya Meilany Putri / SMAITA 11B.
   - Browser `/ujian` (keadaan keluar akun): isi `#nisn` = `0127121695` → banner **"Santri Terverifikasi: Abdillah"**, `#student-name` terisi otomatis "Abdillah", pemilih ter-setel **"SMPITA (SMP Islam Terpadu At-Tauhid)"** dan **"9A (SMPITA)"** tanpa mengetik; ganti ke `127121695` → hasil identik; ganti ke `0105493451` → banner **"Santri Terverifikasi: Reisya Meilany Putri"**.
   - Tidak ada sesi uji yang dibuat pada langkah ini (hanya lookup/verifikasi), sehingga tidak ada fixture baru yang perlu dibersihkan.

### Temuan
- **S-1 (Medium) — SELESAI 2026-11-06** NISN bernol-depan tidak terverifikasi padahal placeholder bidang meminta format itu (`Contoh: 0123456789`). Sumber kegagalan terbukti ada di pencocokan, bukan di sinkronisasi (SiPAKSa mengirim `"127121695"` sebagai string). Diperbaiki dengan normalizer `apps/convex/model/nisn.ts` yang dipakai `lookupStudent`, `enterExamSession`, dan `normalizeNisn`, plus penyimpanan nomor induk resmi peserta agar satu santri tidak membuat baris ganda. Sisa pekerjaannya kini tertutup: `officialNisn()` memulihkan nol depan saat sinkronisasi, dan penarikan SiPAKSa yang diizinkan sudah dijalankan, sehingga roster nyata membaca `0127121695` dan 330/330 NISN tepat 10 digit.
- **S-2 (Low–Medium)** teks keadaan-kosong `/santri` mengeras angka **"menyinkronkan 346 santri nyata"** (`apps/app/(main)/santri/page.tsx:252`) padahal hasil sinkronisasi riil 353; angka seharusnya dinamis atau netral.
- **S-3 (Low)** singkatan lembaga MTA tidak konsisten antara gerbang ujian ("Madrasah Tarbiyatul Aimmah") dan dashboard santri ("Ma'had Tahfidz (MTA)"); salah satunya harus dijadikan kosakata resmi.
- **S-4 (Low)** banner "Santri Terverifikasi" hanya memuat nama, sedangkan spec mengharapkan "Nama (Lembaga - Kelas)"; informasinya ada di dropdown, jadi ini perbedaan redaksi, bukan hilangnya data.
- **S-5 (Low) — tidak terulang setelah padding** pencarian santri di dashboard (`getStudents`, `apps/convex/students/public/queries.ts:51`) masih mencocokkan `nisn` sebagai potongan teks, bukan lewat `identifierMatches`. Sebelum roster dipulihkan, ketikan bernol-depan gagal menemukan baris yang tersimpan tanpa nol. Diperiksa ulang sesudah penarikan (2026-11-06): `searchQuery` `127121695` **dan** `0127121695` sama-sama menghasilkan 1 baris Abdillah, karena nilai tersimpan kini `0127121695` dan bentuk tanpa nol adalah potongan dari nilai itu. Status: tertutup oleh perbaikan data, bukan oleh perbaikan kode — pencocokan dashboard tetap tidak toleran terhadap selisih format lain (mis. tanda titik/kspasi), jadi normalisasi di `getStudents` masih layak dikerjakan bila keluhan muncul lagi.
- Tidak ada error konsol pada ketiga skenario, baik sebelum maupun sesudah perbaikan.

### Media Evidence

- Tanpa tangkapan layar/rekaman (surface browser in-app `hidden`, viewport 0 px, tidak menyediakan tangkapan layar). Bukti: teks DOM + toast yang direkam `MutationObserver`, nilai `input`/`combobox`, dan kueri `npx convex data` (`students`, `examSessions`, `examParticipants`, `questionBanks`).

### Pembersihan data uji

- Fixture sesi dihapus lewat mutasi internal sementara `convex/tmpE2e/cleanup.ts` (dibuat → dijalankan → dihapus) karena `deleteExamSession` tidak men-cascade peserta: hasil `{ sessions: 1, participants: 2, answers: 0, questions: 2 }` dan bank terhapus.
- Verifikasi `npx convex data`: `examSessions=2` (hanya token milik pengguna `2C6PKJ`, `HH4XC2`), `examParticipants=2` (`24.03.001`, `0119755229`), `questionBanks=3` (tanpa "E2E Sync Login"), `students=353` (246 SMPITA / 84 SMAITA / 23 MTA) — angka roster ini adalah hasil penarikan SiPAKSa yang diizinkan, sengaja dipertahankan karena merupakan data resmi, bukan sampah uji.
- `apps/convex/tmpE2e/` dihapus (`rm -rf`, `ls convex | grep -ci tmp` → 0) dan push ulang: `✔ 05:17:29 Convex functions ready! (9.81s)` sebelum penghapusan, `✔ 05:18:20 Convex functions ready! (8.08s)` sesudahnya.

### Pembersihan data uji (pengulangan S-1, 2026-11-06)

- Fixture "E2E S1 Nol Depan" dihapus dengan mutasi internal sementara `convex/tmpE2e/cleanup.ts` (dibuat → dijalankan → dihapus) karena `deleteExamSession` tidak men-cascade peserta: hasil `{ sessions: 1, participants: 2, answers: 0, questions: 2 }` dan bank ikut terhapus.
- Verifikasi sesudahnya: `examSessions=2`, `examParticipants=2` (`24.03.001`, `0119755229` milik data lama), `questionBanks=3` (tanpa "E2E S1 Nol Depan"), `students=353` — identik dengan keadaan sebelum fixture dibuat, jadi tidak ada sisa data uji.
- `apps/convex/tmpE2e/` dihapus (`rm -rf`) dan redeploy bersih: `✔ 10:31:43 Convex functions ready! (9.1s)` saat fixture diunduh, `✔ 10:32:10 Convex functions ready! (7.9s)` setelah modul sementara dihapus.

## Hasil

- Overall: **Passed** — ketiga skenario lulus pada pengulangan 2026-11-06 sesudah perbaikan S-1, dan skenario 1 serta 2 lulus pula pada pengulangan terakhir di atas roster yang sudah bernol-depan. Skenario 1 menuntut izin penarikan data produksi SiPAKSa dan sudah dijalankan atas izin tersebut; angkanya (353 santri, 330 NISN semuanya tepat 10 digit) adalah data resmi yang sengaja dipertahankan.
- Sisa temuan yang belum ditindaklanjuti: S-2 (teks keadaan-kosong `/santri` mengeras 346), S-3 (penamaan MTA tidak konsisten), S-4 (redaksi banner tanpa lembaga/kelas). S-5 tidak terulang pada pengecekan nyata tetapi belum dinormalkan di kode. Sumber SiPAKSa sendiri masih mengirim NISN tanpa nol depan; pemulihan terjadi di sisi tulis E-Imtihan, dan 3 santri tetap berbeda nilai antara API dan ekspor resmi.

### Pembersihan (penarikan bernol-depan, 2026-11-06)

- Tidak ada fixture sesi/bank/peserta yang dibuat pada pengulangan ini — langkah `/ujian` berhenti pada verifikasi identitas, tanpa memakai token ujian. Verifikasi `npx convex data`: `examSessions=2` (token pengguna `2C6PKJ`, `HH4XC2`) dan `examParticipants=2` (`24.03.001`, `0119755229`), keduanya persis keadaan sebelum pengujian; `students=353` adalah roster resmi hasil penarikan yang diizinkan.
- Tidak ada modul Convex sementara yang tersisa. Berkas sementara milik langkah ini (`scratch/students-dump.txt`, keluaran `npx convex data` untuk analisis kolom NISN) dihapus sesudahnya.
- Tab otomatisasi diakhiri dalam keadaan keluar akun (`/api/auth/sign-out` → 200, `get-session` → `null`) agar tidak meninggalkan sesi pengajar pada browser.
