# Spesifikasi E2E: Penilaian Instan Pilihan Ganda & Koreksi Essay (TASK-007)

- **Target Kebutuhan**: `NILAI-FR-001`, `NILAI-FR-002`, `NILAI-FR-003`
- **Rekomendasi E2E**: `Recommended`
- **Status**: `Passed` (dijalankan 2026-11-05: 3/3 skenario lulus, plus 1 kasus negatif batas nilai)
- **Lingkungan**: Local development (`http://localhost:3000`) dengan Convex dev deployment

## Prasyarat
1. Server lokal aktif pada `http://localhost:3000`.
2. Pengguna login sebagai pengajar/admin.
3. Terdapat minimal 1 peserta ujian yang telah mengumpulkan lembar jawaban ujian (`submitted`).

## Skenario Pengujian Browser
1. **Perhitungan Otomatis Skor Pilihan Ganda**:
   - Santri mengumpulkan ujian yang memuat soal pilihan ganda.
   - Pengajar membuka menu rekap / hasil sesi ujian.
   - *Ekspektasi*: Kolom skor pilihan ganda santri langsung menampilkan angka perolehan nilai secara otomatis sesuai kunci jawaban tanpa perlu dihitung manual.

2. **Membuka Lembar Periksa Koreksi Essay**:
   - Pengajar mengklik tombol "Koreksi Essay" pada baris santri yang bersangkutan.
   - *Ekspektasi*: Halaman koreksi terbuka, menampilkan teks pertanyaan, rubrik pedoman penilaian, dan jawaban essay yang diketik santri.

3. **Pengisian Nilai Skor Essay & Catatan Evaluasi**:
   - Pengajar memasukkan skor nilai (misal: 25 dari total bobot 30) dan menulis catatan evaluasi: "Penjelasan cukup lengkap dan tepat".
   - Mengklik tombol "Simpan Nilai Koreksi".
   - *Ekspektasi*: Toast sukses muncul, nilai essay tersimpan, dan total nilai akhir santri langsung terakumulasi (Skor PG + Skor Essay).

## Bukti Eksekusi (Evidence)

### 2026-11-05 — 3/3 skenario Passed

- **Alat**: otomasi browser in-app Qoder di `http://localhost:3000`. Keterbatasan: tab automation selalu `visibilityState = "hidden"` dengan `innerWidth = 0`, tanpa tangkapan layar, `list_console_messages` tidak tersedia. Pembungkus `console.error` / `window.onerror` dipasang di halaman (0 entri selama seluruh run); hasil akhir disetorkan silang dengan `npx convex data`.
- **Fixture** (dibuat lewat mutasi publik aplikasi sebagai pengajar `pengajar.uji@example.com`, lalu sesi diaktifkan): paket "E2E Penilaian" `j57a0t0sw5wa05cwen5mx8hxd58hmtxf` (FIQIH / SMPITA kelas 7, 105 poin, KKM 75) berisi 4 butir — PEN-1 PG 25 (kunci `a`), PEN-2 PG 25 (kunci `a`), PEN-3 PG 25 (kunci `c`, sengaja tidak dijawab), PEN-4 essay 30 dengan rubrik. Sesi "E2E Penilaian 60" `jh78mwfehh8yry219cgejnq2th8hm67t` token `3FYQ5L` (tanpa acak soal/opsi agar kunci mudah dilacak). Santri: `26.02.017` Raihan Pasya Pratama (7A).
- **Jawaban santri lewat UI**: PEN-1 pilih A (benar), PEN-2 pilih B (salah), PEN-3 kosong, PEN-4 essay "Hari pembalasan di mana setiap amal diperlihatkan, baik kebaikan maupun keburukan." Dialog konfirmasi pengumpulan membaca "3 Terjawab / 0 Ragu-ragu / 1 Kosong" sebelum "Ya, Kumpulkan Jawaban".

