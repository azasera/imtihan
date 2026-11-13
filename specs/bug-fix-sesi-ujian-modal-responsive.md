# Spesifikasi: Perbaikan Responsivitas dan Tata Letak Modal Sesi Ujian

## 1. Definisi Masalah & Perilaku yang Diharapkan
- **Masalah**:
  Pada halaman Jadwal Sesi Ujian (`apps/app/(main)/sesi-ujian/page.tsx`), dialog modal "Jadwal Sesi Ujian Baru" tampil terlalu mentok (*cramped*) dan terpotong secara vertikal:
  1. Kontainer `<DialogContent className="sm:max-w-lg">` tidak memiliki batasan tinggi maksimal (`max-h-[90vh]`) maupun pengguliran vertikal (`overflow-y-auto`).
  2. Karena `DialogPrimitive.Popup` menggunakan posisi `fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2`, formulir yang tinggi (~850px+) terdorong keluar batas layar atas dan bawah pada resolusi laptop, tablet, atau browser dengan bilah alat (*viewport* 600px–900px).
  3. Akibatnya, header dialog (`DialogTitle`, `DialogDescription`, dan tombol tutup silang) terpotong di atas layar (hanya menyisakan ujung teks `... acak soal.`), dan tombol aksi formulir (*Batal* serta *Simpan & Buat Sesi*) terpotong di bawah layar sehingga pengguna tidak dapat menekan tombol simpan dengan nyaman.
  4. Lebar `sm:max-w-lg` (512px) terlalu sempit untuk formulir dengan kolom ganda, opsi acak, penegakan integritas, dan rotasi token, membuat isian terasa sangat sesak (*mentok*).
  5. Pada layar kecil / ponsel, kolom tanggal waktu pelaksanaan dipaksa berdampingan (`grid grid-cols-2`), membuat picker waktu terhimpit.
  6. Pada baris durasi, label `Batas Durasi Santri (Menit) *` dan teks pembantu durasi `60 Menit (1 Jam 0 Menit)` bertabrakan dalam satu baris flex horizontal yang sempit.

- **Perilaku yang Diharapkan**:
  1. Modal dibatasi secara adaptif dengan tinggi maksimal 90% viewport dan pengguliran konten vertikal yang mulus: `<DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6 rounded-xl">`.
  2. Judul dialog, deskripsi, dan tombol tutup selalu tampak utuh di dalam viewport layar.
  3. Tata letak grid responsif:
     - Waktu Mulai & Batas Akhir: `grid grid-cols-1 sm:grid-cols-2 gap-3` (vertikal pada ponsel, berdampingan pada layar `sm:` ke atas).
     - Durasi dan Batas Nilai: ditata dengan ruang lapang dan teks pembantu durasi terformat rapi (`flex flex-wrap items-baseline justify-between gap-1`).
  4. Komponen `Switch` pada opsi acak diberi kelas `shrink-0` agar tidak terjepit oleh teks deskripsi.
  5. Tombol aksi bawah (footer formulir) memiliki pemisah atas yang jelas (`border-t pt-3`) dengan layout responsif `flex flex-col-reverse sm:flex-row sm:justify-end gap-2` sehingga mudah diakses baik dari desktop maupun sentuhan ponsel.

## 2. In / Out of Scope
- **In-Scope**:
  - `apps/app/(main)/sesi-ujian/page.tsx`: Penyesuaian kelas dialog, tata letak responsif formulir, dan tombol aksi.
  - Verifikasi pengujian unit yang ada (`apps/tests/sesi-ujian-ui.test.ts`, `apps/tests/session-integrity.test.ts`, `apps/tests/session-token.test.ts`, dsb.).
  - Penambahan uji responsivitas/kelas modal pada `sesi-ujian-ui.test.ts`.
- **Out-of-Scope**:
  - Mengubah mutasi Convex `createExamSession` atau skema data backend.
  - Mengubah dialog lain yang sudah responsif (`session-continuation-dialog.tsx`).

## 3. Bukti & Berkas Terkait
- Tangkapan layar dari pengguna (`media_1794018443422_c399e285.png`) memperlihatkan modal terpotong di bagian atas dan bawah, serta elemen isian yang berhimpitan sempit.
- Berkas terkait:
  - `apps/app/(main)/sesi-ujian/page.tsx`
  - `apps/components/ui/dialog.tsx`
  - `apps/tests/sesi-ujian-ui.test.ts`
  - `apps/tests/session-token.test.ts`
  - `apps/tests/session-integrity.test.ts`

## 4. Kebutuhan Implementasi Terurut Dependensi
1. **Langkah 1**: Perbarui `apps/app/(main)/sesi-ujian/page.tsx`:
   - Ubah `<DialogContent className="sm:max-w-lg">` menjadi `<DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6 rounded-xl">`.
   - Ubah kolom tanggal pelaksanaan dari `grid-cols-2` menjadi `grid-cols-1 sm:grid-cols-2 gap-3`.
   - Rapikan baris header durasi santri agar label dan konversi jam/menit tidak saling menekan.
   - Tambahkan `shrink-0` pada `Switch`.
   - Tata tombol aksi bawah dengan `pt-3 border-t flex flex-col-reverse sm:flex-row sm:justify-end gap-2`.
2. **Langkah 2**: Perbarui `apps/tests/sesi-ujian-ui.test.ts` untuk memastikan keberadaan batasan `max-h-[90vh]` dan `overflow-y-auto` pada modal sesi ujian.
3. **Langkah 3**: Jalankan `node --test apps/tests/sesi-ujian-ui.test.ts` dan seluruh rangkaian pengujian unit `npm test --prefix apps`.
4. **Langkah 4**: Jalankan `npm run typecheck --prefix apps` dan `npm --prefix apps run test:ui-leak`.

## 5. Kriteria Penerimaan yang Terukur
1. Modal sesi ujian tidak pernah terpotong di atas atau di bawah layar pada ukuran layar apa pun karena terkontrol oleh `max-h-[90vh] overflow-y-auto`.
2. Seluruh teks header (judul, deskripsi) dan tombol aksi (Batal, Simpan) selalu dapat dijangkau dan dilihat dengan jelas.
3. Bidang input tanggal/waktu dan durasi tertata lapang tanpa teks yang bertumpuk atau terpotong.
4. Seluruh pengujian unit (409+ tes) lulus 100%.
5. TypeScript check lulus bersih tanpa galat.
6. Nihil kebocoran kode spesifikasi teknis dan nihil emoji.

## 6. Pertimbangan Risiko & Kompatibilitas
- Risiko rendah; murni perbaikan styling responsif pada kontainer modal dan grid form.
- Tidak ada perubahan pada nama properti, ID form, atau data payload ke Convex.

## 7. Perintah Validasi Repositori
- `node --test apps/tests/sesi-ujian-ui.test.ts`
- `npm test --prefix apps`
- `npm run typecheck --prefix apps`
- `npm --prefix apps run test:ui-leak`
