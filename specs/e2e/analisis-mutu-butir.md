# E2E: Analisis mutu butir, penanda tuntas, dan kelompok remedial

- **Work item**: `CHG-010`
- **Status**: `Passed` (14 dari 14 skenario; temuan cetak skenario 8 diperbaiki dan diulang 2026-11-05)
- **Rekomendasi**: `Required`
- **Sumber**: `.planora/EXECUTION/TODO.md` item CHG-010 dan `.planora/UI/screens/analisis-butir-soal.md`
- **Alasan**: laporan analisis memadukan agregasi server, tampilan tabel/cetak, dan keadaan kosong yang hanya dapat dibuktikan di browser, termasuk perbandingan dua peran (pengajar pemilik dan pengunjung lain).
- **Lingkungan**: aplikasi lokal (`npm run dev`) dengan deployment Convex dev yang dikonfigurasi; Chrome terbaru; satu jendela biasa untuk pengajar pemilik sesi dan satu jendela incognito untuk pengunjung tanpa login maupun pengajar lain.

## Prasyarat

- Sesi yang sudah dinilai penuh dengan **minimal 5 peserta** (semua sudah mengumpulkan dan tidak ada essay menunggu koreksi).
- Sesi kedua dengan **kurang dari 5 peserta dinilai** untuk keadaan di bawah ambang.
- Sesi remedial dengan batas tuntas terisi dan satu sesi remedial dengan pembatasan nilai dimatikan.
- Paket bank soal memuat minimal satu butir pilihan ganda yang salah dijawab mayoritas, satu butir pilihan ganda dengan pengecoh tidak terpakai, dan satu butir essay; minimal sebagian butir sudah bertanda tingkat berpikir dan rujukan capaian.
- Akun pengajar kedua yang tidak memiliki sesi tersebut untuk skenario akses.

## Skenario

1. **Masuk dari rekap nilai**
   - Pengajar pemilik membuka `/rekap-nilai`, memilih sesi yang sudah dinilai.
   - Menekan tautan "Analisis Butir".
   - **Harapan**: halaman analisis terbuka untuk sesi yang sama; header menampilkan judul sesi, jenis sesi, mata pelajaran, jenjang, jumlah butir, dan jumlah peserta dinilai.

2. **Masuk dari monitoring**
   - Pengajar membuka `/monitoring-sesi` dan memilih sesi yang sama.
   - **Harapan**: tautan "Analisis Butir" tersedia dan membuka halaman analisis yang sama. Pada sesi yang belum memiliki peserta dinilai, tautan tidak ditampilkan.

3. **Ringkasan kelas**
   - Periksa empat kartu ringkasan.
   - **Harapan**: rata-rata, nilai tertinggi, nilai terendah, dan jumlah peserta tuntas tampil beserta keterangan batas tuntas; angka rata-rata sama dengan rata-rata nilai akhir pada rekap nilai.

4. **Tabel mutu butir**
   - Periksa tabel "Mutu tiap butir" pada layar lebar.
   - **Harapan**: setiap butir menampilkan nomor, tipe, bobot, daya serap, kesukaran (mudah/sedang/sulit), daya beda, sebaran pilihan, status, dan catatan alasan "perlu ditinjau"; butir dengan daya serap rendah atau daya beda tidak positif berstatus perlu ditinjau beserta alasannya.

5. **Sebaran pengecoh dan butir essay**
   - Periksa baris butir pilihan ganda dan baris butir essay.
   - **Harapan**: butir pilihan ganda menampilkan jumlah pemilih tiap opsi dan kunci jawaban berlabel "kunci"; butir essay menampilkan keterangan bahwa sebaran pengecoh tidak berlaku, tanpa angka pilihan.

6. **Capaian per tingkat berpikir dan rujukan capaian**
   - Periksa dua tabel capaian.
   - **Harapan**: tingkat berpikir dan rujukan capaian yang sudah ditandai menampilkan jumlah butir dan rata-rata daya serap; penanda yang belum dipakai tidak menampilkan baris palsu, dan keadaan kosong memakai kalimat netral.

7. **Kelompok remedial dan pengayaan**
   - Periksa bagian kelompok.
   - **Harapan**: peserta di bawah batas tuntas masuk "Perlu remedial", peserta yang tuntas masuk "Siap pengayaan"; setiap anggota menampilkan nomor butir yang salah sebagai tautan, dan tautan membuka lembar koreksi pada butir yang dimaksud.