1. **Perhitungan Otomatis Skor Pilihan Ganda** → **Passed**
   - Aksi: santri mengumpulkan lembar; pengajar membuka `/rekap-nilai`.
   - Ekspektasi: skor PG langsung terhitung otomatis.
   - Aktual: baris "Raihan Pasya Pratama / 26.02.017 / Selesai / Reguler / 0 (Tertib)" menampilkan **Nilai PG 25**, Essay 0, Total 25, Ketuntasan "Belum tuntas", Status "Perlu Koreksi Essay" — tanpa langkah hitung manual. Statistik kelas ikut terisi (Rata-rata 25, Tertinggi 25, Terendah 25).
   - Bukti server (`npx convex data`): `examParticipants` → `multipleChoiceScore: 25`, `gradingStatus: "pending_essay"`; `studentAnswers` per butir → `scoreAwarded: 25` untuk kunci benar, `0` untuk pilihan salah, dan **tidak ada baris** untuk butir yang tidak dijawab.

2. **Membuka Lembar Periksa Koreksi Essay** → **Passed**
   - Aksi: klik tautan "Koreksi Essay" pada baris santri → `/rekap-nilai/koreksi/jn73t25dmwzbzers0p3svt86518hny4d`.
   - Ekspektasi: teks soal, rubrik, dan jawaban santri tampil.
   - Aktual: halaman menampilkan ringkasan "Nilai Pilihan Ganda 25 Poin / Nilai Essay 0 Poin / Total Nilai Akhir 25 Poin"; tiap butir PG diberi penanda "Dipilih Santri" vs "Kunci Jawaban" dan "Poin Butir Ini: 25 / 25", "0 / 25", "0 / 25". Butir #4 essay menampilkan teks soal "E2E PEN-4: jelaskan isi pokok surat Az-Zalzalah.", blok **"Pedoman Rubrik Penilaian: Skor 30: menyebut hari pembalasan (10), amal diperlihatkan (10), contoh ayat (10)."**, dan **"Jawaban Tertulis Santri: Hari pembalasan di mana setiap amal diperlihatkan, baik kebaikan maupun keburukan."** Kolom "Beri Nilai (Maks: 30)" (`#score-j9772xpd…`, `max=30`, placeholder "0 - 30") dan "Catatan Evaluasi / Masukan Pengajar" tersedia.
   - Status: Passed.

3. **Pengisian Nilai Skor Essay & Catatan Evaluasi** → **Passed**
   - Aksi: isi `25` dan catatan "Penjelasan cukup lengkap dan tepat", klik tombol simpan.
   - Catatan deviasi kecil: label tombol pada layar adalah **"Simpan Nilai"**, bukan "Simpan Nilai Koreksi" seperti teks spek; fungsi dan posisinya sama.
   - Ekspektasi: toast sukses, nilai essay tersimpan, total terakumulasi (PG + Essay).
   - Aktual: toast **"Nilai butir essay berhasil disimpan dan total nilai diperbarui!"**; header berubah "Perlu Koreksi Essay" → **"Selesai Dinilai"**, "Nilai Essay 25 Poin", **"Total Nilai Akhir 50 Poin"** (= 25 PG + 25 essay). Kembali ke `/rekap-nilai`, baris menjadi **25 / 25 / 50**, "Belum tuntas" (KKM 75), "Selesai Dinilai", dan statistik kelas naik ke Rata-rata / Tertinggi / Terendah 50.
   - Bukti server: `studentAnswers` → `scoreAwarded: 25`, `teacherFeedback: "Penjelasan cukup lengkap dan tepat"`; `examParticipants` → `multipleChoiceScore: 25`, `essayScore: 25`, `totalScore: 50`, `rawTotalScore: 50`, `gradingStatus: "graded"`.

### Kasus negatif tambahan (di luar daftar spek)

