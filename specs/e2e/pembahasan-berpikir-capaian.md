# Spesifikasi E2E: Pembahasan Butir, Penanda Tingkat Berpikir, dan Rujukan Capaian Materi

- **Sumber Permintaan**: perubahan produk CHG-005 pada rencana eksekusi (kolom pembahasan khusus pengajar, dropdown tingkat berpikir, dan isian rujukan capaian materi pada formulir butir; tidak boleh bocor ke santri)
- **Rekomendasi E2E**: `Required`
- **Status**: `Failed` (dijalankan 2026-11-05 dengan 9 `Passed` / 2 `Failed`; diulang 2026-11-06 menjadi 10 `Passed` / 1 `Failed` setelah penanda kunci di pratinjau santri diperbaiki). Sisa kegagalan: butir essay tanpa penanda tidak menampilkan "Belum ditandai" di lembar koreksi.
- **Lingkungan**: Local development (`http://localhost:3000`) dengan Convex dev deployment `quirky-rat-737`
- **Alasan**: kriteria "ketiganya tersimpan dan kembali utuh saat butir dibuka lagi", "panel pratinjau santri tidak pernah menampilkan pembahasan", dan "lembar ujian santri tidak memuat pembahasan" adalah perilaku layar dan alur pengguna. Penjagaan server (kolom opsional, validasi panjang label, whitelist payload santri, akses koreksi hanya pemilik sesi) sudah terbukti lewat tes unit dan probe CLI; bukti browser tetap dibutuhkan untuk kebenaran tampilan.

## Prasyarat

1. Server lokal berjalan (`npm run dev` di `apps/`). **Wajib** `http://localhost:3000`; lewat `http://127.0.0.1:3000` login pengajar ditolak better-auth dengan `INVALID_ORIGIN`.
2. Login pengajar uji `pengajar.uji@example.com` / `UjiDev2026`.
3. Buat satu paket khusus uji "Probe E2E Metadata" dengan Mata Pelajaran `AQIDAH`, Lembaga `SMPITA`, Tingkat `Kelas 7`. Paket dan seluruh butirnya dihapus di akhir perjalanan supaya data dev tetap bersih.
4. Satu akun santri uji dari data master (NISN yang ada dan cocok dengan jenjang paket) untuk skenario 7.
5. Jangan memakai paket "Adab dan Akhlaq 1" milik akun pengajar uji untuk pengujian tulis — paket itu dipakai sebagai pembanding butir lama.

## Skenario Pengujian Browser

1. **Formulir memuat tiga kolom pengajar**
   - Buka `/bank-soal`, buka paket "Probe E2E Metadata", tambah butir pilihan ganda: teks "Rukun wudhu yang pertama adalah?", opsi A "Niat" (kunci), B "Membasuh tangan", C "Mengusap kepala", D "Membasuh kaki", bobot 10.
   - *Ekspektasi*: di bawah kolom bobot ada satu blok bergaris yang memuat textarea "Pembahasan (tidak dilihat santri)", dropdown "Tingkat berpikir" (pilihan "Belum ditandai", Mengingat, Memahami, Mengaplikasikan, Menganalisis), dan isian "Rujukan capaian materi" dengan placeholder berisi contoh label pendek. Keterangan kecil menyebut ketiganya hanya terbaca pengajar. Tidak ada emoji dan tidak ada kode spesifikasi (`*-FR-*`, `*-AC-*`, `TASK-*`, `Fase NN`, `.md`).

2. **Simpan dan buka ulang mengembalikan ketiga nilai**
   - Isi pembahasan "Niat mendahului seluruh rukun wudhu.", pilih "Memahami", isi capaian "Thaharah — rukun wudhu". Simpan.
   - *Ekspektasi*: butir muncul di daftar tersimpan dengan nomor 1. Klik "Sunting" pada butir itu → ketiga kolom terisi persis seperti yang disimpan. Ubah hanya tingkat berpikir ke "Mengingat" lalu simpan → nomor urut tetap 1, bobot tetap 10, teks dan opsi tidak berubah.

