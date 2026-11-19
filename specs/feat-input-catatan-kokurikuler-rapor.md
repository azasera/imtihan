# Spesifikasi Fitur: Input Catatan Kokurikuler di Tab Asesmen Wali Kelas E-Rapor

## 1. Definisi Masalah & Perilaku yang Diharapkan
- **Latar Belakang / Masalah**:
  Pada cetakan rapor (khususnya *Rapor Umum SAS / PAS Kurikulum Merdeka* pada berkas `apps/components/rapor/ReportCardPrintView.tsx`), terdapat kotak berbingkai dengan judul **"Kokurikuler"**.
  Saat ini, teks narasi di dalam kotak tersebut masih berupa teks baku statis (*hardcoded*):
  > *"Ananda sudah baik dalam keimanan dan ketakwaan terhadap Tuhan Yang Maha Esa, tercermin dari sikap religiusnya seperti melaksanakan sholat berjamaah di masjid, melakukan muroja'ah dan menghafal Al-Qur'an, serta menjaga adab terhadap teman dan guru."*
  Wali kelas belum memiliki sarana di antarmuka web untuk menyesuaikan narasi kokurikuler santri jika ada santri yang memiliki capaian, keunikan, atau catatan perkembangan religius/adab yang berbeda.

- **Perilaku yang Diharapkan**:
  1. **Field Input di Tab Asesmen Wali Kelas**:
     - Di halaman E-Rapor (`apps/app/(main)/rapor/page.tsx`), pada tab **Asesmen Wali Kelas**, disediakan kartu input bertajuk **Catatan Kokurikuler (Penguatan Karakter & P5)**.
     - Field input berupa `<textarea>` yang secara otomatis terisi dengan teks narasi baku bawaan (default) jika santri belum memiliki catatan kustom.
     - Dilengkapi tombol reset (*Kembalikan Teks Baku*) jika wali kelas ingin mengembalikan teks ke template narasi awal.
  2. **Penyimpanan di Backend Convex**:
     - Skema tabel `homeroomAssessments` di `apps/convex/schema.ts` diperluas dengan field opsional `kokurikulerNotes: v.optional(v.string())`.
     - Mutasi `saveHomeroomAssessment` di `apps/convex/rapor/public/mutations.ts` menerima dan menyimpan `kokurikulerNotes`.
     - Kueri `getSingleStudentReport` dan `getClassReports` di `apps/convex/rapor/public/queries.ts` menyertakan `kokurikulerNotes` pada payload `homeroom`.
  3. **Tampilan Cetak Dinamis Presisi**:
     - Komponen `ReportCardPrintView.tsx` menampilkan `homeroom?.kokurikulerNotes` jika tersedia, atau kembali (*fallback*) ke teks narasi bawaan jika belum diisi.
     - Tata letak cetak (*box Kokurikuler*, warna header `#E0E0E0`, border `#000000`, font size `10.5px`, line-height `1.45`) tetap identik dengan rujukan PDF resmi dan tidak berubah.
  4. **Kepatuhan Desain & Nihil Kebocoran**:
     - Menggunakan komponen dan ikon Lucide (`SparklesIcon`, `RotateCcwIcon`, `CheckCircle2Icon`).
     - Tidak menggunakan emoji apa pun pada UI.
     - Tidak membocorkan kode teknis tiket/spesifikasi ke antarmuka pengguna.

---

## 2. Ruang Lingkup (Scope)
- **In-Scope**:
  - `apps/convex/schema.ts`: Menambahkan `kokurikulerNotes: v.optional(v.string())` pada tabel `homeroomAssessments`.
  - `apps/convex/rapor/public/mutations.ts`: Menambahkan `kokurikulerNotes` pada argumen dan implementasi `saveHomeroomAssessment`.
  - `apps/convex/rapor/public/queries.ts`: Mengalirkan `kokurikulerNotes` pada query laporan santri tunggal dan kelas.
  - `apps/app/(main)/rapor/page.tsx`:
    - Menambahkan state `kokurikulerNotes` dengan nilai bawaan narasi baku.
    - Sinkronisasi state saat berganti santri.
    - Menambahkan field input textarea & tombol reset di UI tab Asesmen Wali Kelas.
    - Menyimpan `kokurikulerNotes` saat tombol "Simpan Asesmen Santri" ditekan.
    - Mengoper `kokurikulerNotes` ke `ReportCardPrintView`.
  - `apps/components/rapor/ReportCardPrintView.tsx`: Menggunakan `homeroom?.kokurikulerNotes || DEFAULT_KOKURIKULER_NOTE`.
  - Pengujian unit di `apps/tests/rapor-components.test.ts` atau berkas pengujian baru `apps/tests/rapor-kokurikuler.test.ts`.
