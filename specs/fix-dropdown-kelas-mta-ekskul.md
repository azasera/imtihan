# Spesifikasi Perbaikan: Kelengkapan Kelas MTA (MTA 1 s.d. MTA 6) pada Dropdown Peserta Ekstrakurikuler

## 1. Definisi Masalah & Perilaku yang Diharapkan
- **Masalah Saat Ini**:
  - Pada dropdown pilihan/filter kelas di modul peserta ekstrakurikuler (baik di modal tambah peserta `AddMemberModal` maupun filter rombel tabel santri di `ekstrakurikuler/page.tsx`), pilihan kelas jenjang MTA hanya menampilkan `MTA 1`, `MTA 2`, dan `MTA 3`.
  - Santri jenjang MTA tingkat lanjut (`MTA 4`, `MTA 5`, dan `MTA 6`) tidak dapat difilter atau dipilih secara spesifik dari dropdown kelas tersebut.
  - Sesuai standar lembaga pesantren dan aturan model institusi (`apps/convex/model/institutions.ts`), jenjang MTA memiliki 6 tingkatan resmi: `MTA 1` sampai `MTA 6`.
- **Perilaku yang Diharapkan**:
  - Dropdown filter kelas ekstrakurikuler menyediakan pilihan lengkap jenjang MTA dari `MTA 1` sampai `MTA 6`.
  - Nilai `OFFICIAL_CLASSES` di `apps/lib/extracurricular-constants.ts` memuat `MTA 1`, `MTA 2`, `MTA 3`, `MTA 4`, `MTA 5`, dan `MTA 6`.
  - Fallback kelas MTA di halaman rapor (`apps/app/(main)/rapor/page.tsx`) juga konsisten mencakup `MTA 1` sampai `MTA 6`.

## 2. Bukti & Investigasi (Evidence)
- **Tangkapan Layar Pengguna**: Dropdown kelas peserta ekskul berhenti di `MTA 3` setelah `12B`.
- **Kode Sumber Terkait**:
  - `apps/lib/extracurricular-constants.ts`: `OFFICIAL_CLASSES` hanya berisi `["7A", ..., "12B", "MTA 1", "MTA 2", "MTA 3"]`.
  - `apps/components/ekstrakurikuler/AddMemberModal.tsx`: Menggunakan `OFFICIAL_CLASSES.map(...)`.
  - `apps/app/(main)/ekstrakurikuler/page.tsx`: Menggunakan `OFFICIAL_CLASSES.map(...)`.
  - `apps/convex/model/institutions.ts`: Mendefinisikan `INSTITUTION_LEVELS.MTA` sebagai `["MTA 1", "MTA 2", "MTA 3", "MTA 4", "MTA 5", "MTA 6"]`.
  - `apps/convex/students/public/queries.ts`: `getClassesByLembaga` memvalidasi regex `/^mta\s*[1-6]/i`.

## 3. Ruang Lingkup (Scope)
- **In-Scope**:
  - Menambahkan `"MTA 4"`, `"MTA 5"`, dan `"MTA 6"` pada array `OFFICIAL_CLASSES` di `apps/lib/extracurricular-constants.ts`.
  - Memperbarui fallback kelas MTA di `apps/app/(main)/rapor/page.tsx` menjadi `["MTA 1", "MTA 2", "MTA 3", "MTA 4", "MTA 5", "MTA 6"]`.
  - Menambahkan unit test di `apps/tests/extracurricular.test.ts` untuk memverifikasi kelengkapan kelas resmi `OFFICIAL_CLASSES` (termasuk MTA 1 s.d. 6).
- **Out-of-Scope**:
  - Mengubah skema database Convex atau memodifikasi data santri yang sudah tersimpan.

## 4. Berkas Terkait
- `apps/lib/extracurricular-constants.ts`
- `apps/app/(main)/rapor/page.tsx`
- `apps/tests/extracurricular.test.ts`

## 5. Rencana Implementasi Bertahap (Dependency-Ordered Implementation)
1. Perbarui `apps/lib/extracurricular-constants.ts` untuk menyertakan `"MTA 4"`, `"MTA 5"`, dan `"MTA 6"` pada `OFFICIAL_CLASSES`.
2. Perbarui `fallbackMap.MTA` di `apps/app/(main)/rapor/page.tsx` agar menyertakan `"MTA 5"` dan `"MTA 6"`.
3. Tambahkan unit test pada `apps/tests/extracurricular.test.ts` yang menegaskan `OFFICIAL_CLASSES` memuat `MTA 1` sampai `MTA 6`.
4. Jalankan validasi `npm test` dan `npm run typecheck`.

## 6. Kriteria Keberterimaan (Acceptance Criteria)
1. `OFFICIAL_CLASSES` mencakup `"MTA 1"`, `"MTA 2"`, `"MTA 3"`, `"MTA 4"`, `"MTA 5"`, dan `"MTA 6"`.
2. Dropdown kelas pada modal Tambah Peserta Ekstrakurikuler dan filter kelas di halaman ekstrakurikuler menampilkan opsi MTA 1 sampai MTA 6.
3. Unit test otomatis memverifikasi keberadaan kelas MTA 1 s.d. MTA 6.
4. Semua unit test (593+ test) lolos tanpa kegagalan.
5. `npm run typecheck` lolos dengan 0 error.

## 7. Risiko & Mitigasi
- **Risiko**: Ada format string kelas lain seperti `MTA4` tanpa spasi.
- **Mitigasi**: Fungsi normalisasi backend `normalizeClassName` di `apps/convex/extracurricular/private/helpers.ts` telah menghapus spasi (`replace(/\s+/g, "")`), sehingga pencarian mencocokkan baik `MTA 4` maupun `MTA4`.

## 8. Pertimbangan Kompatibilitas & Migrasi
- Tidak ada perubahan skema database Convex. Tidak memerlukan migrasi data.

## 9. Perintah Validasi
- `npm test`
- `npm run typecheck`