3. **Saran capaian berasal dari mata pelajaran paket**
   - Pada formulir butir baru, mulai mengetik "Thah" di isian rujukan capaian.
   - *Ekspektasi*: saran datalist menampilkan "Thaharah — rukun wudhu" (label yang sudah dipakai butir lain di mata pelajaran `AQIDAH`). Datalist tidak memaksa; teks bebas tetap boleh dikirim.

4. **Batasan panjang label capaian terlihat sebelum kirim**
   - Tempel teks 90 karakter ke isian rujukan capaian.
   - *Ekspektasi*: isian berhenti di 80 karakter (tidak menampilkan pesan galat), sedangkan bila teks panjang dipaksakan lewat API server menolak dengan pesan "Rujukan capaian materi maksimal 80 karakter…". Tidak perlu memaksa lewat API pada peramban — cukup pastikan pemotongan di layar berjalan.

5. **Butir lama tanpa penanda tetap terbaca dan ternilai normal**
   - Buka paket "Adab dan Akhlaq 1" milik akun uji, buka satu butir yang dibuat sebelum perubahan ini.
   - *Ekspektasi*: formulir terbuka normal dengan pembahasan kosong dan tingkat berpikir "Belum ditandai"; nomor urut, bobot, teks, dan opsi tampil utuh. Simpan tanpa mengubah apa pun → tidak ada galat dan nilai kolom kembali kosong, bukan string kosong tersimpan.

6. **Panel pratinjau santri tidak membocorkan pembahasan**
   - Pada butir yang sudah punya pembahasan, buka tab/panel simulasi santri di editor.
   - *Ekspektasi*: panel menampilkan nomor, teks soal, opsi, dan bobot saja. Kata pembahasan, tingkat berpikir, dan rujukan capaian tidak muncul sama sekali, dan kunci jawaban tetap tersembunyi.

7. **Lembar ujian santri dan halaman koreksi pengajar**
   - Buat sesi ujian aktif memakai paket "Probe E2E Metadata", masuk sebagai santri uji di `/ujian` dengan token, buka satu butir bertanda.
   - *Ekspektasi santri*: soal tampil dengan nomor dan opsi; tidak ada teks pembahasan, label tingkat berpikir, maupun label capaian di layar, panel bantuan, atau elemen tersembunyi.
   - Kumpulkan jawaban, lalu sebagai pengajar buka `/rekap-nilai/koreksi/<sesi>` → halaman koreksi menampilkan "Pembahasan: …" dari butir tersebut beserta "Tingkat berpikir: Mengingat" dan "Rujukan capaian: Thaharah — rukun wudhu". Butir essay tanpa penanda tampil dengan tingkat berpikir "Belum ditandai".

8. **Pratinjau impor massal menampilkan tiga kolom baru**
   - Di editor paket, buka layar penulisan cepat/impor massal, tempel dua butir bernomor yang memuat baris `pembahasan: …`, `berpikir: memahami`, `capaian: Thaharah — rukun wudhu` pada butir pertama.
   - *Ekspektasi*: tabel pratinjau memuat kolom "Pembahasan", "Berpikir", dan "Capaian"; baris pertama terisi, baris kedua menampilkan "—". Kartu pratinjau di layar sempit memuat ketiganya sebagai blok teks. Simpan → editor menampilkan metadata yang sama pada butir hasil impor.

9. **Baris bermasalah pada impor tidak disimpan**
   - Tempel butir dengan baris `berpikir: sintesis` (di luar empat pilihan) dan butir lain dengan `capaian:` sepanjang 85 karakter.
   - *Ekspektasi*: kedua baris ditandai bermasalah dengan pesan yang menyebut tingkat berpikir tidak dikenal / rujukan capaian terlalu panjang; tombol simpan tidak menyimpan baris bermasalah, dan butir valid lain tetap bisa disimpan.

10. **Tata letak ponsel**
    - Dengan lebar ±390 px, buka formulir butir dan pratinjau impor.
    - *Ekspektasi*: blok tiga kolom pengajar bertumpuk satu kolom tanpa gulir horizontal; dropdown dan isian capaian dapat disentuh tanpa terpotong; tabel pratinjau berganti menjadi kartu yang tetap memuat pembahasan, berpikir, dan capaian.

