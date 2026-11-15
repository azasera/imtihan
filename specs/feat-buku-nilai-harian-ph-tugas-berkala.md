# Spesifikasi Fitur: Buku Nilai Harian Guru (Input Bertahap PH 1-4 dengan Remedial & Tugas)

## 1. Definisi Masalah & Perilaku yang Diharapkan
### Masalah Saat Ini
Saat ini pada modul E-Rapor (`apps/app/(main)/rapor/page.tsx` dan `apps/convex/rapor/`), guru hanya disediakan 1 kolom angka tunggal untuk `dailyScore` (PH / Tugas). Padahal dalam praktiknya, guru melakukan penilaian secara berkala sepanjang semester:
- Penilaian Harian bab 1 (PH-1) di awal semester, lengkap dengan sesi perbaikan (Remedial).
- Penilaian Harian bab 2 (PH-2) beberapa pekan kemudian.
- Penilaian Harian berikutnya (PH-3, PH-4) serta Tugas 1 s/d 4.
Hal ini memaksa guru tetap harus membuat catatan kertas atau file Excel terpisah di luar aplikasi, menghitung rata-ratanya sendiri, lalu baru menginputkan angka akhirnya saat semester usai.

### Perilaku yang Diharapkan
1. **Input Bertahap & Progresif:** Guru dapat menginputkan nilai segera setelah asesmen selesai (misal: isi PH-1 minggu ini, simpan, lalu beberapa minggu kemudian buka kembali untuk mengisi PH-2, dst.).
2. **Dukungan Nilai Murni (N) & Remedial (R):** Tiap PH (1 s/d 4) menyediakan input Nilai Murni ($N$) dan Nilai Remedial ($R$). Jika siswa mengikuti remedial ($R$ terisi), nilai efektif yang diperhitungkan adalah nilai remedial (dibatasi wajar terhadap KKM/batas tuntas).
3. **Kalkulasi Rata-rata Cerdas (*Dynamic Non-Zero Averaging*):**
   - Sistem hanya membagi dengan jumlah PH/Tugas yang sudah terlaksana (sudah diisi), bukan langsung dibagi 4. Jika baru terlaksana PH-1 dan PH-2, rata-rata dihitung dari 2 penilaian tersebut sehingga nilai santri tidak anjlok ke angka kecil di tengah semester.
4. **Sinkronisasi Real-Time:** Rata-rata PH & Tugas secara otomatis memperbarui `dailyScore` dan memproyeksikan Nilai Akhir Rapor (NAR) serta predikat secara instan.
5. **Aksesibilitas UI yang Bersih:** Terdapat tombol/modal khusus *"Buku Nilai Harian (PH & Tugas)"* di samping kolom PH pada Lembar Nilai kelas, sehingga tabel utama tetap rapi dan tidak penuh sesak baik di layar komputer maupun tablet/ponsel.

---

## 2. Ruang Lingkup (Scope)
### In Scope
- Penambahan skema penyimpanan rincian asesmen formatif (`dailyAssessments`) pada tabel `reportGrades` di Convex.
- Fungsi utilitas penghitungan nilai efektif PH ($N$ & $R$), rata-rata dinamis, dan bobot harian di `apps/lib/rapor-utils.ts`.
- Komponen dialog/modal interaktif `DailyAssessmentsModal.tsx` untuk input santri sekelas dengan navigasi input yang cepat (keyboard-friendly).
- Penyesuaian `upsertGrade` dan `saveSubjectGrades` di `apps/convex/rapor/public/mutations.ts` untuk menerima dan menyimpan rincian asesmen.
- Penyesuaian query `getGradesBySubjectAndClass` di `apps/convex/rapor/public/queries.ts` agar menyertakan data rincian asesmen.
- Pengujian unit untuk logika perhitungan rata-rata dinamis & remedial.
- Pengujian integrasi mutasi Convex.
- Spesifikasi E2E untuk alur input bertahap nilai guru di `specs/e2e/buku-nilai-harian-ph-tugas.md`.

### Out of Scope
- Pengubahan format cetak fisik PDF rapor resmi (PDF resmi tetap mencantumkan Nilai Akhir dan Capaian Kompetensi sesuai format baku kurikulum yang sudah ada).
- Penambahan otomatisasi pembuatan soal CBT khusus untuk tiap PH (guru menginputkan nilai yang diperoleh, baik dari tugas kelas, ujian kertas, maupun ujian CBT).

---

## 3. Bukti & Rujukan Teknis (Evidence)
- File Excel rujukan guru: Struktur kolom header mata pelajaran PAI dengan `PH-1` s/d `PH-4` berpasangan `N` (Murni) dan `R` (Remedial), kolom `Av. PH` (Average PH), serta `TUGAS-1` s/d `TUGAS-4` dengan subheader `KD`.
- Skema database aktif: `apps/convex/schema.ts` (tabel `reportGrades`).
- Formula NAR aktif: `calculateNAR(dailyScore, midtermScore, finalExamScore)` di `apps/lib/rapor-utils.ts`.

---

## 4. Berkas-Berkas Terkait (Relevant Files)
1. `apps/convex/schema.ts` — Menambahkan field opsional `dailyAssessments` pada tabel `reportGrades`.
2. `apps/lib/rapor-utils.ts` — Menambahkan fungsi pembantu kalkulasi nilai harian cerdas:
   - `calculateEffectivePhScore(score?: number, remedial?: number, kkm?: number): number | null`
   - `calculateAveragePh(phs: Array<{ score?: number; remedial?: number }>, kkm?: number): number`
   - `calculateAverageTasks(tasks: Array<number | undefined>): number`
   - `calculateCompositeDailyScore(phs: Array<{ score?: number; remedial?: number }>, tasks: Array<number | undefined>, kkm?: number): number`
