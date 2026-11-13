# Rencana Implementasi: Pengacakan Butir Soal Terkelompok (Pilihan Ganda di Awal, Esai di Akhir)

## 1. Masalah & Perilaku yang Diinginkan
- **Masalah Saat Ini**: Ketika pengajar mengaktifkan opsi *"Acak Urutan Butir Soal"* (`randomizeQuestions: true`) pada Sesi Ujian, fungsi `deterministicShuffle` mengacak seluruh butir soal tanpa membedakan tipe. Akibatnya, soal pilihan ganda dan soal esai berbaur secara acak (misal soal nomor 2 adalah esai, nomor 3 pilihan ganda, nomor 4 esai).
- **Perilaku yang Diinginkan**:
  - Soal pilihan ganda / objektif (`multiple_choice`, `true_false`, `pg_kompleks`) **selalu tampil di nomor-nomor awal** (misal 1 s.d. 20).
  - Soal esai (`essay`) **selalu tampil di nomor-nomor akhir** (misal 21 s.d. 25).
  - Jika `randomizeQuestions` aktif:
    - Kelompok soal objektif diacak antar sesama soal objektif secara deterministik per santri.
    - Kelompok soal esai diacak antar sesama soal esai secara deterministik per santri (menggunakan seed terpisah `${participant._id}_essay`).
  - Jika `randomizeQuestions` nonaktif:
    - Seluruh butir diurutkan berdasarkan `orderNumber` aslinya (`a.orderNumber - b.orderNumber`).
  - Ketentuan ini menjamin bahwa seluruh santri selalu mengerjakan soal objektif terlebih dahulu, baru kemudian mengerjakan soal esai di bagian akhir lembar kerja, namun nomor butir di dalam masing-masing kelompok tetap teracak untuk mencegah kecurangan.

## 2. Cakupan (In/Out Scope)
- **In-Scope**:
  - Logika pengelompokan dan pengacakan di `apps/convex/examSession/public/queries.ts` pada query `getExamForWorksheet`.
  - Fungsi utilitas pendukung (misal `groupAndShuffleQuestions`) di `apps/convex/examSession/private/helpers.ts` agar mudah diuji secara modular dan unit testable.
  - Unit test komprehensif di `apps/tests/exam-grouped-randomization.test.ts`.
  - Pembaruan spesifikasi E2E handoff di `specs/e2e/grouped-question-randomization.md`.
- **Out-of-Scope**:
  - Mengubah skema database Convex (tidak perlu ada kolom baru).
  - Mengubah antarmuka UI Sesi Ujian atau Lembar Kerja Santri (keduanya sudah otomatis mengikuti urutan array soal yang dikirim backend).

## 3. Berkas Terkait
- `apps/convex/examSession/private/helpers.ts`: Implementasi fungsi pembantu `groupAndShuffleQuestions`.
- `apps/convex/examSession/public/queries.ts`: Pemanggilan `groupAndShuffleQuestions` di `getExamForWorksheet`.
- `apps/tests/exam-grouped-randomization.test.ts`: Pengujian unit untuk verifikasi pengacakan terkelompok.

## 4. Rincian Implementasi Berurutan
1. **Langkah 1**: Di `apps/convex/examSession/private/helpers.ts`, buat fungsi `groupAndShuffleQuestions<T extends { type?: string; orderNumber: number }>(questions: T[], participantId: string, shouldRandomize: boolean): T[]`:
   - Memisahkan `objective = questions.filter(q => q.type !== "essay")` dan `essay = questions.filter(q => q.type === "essay")`.
   - Jika `shouldRandomize === true`:
     - Acak `objective` menggunakan `deterministicShuffle(objective, participantId)`.
     - Acak `essay` menggunakan `deterministicShuffle(essay, `${participantId}_essay`)`.
     - Kembalikan `[...shuffledObjective, ...shuffledEssay]`.
   - Jika `shouldRandomize === false`:
     - Urutkan `[...questions].sort((a, b) => a.orderNumber - b.orderNumber)`.
2. **Langkah 2**: Di `apps/convex/examSession/public/queries.ts`, panggil `groupAndShuffleQuestions(rawQuestions, participant._id, session.randomizeQuestions)` untuk menyusun `orderedQuestions`.
3. **Langkah 3**: Buat unit test di `apps/tests/exam-grouped-randomization.test.ts`:
   - Uji bank soal berisi 20 PG + 5 Essay dengan pengacakan aktif: Buktikan indeks 0..19 selalu ber-tipe `multiple_choice`, dan indeks 20..24 selalu ber-tipe `essay`.
   - Uji determinisme: Buktikan santri yang sama selalu mendapatkan urutan yang sama (idempotent / tahan refresh).
   - Uji variasi antar santri: Buktikan santri A dan santri B mendapatkan urutan yang berbeda, tetapi tipe soal tetap terpisah (PG di awal, esai di akhir).
   - Uji saat `randomizeQuestions: false`: Buktikan urutan sesuai `orderNumber` aslinya.
   - Uji bank soal khusus (hanya PG, atau hanya Essay).
4. **Langkah 4**: Jalankan validasi:
   - `npm --prefix apps run test`
   - `npm --prefix apps run typecheck`
   - `npm --prefix apps run test:ui-leak`
5. **Langkah 5**: Deploy ke produksi:
   - `cd apps; npx convex deploy -y` (BypassSandbox: true)
   - `npm --prefix apps run deploy:worker` (BypassSandbox: true)

## 5. Kriteria Keberhasilan & Validasi
- Seluruh 490+ unit tests lulus tanpa regresi.
- `tsc --noEmit` lulus bersih.
- Soal pilihan ganda terbukti tidak pernah muncul setelah soal esai ketika `randomizeQuestions` aktif.