11. **Pembersihan**
    - Hapus sesi uji, paket "Probe E2E Metadata", dan seluruh butirnya; keluar dari akun santri.
    - *Ekspektasi*: daftar paket kembali seperti semula dan tidak ada baris probe tersisa.

## Bukti Eksekusi (2026-11-05)

### Lingkungan

- Tanggal eksekusi: 2026-11-05, aplikasi lokal `http://localhost:3000`, Convex dev `quirky-rat-737`, akun pengajar `pengajar.uji@example.com`.
- Kanal otomasi: satu tab, viewport tetap 474×569 px, tanpa tangkapan layar native (`NATIVE_BROWSER_VIEWPORT_UNAVAILABLE`). Tata letak sempit diuji pada 474 px (bukan 390 px) — lihat batasan di temuan.
- Data uji: paket "Probe E2E Metadata" (`j579zgj73xerdx951rjcpfan3d8hne70`, AQIDAH, SMPITA, Kelas 7) berisi enam butir — #1 "Rukun wudhu yang pertama adalah?" (10 poin, pembahasan "Niat mendahului seluruh rukun wudhu.", tingkat berpikir `mengingat`, capaian "Thaharah — rukun wudhu"), #2 "Butir lama tanpa penanda?" (tanpa metadata), #3 "Butir metadata satu?" ("Ini alasan pertama.", `memahami`), #4 "Butir metadata dua?" (tanpa metadata), #5 "Butir valid pada pengujian impor?" (hasil skenario 9), #6 essay "Jelaskan urutan rukun wudhu secara ringkas." (rubrik, tanpa metadata).
- Sesi "E2E Metadata Sesi" (`jh7c4ckn9mdg4y5j6ns0kehn2d8hnz56`, token `HLA2H4`, 60 menit, 6 soal/100 poin, batas tuntas 75) dan peserta `jn7fjkh9jyhpfqzkvkrx6t86ex8hndxm` (Achmad Syafiq Al Baraja, NISN `26.02.082`, SMPITA 7A).

### Hasil: `Failed` — 11 skenario, 10 `Passed`, 1 `Failed` (sisa: skenario 7 sisi koreksi, butir essay tanpa penanda)

1. **Formulir memuat tiga kolom pengajar — `Passed`**
   - Di bawah kolom bobot tampil blok bergaris berisi textarea "Pembahasan (tidak dilihat santri)", dropdown "Tingkat berpikir" dengan nilai awal "Belum ditandai", dan isian "Rujukan capaian materi" berplaceholder `mis. Thaharah — rukun wudhu`. Keterangan "Ketiganya hanya terbaca pengajar. Saran capaian diambil dari label yang sudah dipakai mata pelajaran paket ini." Tidak ada emoji maupun kode spesifikasi pada teks layar.

2. **Simpan dan buka ulang mengembalikan ketiga nilai — `Passed`**
   - Butir #1 disimpan dengan pembahasan, "Memahami", dan capaian. "Sunting" menampilkan ketiganya persis. Setelah tingkat berpikir diubah ke "Mengingat", `npx convex data questions` menunjukkan `orderNumber 1`, `points 10`, `explanation`/`thinkingLevel`/`achievementRef` utuh, teks dan empat opsi tidak berubah.

3. **Saran capaian berasal dari mata pelajaran paket — `Passed`**
   - Mengetik "Thah" pada isian capaian memunculkan datalist `q-achievement-suggestions` berisi satu saran: "Thaharah — rukun wudhu". Datalist tidak memaksa; teks bebas tetap dapat dikirim.

4. **Batasan panjang label capaian terlihat sebelum kirim — `Passed`**
   - Isian memiliki `maxLength=80`. Tempelan 90 karakter lewat `insertText` berhenti pada 80 karakter tanpa pesan galat; server tidak dipanggil karena tidak disimpan.

5. **Butir lama tanpa penanda tetap terbaca dan ternilai normal — `Passed` dengan substitusi**
   - Paket "Adab dan Akhlaq 1" tidak tersedia pada akun uji (pemilik lain), sehingga jalur lama disimulasikan dengan butir #2 yang dibuat tanpa metadata. Formulir terbuka normal: pembahasan kosong dan tingkat berpikir "Belum ditandai". Menyimpan tanpa perubahan tidak menghasilkan galat; baris basis data tidak memuat kunci `explanation`/`thinkingLevel`/`achievementRef` sama sekali (bukan string kosong).

