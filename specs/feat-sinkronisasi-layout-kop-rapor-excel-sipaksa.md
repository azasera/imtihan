# Spesifikasi Rencana: Penyesuaian Layout Rapor & Kop Surat Sesuai Rujukan Excel & SiPAKSa

## 1. Definisi Masalah dan Perilaku yang Diinginkan (Problem & Desired Behavior)

### Masalah
1. **Kop Surat Rapor Belum Sesuai Rujukan**:
   - Kop surat pada `RaporLetterhead.tsx` saat ini hanya menampilkan satu logo generik di sebelah kiri dengan spacer kosong di sebelah kanan.
   - Belum mengikuti standar resmi SiPAKSa (`https://icentresmart.my.id/raport`):
     - **Sebelah kiri**: Logo resmi Pondok Pesantren Islamic Centre At-Tauhid (`/logo/ikon-ict.png` atau `/logo/logo-ict.png`).
     - **Sebelah kanan**: Logo resmi lembaga masing-masing (`/logo/logo-smpita.png` untuk SMPITA, `/logo/logo-smaita.png` untuk SMAITA, `/logo/logo-mta.png` untuk MTA).
     - **Tengah (Teks Kop)**:
       - Baris 1: `PONDOK PESANTREN` (bold, proporsional)
       - Baris 2: `ISLAMIC CENTRE  AT-TAUHID BANGKA BELITUNG` (bold, tracking-wide)
       - Baris 3: Nama Lembaga (`SMP ISLAM TAHFIDZ AL-QUR'AN AT-TAUHID` / `SMA ISLAM TAHFIDZ AL-QUR'AN AT-TAUHID` / `MANZHUMAH TAKHOSHUSH AL QUR'AN AT-TAUHID`)
       - Baris 4: NPSN (NPSN: 69988220 untuk SMPITA) jika tersedia
       - Baris 5: Alamat resmi (`Jl. Gerunggang Dalam RT 08 RW 03, Kel. Air Kepala Tujuh, Kec. Gerunggang Kota Pangkalpinang`)
       - Baris 6: Provinsi (`Provinsi Kepulauan Bangka Belitung`)
     - **Garis Pembatas Bawah Kop**: Garis ganda tegas (`border-b-4 border-double border-foreground` / `border-slate-950`).

2. **Kesesuaian Layout Rapor dengan Berkas Excel Rujukan (`Rapor KURMER SMPITA AT-TAUHID_Rev.xlsm`)**:
   - **Rapor Umum (Kurikulum Merdeka)**:
     - Judul: `PENCAPAIAN KOMPETENSI MURID` & `SUMATIF AKHIR SEMESTER` (atau `SUMATIF AKHIR TAHUN` jika semester 2).
     - Identitas Peserta Didik: 2 kolom (Nama Murid, NISN, Nama Sekolah, Alamat vs Kelas, Fase, Semester, Tahun Ajaran).
     - Bagian A (Sikap / P5): 6 Dimensi Profil Pelajar Pancasila beserta deskripsi capaian.
     - Bagian B (Pengetahuan): Tabel Mata Pelajaran, Nilai Akhir, Predikat, dan Capaian Kompetensi.
     - Bagian C (Kokurikuler & Ekstrakurikuler): Catatan kokurikuler dan tabel kegiatan ekstrakurikuler (Agrobisnis, TIK, Jurnalis, Bulu Tangkis, Tenis Meja, Futsal, Panahan, Bola Voli).
     - Bagian D (Ketidakhadiran / Absensi): Sakit, Izin, Tanpa Keterangan.
     - Catatan Wali Kelas & Tanggapan Orang Tua / Wali Murid (area kosong tertulis).
     - Keputusan Kenaikan Kelas (jika semester akhir tahun).
     - Kolom Tanda Tangan: Orang Tua / Wali (kiri), Wali Kelas (kanan atas tanggal), Kepala Sekolah (tengah bawah).
   - **Rapor Diniyah (Kurikulum Kepesantrenan)**:
     - Judul: `LAPORAN HASIL SUMATIF AKHIR SEMESTER` - `MATA PELAJARAN DINIYAH`.
     - Identitas Santri: Nama Murid, NISN, Nama Sekolah, Kelas, Semester, Tahun Ajaran.
     - Bagian A: Ketercapaian Hasil Belajar (Mata Pelajaran Diniyah, Nilai Akhir, Predikat, Capaian Kompetensi).
     - Bagian B: Capaian Hafalan Murid (Hadits Arba'in & Tahfidz Al-Qur'an: Capaian Hafalan, Target Hafalan Semester, Keterangan Tuntas).
     - Bagian C: Ketidakhadiran (Absensi) & Catatan Wali Kelas.
     - Kolom Tanda Tangan 3 pihak yang proporsional.

---

## 2. Ruang Lingkup (In / Out Scope)

