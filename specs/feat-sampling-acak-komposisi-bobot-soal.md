# Spesifikasi Fitur: Pengacakan & Komposisi Butir Soal Bank Soal dengan Pembobotan Kategori (PG 70% & Esai 30%)

## 1. Definisi Masalah & Perilaku yang Diharapkan
### Masalah Saat Ini
1. **Tidak Ada Sub-Sampling Soal:** Saat ini pada sistem CBT Imtihan (`apps/convex/examSession/`), Sesi Ujian selalu memuat seluruh butir soal yang berada di dalam paket `questionBanks` rujukan. Jika guru memiliki 500 butir soal di Bank Soal, seluruh 500 soal tersebut langsung disajikan ke santri tanpa ada opsi untuk mengambil hanya sampel sebagian (misal 20 soal PG dan 5 soal Esai).
2. **Ketiadaan Pembobotan Berdasarkan Kategori Soal:** Skema penilaian saat ini mengakumulasi skor murni dari `q.points` masing-masing butir soal. Tidak ada mekanisme pembagian persentase bobot otomatis per kategori (seperti standar umum madrasah/sekolah: 70% untuk Pilihan Ganda dan 30% untuk Esai) dengan total nilai akhir 100.
3. **Ketidaksesuaian Rubrik Koreksi Esai:** Jika guru ingin total nilai esai bernilai 30 poin dari 5 butir soal, guru harus membagi manual poin pecahan (misal 6 poin per nomor), yang menyulitkan proses koreksi rubrik deskriptif.

### Perilaku yang Diharapkan
1. **Mode Pemilihan Soal Fleksibel:** Pada form pembuatan dan pengeditan Sesi Ujian, guru dapat memilih:
   - *Mode Lengkap:* Menggunakan seluruh soal di Bank Soal rujukan (perilaku bawaan saat ini).
   - *Mode Komposisi (Blueprint Sampling):* Menentukan jumlah kuota butir dan bobot persentase per kategori.
2. **Stratified Random Sampling (Pengacakan Terpisah per Kategori):**
   - Sistem secara otomatis memisahkan butir soal objektif (`multiple_choice`, `true_false`, `pg_kompleks`) dan butir soal subjektif (`essay`).
   - Sistem mengambil secara acak butir soal sesuai kuota yang diminta (contoh: 20 butir PG dari kumpulan PG, dan 5 butir Esai dari kumpulan Esai).
   - Daftar butir soal terpilih (`selectedQuestionIds`) dikunci pada Sesi Ujian, sehingga seluruh santri dalam sesi tersebut mengerjakan butir soal yang setara dan adil.
   - Urutan nomor dan pilihan opsi tetap dapat diacak antar-santri menggunakan fitur `randomizeQuestions` dan `randomizeOptions`.
3. **Normalisasi Bobot Kategori Otomatis (70% PG & 30% Esai):**
   - **Skor Pilihan Ganda (Maksimal 70 Poin):** Dihitung otomatis:
     $$\text{Skor PG} = \left(\frac{\text{Jumlah Butir PG Benar}}{\text{Total Butir PG Diujikan}}\right) \times 70$$
   - **Skor Esai (Maksimal 30 Poin):** Guru memberikan nilai rubrik pada skala yang wajar (misal 0–10 atau 0–100 per butir), lalu sistem mengonversikannya secara proporsional ke dalam bobot 30%:
     $$\text{Skor Esai} = \left(\frac{\text{Total Poin Esai yang Diberikan}}{\text{Total Poin Maksimal Esai}}\right) \times 30$$
   - **Total Skor Akhir:**
     $$\text{Total Nilai} = \text{Skor PG} + \text{Skor Esai} \quad (\text{Maksimal } 100)$$
4. **Validasi & Proteksi Form UI:**
   - Menampilkan informasi ketersediaan soal di bank terpilih (misal: "Tersedia 420 butir PG dan 80 butir Esai").
   - Memvalidasi bahwa jumlah butir yang diminta tidak melebihi stok yang tersedia.
   - Memvalidasi bahwa total persentase bobot berjumlah tepat 100% ($70\% + 30\% = 100\%$).
   - Menyediakan tombol *Kocok Ulang* bagi guru untuk memperbarui sampel soal sebelum sesi diaktifkan.

---

## 2. Ruang Lingkup (Scope)
### In Scope
- Penambahan atribut opsional `questionComposition` dan `selectedQuestionIds` pada tabel `examSessions` di `apps/convex/schema.ts`.
- Pembuatan modul utilitas murni `apps/lib/exam-sampling.ts` yang berisi algoritma sampling terpisah (*stratified random sampling*) dan fungsi normalisasi skor kategori.
- Penyesuaian mutasi pembuatan dan pembaruan sesi ujian di `apps/convex/examSession/public/mutations.ts` (`createExamSession`, `updateExamSession`).
- Penyesuaian query lembar ujian santri di `apps/convex/examSession/public/queries.ts` (`getExamSessionForParticipant`) agar hanya mengambil soal yang terdaftar di `selectedQuestionIds`.
- Penyesuaian kalkulasi penilaian akhir di `apps/convex/examSession/public/mutations.ts` (`submitExam` dan `gradeEssayQuestion`) dengan formula normalisasi bobot.
- Penambahan kontrol antarmuka pada modal pembuatan/pengeditan Sesi Ujian di `apps/app/(main)/sesi-ujian/page.tsx`.
- Pengujian unit otomatis di `apps/tests/exam-sampling.test.ts`.
- Penyusunan dokumen handoff E2E di `specs/e2e/sampling-komposisi-bobot-soal.md`.