8. **Unduh tabel dan cetak**
   - Tekan "Unduh tabel" lalu "Cetak".
   - **Harapan**: berkas CSV terunduh dengan 11 kolom termasuk sebaran, status, alasan, tingkat berpikir, dan rujukan capaian; cetak menampilkan kop pondok, tabel butir, capaian, dan kelompok tanpa tombol layar maupun menu aplikasi.

9. **Data belum cukup**
   - Buka analisis sesi dengan kurang dari 5 peserta dinilai.
   - **Harapan**: tabel butir dan capaian diganti keterangan "Data belum cukup" beserta jumlah peserta dinilai dan ambang minimal; tidak ada pembagian dengan nol atau angka `NaN`; kartu ringkasan dan kelompok remedial tetap tampil.

10. **Nilai remedial dibatasi batas tuntas**
    - Buka rekap nilai dan analisis untuk sesi remedial dengan pembatasan aktif.
    - **Harapan**: nilai akhir tidak melebihi batas tuntas; selisih nilai sebelum pembatasan terlihat pada rekap; halaman analisis menyatakan nilai dibatasi sampai batas tuntas.

11. **Pembatasan nilai dimatikan**
    - Buka sesi remedial dengan pembatasan dimatikan.
    - **Harapan**: nilai akhir sama dengan nilai sebelum pembatasan meskipun melewati batas tuntas; halaman analisis menyatakan pembatasan dimatikan; jenis sesi terlihat pada tabel rekap dan pada berkas CSV yang diekspor.

12. **Akses pengajar lain dan pengunjung tanpa login**
    - Buka URL analisis yang sama di jendela incognito (tanpa login), lalu masuk sebagai pengajar lain.
    - **Harapan**: keduanya memperoleh keadaan kosong "Analisis butir tidak tersedia" tanpa angka, nama santri, atau data butir.

13. **Perangkat santri tidak menerima angka analisis**
    - Buka `/ujian` sebagai santri, periksa jawaban jaringan atau muatan halaman.
    - **Harapan**: tidak ada daya serap, daya beda, sebaran, maupun status mutu butir yang dikirim ke peramban santri.

14. **Tata letak ponsel**
    - Buka halaman analisis pada lebar ponsel.
    - **Harapan**: tabel berganti kartu butir yang tetap memuat semua metrik dan alasan; tombol cetak/unduh tetap dapat ditekan; tidak ada gulir horizontal.

## Bukti

Eksekusi 2026-11-05, aplikasi lokal `http://localhost:3000`, deployment Convex dev `quirky-rat-737`, akun pemilik `pengajar.uji@example.com`, akun pengajar kedua `pengajar.kedua@example.com` (dibuat untuk skenario akses). Data uji dibuat lewat modul sementara `convex/tmpE2e/seed.ts` + halaman `/e2e-seed`, lalu dihapus setelah eksekusi (`removed: success`, `listSeedOwners` → `[]`) dan kedua berkas sementara dihapus sebelum `npx convex dev --once` melaporkan `Convex functions ready!`.

Keterbatasan alat: viewport peramban otomatis terkunci (474–638 px) sehingga tidak ada jendela lebar >900 px maupun jendela incognito terpisah. Untuk skenario 4 panel tabel desktop dipaksa tampil lewat `style.display` pada wadah `hidden min-[900px]:block` (bukan perubahan kode); untuk skenario 8 media cetak disimulasikan dengan mengubah `@media print` menjadi `all` melalui CSSOM; CSV ditangkap dengan membungkus `URL.createObjectURL`. Skenario 14 diuji pada lebar asli 474 px. Tidak ada perubahan kode produk selama E2E.

Perbaikan temuan cetak (2026-11-05): `apps/components/site-header.tsx` (kedua varian header) dan `apps/components/ui/sidebar.tsx` (pembungkus desktop, kontainer tetap, sheet ponsel) kini memakai `print:hidden`. Regression test baru `apps/tests/print-chrome.test.ts` (3 tes) gagal sebelum patch dan lolos sesudahnya; `npm test` 335/335, `npm run typecheck` bersih, `npm run lint` 0 error / 46 warning, `npm run build` sukses. Skenario 8 diulang dengan data uji sementara baru (sesi `jh744n40xv8y178wedaffzvna98hjfkg`), lalu data dibersihkan (0 baris berjudul "E2E Analisis" pada `examSessions`, 0 baris `E2E-9001` pada `students`) dan berkas sementara dihapus sebelum `Convex functions ready!`. Bukti struktural pada media cetak: `header` → `display: none`; `document.body.innerText` tidak memuat "Toggle Sidebar" maupun "Switch to dark theme"; blok kop `hidden print:block` → `display: block`; aturan `.print\:hidden` berada setelah `.md\:block` dan `.md\:flex` di CSSOM (indeks 1815 vs 1610/1611), sehingga sidebar desktop juga tidak tampil saat cetak pada lebar A4. Tangkapan layar pengulangan tidak tersedia karena surface peramban in-app berstatus `hidden` (`NATIVE_BROWSER_VIEWPORT_UNAVAILABLE`); bukti yang dipakai adalah nilai gaya terhitung dan urutan CSSOM.