### In Scope
1. **Pembaruan Aset Logo**:
   - Memastikan berkas logo resmi tersimpan di `apps/public/logo/`:
     - `ikon-ict.png` / `logo-ict.png` (Logo Ponpes ICT)
     - `logo-smpita.png` (Logo SMPITA)
     - `logo-smaita.png` (Logo SMAITA)
     - `logo-mta.png` (Logo MTA)
2. **Pembaruan `apps/lib/rapor-utils.ts`**:
   - Menambahkan helper pemetaan logo kiri dan logo kanan berdasarkan lembaga (`getInstitutionLogos(institution)`).
   - Menyempurnakan metadata header lembaga (`INSTITUTION_HEADERS`).
3. **Pembaruan Komponen Kop Surat `apps/components/rapor/RaporLetterhead.tsx`**:
   - Logo kiri (Ponpes ICT), teks lembaga di tengah, logo kanan (lembaga santri).
   - Garis ganda `border-b-4 border-double border-foreground`.
4. **Pembaruan Lembar Cetak Rapor `apps/components/rapor/ReportCardPrintView.tsx`**:
   - Menyelaraskan hierarki bagian (Sikap P5, Pengetahuan, Kokurikuler, Ekstrakurikuler, Absensi, Catatan Wali Kelas, Tanggapan Orang Tua, Keputusan Kenaikan Kelas, dan Tanda Tangan) sesuai sheet `Rapor Umum PAS` dan `Rapor Diniyah PAS`.
5. **Verifikasi Pengujian**:
   - Menambahkan dan memperbarui unit test pada `apps/tests/rapor-components.test.ts` dan `apps/tests/rapor-utils.test.ts`.

### Out Scope
- Perubahan pada skema Convex (`schema.ts`) karena struktur data nilai rapor sudah mencukupi.
- Pengubahan logika hitung nilai rapor (NAR) yang sudah teruji.

---

## 3. Bukti (Evidence)

1. **Berkas Excel Rujukan**:
   - `rapor/Rapor KURMER SMPITA AT-TAUHID_Rev.xlsm`
   - Sheet `Rapor Umum PAS`:
     - Baris 1-3: Yayasan & Nama Sekolah.
     - Baris 5-6: PENCAPAIAN KOMPETENSI MURID - SUMATIF AKHIR SEMESTER.
     - Baris 8-11: Identitas Murid 2 kolom.
     - Baris 13-21: SIKAP (6 Dimensi P5).
     - Baris 23-45: PENGETAHUAN (No, Mata Pelajaran, Nilai Akhir, Capaian Kompetensi).
     - Baris 48-49: Kokurikuler.
     - Baris 53-61: Ekstrakurikuler (8 kegiatan).
     - Baris 64-67: Ketidakhadiran (Sakit, Izin, Tanpa Keterangan).
     - Baris 65: Catatan Wali Kelas.
     - Baris 70: Tanggapan Orang Tua/Wali Murid.
     - Baris 76-78: Keputusan Kenaikan Kelas.
     - Baris 81-96: Tanda Tangan Orang Tua, Wali Kelas, Kepala Sekolah.
   - Sheet `Rapor Diniyah PAS`:
     - Baris 4-8: Yayasan, Lembaga, Alamat.
     - Baris 10-11: LAPORAN HASIL SUMATIF AKHIR SEMESTER - MATA PELAJARAN DINIYAH.
     - Baris 13-15: Identitas Murid.
     - Baris 17-34: A. Ketercapaian Hasil Belajar (No, Mata Pelajaran, Nilai Akhir, Predikat, Capaian Kompetensi).
     - Baris 37-40: B. Capaian Hafalan Murid (Hadits Arba'in, Tahfidz Al-Qur'an).
     - Baris 42-57: Tanda Tangan 3 pihak.
2. **Implementasi Resmi SiPAKSa (`https://icentresmart.my.id/raport`)**:
   - Logo kiri: `/cetak/logo/ikon-ict.png`
   - Logo kanan: `/cetak/logo/logo-smpita.png`, `/cetak/logo/logo-smaita.png`, `/cetak/logo/logo-mta.png`
   - Header style: `border-b-4 border-double border-slate-950`
   - Teks tengah:
     - `PONDOK PESANTREN` (bold, ~17px)
     - `ISLAMIC CENTRE  AT-TAUHID BANGKA BELITUNG` (bold, ~10px)
     - `[NAMA LEMBAGA]` (bold, ~14-16px)
     - `[ALAMAT RESMI]` (italic serif, ~7.5-8.5px)

---

## 4. Berkas yang Terkait (Relevant Files)

- `apps/public/logo/ikon-ict.png` (Aset logo Ponpes ICT)
- `apps/public/logo/logo-smpita.png` (Aset logo SMPITA)
- `apps/public/logo/logo-smaita.png` (Aset logo SMAITA)
- `apps/public/logo/logo-mta.png` (Aset logo MTA)
- `apps/lib/rapor-utils.ts` (Fungsi helper metadata dan logo lembaga)
- `apps/components/rapor/RaporLetterhead.tsx` (Komponen Kop Surat Rapor)
- `apps/components/rapor/ReportCardPrintView.tsx` (Komponen Lembar Cetak Rapor)
- `apps/tests/rapor-components.test.ts` (Unit test komponen rapor)
- `apps/tests/rapor-utils.test.ts` (Unit test fungsi rapor)

