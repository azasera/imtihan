# Spesifikasi E2E: Lembar Pengerjaan Ujian Santri & Auto-Save (TASK-006)

- **Target Kebutuhan**: `UJIAN-FR-002`, `UJIAN-FR-003`, `UJIAN-FR-004`, `UJIAN-FR-005`
- **Rekomendasi E2E**: `Recommended`
- **Status**: `Passed` (dijalankan 2026-11-05: 6 dari 6 skenario terverifikasi, 3 temuan tercatat)
- **Lingkungan**: Local development (`http://localhost:3000`) dengan Convex dev deployment

## Prasyarat
1. Server lokal berjalan pada `http://localhost:3000`.
2. Sesi ujian aktif dengan minimal 2 butir soal (1 pilihan ganda dan 1 essay).
3. Santri telah berhasil masuk via NISN dan token di `/ujian`.

## Skenario Pengujian Browser
1. **Membuka Lembar Ujian & Verifikasi Elemen**:
   - Setelah masuk, klik tombol "Mulai Mengerjakan Ujian".
   - *Ekspektasi*: Lembar ujian terbuka dengan menampilkan timer hitung mundur, teks soal nomor 1, opsi pilihan jawaban, dan grid navigasi nomor soal.

2. **Memilih Jawaban Pilihan Ganda & Auto-Save**:
   - Klik salah satu opsi jawaban (misal Opsi B).
   - *Ekspektasi*: Opsi terpilih, indikator status auto-save menampilkan "Tersimpan", dan kotak nomor soal pada grid berubah menjadi status "Sudah Dijawab".

3. **Menandai Soal Ragu-ragu**:
   - Klik tombol "Ragu-ragu".
   - *Ekspektasi*: Kotak nomor soal pada grid berubah warna menjadi kuning (ragu-ragu).

4. **Navigasi ke Soal Berikutnya**:
   - Klik tombol "Soal Berikutnya" atau klik nomor 2 pada grid soal.
   - *Ekspektasi*: Tampilan berpindah ke soal nomor 2.

5. **Pengisian Jawaban Essay**:
   - Ketik jawaban pada textarea essay.
   - *Ekspektasi*: Jawaban tersimpan otomatis ke database.

6. **Konfirmasi Pengumpulan Lembar Ujian**:
   - Klik tombol "Selesaikan Ujian".
   - *Ekspektasi*: Dialog konfirmasi pengumpulan muncul menampilkan rekap jumlah soal yang sudah dijawab, belum dijawab, dan ragu-ragu.
   - Klik "Ya, Kumpulkan Jawaban".
   - *Ekspektasi*: Lembar ujian ditutup, status peserta menjadi selesai, dan tampil layar penutup bahwa ujian telah berhasil dikumpulkan.

## Bukti Eksekusi (Evidence)

### Eksekusi 2026-11-05 oleh `/e2e-tester`

