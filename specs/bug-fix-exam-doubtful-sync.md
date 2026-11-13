# Spesifikasi: Sinkronisasi Status Pengerjaan (Pasti, Ragu-ragu, dan Kosong) pada Lembar Ujian

## 1. Definisi Masalah & Perilaku yang Diharapkan
- **Masalah**:
  1. Pada lembar kerja ujian santri (`apps/app/ujian/ExamWorksheet.tsx`), santri dapat menekan tombol **"Ragu-ragu"** meskipun butir soal tersebut belum dipilih atau diisi jawabannya.
  2. Ketika suatu butir soal ditandai ragu-ragu tanpa adanya jawaban (`hasAnswer === false` dan `isDoubtful === true`):
     - Di logika kalkulasi status, pengecekan `if (ans?.isDoubtful)` dijalankan sebelum pengecekan `hasAnswer`. Akibatnya, butir soal kosong tersebut dihitung ke dalam `doubtfulCount`, dan **tidak masuk** ke dalam `unansweredCount`.
     - Legenda Peta Nomor Soal menampilkan `Belum Dijawab (0)` padahal Header Peta Nomor Soal menampilkan `24/25 Terjawab` (ada 1 soal kosong).
     - Di Grid Peta Nomor Soal, butir yang ragu-ragu tanpa jawaban langsung diwarnai oranye (`bg-amber-500`). Akibatnya, seluruh 25 tombol terwarnai (23 hijau, 2 oranye) tanpa ada tombol abu-abu, sehingga santri tidak dapat melihat butir nomor mana yang sebenarnya masih kosong.
     - Di dialog konfirmasi pengumpulan ujian (*Modal Submission*), ketiga kartu ringkasan menampilkan: **24 Terjawab**, **2 Ragu-ragu**, dan **1 Kosong**. Jumlah ketiganya ($24 + 2 + 1 = 27$) melebihi total butir soal (25) akibat tumpang tindih (*overlap*) antara soal terjawab dan soal ragu-ragu.
     - Peringatan di dialog konfirmasi berbunyi *"Masih terdapat 1 soal belum dijawab..."*, berkontradiksi langsung dengan legenda Peta Soal yang sebelumnya menyebutkan *Belum Dijawab (0)*.

- **Perilaku yang Diharapkan**:
  1. **Persyaratan Ragu-ragu**:
     - Tombol "Ragu-ragu" hanya dapat diaktifkan jika butir soal sudah memiliki jawaban (pilihan ganda, PG kompleks, benar/salah, atau essay).
     - Jika santri belum menjawab dan menekan tombol "Ragu-ragu", sistem menampilkan peringatan (*toast info/warning*): *"Pilih atau isi jawaban terlebih dahulu sebelum menandai ragu-ragu."*
  2. **Konsistensi Matematis Mutlak (Partisi Eksklusif)**:
     - Setiap butir soal dalam total soal ($N$) terpartisi secara tegas ke dalam salah satu dari tiga status eksklusif:
       - **Dijawab Pasti**: Memiliki jawaban dan tidak ragu-ragu (`answeredSureCount`).
       - **Ragu-ragu**: Memiliki jawaban dan ditandai ragu-ragu (`doubtfulCount`).
       - **Belum Dijawab / Kosong**: Belum memiliki jawaban (`unansweredCount`).
       - Rumus: $\text{Dijawab Pasti} + \text{Ragu-ragu} + \text{Belum Dijawab} = \text{Total Soal}$.
     - `totalAnswered` konsisten bernilai $\text{Dijawab Pasti} + \text{Ragu-ragu}$.
  3. **Visual Grid Peta Nomor Soal**:
     - Butir yang belum memiliki jawaban **harus selalu berwarna abu-abu/netral** (`bg-muted`), sehingga santri langsung mengetahui nomor yang belum dikerjakan.
     - Butir yang sudah dijawab dan ragu-ragu berwarna oranye (`bg-amber-500`).
     - Butir yang sudah dijawab pasti berwarna hijau (`bg-emerald-600`).
  4. **Penyelarasan Dialog Konfirmasi Pengumpulan**:
     - Tiga kartu metrik ringkasan menyajikan partisi yang konsisten:
       - **Dijawab Pasti** (Hijau)
       - **Ragu-ragu** (Oranye)
       - **Belum Dijawab** (Netral/Abu-abu)
     - Jumlah ketiga kartu selalu tepat sama dengan total soal ($23 + 1 + 1 = 25$).

## 2. In / Out of Scope
- **In-Scope**:
  - `apps/app/ujian/ExamWorksheet.tsx`:
    - Validasi penjaga saat menekan tombol ragu-ragu jika belum ada jawaban.
    - Normalisasi kalkulasi `answeredSureCount`, `doubtfulCount`, `unansweredCount`, dan `totalAnswered`.
    - Sinkronisasi pewarnaan tombol grid nomor pada desktop dan modal mobile.
    - Sinkronisasi kartu ringkasan pada Dialog Konfirmasi Pengumpulan Ujian.
  - `apps/tests/exam-worksheet.test.ts`:
    - Pembaruan dan penambahan uji unit untuk menjamin konsistensi matematis ketiga kategori dan pencegahan penandaan ragu-ragu pada butir kosong.