- Aksi: mengisi nilai essay `40` (di atas `max=30`) lalu menyimpan.
- Aktual: ditolak dengan toast **"Nilai harus di antara 0 dan 30 poin."** dan nilai tersimpan tetap 25 (header masih "Nilai Essay 25 Poin / Total 50"). Validasi batas bekerja di sisi klien maupun simpan.

### Temuan

- Tidak ada kegagalan fungsional pada tiga skenario. Satu deviasi penamaan tombol ("Simpan Nilai") dicatat di atas.
- Terulang dari spec lain (bukan regression spec ini): layar akhir santri menampilkan baris identitas kosong, dan indikator auto-save tersembunyi di bawah breakpoint — keduanya tidak memengaruhi penilaian di sini.

### Media Evidence

- Tanpa tangkapan layar/rekaman (kemampuan browser in-app tidak menyediakannya pada sesi ini; tab target selalu `hidden`, viewport 0 px). Bukti yang dipakai: teks DOM yang dibaca langsung, toast hasil `MutationObserver`, dan kueri `npx convex data` pada `examParticipants` + `studentAnswers`.

### Pembersihan data uji

Dijalankan 2026-11-05 setelah seluruh skenario selesai.

- Fixture yang dipakai: paket bank soal `j57a0t0sw5wa05cwen5mx8hxd58hmtxf` ("E2E Penilaian", 4 butir) dan sesi `jh78mwfehh8yry219cgejnq2th8hm67t` (token `3FYQ5L`) beserta peserta dan lembar jawabannya.
- Jalur publik saja tidak cukup: `deleteExamSession` (`apps/convex/examSession/public/mutations.ts:408-428`) hanya menghapus dokumen sesi sehingga peserta dan lembar jawaban akan yatim, sedangkan `deleteQuestionBank` (`apps/convex/bank/public/mutations.ts:415-442`) sudah men cascade butir soal. Karena itu dipakai mutasi internal sementara `convex/tmpE2e/cleanup.ts` (dibuat, dijalankan, lalu dihapus) yang menelusuri `examParticipants.by_session` → `studentAnswers.by_participant` → sesi, dan `questions.by_bank` → bank.
- Perintah: `npx convex dev --once` (push modul sementara), lalu
  `npx convex run tmpE2e/cleanup:cleanup '{"bankId":"j57a0t0sw5wa05cwen5mx8hxd58hmtxf","sessionIds":["jh78mwfehh8yry219cgejnq2th8hm67t"]}'`
- Hasil yang dikembalikan fungsi: `{ sessions: 1, participants: 1, answers: 3, questions: 4 }` dan bank terhapus.

## Status Pembersihan (2026-11-05)

- Verifikasi ulang dengan `npx convex data` — hanya data milik pengguna yang tersisa, tidak ada jejak fixture:
  - `examSessions` (2): `jh7177my09awgzjjnv91d618b18hgdsm` "adab akhlaq" (token `2C6PKJ`), `jh77j75c1d1fm120vqqe00qhh58hgfpc` "Ujian FiQih Uji Integrasi" (token `HH4XC2`).
  - `examParticipants` (2): peserta milik kedua sesi di atas (`24.03.001` dan `0119755229`), keduanya `submitted`.
  - `studentAnswers` (1): 1 lembar jawaban warisan milik sesi `HH4XC2`.
  - `questionBanks` (3): "Adab dan Akhlaq 1" ×2 dan "Uji Integrasi CBT".
- Modul sementara `apps/convex/tmpE2e/` sudah dihapus (`rm -rf convex/tmpE2e`), dan push ulang menghasilkan `✔ 23:10:34 Convex functions ready! (7.75s)` — tidak ada fungsi tersisa di deployment yang berasal dari tes ini.
- Akun pengajar uji `pengajar.uji@example.com` sengaja dipertahankan (dipakai spec lain); `pengajar.dua@example.com` tidak dapat dihapus lewat jalur publik karena baris better-auth berada di tabel komponen.