3. `apps/components/rapor/DailyAssessmentsModal.tsx` (Baru) — Komponen UI modal/dialog spreadsheet mikro untuk input santri sekelas (PH 1-4 & Tugas 1-4).
4. `apps/convex/rapor/public/mutations.ts` — Update validasi argumen dan penyimpanan field `dailyAssessments`.
5. `apps/convex/rapor/public/queries.ts` — Return field `dailyAssessments` pada lembar kerja guru.
6. `apps/app/(main)/rapor/page.tsx` — Menyediakan tombol akses modal di sebelah input PH / Tugas serta integrasi state real-time.
7. `apps/tests/daily-assessments-calc.test.ts` (Baru) — Unit test kalkulasi nilai harian, remedial, dan rata-rata dinamis.
8. `specs/e2e/buku-nilai-harian-ph-tugas.md` (Baru) — Dokumen spesifikasi pengujian end-to-end.

---

## 5. Rencana Implementasi Bertahap (Dependency-Ordered Implementation)

### Tahap 1: Logika Perhitungan & Skema Data
1. Menambahkan definisi tipe `DailyAssessments` pada `apps/lib/rapor-utils.ts` dan fungsi-fungsi kalkulator:
   - Hitung nilai per PH: jika ada $R > 0$, gunakan $R$; jika tidak, gunakan $N$.
   - Hitung rata-rata hanya dari item yang tidak kosong.
   - Hitung bobot nilai harian gabungan (default: 60% PH + 40% Tugas jika ada tugas, atau 100% PH jika belum ada tugas).
2. Tulis unit tests di `apps/tests/daily-assessments-calc.test.ts` dan pastikan lulus.
3. Update `apps/convex/schema.ts` untuk menambahkan field:
   ```ts
   dailyAssessments: v.optional(
     v.object({
       ph: v.optional(v.array(v.object({
         score: v.optional(v.number()),
         remedial: v.optional(v.number()),
       }))),
       tasks: v.optional(v.array(v.optional(v.number()))),
     })
   )
   ```
4. Jalankan validasi `npx convex dev --once` dari direktori `apps/`.

### Tahap 2: Backend Convex Mutations & Queries
1. Update `apps/convex/rapor/public/mutations.ts` agar `upsertGrade` dan `saveSubjectGrades` menerima opsional `dailyAssessments`.
2. Pastikan query `getGradesBySubjectAndClass` mengembalikan struktur ini ke client.

### Tahap 3: Pembuatan Komponen UI `DailyAssessmentsModal.tsx`
1. Desain modal responsif dengan tab/filter:
   - Pilihan entri cepat per kompetensi: **Semua Kolom (Ledger)** atau fokus ke **PH 1**, **PH 2**, **PH 3**, **PH 4**, atau **Tugas**.
   - Kolom tabel: No, NISN, Nama Santri, PH 1 (N & R), PH 2 (N & R), PH 3 (N & R), PH 4 (N & R), Tugas (1-4), Rata-rata Terhitung.
   - Tombol "Terapkan & Simpan Nilai Harian".
2. Integrasikan ke `apps/app/(main)/rapor/page.tsx`:
   - Tambahkan tombol pintasan (icon buku/pensil) di header kolom dan pada tiap baris input PH/Tugas.
   - Ketika modal disimpan, state lokal dan Convex otomatis tersinkronisasi.

### Tahap 4: Verifikasi & Uji Kualitas
1. Jalankan unit test `npm test` / `vitest` / `tsx`.
2. Validasi deploy schema Convex (`npx convex dev --once`).
3. Buat dokumen E2E handoff di `specs/e2e/buku-nilai-harian-ph-tugas.md`.

---

## 6. Kriteria Penerimaan yang Terukur (Measurable Acceptance Criteria)
1. **Penyimpanan Bertahap:** Guru dapat mengisi PH-1 santri tanpa harus mengisi PH-2 s/d PH-4, dan data tetap tersimpan saat halaman dimuat ulang.
2. **Kalkulasi Remedial:** Jika santri memperoleh $N = 65$ dan $R = 80$, nilai yang dijadikan dasar perhitungan rata-rata adalah 80 (atau batas KKM).
3. **Rata-Rata Proporsional:** Jika santri baru memiliki nilai pada PH-1 (80) dan PH-2 (90), rata-rata PH yang muncul adalah 85 (dibagi 2), bukan 42.5 (tidak dibagi 4).
4. **Sinkronisasi Otomatis:** Saat modal harian disimpan, kolom `PH / Tugas` di lembar nilai utama langsung terisi nilai rata-rata tersebut dan Nilai Akhir (NAR) langsung diperbarui sesuai formula resmi.
5. **Kompatibilitas Penuh:** Nilai lama yang belum memiliki rincian tetap terbaca normal (`dailyScore` tidak terhapus/rusak).

---

## 7. Mitigasi Risiko & Keamanan
- **Risiko Nilai Turun karena Kolom Kosong:** Dimatangkan dengan pembagian dinamis `countValidEntries > 0 ? sum / countValidEntries : 0`.
- **Risiko Konflik Data:** Penyimpanan menggunakan mutasi Convex transaksional per santri/kelas dengan field `updatedBy` dan `updatedAt`.
- **Backward Compatibility:** Field `dailyAssessments` bersifat `v.optional(...)`, sehingga data rapor yang sudah ada tetap 100% valid tanpa memerlukan migrasi paksa.

---

## 8. Perintah Validasi Repositori
- Skema & Fungsi Convex: `cd apps && npx convex dev --once`
- Unit Tests: `cd apps && npm test`
- Type Check & Lint: `cd apps && npm run build` (atau `tsc --noEmit`)
