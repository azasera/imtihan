# Spesifikasi: Pembuangan Teks Yayasan dan Kota pada Kop Rapor

## 1. Definisi Masalah & Perilaku yang Diharapkan
- **Masalah**:
  Pada tampilan Kop Rapor resmi (`apps/components/rapor/RaporLetterhead.tsx`), di bagian atas judul lembaga/pesantren, terdapat baris teks:
  `YAYASAN AT-TAUHID AL ISLAMY BANGKA BELITUNG • KOTA PANGKALPINANG`
  (dihasilkan dari `{header.foundation} &bull; {header.city}`).
  Pengguna meminta untuk membuang teks `"YAYASAN AT-TAUHID AL ISLAMY BANGKA BELITUNG • KOTA PANGKALPINANG"` dari Kop Rapor agar susunan kop lebih fokus, proporsional, dan ringkas.

- **Perilaku yang Diharapkan**:
  1. Pada komponen `RaporLetterhead.tsx`, elemen `<p>` yang memuat `{header.foundation} &bull; {header.city}` dihapus.
  2. Elemen kop lainnya (Logo kiri Ponpes ICT, Logo kanan Lembaga, judul `PONDOK PESANTREN`, subjudul `ISLAMIC CENTRE AT-TAUHID BANGKA BELITUNG`, nama lembaga, NPSN, dan alamat) tetap utuh dan tersusun rapi.
  3. Pengujian unit di `apps/tests/rapor-components.test.ts` diperbarui untuk mencerminkan bahwa baris yayasan & kota tidak lagi dirender pada komponen Kop Rapor (`assert.doesNotMatch(letterheadSource, /header\.foundation/)`).
  4. Nol kebocoran kode spesifikasi teknis dan nihil emoji.

## 2. In / Out of Scope
- **In-Scope**:
  - Menghapus elemen paragraf yayasan & kota pada `apps/components/rapor/RaporLetterhead.tsx`.
  - Memperbarui pengujian unit di `apps/tests/rapor-components.test.ts`.
  - Memvalidasi seluruh tes unit, typecheck TypeScript, dan aturan nol kebocoran kode teknis serta emoji.
- **Out-of-Scope**:
  - Mengubah kamus data `INSTITUTION_HEADERS` pada `apps/lib/rapor-utils.ts` (tetap mempertahankan struktur data untuk backward compatibility metadata).
  - Mengubah tata letak isi rapor, tabel nilai, tanda tangan, maupun fungsi ekspor PDF.
  - Mengubah skema atau fungsi Convex.

## 3. Bukti & Berkas Terkait
- Permintaan pengguna: `Pada Kop Rapot : buang teks : "YAYASAN AT-TAUHID AL ISLAMY BANGKA BELITUNG • KOTA PANGKALPINANG"`
- Berkas terkait:
  - `apps/components/rapor/RaporLetterhead.tsx` (baris 48-50)
  - `apps/tests/rapor-components.test.ts` (baris 22-36)

## 4. Kebutuhan Implementasi Terurut Dependensi
1. **Langkah 1**: Hapus paragraf `{header.foundation} &bull; {header.city}` pada komponen `RaporLetterhead.tsx`.
2. **Langkah 2**: Perbarui assertion pengujian unit di `apps/tests/rapor-components.test.ts` agar memvalidasi ketiadaan teks yayasan pada Kop (`assert.doesNotMatch(letterheadSource, /header\.foundation/)`) dan tetap memverifikasi elemen lembaga & logo resmi.
3. **Langkah 3**: Jalankan `node --test apps/tests/rapor-components.test.ts` dan `npm --prefix apps run typecheck`.
4. **Langkah 4**: Jalankan test suite lengkap `npm --prefix apps test`.

## 5. Kriteria Penerimaan yang Terukur
1. Teks `header.foundation` dan `header.city` tidak lagi dirender pada `apps/components/rapor/RaporLetterhead.tsx`.
2. Tampilan Kop Rapor tetap menampilkan logo, nama pondok pesantren, nama lembaga resmi, NPSN, dan alamat dengan rapi.
3. Seluruh unit test lulus 100%.
4. Nihil kode spesifikasi teknis dan nihil emoji.

## 6. Risiko & Mitigasi
- **Risiko**: `rapor-components.test.ts` sebelumnya mengecek `assert.match(letterheadSource, /header\.foundation/)` dan `assert.match(letterheadSource, /header\.city/)`.
- **Mitigasi**: Selaraskan pengujian unit agar mengonfirmasi pembuangan baris yayasan dengan `assert.doesNotMatch(letterheadSource, /header\.foundation/)`.

## 7. Penilaian E2E
- Rekomendasi: `Not needed`
- Alasan: Perubahan ini adalah pembersihan baris teks statis dekoratif pada komponen pratinjau lembar cetak rapor, tidak mengubah alur interaktif, navigasi, formulir, maupun state peramban.

## 8. Perintah Validasi
- `node --test apps/tests/rapor-components.test.ts`
- `npm --prefix apps run typecheck`
- `npm --prefix apps test`
