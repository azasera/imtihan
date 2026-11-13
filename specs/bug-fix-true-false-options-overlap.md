# Spesifikasi: Perbaikan Teks Label Menumpuk pada Butir Soal Benar / Salah

## 1. Definisi Masalah & Perilaku yang Diharapkan
- **Masalah**:
  Pada kartu butir soal tersimpan (`apps/components/bank-soal/question-row.tsx`) dan halaman rekap koreksi (`apps/app/(main)/rekap-nilai/koreksi/[id]/page.tsx`), baris opsi butir soal bertipe Benar / Salah (`question.type === "true_false"`) mengalami penumpukan teks secara visual (*text overlap / collision*):
  1. Kontainer opsi merender `<span className="w-5 font-mono">{opt.label}.</span>` diikuti `<span className="flex-1">{opt.text}</span>`.
  2. Untuk tipe soal Benar / Salah, `opt.label` bernilai `"Benar"` dan `"Salah"`, sedangkan `opt.text` bernilai `"Pernyataan Benar"` dan `"Pernyataan Salah"`.
  3. Kelas `w-5` (lebar 20px) didesain untuk huruf tunggal (`A.`, `B.`, dsb.). Karena teks `"Benar."` dan `"Salah."` memiliki panjang 6 karakter (~40–48px) dan kontainer tidak memotong limpahan (*overflow*), teks label tumpah ke kanan dan bertabrakan langsung di atas teks opsi, menghasilkan teks rancu seperti `"BenaPernyataan Benar"` dan `"SalaPernyataan Salah"`.
  4. Selain itu, menampilkan awalan `"Benar. Pernyataan Benar"` atau `"Salah. Pernyataan Salah"` bersifat redundan karena butir soal Benar / Salah cukup menampilkan status pernyataan secara langsung.

- **Perilaku yang Diharapkan**:
  1. Pada butir soal bertipe Benar / Salah (`question.type === "true_false"`), hilangkan awalan `{opt.label}.` sehingga opsi langsung menampilkan `{opt.text || opt.label}` ("Pernyataan Benar" dan "Pernyataan Salah").
  2. Baris opsi yang merupakan kunci jawaban tetap ditandai dengan latar belakang penanda (`bg-primary/10 text-primary font-semibold`) dan ikon centang (`CheckCircle2Icon`).
  3. Pada butir pilihan ganda reguler atau kompleks, pertahankan awalan huruf opsi dengan pelindung penyusutan (`min-w-5 shrink-0 font-mono`) agar teks label huruf tidak akan pernah menumpuk dengan teks opsi jawaban.
  4. Terapkan logika penyajian yang sama pada halaman koreksi rekap nilai (`apps/app/(main)/rekap-nilai/koreksi/[id]/page.tsx`).

## 2. In / Out of Scope
- **In-Scope**:
  - `apps/components/bank-soal/question-row.tsx`: Penyesuaian perenderan opsi khusus untuk butir soal Benar / Salah dan pencegahan overflow label pilihan ganda.
  - `apps/app/(main)/rekap-nilai/koreksi/[id]/page.tsx`: Penyesuaian perenderan opsi butir Benar / Salah pada lembar koreksi.
  - Penambahan uji unit di `apps/tests/` untuk menjamin tidak adanya penumpukan label pada tipe `true_false`.
- **Out-of-Scope**:
  - Mengubah struktur data di basis data Convex atau skema tabel `questions`.
  - Mengubah logika parser impor massal atau lembar kerja ujian siswa.

## 3. Bukti & Berkas Terkait
- Tangkapan layar dari pengguna (`media_1794008399222_83186008.png`) memperlihatkan kartu `#3 Benar / Salah 5 Poin` dengan teks opsi yang bertumpuk: `"BenaPernyataan Benar"` dan `"SalaPernyataan Salah"`.
- Berkas terkait:
  - `apps/components/bank-soal/question-row.tsx`
  - `apps/app/(main)/rekap-nilai/koreksi/[id]/page.tsx`
  - `apps/tests/question-edit-duplicate.test.ts`

## 4. Kebutuhan Implementasi Terurut Dependensi
1. **Langkah 1**: Perbarui `apps/components/bank-soal/question-row.tsx`:
   - Deteksi apakah butir soal bertipe `true_false`.
   - Jika `true_false`, jangan render awalan `{opt.label}.`; tampilkan langsung teks opsi `{opt.text || opt.label}`.
   - Jika bukan `true_false`, gunakan `<span className="min-w-5 shrink-0 font-mono">{opt.label}.</span>`.
2. **Langkah 2**: Perbarui `apps/app/(main)/rekap-nilai/koreksi/[id]/page.tsx`:
   - Hindari perenderan `{opt.label}.` jika butir bertipe `true_false`.
3. **Langkah 3**: Tambahkan pengujian unit di `apps/tests/question-edit-duplicate.test.ts` (atau tes baru) untuk memvalidasi perenderan opsi Benar / Salah tanpa awalan menumpuk.
4. **Langkah 4**: Jalankan pengujian unit, typecheck, dan ui-leak check.

## 5. Kriteria Penerimaan yang Terukur
1. Kartu butir soal Benar / Salah di panel daftar soal menampilkan opsi "Pernyataan Benar" dan "Pernyataan Salah" dengan rapi tanpa ada karakter yang menumpuk.
2. Opsi yang menjadi kunci jawaban tetap memiliki latar penanda dan ikon centang yang tepat.
3. Soal pilihan ganda biasa (A, B, C, ...) tetap merender huruf opsi dengan benar.
4. Seluruh rangkaian pengujian unit (408+ tes) lulus 100%.
5. TypeScript check `tsc --noEmit` lolos tanpa kesalahan.
6. Nihil kebocoran kode spesifikasi teknis dan nihil emoji.

## 6. Pertimbangan Risiko, Kompatibilitas, & Keamanan
- Risiko sangat rendah karena hanya mengubah penyajian tampilan baris opsi di komponen UI.
- Kompatibel penuh dengan butir soal lama maupun yang baru diimpor dari Excel/Word.

## 7. Perintah Validasi Repositori
- `node --test apps/tests/question-edit-duplicate.test.ts`
- `npm test --prefix apps`
- `npm run typecheck --prefix apps`
- `npm --prefix apps run test:ui-leak`
