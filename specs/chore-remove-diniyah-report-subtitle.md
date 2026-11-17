# Spesifikasi: Pembuangan Subteks Judul Rapor Diniyah

## 1. Definisi Masalah & Perilaku yang Diharapkan
- **Masalah**:
  Pada tampilan lembar cetak Rapor Diniyah (`apps/components/rapor/ReportCardPrintView.tsx`), di bawah judul `MATA PELAJARAN DINIYAH`, terdapat subteks:
  `Laporan Hasil Sumatif Diniyah & Tahfidz — Kurikulum Kepesantrenan At-Tauhid`
  Pengguna meminta untuk menghapus teks tersebut dari lembar Rapor agar tampilan kop/judul lebih bersih, ringkas, dan sesuai kebutuhan format cetak resmi.

- **Perilaku yang Diharapkan**:
  1. Pada lembar cetak Rapor Diniyah (bagian header/judul dokumen), paragraf `<p>` yang memuat teks `Laporan Hasil Sumatif Diniyah & Tahfidz — Kurikulum Kepesantrenan At-Tauhid` dihapus sepenuhnya.
  2. Elemen header lainnya (`<h2>` periode STS/SAS dan `<h3>` `MATA PELAJARAN DINIYAH`) tetap dipertahankan dengan rapi.
  3. Pengujian unit di `apps/tests/rapor-components.test.ts` diperbarui untuk mencerminkan penghapusan teks tersebut (memastikan teks tersebut tidak lagi muncul dan format diniyah tetap terverifikasi).
  4. Nol kebocoran kode spesifikasi teknis dan nihil emoji.

## 2. In / Out of Scope
- **In-Scope**:
  - Menghapus elemen `<p>` yang memuat `Laporan Hasil Sumatif Diniyah & Tahfidz — Kurikulum Kepesantrenan At-Tauhid` pada `apps/components/rapor/ReportCardPrintView.tsx`.
  - Memperbarui berkas pengujian `apps/tests/rapor-components.test.ts` agar memeriksa ketiadaan teks tersebut (`assert.doesNotMatch`) dan memverifikasi keberadaan header Diniyah (`MATA PELAJARAN DINIYAH`).
  - Menjalankan pengujian regresi dan verifikasi tipe TypeScript.
- **Out-of-Scope**:
  - Mengubah format rapor umum (Kurikulum Merdeka).
  - Mengubah kalkulasi nilai, PDF export, atau logika backend Convex.

## 3. Bukti & Berkas Terkait
- Permintaan pengguna: "halaman e-rapor pada Rapor. buang teks ini : Laporan Hasil Sumatif Diniyah & Tahfidz — Kurikulum Kepesantrenan At-Tauhid"
- Berkas terkait:
  - `apps/components/rapor/ReportCardPrintView.tsx` (baris 745-747)
  - `apps/tests/rapor-components.test.ts` (baris 51-52)

## 4. Kebutuhan Implementasi Terurut Dependensi
1. **Langkah 1**: Hapus paragraf subteks pada bagian judul lembar Diniyah di `apps/components/rapor/ReportCardPrintView.tsx`.
2. **Langkah 2**: Perbarui assertion pengujian unit di `apps/tests/rapor-components.test.ts` untuk memverifikasi teks telah dibuang dan struktur judul `MATA PELAJARAN DINIYAH` tetap valid.
3. **Langkah 3**: Jalankan `npm test --prefix apps` dan `npm run typecheck --prefix apps` untuk memvalidasi zero regression.

## 5. Kriteria Penerimaan yang Terukur
1. Teks `Laporan Hasil Sumatif Diniyah & Tahfidz — Kurikulum Kepesantrenan At-Tauhid` tidak lagi ditemukan pada berkas `apps/components/rapor/ReportCardPrintView.tsx`.
2. Judul `MATA PELAJARAN DINIYAH` dan judul periode (`LAPORAN HASIL SUMATIF TENGAH SEMESTER` / `AKHIR SEMESTER`) tetap ada dan tampil proporsional.
3. Seluruh unit test (`rapor-components.test.ts` dan test suite lengkap) lulus 100%.
4. Nihil kode spesifikasi teknis dan nihil emoji.

## 6. Risiko & Mitigasi
- **Risiko**: Pengujian `rapor-components.test.ts` sebelumnya memiliki `assert.match(printViewSource, /Laporan Hasil Sumatif Diniyah & Tahfidz/)` dan `assert.match(printViewSource, /Kurikulum Kepesantrenan At-Tauhid/)` yang akan gagal jika teks dihapus tanpa menyelaraskan pengujian.
- **Mitigasi**: Selaraskan assertion pada `apps/tests/rapor-components.test.ts` dengan memvalidasi ketiadaan teks tersebut (`assert.doesNotMatch`) dan memastikan penanda format Diniyah menggunakan `MATA PELAJARAN DINIYAH`.

## 7. Penilaian E2E
- Rekomendasi: `Not needed`
- Alasan: Perubahan ini murni penghapusan satu baris teks statis dekoratif pada komponen pratinjau cetak rapor, tidak mengubah interaksi, alur navigasi, formulir input, maupun logika state peramban.

## 8. Perintah Validasi
- `node --test apps/tests/rapor-components.test.ts`
- `npm --prefix apps run typecheck`
- `npm --prefix apps test`