### Out of Scope
- Pengubahan skema tabel `questions` atau penulisan ulang butir soal di Bank Soal.
- Fitur penarikan soal acak dinamis yang berbeda per santri dalam satu sesi (karena tidak adil untuk ujian resmi madrasah; semua santri dalam satu sesi mendapatkan paket 25 butir soal yang sama, namun urutan nomor dan opsi diacak).
- Modifikasi format cetak rapor fisik (rapor tetap membaca nilai akhir 0–100 hasil kalkulasi sesi).

---

## 3. Bukti & Rujukan Teknis (Evidence)
- Skema database aktif: `apps/convex/schema.ts` (tabel `examSessions` baris 86–116, tabel `questions` baris 40–84).
- Logika query soal santri: `apps/convex/examSession/public/queries.ts` (`getExamSessionForParticipant`, baris 306–318).
- Logika pengoreksian PG: `apps/convex/examSession/public/mutations.ts` (`submitExam`, baris 895–965).
- Logika pengoreksian Esai: `apps/convex/examSession/public/mutations.ts` (`gradeEssayQuestion`, baris 1000–1080).
- Halaman UI Sesi Ujian: `apps/app/(main)/sesi-ujian/page.tsx` (state form baris 92–105).

---

## 4. Berkas-Berkas Terkait (Relevant Files)
1. `apps/lib/exam-sampling.ts` (Baru):
   - `sampleQuestionsByComposition(questions, composition)`
   - `calculateNormalizedPgScore(correctCount, totalPg, pgWeight)`
   - `calculateNormalizedEssayScore(awardedTotal, maxPossible, essayWeight)`
   - `calculateCompositeFinalScore(pgScore, essayScore, passingScore, capAtPassingScore)`
2. `apps/convex/schema.ts`:
   - Penambahan kolom `questionComposition` dan `selectedQuestionIds` pada tabel `examSessions`.
3. `apps/convex/examSession/public/mutations.ts`:
   - Integrasi pemilihan sampel butir soal pada `createExamSession` dan `updateExamSession`.
   - Penerapan normalisasi bobot pada `submitExam` dan `gradeEssayQuestion`.
4. `apps/convex/examSession/public/queries.ts`:
   - Penyaringan soal berdasarkan `selectedQuestionIds` pada `getExamSessionForParticipant` dan `getExamSessionById`.
5. `apps/app/(main)/sesi-ujian/page.tsx`:
   - Penambahan kontrol komposisi (Toggle mode, Input kuota butir PG & Esai, Input bobot 70% & 30%, indikator validitas 100%, dan pratinjau ketersediaan butir).
6. `apps/tests/exam-sampling.test.ts` (Baru):
   - Pengujian unit untuk sampling acak terpisah, validasi stok soal, dan formula pembobotan skor.
7. `specs/e2e/sampling-komposisi-bobot-soal.md` (Baru):
   - Skenario pengujian browser untuk alur pembuatan sesi dengan komposisi 20 PG (70%) + 5 Esai (30%).

---

## 5. Kebutuhan Implementasi Berurutan (Dependency-Ordered Tasks)
1. **Tahap 1: Utilitas Murni (`apps/lib/exam-sampling.ts`)**
   - Implementasikan fungsi pengelompokan butir soal objektif vs esai.
   - Implementasikan algoritma pengambilan sampel acak deterministik/pseudo-acak tanpa duplikasi.
   - Implementasikan fungsi kalkulasi normalisasi skor ($70\%$ PG dan $30\%$ Esai).
2. **Tahap 2: Skema Database (`apps/convex/schema.ts`)**
   - Tambahkan field opsional pada `examSessions`:
     ```typescript
     questionComposition: v.optional(
       v.object({
         enabled: v.boolean(),
         pgCount: v.number(),
         pgWeight: v.number(), // misal 70
         essayCount: v.number(),
         essayWeight: v.number(), // misal 30
       })
     ),
     selectedQuestionIds: v.optional(v.array(v.id("questions"))),
     ```
3. **Tahap 3: Logika Backend Convex (`apps/convex/examSession/`)**
   - Pada `createExamSession`, jika mode komposisi aktif:
     - Validasi kecukupan jumlah soal PG dan Esai di bank soal rujukan.
     - Eksekusi pengambilan sampel `selectedQuestionIds`.
   - Pada `getExamSessionForParticipant`, jika `session.selectedQuestionIds` terisi:
     - Hanya muat butir soal yang ID-nya ada di dalam daftar `selectedQuestionIds`.
   - Pada `submitExam`:
     - Hitung skor PG terbobot (skala 70).
   - Pada `gradeEssayQuestion`:
     - Hitung skor Esai terbobot (skala 30) dan jumlahkan menjadi skor akhir (skala 100).