1. **Masuk dari rekap nilai — Passed**
   - Aksi: `/rekap-nilai` → pilih "E2E Analisis — Sesi Remedial" → klik "Analisis Butir".
   - Hasil: URL `/rekap-nilai/analisis/jh716d9fgpaqjsbgnn9fk9j6n98hkeeg`; header "E2E Analisis — Sesi Remedial", badge "Remedial", `FIQIH · Kelas 7 · 3 butir · 6 peserta dinilai · batas tuntas 75`.
2. **Masuk dari monitoring — Passed**
   - Aksi: `/monitoring-sesi` → pilih sesi remedial; lalu buka sesi "E2E Analisis — Ujian Santri" (0 peserta dinilai).
   - Hasil: pada sesi remedial tautan "Analisis Butir" tampil dan mengarah ke URL yang sama. Pada sesi aktif tanpa peserta dinilai tautan tidak tampil, termasuk setelah satu santri mulai mengerjakan (1 peserta "Sedang Mengerjakan", 0 selesai).
3. **Ringkasan kelas — Passed**
   - Hasil: rata-rata 47.5, tertinggi 75, terendah 5, peserta tuntas 1/6 (16.7%) dengan keterangan "Dari batas tuntas 75". Rata-rata identik dengan rekap nilai sesi yang sama (47.5, 6 santri selesai).
4. **Tabel mutu butir — Passed** (panel desktop dipaksa tampil; lihat keterbatasan alat)
   - Header: `No, Tipe, Bobot, Daya serap, Kesukaran, Daya beda, Sebaran pilihan, Status, Catatan`.
   - Butir 1: PG, 40, 50%, Sedang, 1,00, `A 3 KUNCI B 1 C 1 D 1 E 0`, **Perlu ditinjau**, "Pengecoh tidak dipilih siapa pun".
   - Butir 2: PG, 40, 50%, Sedang, 0,00, `A 3 KUNCI B 2 C 1`, **Perlu ditinjau**, "Daya pembeda nol".
   - Butir 3: Essay, 20, 58,3%, Sedang, 0,88, `-`, Baik, `-`.
   - Alasan "perlu ditinjau" muncul tepat pada butir dengan daya serap <30% atau daya beda tidak positif; aturan ambang terlihat di keterangan tabel.
5. **Sebaran pengecoh dan butir essay — Passed**
   - PG menampilkan jumlah pemilih per opsi (A–E) dan label teks "KUNCI" pada opsi benar. Baris essay menampilkan tanda hubung tanpa angka pilihan (sesuai kontrak UI `analisis-butir-soal.md`); kartu ponsel menampilkan "Sebaran: Tidak ada".
6. **Capaian per tingkat berpikir dan rujukan capaian — Passed**
   - Tingkat berpikir: Memahami 1 butir 50%, Menganalisis 1 butir 50%, Mengaplikasikan 1 butir 58,3% — persis tiga penanda yang dipakai, tanpa baris palsu.
   - Rujukan capaian: "Dalil wudu" 2 butir 54,2%, "Rukun wudu" 1 butir 50%.
7. **Kelompok remedial dan pengayaan — Passed**
   - Remedial: 5 santri (Delta 5, Foxtrot 40, Charlie 50, Bravo 55, Echo 60), masing-masing menampilkan nomor butir salah sebagai tautan.
   - Klik tautan Santri Delta butir 1 → `/rekap-nilai/koreksi/jn7991fmj6rdw8ktt82yn46g0x8hjfez#butir-1`, halaman "Lembar Koreksi: Santri Delta", elemen `#butir-1` ada dan berisi "Soal #1".
   - Pengayaan: Santri Alpha nilai 75 "(sebelum batas 100)", "Tidak ada butir yang salah."
