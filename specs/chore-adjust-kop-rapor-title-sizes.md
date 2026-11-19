# Spesifikasi: Penyesuaian dan Pembesaran Ukuran Teks Judul Kop Rapor

## 1. Definisi Masalah & Perilaku yang Diharapkan
- **Masalah**:
  Setelah penghapusan teks baris yayasan teratas pada Kop Rapor, teks judul `PONDOK PESANTREN` dan subjudul `ISLAMIC CENTRE AT-TAUHID BANGKA BELITUNG` pada `apps/components/rapor/RaporLetterhead.tsx` terlihat relatif kecil (`text-sm md:text-lg` dan `text-[10px] md:text-xs`) jika dibandingkan dengan proporsi logo 80px di kedua sisi serta nama lembaga di bawahnya.
  Pengguna meminta untuk menyesuaikan ukuran teks `PONDOK PESANTREN` dan `ISLAMIC CENTRE AT-TAUHID BANGKA BELITUNG` agar lebih besar dan proporsional.

- **Perilaku yang Diharapkan**:
  1. Pada `apps/components/rapor/RaporLetterhead.tsx`, ukuran teks `PONDOK PESANTREN` diperbesar dari `text-sm md:text-lg` (14px/18px) menjadi `text-lg md:text-2xl` (18px/24px).
  2. Ukuran teks `ISLAMIC CENTRE AT-TAUHID BANGKA BELITUNG` diperbesar dari `text-[10px] md:text-xs` (10px/12px) menjadi `text-xs md:text-sm` (12px/14px).
  3. Proporsi hierarki visual kop rapor menjadi seimbang dan harmonis dengan kedua logo resmi di sisi kiri dan kanan.
  4. Seluruh pengujian unit tetap lulus 100%, nihil kebocoran kode spesifikasi teknis, dan nihil emoji.

## 2. In / Out of Scope
- **In-Scope**:
  - Menyesuaikan kelas ukuran font pada elemen `h2` (`PONDOK PESANTREN`) dan `h3` (`ISLAMIC CENTRE AT-TAUHID BANGKA BELITUNG`) di `apps/components/rapor/RaporLetterhead.tsx`.
  - Memvalidasi tampilan dan memastikan tidak ada teks yang terpotong (overflow/wrapping tak wajar).
  - Menjalankan pengujian unit dan typecheck TypeScript.
- **Out-of-Scope**:
  - Mengubah struktur data atau metadata di `apps/lib/rapor-utils.ts`.
  - Mengubah layout isi nilai atau tabel pada lembar cetak rapor.

## 3. Bukti & Berkas Terkait
- Permintaan pengguna: "teks PONDOK PESANTREN dan ISLAMIC CENTRE AT-TAUHID BANGKA BELITUNG sesuaikan ukuran. buat lebih besar" disertai tangkapan layar kop rapor.
- Berkas terkait:
  - `apps/components/rapor/RaporLetterhead.tsx` (baris 48-53)
  - `apps/tests/rapor-components.test.ts`

## 4. Kebutuhan Implementasi Terurut Dependensi
1. **Langkah 1**: Perbarui kelas tipografi pada elemen `h2` dan `h3` di `apps/components/rapor/RaporLetterhead.tsx`.
2. **Langkah 2**: Jalankan pengujian unit `node --test apps/tests/rapor-components.test.ts` dan typecheck `npm --prefix apps run typecheck`.
3. **Langkah 3**: Jalankan seluruh pengujian `npm --prefix apps test`.

## 5. Kriteria Penerimaan yang Terukur
1. Teks `PONDOK PESANTREN` menggunakan kelas `text-lg md:text-2xl font-extrabold tracking-wide uppercase font-heading text-foreground leading-tight`.
2. Teks `ISLAMIC CENTRE AT-TAUHID BANGKA BELITUNG` menggunakan kelas `text-xs md:text-sm font-bold tracking-wider uppercase text-foreground/90`.
3. Seluruh unit test lulus 100%.
4. Nihil kode spesifikasi teknis dan nihil emoji.

## 6. Risiko & Mitigasi
- **Risiko**: Teks `ISLAMIC CENTRE AT-TAUHID BANGKA BELITUNG` dapat meluap (wrap) jika ukuran terlalu besar pada kertas A4.
- **Mitigasi**: Ukuran `text-sm` (14px) memiliki total panjang ~300px pada font serif Times New Roman, yang jauh di bawah batas ruang tengah (~456px) sehingga dijamin tidak meluap ke baris baru.

## 7. Penilaian E2E
- Rekomendasi: `Not needed`
- Alasan: Penyesuaian ukuran font statis pada komponen presentasional kop rapor tanpa logika interaktif peramban.

## 8. Perintah Validasi
- `node --test apps/tests/rapor-components.test.ts`
- `npm --prefix apps run typecheck`
- `npm --prefix apps test`
