# Spesifikasi Rencana: Penambahan Filter STS/SAS dan Fitur Download PDF (Single, Multi-ZIP, & Batch 1 Kelas)

## 1. Definisi Masalah dan Perilaku yang Diinginkan (Problem & Desired Behavior)

### Masalah
1. **Belum Ada Pemisahan Format STS (Tengah Semester) vs SAS (Akhir Semester)**:
   - Pada berkas Excel rujukan (`Rapor KURMER SMPITA AT-TAUHID_Rev.xlsm`), lembar STS (**`Rapor Umum PTS`** & **`Rapor Diniyah PTS`**) memiliki tata letak ringkas (hanya memuat Ketercapaian Hasil Belajar Mata Pelajaran + Target Hafalan Hadits, tanpa P5, Kokurikuler, Ekstrakurikuler, atau Keputusan Kenaikan Kelas).
   - Pada aplikasi saat ini, tampilan cetak rapor selalu menampilkan format lengkap SAS (Akhir Semester) tanpa filter untuk memilih periode STS.
2. **Kebutuhan Cetak & Unduh Fleksibel Guru**:
   - Guru membutuhkan:
     1. **Unduh PDF Santri Tunggal (Single PDF)**: Mengunduh 1 file PDF untuk santri yang sedang dipilih.
     2. **Unduh Multi-ZIP (Berkas Terpisah per Santri)**: Mengunduh arsip `.zip` berisi file-file PDF terpisah untuk setiap santri dalam satu kelas (misal: `Rapor_7A_Ahmad.pdf`, `Rapor_7A_Budi.pdf`, dst.).
     3. **Unduh/Cetak 1 File PDF Gabungan untuk 1 Kelas (Batch Print Sekali Klik)**: Menggabungkan seluruh santri dalam 1 kelas ke dalam satu dokumen terpadu dengan pemisah halaman (`page-break-after: always;` / `break-after: page;`) sehingga guru dan wali kelas dapat mencetak seluruh kelas hanya dengan satu kali klik.

### Perilaku yang Diinginkan
1. **Pemilih Periode Asesmen**:
   - Tab "Cetak Rapor" menyediakan filter periode asesmen:
     - **STS (Sumatif Tengah Semester)**
     - **SAS (Sumatif Akhir Semester)**
   - Berkolaborasi dengan filter **Semester** (1 atau 2) yang sudah ada:
     - **STS 1**: Rapor Tengah Semester Ganjil.
     - **SAS 1**: Rapor Akhir Semester Ganjil.
     - **STS 2**: Rapor Tengah Semester Genap.
     - **SAS 2 / SAT**: Rapor Akhir Tahun Genap (+ Keputusan Kenaikan Kelas).
   - Saat periode **STS** dipilih:
     - Rapor Umum menampilkan format ringkas: KOP + Identitas + Ketercapaian Hasil Belajar + Tanda Tangan (tanpa P5, tanpa Kokurikuler, tanpa Ekskul).
     - Rapor Diniyah menampilkan: KOP + Identitas + Ketercapaian Mapel Diniyah + Catatan Target Hafalan Hadits + Tanda Tangan.
   - Saat periode **SAS** dipilih:
     - Menampilkan format lengkap (Sikap P5, Mapel, Kokurikuler, Ekskul, Absensi, Catatan Walas, Tanggapan Ortu, Keputusan Kenaikan Kelas).
2. **Aksi Cetak & Unduh**:
   - Tombol **Cetak Rapor Santri Ini (A4)** (cetak 1 santri).
   - Tombol **Cetak Rapor 1 Kelas Sekaligus (A4)** (cetak batch semua santri di kelas tersebut dalam 1 jendela print).
   - Tombol **Unduh PDF Santri (Single)**.
   - Tombol **Unduh ZIP Kelas (File PDF Terpisah)**.
   - Tombol **Unduh 1 PDF Kelas (Gabungan)**.

---

## 2. Ruang Lingkup (In / Out Scope)