4. **Tahap 4: Antarmuka Sesi Ujian (`apps/app/(main)/sesi-ujian/page.tsx`)**
   - Tambahkan section kartu form *"Komposisi & Pembobotan Soal"* di dalam dialog pembuatan sesi.
   - Hitung ketersediaan butir soal dari bank yang dipilih secara real-time.
   - Sediakan preset default: 20 PG (70%) + 5 Esai (30%).
   - Tampilkan badge indikator validitas total bobot (100%).
   - Pastikan bebas emoji (gunakan ikon Lucide) dan bebas dari kebocoran teks teknis.
5. **Tahap 5: Pengujian & Validasi**
   - Buat unit test pada `apps/tests/exam-sampling.test.ts`.
   - Jalankan `npm --prefix apps test` dan verifikasi seluruh pengujian lolos.
   - Jalankan `npm --prefix apps run typecheck` untuk menjamin integritas tipe TypeScript.
   - Buat dokumen spesifikasi E2E di `specs/e2e/sampling-komposisi-bobot-soal.md`.

---

## 6. Kriteria Keberhasilan yang Terukur (Measurable Acceptance Criteria)
- **AC-01**: Guru dapat memilih opsi komposisi soal saat membuat sesi ujian dengan kuota 20 PG dan 5 Esai.
- **AC-02**: Sistem memverifikasi bahwa total bobot persentase adalah tepat 100% (70% + 30%).
- **AC-03**: Sistem menolak pembuatan sesi jika kuota butir soal melebihi stok yang tersedia di Bank Soal.
- **AC-04**: Peserta ujian yang masuk ke sesi hanya menerima 25 butir soal terpilih (bukan seluruh 500 soal).
- **AC-05**: Jawaban PG yang benar 20 dari 20 butir menghasilkan skor PG tepat 70.00.
- **AC-06**: Nilai esai santri yang diberikan guru dinormalisasi secara proporsional ke bobot maksimal 30.00.
- **AC-07**: Nilai total santri berakumulasi maksimal 100.00.
- **AC-08**: Sesi ujian yang dibuat sebelum fitur ini ada (atau yang tidak mengaktifkan komposisi) tetap berfungsi 100% normal (*full backward compatibility*).
- **AC-09**: Seluruh tes unit (`npm --prefix apps test`) dan pemeriksaan tipe (`npm --prefix apps run typecheck`) lulus dengan 0 kesalahan.

---

## 7. Risiko & Mitigasi (Risk & Mitigation)
- **Risiko 1:** Bank soal tidak memiliki cukup butir esai (misal hanya ada 3 butir esai padahal kuota diminta 5).
  - *Mitigasi:* Sistem menampilkan validasi visual langsung pada form sebelum simpan: *"Stok esai tidak mencukupi (tersedia 3 butir, diminta 5 butir)"* dan tombol simpan dinonaktifkan.
- **Risiko 2:** Pembagian skor dengan angka desimal (misal $70 / 20 = 3.5$).
  - *Mitigasi:* Skor disimpan dengan pembulatan 2 tempat desimal standar (`Math.round(score * 100) / 100`), seragam dengan sistem pelaporan rapor.
- **Risiko 3:** Regresi pada sesi ujian yang sudah berjalan.
  - *Mitigasi:* Semua kolom skema baru bersifat opsional (`v.optional`), sehingga bila tidak disetel, sistem menjalankan logika lama secara utuh.

---

## 8. Pertimbangan Kompatibilitas, Keamanan & Migrasi
- **Kompatibilitas:** Data sesi lama tidak memerlukan migrasi database karena ketiadaan `questionComposition` diartikan sebagai mode bawaan (menggunakan semua butir soal di bank).
- **Keamanan:** Pengundian dan penetapan ID soal dilakukan di backend Convex yang aman dari manipulasi klien. Santri tidak dapat meminta soal di luar `selectedQuestionIds`. Kunci jawaban (`isCorrect`) dan rubrik esai tetap disanitasi ketat sebelum dikirim ke peramban santri.

---

## 9. Perintah Validasi Repository
```bash
# 1. Jalankan unit test menyeluruh
npm --prefix apps test

# 2. Jalankan pemeriksaan tipe TypeScript
npm --prefix apps run typecheck

# 3. Sinkronisasi fungsi dan skema Convex
npx --prefix apps convex dev --once
```

---

## 10. Ekspektasi Dokumentasi & Hand-off E2E
- Dokumen spesifikasi implementasi: `specs/feat-sampling-acak-komposisi-bobot-soal.md` (dokumen ini).
- Dokumen handoff pengujian antarmuka: `specs/e2e/sampling-komposisi-bobot-soal.md`.