8. **Unduh tabel dan cetak — Passed** (diulang 2026-11-05 setelah perbaikan header/sidebar)
   - Unduh: tombol menghasilkan CSV 11 kolom: `No,Tipe,Bobot,Daya Serap (%),Tingkat Kesukaran,Daya Beda,Sebaran Pilihan,Status,Alasan,Tingkat Berpikir,Rujukan Capaian`; 3 baris data; sebaran `"A (kunci): 3; B: 1; ..."`; alasan, tingkat berpikir, dan rujukan terisi. **Lolos.**
   - Cetak: media cetak menampilkan kop "PONDOK PESANTREN AT-TAUHID", judul "LAPORAN ANALISIS MUTU BUTIR SOAL", tabel butir, kedua tabel capaian, dan kelompok; tombol "Cetak", "Unduh tabel", serta tautan "Kembali" tersembunyi. Setelah perbaikan, `header` berstatus `display: none`, `document.body.innerText` tidak memuat "Toggle Sidebar" maupun "Switch to dark theme", dan sidebar desktop kalah oleh aturan `print:hidden` pada urutan CSSOM. **Lolos.**
   - Riwayat: eksekusi pertama hari yang sama gagal karena `SiteHeader` belum memakai `print:hidden`; perbaikan dan regression test dicatat pada bagian Bukti.
9. **Data belum cukup — Passed**
   - Sesi "Sesi Kecil" (4 peserta dinilai): panel metrik diganti "Data belum cukup — Metrik butir baru ditampilkan setelah minimal 5 peserta dinilai. Saat ini 4 peserta sudah dinilai." Tidak ada `NaN` atau pembagian nol; kartu ringkasan (67.5/90/40/2 tuntas) dan kelompok remedial/pengayaan tetap tampil; tombol Cetak/Unduh nonaktif.
10. **Nilai remedial dibatasi batas tuntas — Passed**
    - Rekap: Santri Alpha total 75 dengan anotasi "sebelum batas: 100"; santri lain tidak melebihi 75. Analisis: "Nilai dibatasi sampai batas tuntas 75." dan pengayaan menampilkan "75 (sebelum batas 100)".
11. **Pembatasan nilai dimatikan — Passed**
    - Analisis "Cap Off": "Pembatasan nilai remedial dimatikan untuk sesi ini.", nilai 40 > batas 30. Rekap menampilkan kolom "Jenis Sesi" = Remedial dan total 40. CSV rekap 13 kolom: `...,Jenis Sesi,...,Nilai Sebelum Pembatasan,Total Nilai Akhir,Batas Tuntas,Ketuntasan` dengan baris `Remedial,0,40,0,40,40,30,Tuntas`.
12. **Akses pengajar lain dan pengunjung tanpa login — Passed**
    - Tanpa login: halaman menampilkan "Analisis butir tidak tersedia — Sesi ini tidak ditemukan atau bukan milik akun pengajar yang sedang masuk.", tanpa angka atau nama santri.
    - Login `pengajar.kedua@example.com`: hasil kosong yang sama; tidak ada data butir atau peserta.
13. **Perangkat santri tidak menerima angka analisis — Passed**
    - Santri masuk dengan token `E2E7K9` + NISN `E2E-9001`, halaman ujian memuat butir dan opsi saja. Pencarian di HTML dan teks terlihat untuk "daya serap", "daya beda", "sebaran", "status mutu", "perlu ditinjau", "kunci jawaban", dan "tingkat berpikir" → 0 kecocokan. Daftar permintaan jaringan hanya memuat aset statis dan `GET /api/auth/get-session [200]`.
14. **Tata letak ponsel — Passed**
    - Pada lebar 474 px: wadah tabel desktop tersembunyi (`getBoundingClientRect().width = 0`), kartu butir tampil, seluruh metrik dan alasan ada pada kartu (mis. "Daya serap 50%", "Kesukaran Sedang", "Daya beda 1,00", "Sebaran Terlihat di bawah", chip `A 3 KUNCI`, "Pengecoh tidak dipilih siapa pun"). `document.documentElement.scrollWidth` 459 ≤ 474 sehingga tidak ada gulir horizontal; tombol Cetak dan Unduh tabel aktif.

Temuan awal pada header global sudah ditutup: `apps/components/site-header.tsx` dan `apps/components/ui/sidebar.tsx` memakai `print:hidden`, regression test `apps/tests/print-chrome.test.ts` menjaga perilaku ini, dan skenario 8 lolos pada pengulangan.