---

## 5. Rincian Persyaratan Implementasi Terurut Ketergantungan (Dependency-ordered Implementation)

1. **Langkah 1: Verifikasi dan Normalisasi Aset Logo Lembaga**
   - Pastikan berkas logo lokal di `apps/public/logo/` lengkap dan dapat dimuat oleh Next.js Image component.
2. **Langkah 2: Perluasan `rapor-utils.ts`**
   - Tambahkan fungsi `getInstitutionLogos(institution: Institution | string)` yang mengembalikan `{ leftLogo: string; rightLogo: string; institutionTitle: string }`.
   - Perbarui teks alamat dan penamaan lembaga agar presisi dengan rujukan SiPAKSa.
3. **Langkah 3: Pembaruan `RaporLetterhead.tsx`**
   - Pasang logo kiri (`leftLogo`), teks identitas lembaga di tengah, dan logo kanan (`rightLogo`).
   - Ubah garis pembatas bawah menjadi `border-b-4 border-double border-foreground` (atau `border-slate-900`).
4. **Langkah 4: Pembaruan `ReportCardPrintView.tsx`**
   - Selaraskan bagian Rapor Umum:
     - Tambahkan blok Tanggapan Orang Tua / Wali Murid sesuai Excel.
     - Pastikan tata letak Sikap P5, Mapel, Kokurikuler, Ekstrakurikuler, Absensi, dan Tanda Tangan persis seperti Excel.
   - Selaraskan bagian Rapor Diniyah:
     - Format tabel Capaian Hafalan Murid (Hadits Arba'in & Tahfidz Al-Qur'an).
5. **Langkah 5: Validasi Pengujian & Typecheck**
   - Jalankan `npm --prefix apps run test` dan `npm --prefix apps run typecheck`.

---

## 6. Kriteria Penerimaan Terukur (Measurable Acceptance Criteria)

- [ ] Kop surat menampilkan logo Ponpes ICT di sebelah kiri pada semua lembar rapor.
- [ ] Kop surat menampilkan logo lembaga masing-masing (SMPITA/SMAITA/MTA) di sebelah kanan.
- [ ] Garis pembatas bawah kop menggunakan garis ganda (`border-b-4 border-double`).
- [ ] Rapor Umum menampilkan seksi Sikap P5, Ketercapaian Hasil Belajar, Kokurikuler, Ekstrakurikuler, Absensi, Catatan Wali Kelas, Tanggapan Orang Tua, dan Tanda Tangan.
- [ ] Rapor Diniyah menampilkan seksi Ketercapaian Mapel Diniyah, Capaian Hafalan (Hadits & Tahfidz), Absensi, Catatan Wali Kelas, dan Tanda Tangan.
- [ ] Tidak ada emoji di seluruh teks UI atau komponen.
- [ ] Tidak ada kebocoran kode spesifikasi teknis (`SCR-*`, `*-FR-*`, `TASK-*`, dll.).
- [ ] Seluruh unit test (`node --test tests/**/*.test.ts`) lulus 100% tanpa regresi.

---

## 7. Analisis Risiko (Risk Analysis)

- **Risiko**: Ukuran berkas logo lokal dapat memengaruhi performa cetak jika terlalu besar.
  - **Mitigasi**: Berkas logo berukuran optimal (62 KB - 800 KB) dan Next.js Image component menangani optimasi dengan atribut `priority`.
- **Risiko**: Tampilan cetak print CSS (`@media print`) terpotong jika jarak margin tidak tepat.
  - **Mitigasi**: Gunakan `print:break-inside-avoid`, `print:p-0`, dan ukuran standar A4.

---

## 8. Pertimbangan Kompatibilitas, Keamanan, & Migrasi

- **Kompatibilitas**: Komponen tetap kompatibel dengan data santri yang ada saat ini (jenjang SMPITA, SMAITA, MTA).
- **Keamanan**: Tidak ada input pengguna yang di-render secara mentah; nama santri dibersihkan dengan `cleanStudentName`.
- **Migrasi**: Tidak membutuhkan migrasi database Convex.

---

## 9. Perintah Validasi Repositori (Validation Commands)

```bash
npm --prefix apps run test tests/rapor-components.test.ts tests/rapor-utils.test.ts
npm --prefix apps run typecheck
npm --prefix apps run test
```

---

## 10. Ekspektasi Dokumentasi (Documentation Expectations)

- Spesifikasi tersimpan di `specs/feat-sinkronisasi-layout-kop-rapor-excel-sipaksa.md`.
- Komentar kode pada `RaporLetterhead.tsx` dan `ReportCardPrintView.tsx` menjelaskan keterkaitan dengan standar format SiPAKSa dan berkas Excel rujukan.