6. **Panel pratinjau santri tidak membocorkan pembahasan — `Passed` pada pengulangan 2026-11-06 (semula `Failed`)**
   - Bukti asli 2026-11-05 (`Failed`, dipertahankan): pembahasan, tingkat berpikir, dan rujukan capaian memang tidak muncul. Namun panel "Simulasi Siswa" menampilkan penanda **"Kunci"** di samping opsi kunci (`A. (Opsi kosong) Kunci`), padahal skenario meminta kunci jawaban tetap tersembunyi.
   - Pengulangan 2026-11-06 sesudah perbaikan: paket baru "Probe E2E Kunci Pratinjau" (Fiqih Ibadah / Kelas 7) dibuat lewat dialog, lalu tiap tipe soal diisi dan panel pratinjau dibaca dari `document.body.innerText` mulai penanda "Simulasi Siswa".
     - Pilihan Ganda, kunci A aktif di formular: pratinjau `A. Seduh kaki / B. Basmalah / C. Tayammum / D. Niat` tanpa penanda apa pun; pada saat yang sama kolom kiri tetap menampilkan `Pilihan Opsi Jawaban & Kunci` dan badge `Kunci` pada baris A. Jumlah kemunculan "Kunci" pada seluruh `main` = **1** (hanya di sisi pengajar), "(Kunci)" = 0, "Rubrik Penguji" = 0.
     - PG Kompleks dengan **tiga** kunci (A, B, C `aria-checked=true`): pratinjau menampilkan keempat opsi dengan cincin kotak kosong, `hasKunci=false`.
     - Benar/Salah: pratinjau `Benar` / `Salah` dalam dua kotak seragam, tanpa "(Kunci)".
     - Essay dengan `#q-rubric` terisi "Skor penuh bila menyebut niat dan tertib.": pratinjau hanya berisi placeholder "Santri akan mengetik jawaban uraian mereka…";regex `Rubrik|Skor penuh|Kunci` pada teks pratinjau = tidak cocok.
   - Regresi sisi pengajar (`Passed`): butir PG Kompleks disimpan, halaman dimuat ulang dari server, lalu "Sunting butir nomor 2" mengembalikan tipe PG Kompleks dan ketiga kunci (`aria-checked` = true,true,true,false) — kunci tidak hilang, hanya tidak lagi dirender ke simulasi. Toast "Butir soal berhasil ditambahkan!" menyertai tiap penyimpanan; `list_console_messages` = 0 `console.error`.

7. **Lembar ujian santri dan halaman koreksi pengajar — `Failed` (sisi santri `Passed`, sisi koreksi `Failed`)**
   - Santri masuk lewat `/ujian` (SMPITA → 7A → NISN `26.02.082` → token `HLA2H4`) dan mengerjakan enam butir. Untuk setiap nomor, seluruh `document.body.innerHTML` diperiksa: tidak ada "Pembahasan", "Thaharah", "Mengingat", "tingkat berpikir", maupun "capaian" — hanya nomor, tipe, bobot, teks soal, dan opsi.
   - Jawaban dikumpulkan (6 terjawab) sampai layar "Ujian Selesai & Terkumpul". Halaman koreksi `/rekap-nilai/koreksi/<participantId>` menampilkan untuk Soal #1: "Pembahasan: Niat mendahului seluruh rukun wudhu.", "Tingkat berpikir: Mengingat", "Rujukan capaian: Thaharah — rukun wudhu"; Soal #3: "Pembahasan: Ini alasan pertama." dan "Tingkat berpikir: Memahami".
   - **Gagal**: butir essay #6 tanpa penanda tidak menampilkan baris "Tingkat berpikir: Belum ditandai" sama sekali — blok penanda pengajar hanya dirender bila salah satu dari ketiga kolom terisi.
   - Catatan rute: parameter rute ini adalah `participantId`, bukan id sesi. Membuka `/rekap-nilai/koreksi/<id-sesi>` memunculkan layar galat generik "This page couldn't load", bukan keadaan "Data peserta ujian tidak ditemukan".