### In Scope
1. **Pembaruan Antarmuka `apps/app/(main)/rapor/page.tsx`**:
   - Menambahkan state `assessmentPeriod: "STS" | "SAS"` dengan segmented button / switcher.
   - Menambahkan tombol aksi cetak dan unduh:
     - Cetak Santri Tunggal.
     - Cetak Batch 1 Kelas Sekaligus.
     - Unduh Single PDF.
     - Unduh Multi ZIP (file PDF terpisah per santri).
     - Unduh 1 File PDF Gabungan 1 Kelas.
   - Menyediakan query data nilai untuk seluruh santri dalam kelas yang dipilih agar batch generation berjalan mulus.
2. **Pembaruan Komponen Cetak `apps/components/rapor/ReportCardPrintView.tsx`**:
   - Menambahkan prop `period?: "STS" | "SAS"`.
   - Mengondisikan visibilitas seksi P5, Kokurikuler, Ekstrakurikuler, dan Keputusan Kenaikan Kelas hanya tampil jika `period === "SAS"`.
   - Menyesuaikan judul dokumen:
     - `period === "STS"`: `Pencapaian Kompetensi Murid` - `Sumatif Tengah Semester` (Umum) / `Laporan Hasil Sumatif Tengah Semester` - `Mata Pelajaran Diniyah` (Diniyah).
     - `period === "SAS"`: `Laporan Hasil Sumatif Akhir Semester` (Sem 1) atau `Laporan Hasil Sumatif Akhir Tahun` (Sem 2).
3. **Penyediaan Utilitas PDF & ZIP (`apps/lib/rapor-pdf.ts`)**:
   - Memanfaatkan library client-side (`jspdf`, `jszip`, `html2canvas`) untuk rendering dan bundling berkas PDF dan ZIP secara asinkron tanpa membebani server.
4. **Pembaruan Pengujian Unit**:
   - Memperbarui `apps/tests/rapor-components.test.ts` dan `apps/tests/rapor-utils.test.ts`.

### Out Scope
- Perubahan pada skema database Convex (`schema.ts`).
- Pengubahan formula kalkulasi nilai rapor (NAR).

---

## 3. Bukti (Evidence)

1. **Excel Sheet `Rapor Umum PTS`**:
   - Menampilkan hanya identitas murid, tabel No, Mata Pelajaran, Nilai Akhir, Capaian Kompetensi, dan langsung tanda tangan 3 pihak (tanpa P5 dan Ekskul).
2. **Excel Sheet `Rapor Diniyah PTS`**:
   - Menampilkan A. Ketercapaian Hasil Belajar dan B. Catatan Hafalan Hadits (Target Hafalan Tengah Semester) dan tanda tangan.
3. **Excel Sheet `Rapor Umum PAS` & `Rapor Diniyah PAS`**:
   - Menampilkan seluruh seksi lengkap termasuk P5, Kokurikuler, Ekstrakurikuler, Catatan Walas, Tanggapan Ortu, dan Keputusan Kenaikan Kelas.

---

## 4. Berkas yang Terkait (Relevant Files)

- `apps/components/rapor/ReportCardPrintView.tsx` (Komponen tampilan lembar cetak rapor)
- `apps/app/(main)/rapor/page.tsx` (Halaman utama E-Rapor dengan tab Cetak Rapor)
- `apps/lib/rapor-pdf.ts` (Modul utilitas generate PDF single, gabungan, dan arsip ZIP)
- `apps/package.json` (Dependensi: `jspdf`, `jszip`, `html2canvas`)
- `apps/tests/rapor-components.test.ts` (Unit test komponen)
- `apps/tests/rapor-utils.test.ts` (Unit test utilitas)

---

## 5. Rincian Persyaratan Implementasi Terurut Ketergantungan (Dependency-ordered Implementation)

1. **Langkah 1: Instalasi Dependensi PDF & ZIP**
   - Tambahkan `jspdf`, `jszip`, `html2canvas` ke `apps/package.json`.