- **Out-of-Scope**:
  - Mengubah layout cetak lembar STS (STS tidak menampilkan box Kokurikuler).
  - Mengubah format penilaian ekskul atau absensi.

---

## 3. Bukti & Dasar Rujukan (Evidence)
- Tangkapan layar pengguna: Kotak judul **Kokurikuler** dengan teks *"Ananda sudah baik dalam keimanan dan ketakwaan terhadap Tuhan Yang Maha Esa..."*.
- Rujukan cetak: `apps/components/rapor/ReportCardPrintView.tsx` baris 477-500.
- Rujukan skema: `apps/convex/schema.ts` tabel `homeroomAssessments`.

---

## 4. Berkas Terkait
1. `apps/convex/schema.ts`
2. `apps/convex/rapor/public/mutations.ts`
3. `apps/convex/rapor/public/queries.ts`
4. `apps/components/rapor/ReportCardPrintView.tsx`
5. `apps/app/(main)/rapor/page.tsx`
6. `apps/tests/rapor-components.test.ts`
7. `apps/tests/rapor-kokurikuler.test.ts` (pengujian unit baru)

---

## 5. Kebutuhan Implementasi Terurut Dependensi
1. **Langkah 1**: Tambahkan `kokurikulerNotes: v.optional(v.string())` pada tabel `homeroomAssessments` di `apps/convex/schema.ts`.
2. **Langkah 2**: Perbarui mutasi `saveHomeroomAssessment` di `apps/convex/rapor/public/mutations.ts` agar menerima dan menyimpan `kokurikulerNotes`.
3. **Langkah 3**: Perbarui fallback payload di `apps/convex/rapor/public/queries.ts` untuk `kokurikulerNotes`.
4. **Langkah 4**: Sinkronkan Convex dev dengan `npx convex dev --once` dari direktori `apps/`.
5. **Langkah 5**: Perbarui `apps/components/rapor/ReportCardPrintView.tsx` agar membaca `homeroom?.kokurikulerNotes || DEFAULT_KOKURIKULER_NOTE`.
6. **Langkah 6**: Perbarui `apps/app/(main)/rapor/page.tsx`:
   - Tambahkan state `kokurikulerNotes`.
   - Tambahkan UI Textarea di tab `wali-kelas`.
   - Sertakan `kokurikulerNotes` saat `handleSaveHomeroom`.
7. **Langkah 7**: Tulis pengujian unit di `apps/tests/rapor-kokurikuler.test.ts`.
8. **Langkah 8**: Jalankan `npm test --prefix apps` dan `npm run typecheck --prefix apps` untuk memverifikasi fungsionalitas dan zero regression.

---

## 6. Kriteria Keberhasilan (Acceptance Criteria)
- [ ] Wali kelas dapat melihat input textarea **Catatan Kokurikuler** di tab **Asesmen Wali Kelas**.
- [ ] Textarea secara otomatis menampilkan teks bawaan narasi keimanan & ketakwaan jika belum ada catatan kustom.
- [ ] Terdapat tombol reset untuk mengembalikan teks narasi baku kapan saja.
- [ ] Mengubah isi catatan dan menekan "Simpan Asesmen Santri" berhasil menyimpan data ke backend Convex.
- [ ] Pada lembar Cetak Rapor (Rapor Umum SAS), teks di kotak **Kokurikuler** mencerminkan catatan yang tersimpan untuk santri tersebut.
- [ ] Tidak ada regresi pada cetak rapor batch/PDF/ZIP dan tidak ada error TypeScript.

---

## 7. Risiko, Kompatibilitas, & Keamanan
- **Migrasi**: Field bersifat opsional (`v.optional(v.string())`) sehingga data lama tetap valid dan otomatis menggunakan fallback narasi baku.
- **Autorisasi**: Mutasi `saveHomeroomAssessment` sudah dilindungi `requireAuthenticatedUser(ctx)`.
- **Desain UI**: Tidak menggunakan emoji, menggunakan Lucide icon, dan layout responsif.

---

## 8. Rencana E2E (E2E Assessment)
- **Rekomendasi**: `Recommended`
- **Alasan**: Merupakan interaksi formulir pengguna pada antarmuka web (mengisi textarea, klik simpan, dan melihat pratinjau cetak).
- **Spesifikasi Handoff E2E**: Dibuat di `specs/e2e/feat-input-catatan-kokurikuler-rapor.md`.
