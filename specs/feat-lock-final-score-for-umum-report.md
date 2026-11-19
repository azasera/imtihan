# Spesifikasi Fitur: Penguncian Nilai Akhir Otomatis untuk Rapor Umum (Hanya Diniyah yang Diizinkan Manual)

## 1. Definisi Masalah & Perilaku yang Diharapkan
- **Latar Belakang / Masalah**:
  Sebelumnya, fitur pengisian manual Nilai Akhir (NAR) dibuka untuk seluruh mata pelajaran. Namun, pihak sekolah/kurikulum menetapkan kebijakan bahwa **Rapor Umum (Kurikulum Merdeka)** harus memiliki nilai akhir yang objektif dan terkunci secara ketat berdasarkan rincian formula komponen nilai harian dan ujian:
  $$\text{Nilai Akhir} = \frac{2 \times \text{PH} + \text{STS} + \text{SAS}}{4}$$
  Pengisian manual nilai akhir hanya diizinkan untuk mata pelajaran **Diniyah** (kepesantrenan) yang memerlukan fleksibilitas penilaian langsung (ujian praktik ibadah, setoran hafalan mandiri, atau ujian lisan).
- **Perilaku yang Diharapkan**:
  1. **Penguncian Rapor Umum (Mapel Umum)**:
     - Saat guru membuka mata pelajaran Umum (misal PAI, PP, BINDO, MTK, IPA, IPS, BING, PJOK, INFOR, PRA), kolom **Nilai Akhir** terkunci (hanya-baca / teks tebal).
     - Kolom Nilai Akhir untuk mapel umum tidak memiliki kotak input angka dan tidak dapat diubah manual.
     - Nilai akhir mapel umum selalu dihitung murni dari formula bawaan $(2 \times \text{PH} + \text{STS} + \text{SAS}) / 4$.
  2. **Fleksibilitas Rapor Diniyah (Mapel Diniyah)**:
     - Saat guru membuka mata pelajaran Diniyah (misal FIQIH, AQIDAH, TAJWID, TAFSIR, HADITS, B_ARAB/BARAB), kolom **Nilai Akhir** tetap berupa input fleksibel (mode hybrid) dengan penanda warna amber dan tombol reset bila di-override manual.
  3. **Integritas Penyimpanan Backend Convex**:
     - Pada mutasi `saveSubjectGrades`, jika `subjectCode` merupakan mata pelajaran umum (`!isDiniyahSubject`), backend selalu memberlakukan nilai akhir dari formula `calculatedNar`, mengabaikan input manual liar bila ada. Input manual hanya disimpan jika mata pelajaran adalah kelompok Diniyah.
  4. **Nihil Emoji & Bebas Kebocoran Kode Spesifikasi Teknis**:
     - Antarmuka tetap menggunakan Lucide icons, tanpa emoji, dan bebas dari kode spesifikasi teknis.

---

## 2. Ruang Lingkup (Scope)
- **In-Scope**:
  - `apps/app/(main)/rapor/page.tsx`:
    - Menggunakan helper `isUmumSubject` / `isDiniyahSubject` untuk menentukan status kunci input Nilai Akhir.
    - Pada `editableGrades`: Jika mata pelajaran adalah Umum, `finalScore` selalu diset ke `calculatedNar` dan `isManualFinalScore` selalu `false`.
    - Pada `handleScoreChange`: Mencegah modifikasi field `"finalScore"` jika mata pelajaran yang aktif adalah mapel Umum.
    - Pada tabel lembar nilai: Merender teks tebal `{g.finalScore}` untuk mapel Umum, dan merender `<Input ... />` beserta tombol reset untuk mapel Diniyah.
  - `apps/convex/rapor/public/mutations.ts`:
    - Memperbarui mutasi `saveSubjectGrades`: jika mata pelajaran bukan Diniyah (`!isDiniyahSubject(args.subjectCode)`), backend selalu menyimpan `finalScore = calculatedNar`.
  - `apps/tests/rapor-manual-final-score.test.ts`:
    - Memperbarui dan menambahkan kasus uji untuk memverifikasi bahwa Nilai Akhir terkunci pada mapel umum dan hanya dapat diisi manual pada mapel Diniyah.
- **Out-of-Scope**:
  - Mengubah rumus bawaan `calculateNAR`.
  - Mengubah tampilan lembar cetak rapor (`ReportCardPrintView.tsx` sudah membulatkan angka).

---

## 3. Berkas Terkait
- `apps/app/(main)/rapor/page.tsx`
- `apps/convex/rapor/public/mutations.ts`
- `apps/lib/rapor-utils.ts`
- `apps/tests/rapor-manual-final-score.test.ts`
- `specs/feat-lock-final-score-for-umum-report.md`

---

## 4. Kebutuhan Implementasi Terurut Dependensi
1. **Langkah 1**: Perbarui mutasi `saveSubjectGrades` di `apps/convex/rapor/public/mutations.ts` untuk mengimpor `isDiniyahSubject` dan mengunci `finalScore = calculatedNar` jika mata pelajaran bukan Diniyah.
2. **Langkah 2**: Perbarui logika state dan antarmuka tabel di `apps/app/(main)/rapor/page.tsx` agar membedakan tampilan sel Nilai Akhir antara mapel Umum (kunci/teks) dan mapel Diniyah (input manual override).
3. **Langkah 3**: Perbarui unit test di `apps/tests/rapor-manual-final-score.test.ts` untuk menguji penguncian mapel umum dan izin manual mapel diniyah.
4. **Langkah 4**: Jalankan validasi `node --test apps/tests/rapor-manual-final-score.test.ts`, `npm --prefix apps run typecheck`, dan seluruh suite `npm --prefix apps test`.

---

## 5. Kriteria Penerimaan yang Terukur
1. Saat memilih mata pelajaran Umum (misal PAI, Matematika, IPA, PP, dll.):
   - Kolom Nilai Akhir berupa teks tebal statis `{g.finalScore}`, tidak ada input form, dan nilainya selalu murni hasil rumus $(2 \times \text{PH} + \text{STS} + \text{SAS}) / 4$.
2. Saat memilih mata pelajaran Diniyah (misal Fiqih, Aqidah, dll.):
   - Kolom Nilai Akhir tetap berupa input angka interaktif dengan dukungan manual override dan tombol reset.
3. Backend `saveSubjectGrades` menolak override manual pada mapel umum dan menyimpannya murni dari formula `calculatedNar`.
4. Seluruh pengujian unit lolos 100%, `tsc --noEmit` bersih (0 error), bebas emoji, dan 0 kebocoran kode spesifikasi teknis.

---

## 6. Risiko & Mitigasi
- **Risiko**: Nilai lama mapel umum yang pernah di-override manual tetap terbaca dari database.
- **Mitigasi**: Di `editableGrades` dan di `saveSubjectGrades`, untuk mapel umum kita selalu mengabaikan override dan menghitung `finalScore` murni dari `calculatedNar`.

---

## 7. Penilaian E2E
- Rekomendasi: `Not needed`
- Alasan: Perubahan mengembalikan elemen input menjadi teks hanya-baca statis untuk mapel umum dan mempertahankan logika interaktif hanya pada mapel diniyah, teruji penuh pada level pengujian unit.

---

## 8. Perintah Validasi
- `node --test apps/tests/rapor-manual-final-score.test.ts`
- `npm --prefix apps run typecheck`
- `npm --prefix apps test`
