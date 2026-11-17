# Spesifikasi Fitur: Pengisian Manual Nilai Akhir Rapor (NAR) dengan Dukungan Kalkulasi Otomatis (Hybrid Mode)

## 1. Definisi Masalah & Perilaku yang Diharapkan
- **Latar Belakang / Masalah**:
  Wali kelas dan guru mapel memberikan masukan bahwa dalam kondisi riil di sekolah/pesantren, sering kali nilai akhir santri perlu diisi atau disesuaikan secara langsung (manual). Contohnya:
  1. Santri pindahan atau santri yang mengikuti ujian susulan offline di mana guru hanya menerima rekap nilai akhir jadi (gelondongan) tanpa rincian PH 1-5 atau ujian CBT.
  2. Penyesuaian nilai hasil rapat pleno dewan guru (misalnya penyesuaian batas tuntas KKM/KKTP dari 73 ke 75) tanpa guru harus memalsukan rincian nilai komponen harian atau ujian CBT.
  3. Mata pelajaran tertentu yang asesmennya murni praktik atau hafalan langsung.
  Saat ini, kolom Nilai Akhir (NAR) pada lembar nilai rapor (`apps/app/(main)/rapor/page.tsx`) bersifat teks statis hanya-baca (`<td>{g.finalScore}</td>`), dan mutasi backend (`saveSubjectGrades`) selalu menimpa nilai akhir dengan rumus `(2 * PH + STS + SAS) / 4`.

- **Perilaku yang Diharapkan**:
  1. **Mode Hybrid (Otomatis secara Bawaan, Fleksibel Manual Override)**:
     - Jika guru mengisi nilai komponen (`PH`, `STS`, atau `SAS`), sistem secara otomatis menghitung kolom Nilai Akhir dengan rumus `(2 * PH + STS + SAS) / 4`.
     - Guru dapat mengklik langsung kolom Nilai Akhir dan mengetikkan angka nilai akhir yang diinginkan (manual override).
  2. **Indikator Visual & Tombol Reset Rumus**:
     - Jika nilai akhir diisi manual dan berbeda dari hasil hitungan rumus otomatis, kolom input diberi penanda visual (border oranye/amber) dan tombol reset kecil (*RotateCcwIcon*) yang memungkinkan guru mengembalikan nilai ke kalkulasi rumus otomatis kapan saja.
  3. **Sinkronisasi Reaktif Predikat & Narasi Capaian**:
     - Perubahan Nilai Akhir (baik manual maupun otomatis) seketika memperbarui Predikat (`g.predicate`: A/B/C/D) dan narasi capaian pembelajaran otomatis sesuai CP semester yang aktif.
  4. **Penyimpanan Presisi di Backend**:
     - Mutasi `saveSubjectGrades` di backend Convex menghormati nilai `g.finalScore` yang dikirim dari klien, tanpa menimpanya secara paksa dengan rumus `calculateNAR` jika nilai tersebut merupakan input manual.
  5. **Zero Regression pada Leger & Cetak Rapor**:
     - Buku Leger Nilai dan Lembar Cetak Rapor (PDF & Cetak Batch) tetap membaca `finalScore` secara konsisten tanpa merusak format presisi yang sudah ada.
  6. **Nol Kebocoran Kode Spesifikasi Teknis & Nihil Emoji**:
     - Semua ikon menggunakan Lucide icons, tanpa emoji dan tanpa kode spesifikasi teknis di UI.

---

## 2. Ruang Lingkup (Scope)
- **In-Scope**:
  - `apps/convex/rapor/public/mutations.ts`: Memperbarui mutasi `saveSubjectGrades` agar memprioritaskan `g.finalScore` yang dikirim pengguna.
  - `apps/app/(main)/rapor/page.tsx`:
    - Memperbarui interface `GradeOverride` untuk mendukung `finalScore` dan `isManualFinalScore`.
    - Memperbarui `editableGrades` untuk mendeteksi status manual override (apakah dari state lokal atau data tersimpan di DB yang berbeda dari rumus).
    - Memperbarui handler `handleScoreChange` untuk menangani input `"finalScore"`.
    - Menambahkan `handleResetFinalScore` untuk mereset nilai akhir kembali ke rumus komponen.
    - Mengubah sel tabel Nilai Akhir menjadi input angka dengan tombol reset dan tooltip informatif.
  - Pengujian unit di `apps/tests/rapor-daily-assessments.test.ts` atau berkas pengujian baru `apps/tests/rapor-manual-final-score.test.ts`.
- **Out-of-Scope**:
  - Mengubah rumus bawaan `calculateNAR`.
  - Mengubah skema database Convex (tabel `reportGrades` sudah memiliki kolom `finalScore: v.number()`).

---

