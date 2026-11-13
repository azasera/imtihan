# Spesifikasi Perbaikan UI/UX Ruang Ujian Santri (ExamWorksheet)

## 1. Definisi Masalah & Perilaku yang Diharapkan
Berdasarkan hasil audit menyeluruh terhadap tangkapan layar antarmuka Lembar Pengerjaan Ujian Santri (`/ujian`), ditemukan beberapa kelemahan visual, ambiguitas UX, serta inkonsistensi hitungan pada antarmuka:
1. **Inkonsistensi Legenda Jumlah Soal (Bug Kritis):**
   - *Masalah:* Legenda menampilkan `Sudah Dijawab (24) + Ragu-ragu (1) + Belum Dijawab (1) = 26`, padahal total soal hanya 25. Hal ini terjadi karena soal berstatus ragu-ragu dihitung ganda (masuk ke `answeredCount` sekaligus ke `doubtfulCount`).
   - *Perilaku Baru:* Klasifikasi legenda dipisahkan secara mutually exclusive:
     - `Dijawab Pasti`: jumlah soal yang telah diisi jawaban dan TIDAK berstatus ragu-ragu (`answeredSureCount`).
     - `Ragu-ragu`: jumlah soal yang ditandai ragu-ragu (`doubtfulCount`).
     - `Belum Dijawab`: jumlah soal yang belum diisi jawaban dan TIDAK ditandai ragu-ragu (`unansweredCount`).
     - Total: `answeredSureCount + doubtfulCount + unansweredCount === totalQuestions` (23 + 1 + 1 = 25).
     - Di header peta soal tetap ditampilkan total kemajuan pengisian: `${answeredCount}/${totalQuestions} Terjawab`.
2. **Status "Tersimpan" Tidak Jelas:**
   - *Masalah:* Indikator simpan di header hanya teks abu-abu tipis tanpa aksen visual kuat.
   - *Perilaku Baru:* Menggunakan badge status yang jelas dengan warna emerald (`CheckCircle2Icon` + "Tersimpan ✓"), loader saat proses simpan (`Menyimpan...`), dan peringatan merah jika koneksi putus (`Koneksi Terganggu`).
3. **Warna Tombol Opsi Benar/Salah Membingungkan:**
   - *Masalah:* Opsi "Pernyataan Salah" yang terpilih menggunakan border dan latar `rose-600 / rose-50` yang bernuansa pink/magenta dan menggunakan ikon tanda tanya (`HelpCircleIcon`).
   - *Perilaku Baru:* Opsi "Pernyataan Salah" yang dipilih menggunakan warna merah tegas (`border-red-600 bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-300 ring-2 ring-red-500/30`) dengan ikon silang `XCircleIcon`. Opsi "Pernyataan Benar" menggunakan hijau tegas (`border-emerald-600 bg-emerald-50 text-emerald-700`) dengan ikon `CheckCircle2Icon`.
4. **Panel Wacana/Stimulus Kosong & Layout Grid Tidak Seimbang:**
   - *Masalah:* Pada soal bacaan mandiri tanpa wacana, panel kiri menampilkan kartu placeholder berukuran besar yang memakan 33% lebar layar, membuat panel soal di tengah terasa sempit.
   - *Perilaku Baru:* Layout adaptif:
     - Jika soal memiliki wacana (`hasStimulus === true`): Menampilkan grid 3-kolom seimbang (Panel Stimulus 4 col, Panel Soal 5 col, Panel Peta 3 col).
     - Jika soal TIDAK memiliki wacana (`hasStimulus === false`): Panel soal diperlebar menjadi 8-9 kolom di desktop dengan card stimulus berupa info kontekstual ringkas, sehingga santri membaca soal dengan lebih leluasa.
5. **Navigasi Tombol "Sebelumnya / Ragu-ragu / Berikutnya" Kurang Menonjol:**
   - *Masalah:* Tombol navigasi berukuran kecil dengan kontras datar.
   - *Perilaku Baru:* Tombol "Berikutnya" diberi aksen utama `bg-primary` (teal) yang tegas, tombol "Sebelumnya" memiliki border dan padding lega, serta tombol "Ragu-ragu" memiliki aksen kuning/amber kontras.
6. **Timer Tanpa Warning State:**
   - *Masalah:* Timer berjalan monokrom tanpa indikasi visual sisa waktu kritis.
   - *Perilaku Baru:*
     - Sisa waktu > 10 menit: Netral / Card biasa.
     - Sisa waktu ≤ 10 menit: Aksen kuning/amber (`text-amber-700 bg-amber-50 border-amber-300 dark:bg-amber-950/50`).
     - Sisa waktu ≤ 5 menit: Aksen merah berkedip (`text-red-700 bg-red-50 border-red-500 dark:bg-red-950/50 animate-pulse font-extrabold`).
7. **Header Kurang Informatif:**
   - *Masalah:* Tidak ada visualisasi persentase progres pengerjaan di header.
   - *Perilaku Baru:* Menambahkan Progress Bar tepat di bawah header yang mencerminkan persentase pengisian soal secara real-time.