- Lingkungan: lokal `http://localhost:3000`, Convex dev deployment `quirky-rat-737`, login pengajar `pengajar.uji@example.com`.
- Fixture: bank `E2E Lembar Santri (FIQIH)` (`j574gqw00nm9s9j3d0pse2kfwh8hnv3r`) berisi 1 butir pilihan ganda (4 opsi, 50 poin) + 1 butir essay (50 poin); sesi `E2E Lembar Santri` (`jh7c0rxf23w6wma6stq6f2jd4d8hm2b6`, token `CGCM32`, durasi 60 menit, pengacakan soal & opsi aktif, batas tuntas 75) dibuat lalu diaktifkan dari layar `/sesi-ujian`; peserta santri `26.03.026` Zamzami (SMAITA / 10A).
- Hasil keseluruhan: **Passed** (6 dari 6 skenario).
- Batasan alat: tab browser berada pada `visibilityState=hidden` dengan viewport terkunci 474×569 px (tidak dapat diubah) dan tanpa tangkapan layar. Konsekuensinya, dua elemen yang memang disengaja tersembunyi di bawah breakpoint tidak bisa dikonfirmasi secara visual: indikator auto-save (`hidden sm:flex` di [apps/app/ujian/ExamWorksheet.tsx:617](file:///D:/DATA/PROJEK/IMTIHAN/apps/app/ujian/ExamWorksheet.tsx)) dan label teks "Tersimpan" (`hidden md:inline` pada baris 631). Statusnya dibuktikan lewat DOM/CSS terkomputasi dan isi database, bukan lewat pengamatan mata.
- Catatan prasyarat: bank soal fixture dibuat melalui mutasi publik aplikasi (`bank/public/mutations:createQuestionBank` + `createQuestion`) yang dipanggil dari client Convex milik sesi login pengajar, karena dialog pembuatan bank soal bermasalah saat disimpan (perilaku yang sama sudah dicatat pada `specs/e2e/batas-tuntas-sesi-lanjutan.md`). Sesi, aktivasi, dan seluruh alur lembar ujian dikerjakan lewat UI.

### Skenario 1 — Membuka Lembar Ujian & Verifikasi Elemen

- Actions: masuk gerbang `/ujian` (NISN `26.03.026`, token `CGCM32`), lalu klik "Mulai Mengerjakan Ujian".
- Expected: timer hitung mundur, teks soal nomor 1, opsi jawaban, dan grid navigasi nomor soal.
- Actual: timer `59:44` berjalan mundur; header `1/2` dan mapel "FIQIH"; soal "E2E WS 1: manakah rukun Islam yang kedua?" dengan tipe "Pilihan Ganda", bobot 50 Poin; opsi A/B/C/D tampil dalam urutan teracak (Syahadat, Haji, Salat, Puasa — berbeda dari urutan bank); grid navigasi berisi tombol bernomor `1` dan `2`.
- Status: **Passed**

### Skenario 2 — Memilih Jawaban Pilihan Ganda & Auto-Save

- Actions: klik opsi "Salat" (label C pada urutan acak).
- Expected: opsi terpilih, indikator "Tersimpan", kotak nomor berubah ke status "Sudah Dijawab".
- Actual: kotak grid `1` berubah kelas menjadi `bg-emerald-600 text-white ... ring-2` (status terjawab) sementara kotak `2` tetap `bg-muted`; elemen status auto-save berada di keadaan `saved` — `<span class="text-emerald-600 …">Tersimpan</span>` beserta ikon centang ada di DOM. Bukti persistensi: baris `studentAnswers` untuk butir PG tersimpan dengan `selectedOptionId: "b"` (Salat = kunci jawaban).
- Catatan: teks "Tersimpan" tidak muncul pada `document.body.innerText` karena penyembunyian responsif di bawah 640 px — lihat Temuan 1.
- Status: **Passed** (dengan catatan pengukuran)

### Skenario 3 — Menandai Soal Ragu-ragu

- Actions: klik tombol "Ragu-ragu" pada soal 1.
- Expected: kotak nomor 1 berubah kuning.
- Actual: kelas kotak grid `1` berubah dari `bg-emerald-600` menjadi `bg-amber-500`; `studentAnswers.isDoubtful: true` di database.
- Status: **Passed**

### Skenario 4 — Navigasi ke Soal Berikutnya

- Actions: klik tombol "Berikutnya".
- Expected: tampilan berpindah ke soal nomor 2.
- Actual: penghitung `2/2`, judul blok "Nomor 2", tipe "Essay / Uraian", bobot 50 Poin, dan textarea jawaban muncul.
- Status: **Passed**

### Skenario 5 — Pengisian Jawaban Essay

- Actions: mengetik "Sholat berjamaahpahala berganda dan melatih kedisiplinan santri." pada textarea, menunggu auto-save.
- Expected: jawaban tersimpan otomatis ke database.
- Actual: setelah ±6 detik indikator kembali ke keadaan `saved` ("Tersimpan"), dan `npx convex data studentAnswers` menampilkan `essayAnswer: "Sholat berjamaahpahala bergand…"` untuk butir essay.
- Status: **Passed**

### Skenario 6 — Konfirmasi Pengumpulan Lembar Ujian

- Actions: klik "Selesaikan Ujian", lalu "Ya, Kumpulkan Jawaban".
- Expected: dialog konfirmasi berisi rekap terjawab/belum/ragu-ragu; setelah konfirmasi lembar ditutup, peserta selesai, layar penutup muncul.
- Actual: dialog "Konfirmasi Pengumpulan Ujian" menampilkan rekap `2 Terjawab`, `1 Ragu-ragu`, `0 Kosong` plus peringatan "Masih terdapat 0 soal belum dijawab dan 1 soal ragu-ragu." Setelah konfirmasi: dialog dan lembar ujian hilang dari DOM (textarea tidak ada), layar "Ujian Selesai & Terkumpul" tampil dengan toast "Alhamdulillah, lembar ujian Anda telah berhasil dikumpulkan!", tombol "Selesai & Keluar dari Ruang Ujian" mengembalikan santri ke gerbang NISN/token. Verifikasi backend: `examParticipants.status = "submitted"`, `score = 50` (nilai otomatis PG; essay menunggu koreksi guru).
- Status: **Passed**

## Temuan

1. **Medium** — Indikator auto-save tidak tersedia untuk santri yang ujian di layar kecil. Pembungkus status berkelas `hidden sm:flex` ([apps/app/ujian/ExamWorksheet.tsx:617](file:///D:/DATA/PROJEK/IMTIHAN/apps/app/ujian/ExamWorksheet.tsx)) sehingga di bawah 640 px tidak ada ikon "Menyimpan…", tidak ada estado "Koneksi lambat", dan tidak ada "Tersimpan" sama sekali; label teksnya sendiri baru muncul di 768 px ke atas. Santri HP kehilangan satu-satunya umpan balik simpan-otomatis.
2. **Medium** — Layar penutup kehilangan data identitas. Baris "Nama Santri:", "NISN:", dan "Mata Pelajaran:" dirender kosong (nilai `""`), padahal santri baru saja mengumpulkan ujian dan perlu memastikan lembar miliknya memang terkumpul ([apps/app/ujian/ExamWorksheet.tsx](file:///D:/DATA/PROJEK/IMTIHAN/apps/app/ujian/ExamWorksheet.tsx), blok layar selesai).
3. **Low** — Menandai "Ragu-ragu" pada soal yang sudah dijawab mengganti warna kotak dari hijau (terjawab) menjadi kuning, sehingga status terjawab tidak lagi terlihat di grid; rekap pengumpulan tetap menghitungnya sebagai terjawab (2 Terjawab). Perlu legenda/dua penanda bila keduanya ingin tetap terbaca.

## Status Pembersihan

- Sesi `jh7c0rxf23w6wma6stq6f2jd4d8hm2b6` (token `CGCM32`) beserta peserta/jawabannya, dan bank `j574gqw00nm9s9j3d0pse2kfwh8hnv3r` beserta 2 butirnya, dihapus lewat modul internal sementara `convex/tmpE2e/cleanup.ts` (`npx convex run tmpE2e/cleanup:cleanup` → `{sessions: 1, participants: 1, answers: 2, questions: 2, bankDeleted: true}`). Verifikasi `npx convex data`: 0 sesi dan 0 bank berawalan "E2E" tersisa; data milik pengguna (`adab akhlaq`, `Ujian FiQih Uji Integrasi`) tidak disentuh.