- **Out-of-Scope**:
  - Perubahan skema basis data Convex (`schema.ts`).
  - Perubahan alur penilaian / kalkulasi skor guru di backend.

## 3. Bukti & Berkas Terkait
- **Bukti Pengguna**:
  - Gambar 1: Header `24/25 Terjawab`, Legenda `Belum Dijawab (0)`, Grid `23 Hijau & 2 Oranye`.
  - Gambar 2: Modal Konfirmasi `24 Terjawab`, `2 Ragu-ragu`, `1 Kosong` (Total 27).
- **Berkas Terkait**:
  - `apps/app/ujian/ExamWorksheet.tsx`
  - `apps/tests/exam-worksheet.test.ts`

## 4. Kebutuhan Implementasi Terurut Dependensi
1. **Langkah 1**: Perbarui `apps/app/ujian/ExamWorksheet.tsx`:
   - Di `handleToggleDoubtful`: Cek apakah butir aktif memiliki jawaban (`hasAnswer`). Jika belum ada, berikan `toast.warning("Pilih atau isi jawaban terlebih dahulu sebelum menandai ragu-ragu.")` dan batalkan perubahan.
   - Di blok kalkulasi statistik soal:
     - Tentukan `hasAnswer` per butir.
     - Suatu butir dikategorikan `isDoubtful` hanya jika `hasAnswer && ans?.isDoubtful`.
     - Hitung:
       - `answeredSureCount`: `hasAnswer && !ans?.isDoubtful`
       - `doubtfulCount`: `hasAnswer && Boolean(ans?.isDoubtful)`
       - `unansweredCount`: `!hasAnswer`
       - `totalAnswered`: `hasAnswer` (identik dengan `answeredSureCount + doubtfulCount`)
   - Di perenderan tombol Grid (desktop & mobile dialog):
     - `if (isAnswered && isDoubtful)` -> `bg-amber-500 text-white font-bold border-amber-600`
     - `else if (isAnswered)` -> `bg-emerald-600 text-white font-bold border-emerald-700`
     - `else` -> `bg-muted text-muted-foreground border-transparent`
   - Di Dialog Konfirmasi Pengumpulan Ujian:
     - Tiga kotak ringkasan:
       1. **Dijawab Pasti** (`answeredSureCount`, hijau)
       2. **Ragu-ragu** (`doubtfulCount`, oranye)
       3. **Belum Dijawab** (`unansweredCount`, netral/abu-abu)
     - Keterangan teks peringatan di bawahnya tetap akurat mengacu pada `unansweredCount` dan `doubtfulCount`.
2. **Langkah 2**: Perbarui `apps/tests/exam-worksheet.test.ts` untuk menguji:
   - Jumlah `answeredSureCount + doubtfulCount + unansweredCount === totalQuestions`.
   - Pencegahan ragu-ragu tanpa jawaban.
   - Penyelarasan dialog konfirmasi.
3. **Langkah 3**: Jalankan validasi pengujian otomatis dan typecheck.

## 5. Kriteria Penerimaan yang Terukur
1. Legenda "Peta Nomor Soal" dan Header selalu sinkron: jika header `24/25 Terjawab`, maka `Belum Dijawab` pada legenda wajib bernilai `1` (bukan `0`).
2. Nomor soal yang belum dijawab selalu tampil berwarna abu-abu di grid peta nomor soal, sehingga langsung terlihat oleh santri.
3. Total angka pada ketiga kartu modal konfirmasi selalu sama dengan total soal ujian ($23 + 1 + 1 = 25$).
4. Tombol ragu-ragu tidak dapat diaktifkan pada soal yang belum dipilih jawabannya.
5. Seluruh rangkaian tes di `apps/tests/exam-worksheet.test.ts` lulus tanpa kesalahan.
6. Nihil kebocoran kode spesifikasi teknis (`SCR-*`, `TASK-*`, dll.) dan nihil emoji di antarmuka.

## 6. Risiko, Kompatibilitas, & Mitigasi
- **Risiko**: Data lembar ujian yang sedang berjalan dari santri mungkin sudah memiliki catatan `isDoubtful: true` pada soal tanpa jawaban di database.
- **Mitigasi**: Di level UI, filter defensif `hasAnswer && ans?.isDoubtful` diterapkan pada saat membaca state jawaban, sehingga data lama yang tersimpan tetap tertangani dengan aman dan tidak merusak visual.

## 7. Perintah Validasi Repositori
- `node --test apps/tests/exam-worksheet.test.ts`
- `npx tsc --noEmit --project apps/tsconfig.json`

## 8. Ekspektasi Dokumentasi
- Pertahankan seluruh komentar kode dan arsitektur yang sudah ada.