8. **Pratinjau impor massal menampilkan tiga kolom baru — `Passed` dengan catatan**
   - Pratinjau impor menampilkan baris pertama dengan "Pembahasan:", "Tingkat berpikir:" (Memahami), dan "Capaian: Thaharah — rukun wudhu"; baris kedua hanya "Tingkat berpikir: Belum ditandai". Butir hasil impor menyimpan metadata yang sama saat dibuka di editor.
   - Catatan: pada kartu sempit nilai kosong dihilangkan, bukan diganti tanda "—" seperti tertulis pada skenario. Tampilan tabel lebar tidak dapat diamati pada viewport tetap 474 px.

9. **Baris bermasalah pada impor tidak disimpan — `Passed` dengan penyimpangan**
   - Tempelan tiga butir (valid, `berpikir: sintesis`, `capaian` 85 karakter) menghasilkan "1 butir siap disimpan | 2 butir perlu perbaikan". Alasan yang tampil: `tingkat berpikir "sintesis" pada baris ke-9 tidak dikenal; pilih mengingat, memahami, mengaplikasikan, atau menganalisis.` dan `rujukan capaian pada baris ke-14 melebihi 80 karakter; ringkas menjadi label pendek.` Tombol utama "Simpan 3 butir soal" nonaktif; tombol sekunder "Simpan 1 butir yang siap" menyimpan tepat satu butir (Daftar Soal 4 → 5).
   - **Penyimpangan**: setelah simpan sebagian, kolom tempel dikosongkan dan pratinjau hilang, sehingga dua baris bermasalah tidak "tetap ada di pratinjau" seperti tertulis pada skenario.

10. **Tata letak ponsel — `Passed` pada 474 px**
    - Tanpa gulir horizontal (`scrollWidth 459 = clientWidth 459`). Blok tiga kolom pengajar bertumpuk satu kolom (`grid-cols-1`); dropdown tingkat berpikir dan isian capaian selebar 367 px di dalam blok 393 px, tidak terpotong. Pratinjau impor berganti menjadi kartu yang tetap memuat "Pembahasan:", "Tingkat berpikir:", dan "Capaian:".

11. **Pembersihan — `Passed`**
    - Modul sementara `apps/convex/tmpE2e/cleanup.ts` menghapus 1 sesi, 1 peserta, 6 jawaban, 6 butir, dan 1 bank. Panggilan kedua mengembalikan semua nol; `npx convex data` pada `questionBanks`, `questions`, `examSessions`, `examParticipants`, dan `studentAnswers` tidak menemukan sisa baris. Modul dihapus dan `npx convex dev --once` → `Convex functions ready!`.

### Perbaikan temuan pertama (2026-11-06, implementasi saja — skenario 6 belum diulang di browser)