2. **Langkah 2: Pembaruan `ReportCardPrintView.tsx`**
   - Tambahkan prop `period?: "STS" | "SAS"`.
   - Modifikasi kondisional render sehingga jika `period === "STS"`, seksi P5, Kokurikuler, Ekstrakurikuler, dan Keputusan Kenaikan Kelas disembunyikan sesuai sheet `Rapor Umum PTS` & `Rapor Diniyah PTS`.
   - Judul dokumen otomatis mencerminkan STS vs SAS dan Semester 1 vs 2.
3. **Langkah 3: Pembuatan Modul Utilitas `apps/lib/rapor-pdf.ts`**
   - Fungsi `generateSingleStudentPdf(elementId, filename)`
   - Fungsi `generateClassCombinedPdf(containerElementId, filename)`
   - Fungsi `generateClassSeparatedZip(students, renderCallback, zipFilename)`
4. **Langkah 4: Integrasi di Halaman `apps/app/(main)/rapor/page.tsx`**
   - Tambahkan pemilih periode asesmen:
     - `STS (Tengah Semester)`
     - `SAS (Akhir Semester)`
   - Tambahkan kelompok tombol aksi:
     - Cetak Santri Tunggal & Cetak 1 Kelas Sekaligus.
     - Unduh PDF Single, Unduh ZIP Terpisah, dan Unduh 1 PDF Kelas.
   - Tambahkan container khusus cetak batch (`print:block`) dengan CSS page-break per santri.
5. **Langkah 5: Validasi Pengujian & Typecheck**
   - Jalankan `npm --prefix apps run test` dan `npm --prefix apps run typecheck`.

---

## 6. Kriteria Penerimaan Terukur (Measurable Acceptance Criteria)

- [ ] Pengguna dapat memilih Periode Asesmen antara `STS (Tengah Semester)` dan `SAS (Akhir Semester)`.
- [ ] Lembar cetak saat periode `STS` dipilih menampilkan format ringkas sesuai sheet `Rapor Umum PTS` / `Rapor Diniyah PTS` tanpa tabel P5 dan Ekskul.
- [ ] Lembar cetak saat periode `SAS` dipilih menampilkan format lengkap sesuai sheet `Rapor Umum PAS` / `Rapor Diniyah PAS`.
- [ ] Tersedia tombol unduh PDF untuk santri terpilih.
- [ ] Tersedia tombol unduh arsip ZIP berisi PDF terpisah untuk seluruh santri di kelas tersebut.
- [ ] Tersedia tombol unduh/cetak 1 file PDF gabungan untuk seluruh santri di kelas dengan pemisah halaman otomatis.
- [ ] Bebas emoji dan bebas kebocoran kode spesifikasi teknis.
- [ ] Seluruh unit test lulus 100% tanpa regresi.

---

## 7. Analisis Risiko (Risk Analysis)

- **Risiko**: Ukuran berkas ZIP atau PDF gabungan kelas dapat memakan memori browser jika diproses secara paralel tanpa jeda.
  - **Mitigasi**: Proses pembuatan PDF per santri dilakukan secara sekuensial dengan indikator kemajuan (progress state) dan pemberitahuan Toast.
- **Risiko**: Perbedaan ukuran kertas pada print dialog.
  - **Mitigasi**: Gunakan CSS `@page { size: A4 portrait; margin: 10mm; }` dan `.page-break-after-always`.

---

## 8. Pertimbangan Kompatibilitas, Keamanan, & Migrasi

- **Kompatibilitas**: Semua proses dilakukan di sisi klien menggunakan API Canvas dan PDF standar.
- **Keamanan**: Berkas diunduh langsung di memori browser pengguna (`blob:` URL), tidak ada data santri yang dikirim ke server pihak ketiga.
- **Migrasi**: Tidak ada perubahan skema database.

---

## 9. Perintah Validasi Repositori (Validation Commands)

```bash
npm --prefix apps run test
npm --prefix apps run typecheck
```

---

## 10. Ekspektasi Dokumentasi (Documentation Expectations)

- Rencana didokumentasikan di `specs/feat-rapor-sts-sas-filter-and-batch-pdf-zip-download.md`.
- Komentar kode pada fungsi baru di `rapor-pdf.ts` dan antarmuka `rapor/page.tsx`.
