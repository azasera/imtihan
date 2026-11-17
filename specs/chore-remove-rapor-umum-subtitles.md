# Spesifikasi: Pembuangan Subteks Judul Rapor Umum (Kurikulum Merdeka)

## 1. Definisi Masalah & Perilaku yang Diharapkan
- **Masalah**:
  Pada tampilan lembar cetak Rapor Umum (`apps/components/rapor/ReportCardPrintView.tsx`), terdapat subteks di bawah judul utama:
  1. Pada Rapor Umum STS (Sumatif Tengah Semester): `<p>Laporan Hasil Sumatif Tengah Semester — Kurikulum Merdeka</p>`
  2. Pada Rapor Umum SAS (Sumatif Akhir Semester): `<p>Laporan Hasil Sumatif Akhir Semester — Kurikulum Merdeka</p>`
  Pengguna meminta untuk menghapus teks tersebut dari Rapor Umum agar tampilannya bersih, seragam, dan selaras dengan Rapor Diniyah yang subteksnya telah dibuang sebelumnya.

- **Perilaku yang Diharapkan**:
  1. Pada lembar cetak Rapor Umum STS, elemen `<p>` yang memuat teks `Laporan Hasil Sumatif Tengah Semester — Kurikulum Merdeka` dihapus.
  2. Pada lembar cetak Rapor Umum SAS, elemen `<p>` yang memuat teks `Laporan Hasil Sumatif Akhir Semester — Kurikulum Merdeka` dihapus.
  3. Judul utama (`PENCAPAIAN KOMPETENSI MURID`) dan sub-judul (`SUMATIF TENGAH SEMESTER` / `SUMATIF AKHIR SEMESTER`) tetap dipertahankan.
  4. Pengujian unit di `apps/tests/rapor-components.test.ts` diperbarui untuk mencerminkan penghapusan teks tersebut (memastikan teks tersebut tidak lagi muncul dan format umum terverifikasi lewat judul dan tabel P5).
  5. Nol kebocoran kode spesifikasi teknis dan nihil emoji.

## 2. In / Out of Scope
- **In-Scope**:
  - Menghapus elemen `<p>` subteks Kurikulum Merdeka pada Rapor Umum STS dan SAS di `apps/components/rapor/ReportCardPrintView.tsx`.
  - Memperbarui pengujian di `apps/tests/rapor-components.test.ts`.
  - Menjalankan pengujian unit, typecheck, dan UI leakage check.
- **Out-of-Scope**:
  - Mengubah tabel nilai, tanda tangan, layout KOP, atau kalkulasi capaian.
  - Mengubah logika backend Convex.

## 3. Bukti & Berkas Terkait
- Permintaan pengguna: "ya" (menyetujui pembuangan teks keterangan di bawah judul Rapor Umum)
- Berkas terkait:
  - `apps/components/rapor/ReportCardPrintView.tsx` (baris 182-184 dan baris 364-366)
  - `apps/tests/rapor-components.test.ts` (baris 44-48)

## 4. Kebutuhan Implementasi Terurut Dependensi
1. **Langkah 1**: Hapus paragraf subteks pada bagian judul lembar Rapor Umum STS di `apps/components/rapor/ReportCardPrintView.tsx`.
2. **Langkah 2**: Hapus paragraf subteks pada bagian judul lembar Rapor Umum SAS di `apps/components/rapor/ReportCardPrintView.tsx`.
3. **Langkah 3**: Perbarui assertion pengujian unit di `apps/tests/rapor-components.test.ts` untuk memverifikasi teks telah dibuang (`assert.doesNotMatch`) dan judul format umum tetap valid.
4. **Langkah 4**: Jalankan `node --test apps/tests/rapor-components.test.ts`, `npm run typecheck --prefix apps`, dan `npm test --prefix apps`.

## 5. Kriteria Penerimaan yang Terukur
1. Teks `Laporan Hasil Sumatif Tengah Semester — Kurikulum Merdeka` dan `Laporan Hasil Sumatif Akhir Semester — Kurikulum Merdeka` tidak lagi ditemukan pada berkas `apps/components/rapor/ReportCardPrintView.tsx`.
2. Judul `PENCAPAIAN KOMPETENSI MURID`, `SUMATIF TENGAH SEMESTER`, dan `SUMATIF AKHIR SEMESTER` tetap utuh dan tampil rapi.
3. Seluruh unit test lulus 100%.
4. Nihil kode spesifikasi teknis dan nihil emoji.

## 6. Risiko & Mitigasi
- **Risiko**: `rapor-components.test.ts` sebelumnya mengecek `assert.match(printViewSource, /Kurikulum Merdeka/)`.
- **Mitigasi**: Perbarui tes agar mengecek ketiadaan teks tersebut (`assert.doesNotMatch`) dan memverifikasi format umum melalui judul dan tabel P5.

## 7. Penilaian E2E
- Rekomendasi: `Not needed`
- Alasan: Perubahan ini adalah pembersihan baris teks statis dekoratif pada komponen pratinjau lembar cetak rapor.

## 8. Perintah Validasi
- `node --test apps/tests/rapor-components.test.ts`
- `npm --prefix apps run typecheck`
- `npm --prefix apps test`