- Akar masalah: panel "Simulasi Siswa" di `apps/app/(main)/bank-soal/[id]/page.tsx` membaca state form pengajar, bukan payload santri. Opsi pilihan ganda dan PG kompleks menonjolkan `opt.isCorrect` dengan badge "Kunci" plus titik/ikon centang, tombol benar/salah menulis literal "(Kunci)", dan butir uraian merender blok "Rubrik Penguji". Padahal proyeksi santri (`convex/examSession/public/queries.ts`, blok `sanitizedQuestions`) hanya mengirim `id`, `label`, `text` tanpa `isCorrect` maupun rubrik, jadi panel itu menampilkan sesuatu yang mustahil dilihat santri.
- Perubahan: baris opsi kedua tipe pilihan kini memakai gaya netral (kotak radio/centang kosong, tanpa badge), pasangan Benar/Salah dirender seragam tanpa penanda, dan blok "Rubrik Penguji" dihapus dari panel simulasi. Formulasi pengajar di kolom kiri tidak berubah — pemilih kunci benar, penanda status pernyataan benar/salah, dan kolom rubrik tetap ada dan tetap disimpan.
- Kontrak UI dipertajam agar tidak kembali bocor: butir 18 "Panel Pratinjau Simulasi Siswa" di `.planora/UI/components/penulisan-soal-dan-mapel.md` dan paragraf tambahan pada `.planora/UI/patterns/penulisan-soal-massal.md`.
- Bukti non-browser: tes regresi baru `apps/tests/student-preview-key-leak.test.ts` (5 kasus) lulus; disisipkan ulang satu badge "Kunci" → kasus pertama langsung gagal, lalu file dipulihkan dan seluruhnya lulus lagi. `npm test` 363/363, `npx tsc --noEmit` bersih, `npm run lint` 0 galat (46 peringatan tetap, semua di file tes lama), dan pemindaian kebocoran kode spesifikasi pada halaman yang diubah menghasilkan 0.
- Bukti browser (2026-11-06): lihat skenario 6 di atas — tiga tipe soal diperiksa langsung dan 0 penanda kunci di panel simulasi, sementara formular pengajar tetap menandai kunci dan nilai kunci bertahan setelah muat ulang.
- Fixture dibersihkan: paket "Probe E2E Kunci Pratinjau" dihapus lewat tombol hapus di `/bank-soal` (toast "Paket bank soal berhasil dihapus."). Verifikasi `npx convex data`: `questionBanks` kembali 3 baris dan tidak ada yang berjudul fixture; `questions` menyisakan 6 baris milik paket nyata ("Adab dan Akhlaq 1" dan sejenisnya) dengan **0** baris ber-`bankId` milik fixture. Akun pengajar uji dikeluarkan lewat `/api/auth/sign-out` (200).
- Belum dibuktikan: sisi koreksi pada skenario 7 ("Belum ditandai" untuk butir essay tanpa penanda) — masih `Failed` dan belum diperbaiki.

### Temuan

- **Sedang — pratinjau santri masih menampilkan penanda "Kunci". SUDAH DIPERBAIKI (2026-11-06).** Panel "Simulasi Siswa" di editor butir menandai opsi kunci dengan label "Kunci", meskipun skenario menuntut kunci tersembunyi dari pratinjau. Tidak berdampak ke perangkat santri sungguhan (lembar `/ujian` bersih), tetapi bertentangan dengan kontrak pratinjau. Perbaikan dan bukti pengulangan dicatat pada blok "Perbaikan temuan pertama" dan skenario 6.
- **Sedang — butir tanpa penanda tidak menampilkan "Belum ditandai" di lembar koreksi.** Blok metadata pengajar hanya dirender bila `explanation`, `thinkingLevel`, atau `achievementRef` terisi, sehingga butir essay lama tidak memperlihatkan status default yang diminta skenario.
- **Rendah — parameter rute koreksi berbeda dari spek.** Halaman memakai `participantId`; id sesi pada segmen rute menghasilkan layar galat generik alih-alih keadaan kosong yang ramah.
- **Rendah — simpan sebagian membersihkan pratinjau.** Baris bermasalah hilang bersama kolom tempel, bukan bertahan untuk diperbaiki.
- **Rendah — nilai metadata kosong dihilangkan pada kartu pratinjau impor**, bukan ditampilkan sebagai "—".
- **Batasan alat (bukan cacat produk).** Viewport otomasi tetap 474×569 px tanpa tangkapan layar native; tata letak desktop dan 390 px hanya dapat disimpulkan dari struktur DOM dan pengukuran lebar.

### Langkah berikutnya

- Rekomendasi `/bug`: **sudah dijalankan untuk temuan pertama** (penanda kunci di pratinjau santri, lihat blok perbaikan 2026-11-06). Yang tersisa temuan kedua — tampilkan "Belum ditandai" untuk butir tanpa penanda di lembar koreksi, atau selaraskan skenario bila keputusan produk berbeda.
- Skenario 6 dan sisi pengajar skenario 1/4 **sudah diulang di browser 2026-11-06** dan lulus (lihat bukti pada skenario 6). Pengulangan berikutnya hanya dibutuhkan untuk sisi koreksi skenario 7 setelah temuan kedua diperbaiki: `/e2e-tester specs/e2e/pembahasan-berpikir-capaian.md`.
- Perjelas kontrak rute koreksi (`participantId` vs id sesi) pada dokumentasi dan tangani id tidak valid tanpa layar galat generik.
