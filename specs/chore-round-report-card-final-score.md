# Spesifikasi Perubahan: Pembulatan Angka Bulat pada Nilai Akhir Lembar Cetak Rapor (Preservasi Desimal Pra-Rapor)

## 1. Definisi Masalah & Perilaku yang Diharapkan
- **Latar Belakang / Masalah**:
  Pada tampilan lembar cetak rapor (`apps/components/rapor/ReportCardPrintView.tsx`), kolom tabel **Nilai Akhir** mencetak langsung nilai dari `g.finalScore`. Jika nilai akhir hasil rumus formula `(2*PH + STS + SAS)/4` menghasilkan desimal (seperti `43.5` pada tangkapan layar yang dilampirkan pengguna), angka tersebut tercetak dengan koma/desimal pada lembar rapor resmi santri.
- **Perilaku yang Diharapkan**:
  1. **Angka Bulat pada Lembar Cetak Rapor**: Nilai akhir yang tampil pada lembar cetak rapor (`ReportCardPrintView.tsx`) di seluruh varian format (Kurikulum Merdeka PTS 1 halaman, Kurikulum Merdeka PAS 2 halaman, dan Diniyah PTS/PAS) dibulatkan menjadi angka bulat terdekat menggunakan pembulatan standar (`Math.round(g.finalScore)`), misalnya `43.5` tampil sebagai `44`.
  2. **Preservasi Desimal Sebelum Masuk Rapor**: Data dan tampilan angka sebelum masuk rapor (pada tab *Nilai Mata Pelajaran*, nilai komponen PH 1-5, STS, SAS, input Nilai Akhir manual/otomatis, database Convex `reportGrades`, dan Buku Leger Nilai) tetap mempertahankan nilai presisi dengan koma desimal tanpa terpotong atau dipaksa bulat sejak awal.
  3. **Nihil Emoji & Bebas Kebocoran Kode Spesifikasi Teknis**: Seluruh antarmuka tetap bersih tanpa emoji dan tanpa kode teknis.

---

## 2. Ruang Lingkup (Scope)
- **In-Scope**:
  - `apps/components/rapor/ReportCardPrintView.tsx`:
    - Memformat tampilan kolom Nilai Akhir di Kurmer PTS (`line 272`), Kurmer PAS (`line 451`), dan Diniyah PTS/PAS (`line 834`) agar menampilkan angka bulat menggunakan pembulatan standar `Math.round(g.finalScore)`.
  - `apps/tests/rapor-components.test.ts`:
    - Menambahkan pengujian unit yang memverifikasi bahwa `ReportCardPrintView.tsx` membulatkan tampilan nilai akhir menjadi angka bulat dan tidak merusak nilai desimal asli.
  - Dokumentasi spesifikasi & pelacak.
- **Out-of-Scope**:
  - Mengubah tipe data skema backend Convex (`finalScore` tetap bertipe `v.number()` dengan presisi desimal penuh).
  - Mengubah fungsi `calculateNAR` di `apps/lib/rapor-utils.ts` (tetap menyimpan presisi 2 desimal `Math.round(raw * 100) / 100`).
  - Mengubah nilai komponen nilai harian / ujian CBT.

---

## 3. Bukti (Evidence)
- Tangkapan layar dari pengguna (`media_1794921375921_b9d20c47.png`) menunjukkan kolom **Nilai Akhir** pada lembar cetak rapor mencetak angka desimal:
  ```
  87
  43.5
  43.5
  87
  43.5
  ...
  ```
  yang diharapkan menjadi angka bulat (`87`, `44`, `44`, `87`, `44`, ...).

---

## 4. Berkas Terkait
- `apps/components/rapor/ReportCardPrintView.tsx`
- `apps/tests/rapor-components.test.ts`
- `specs/chore-round-report-card-final-score.md`

---

## 5. Kebutuhan Implementasi Terurut Dependensi
1. **Langkah 1**: Perbarui ketiga tabel nilai di `apps/components/rapor/ReportCardPrintView.tsx` (Kurmer PTS, Kurmer PAS, dan Diniyah) agar mencetak nilai akhir dalam bentuk angka bulat (`Math.round(g.finalScore)` jika `typeof g.finalScore === "number"`).
2. **Langkah 2**: Tambahkan unit test pada `apps/tests/rapor-components.test.ts` untuk memastikan pembulatan angka bulat pada lembar cetak rapor berjalan benar.
3. **Langkah 3**: Jalankan `node --test apps/tests/rapor-components.test.ts` dan `npm --prefix apps run typecheck` untuk memverifikasi validitas tipe dan regresi.
4. **Langkah 4**: Jalankan seluruh test suite `npm --prefix apps test` untuk memastikan 532+ test suite lolos 100%.

---

## 6. Kriteria Penerimaan yang Terukur
1. Kolom Nilai Akhir pada lembar cetak rapor (`ReportCardPrintView.tsx`) menampilkan angka bulat (contoh: nilai `43.5` tampil sebagai `44`, `87` tetap `87`).
2. Nilai di lembar kerja sebelum cetak rapor (`apps/app/(main)/rapor/page.tsx`), nilai komponen PH/STS/SAS, serta database Convex tetap menyimpan desimal asli.
3. Seluruh unit test lolos 100% dan `tsc --noEmit` bersih tanpa error.
4. Nol kebocoran kode spesifikasi teknis dan nihil emoji.

---

## 7. Risiko & Mitigasi
- **Risiko**: Nilai `finalScore` bernilai `0`, `NaN`, atau belum diisi.
- **Mitigasi**: Pastikan pemeriksaan tipe aman:
  `typeof g.finalScore === "number" && !isNaN(g.finalScore) ? Math.round(g.finalScore) : g.finalScore`
  sehingga aman dari `NaN` atau nilai undefined.

---

## 8. Penilaian E2E
- Rekomendasi: `Not needed`
- Alasan: Perubahan murni merupakan formatting presentasi visual pada teks angka di tabel cetak tanpa mengubah alur interaksi peramban, form state, mutasi, atau navigasi.

---

## 9. Perintah Validasi
- `node --test apps/tests/rapor-components.test.ts`
- `npm --prefix apps run typecheck`
- `npm --prefix apps test`