8. **Nomor Aktif pada Peta Nomor Soal Tidak Menonjol:**
   - *Masalah:* Nomor soal yang sedang dibuka santri sulit dibedakan dari nomor soal lain.
   - *Perilaku Baru:* Nomor aktif diberi aksen `ring-2 ring-primary ring-offset-2 scale-105 font-black shadow-md z-10`.
9. **Duplikasi Tombol "Selesaikan Ujian":**
   - *Masalah:* Tombol "Selesaikan Ujian" muncul ganda di header dan di bawah peta soal dengan bobot visual yang sama.
   - *Perilaku Baru:* Tombol utama diletakkan di bawah Peta Nomor Soal. Di header dibuat lebih kompak atau ditiadakan agar santri fokus menuntaskan peta nomor soal.
10. **Akses Pengajar / Tombol Kembali ke Dashboard:**
    - Pada `/ujian`, jika dibuka oleh pengajar yang sedang login, sediakan tombol navigasi "Kembali ke Dashboard Pengajar".

---

## 2. Ruang Lingkup
- **In Scope:**
  - `apps/app/ujian/ExamWorksheet.tsx`: Implementasi 9 perbaikan UI/UX lembar ujian santri.
  - `apps/app/ujian/page.tsx`: Penambahan tombol kembali ke dashboard untuk akun pengajar/admin.
  - `apps/tests/exam-worksheet.test.ts`: Pembaruan dan penambahan pengujian unit verifikasi formula legenda, warning state timer, styling Benar/Salah, dan zero leak.
- **Out of Scope:**
  - Perubahan skema basis data Convex (`schema.ts`).
  - Perubahan logika evaluasi nilai otomatis / mutasi backend ujian.

---

## 3. Bukti & Dasar Masalah
- Tangkapan layar `media_1794033147441_cae74bbb.png` menunjukkan:
  - Legenda: `Sudah Dijawab (24)`, `Ragu-ragu (1)`, `Belum Dijawab (1)` -> total 26 pada bank soal berisi 25 butir.
  - Kotak "Pernyataan Salah" berwarna pink (rose-600).
  - Panel stimulus kosong memakan sepertiga layar.
  - Timer `58:29` tanpa indikator visual.

---

## 4. Berkas yang Terkait
- `apps/app/ujian/ExamWorksheet.tsx`
- `apps/app/ujian/page.tsx`
- `apps/tests/exam-worksheet.test.ts`

---

## 5. Rencana Implementasi Bertahap
1. **Langkah 1 - Perbaikan Formula Status Soal:**
   - Di `ExamWorksheet.tsx`, hitung `answeredSureCount`, `doubtfulCount`, `unansweredCount`, dan `answeredTotalCount`.
   - Pastikan `answeredSureCount + doubtfulCount + unansweredCount === totalQuestions`.
2. **Langkah 2 - Styling Opsi Benar/Salah & Navigasi:**
   - Ganti `rose-600` dengan `red-600` dan icon `XCircleIcon` pada opsi "Salah".
   - Tingkatkan kontras dan visual tombol "Sebelumnya", "Ragu-ragu", dan "Berikutnya".
3. **Langkah 3 - Warning State Timer & Progress Bar:**
   - Buat helper/komputasi status timer (<10m amber, <5m red pulse).
   - Tambahkan progress bar pengerjaan di bawah top navbar.
4. **Langkah 4 - Layout Adaptif Wacana & Nomor Aktif:**
   - Atur grid dinamis: jika `!hasStimulus`, panel stimulus dibuat compact/secondary dan panel soal diperlebar.
   - Pertegas highlight nomor aktif di Peta Nomor Soal.
5. **Langkah 5 - Tombol Kembali Pengajar:**
   - Di `apps/app/ujian/page.tsx`, tampilkan tombol navigasi kembali ke dashboard bagi pengajar.
6. **Langkah 6 - Verifikasi & Validasi Uji:**
   - Jalankan test suite `exam-worksheet.test.ts` dan seluruh unit test aplikasi.

---

## 6. Kriteria Keberterimaan (Acceptance Criteria)
1. Jumlah soal pada legenda selalu konsisten: `Dijawab Pasti + Ragu-ragu + Belum Dijawab === Total Soal`.
2. Tombol "Pernyataan Salah" yang dipilih memiliki visual merah tegas dengan `XCircleIcon`.
3. Sisa waktu pengerjaan berubah warna menjadi amber saat <10 menit dan merah berkedip saat <5 menit.
4. Terdapat progress bar persentase pengerjaan di header.
5. Nomor soal yang sedang aktif memiliki highlight `ring-2 ring-primary ring-offset-2 scale-105 font-black`.
6. Tidak ada kebocoran kode teknis (`SCR-*`, `TASK-*`, dsb.) dan zero emojis.
7. Seluruh 411+ unit tests lulus 100%.

---

## 7. Perintah Validasi Repositori
- `node --test apps/tests/exam-worksheet.test.ts`
- `npm test --prefix apps`
- `npm run typecheck --prefix apps`
- `npm --prefix apps run test:ui-leak`