## 3. Berkas Terkait
- `apps/convex/rapor/public/mutations.ts`
- `apps/app/(main)/rapor/page.tsx`
- `apps/lib/rapor-utils.ts`
- `apps/tests/rapor-components.test.ts`
- `apps/tests/rapor-manual-final-score.test.ts` (pengujian unit baru)

---

## 4. Kebutuhan Implementasi Terurut Dependensi
1. **Langkah 1**: Perbarui mutasi `saveSubjectGrades` di `apps/convex/rapor/public/mutations.ts` agar menyimpan `g.finalScore` jika disediakan, dengan fallback ke `calculateNAR`.
2. **Langkah 2**: Jalankan `npx convex dev --once` untuk memastikan backend Convex sinkron dan siap.
3. **Langkah 3**: Perbarui logika state dan antarmuka di `apps/app/(main)/rapor/page.tsx`:
   - Tambahkan dukungan `finalScore` dan `isManualFinalScore` pada `GradeOverride`.
   - Modifikasi `handleScoreChange` agar saat `field === "finalScore"`, nilai diset sebagai manual override dan narasi/predikat otomatis terbarui.
   - Tambahkan `handleResetFinalScore`.
   - Pasang `<Input type="number" ... />` pada sel Nilai Akhir beserta tombol reset *RotateCcwIcon* saat status manual aktif.
4. **Langkah 4**: Tulis pengujian unit komprehensif di `apps/tests/rapor-manual-final-score.test.ts` yang mencakup:
   - Nilai akhir otomatis dari formula `calculateNAR`.
   - Nilai akhir manual yang menimpa hasil formula.
   - Tombol reset yang mengembalikan nilai akhir manual ke hasil formula.
   - Pembaruan predikat (A/B/C/D) dan narasi capaian saat nilai akhir diubah manual.
   - Backend `saveSubjectGrades` yang menyimpan nilai akhir manual dengan benar.
5. **Langkah 5**: Jalankan `npm run typecheck --prefix apps` dan `npm test --prefix apps` untuk memverifikasi zero regression.

---

## 5. Kriteria Penerimaan yang Terukur
1. Kolom Nilai Akhir pada tab *Nilai Mata Pelajaran* berupa input angka yang dapat diedit langsung oleh pengguna.
2. Saat guru mengubah PH, STS, atau SAS, kolom Nilai Akhir terhitung otomatis sesuai formula `(2*PH + STS + SAS) / 4`.
3. Saat guru mengetik angka pada kolom Nilai Akhir, angka tersebut tersimpan sebagai nilai akhir santri, predikat (A-D) berubah seketika, narasi capaian menyesuaikan, dan tombol reset muncul di samping input.
4. Menekan tombol reset mengembalikan nilai akhir santri ke hasil kalkulasi rumus komponen.
5. Nilai akhir manual tersimpan ke database Convex dan tampil identik pada Buku Leger Nilai serta Lembar Cetak Rapor.
6. Seluruh pengujian unit lolos 100%, nihil kebocoran kode teknis, dan nihil emoji.

---

## 6. Risiko & Mitigasi
- **Risiko**: Nilai akhir manual hilang jika pengguna menyimpan nilai tanpa menyertakan `finalScore`.
- **Mitigasi**: Pastikan `sanitizedGrades` selalu menyertakan `finalScore: g.finalScore`, dan backend memvalidasi angka sebelum disimpan.
- **Risiko**: Masukan angka tidak valid (misal angka negatif atau > 100).
- **Mitigasi**: Batasi input dengan `min={0} max={100}` serta sanitasi `Math.max(0, Math.min(100, Math.round(value)))`.

---

## 7. Penilaian E2E
- Rekomendasi: `Recommended`
- Alasan: Fitur ini menambahkan interaksi langsung pada kolom tabel lembar nilai rapor guru yang memicu state override, perubahan reaktif predikat, dan tombol reset visual.
- Skenario:
  1. Guru membuka tab *Nilai Mata Pelajaran*.
  2. Mengisi nilai STS 80 dan SAS 80 -> Nilai Akhir otomatis 40 (jika PH 0).
  3. Guru mengklik kolom Nilai Akhir dan mengubahnya secara manual menjadi 85 -> Predikat berubah menjadi B/A, tombol reset muncul.
  4. Guru menekan tombol reset -> Nilai kembali ke 40 dan tombol reset hilang.
  5. Guru mengisi manual 90, menekan Simpan Nilai -> Toast sukses muncul, nilai 90 tersimpan dan tercermin di Leger Nilai.

---

## 8. Perintah Validasi
- `npx convex dev --once`
- `node --test apps/tests/rapor-manual-final-score.test.ts`
- `npm --prefix apps run typecheck`
- `npm --prefix apps test`
