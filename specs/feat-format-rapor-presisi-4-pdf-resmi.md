# Spesifikasi Fitur: Penyelarasan Format Rapor Presisi 4 Varian PDF Resmi At-Tauhid

## Ringkasan Fitur
Menyelaraskan lembar cetak rapor digital dan fisik pada modul E-Rapor agar 100% presisi dan identik secara visual dengan 4 berkas rujukan PDF resmi Pesantren Islamic Centre At-Tauhid:
1. `rapor/Rapor KURMER PTS.pdf` (1 Halaman A4)
2. `rapor/Rapor KURMER PAS.pdf` (2 Halaman A4 terpisah proporsional)
3. `rapor/Rapor DINIYAH SMP PTS.pdf` (1 Halaman A4)
4. `rapor/Rapor DINIYAH SMP PAS.pdf` (1 Halaman A4)

Serta memperbaiki proses rendering kanvas PDF via `html2canvas-pro` dengan palet warna standar hex murni (`#000000`, `#E0E0E0`, `#ffffff`) untuk mengeliminasi sepenuhnya galat peramban *"Attempting to parse an unsupported color function 'lab'"*.

## Rincian Desain 4 Format Rapor

### 1. Rapor KURMER PTS (1 Halaman)
- **Judul**:
  - `PENCAPAIAN KOMPETENSI MURID`
  - `SUMATIF TENGAH SEMESTER`
- **Identitas Santri (2 Kolom)**:
  - Kiri: Nama Murid, NISN, Nama Sekolah, Alamat
  - Kanan: Kelas, Fase (D untuk SMPITA), Semester, Tahun Ajaran
- **Tabel Nilai 10 Mapel Umum**:
  - Kolom: `No` | `Mata Pelajaran` | `Nilai Akhir` | `Capaian Kompetensi`
  - Header: `#E0E0E0` dengan border solid 1px hitam
  - Tanpa kolom KKM dan Predikat
- **Blok Tanda Tangan (3 Pihak)**:
  - Kiri: Mengetahui, Orang Tua/Wali
  - Kanan: Tanggal (Pangkalpinang, ...), Guru Kelas, Nama & NIY
  - Tengah Bawah: Mengetahui, Kepala Sekolah, Nama & NIY

### 2. Rapor KURMER PAS (2 Halaman)
- **Halaman 1**:
  - Judul: `PENCAPAIAN KOMPETENSI MURID / SUMATIF AKHIR SEMESTER`
  - Identitas 2 Kolom lengkap
  - Tabel 10 Mapel Umum (`No`, `Mata Pelajaran`, `Nilai Akhir`, `Capaian Kompetensi`)
  - Kotak Berbingkai `Kokurikuler` dengan bar header `#E0E0E0` dan narasi perkembangan religius & adab santri.
- **Pemisah Halaman**:
  - Sumbu potong halaman standar cetak A4 (`page-break-after: always`).
- **Halaman 2**:
  - Header identitas santri ringkas di bagian atas.
  - Tabel `Ekstrakurikuler` (8 baris kegiatan: Agrobisnis, TIK, Jurnalis, Bulu Tangkis, Tenis Meja, Futsal, Panahan, Bola Voli) beserta predikat & keterangan.
  - Baris Berdampingan (2 Kolom):
    - Kiri: Tabel `Ketidakhadiran` (Sakit, Izin, Tanpa Keterangan).
    - Kanan: Kotak `Catatan Wali Kelas` berlatar bar `#E0E0E0` dengan narasi motivasi.
  - Kotak `Tanggapan Orang Tua/Wali Murid` dengan baris titik-titik.
  - Kotak `Keputusan : Naik ke kelas ...` (pada semester 2 / akhir tahun).
  - Blok Tanda Tangan 3 Pihak.

### 3. Rapor DINIYAH PTS (1 Halaman)
- **Judul**:
  - `LAPORAN HASIL SUMATIF TENGAH SEMESTER`
  - `MATA PELAJARAN DINIYAH`
- **Identitas Santri (2 Kolom Ringkas)**:
  - Kiri: Nama Murid, NISN, Nama Sekolah
  - Kanan: Kelas, Semester, Tahun Ajaran
- **Bagian A. Ketercapaian Hasil Belajar**:
  - Tabel 6 mapel Diniyah: Aqidah, Adab & Akhlak, Fiqih, Bahasa Arab, Nahwu, Shiroh.
  - Kolom: `No` | `Mata Pelajaran` | `Nilai Akhir` | `Capaian Kompetensi`
- **Bagian B. Catatan Hafalan Hadits**:
  - Tabel: `No` | `Mata Pelajaran` | `Capaian Hafalan Murid` | `Target Hafalan Tengah Semester 1` | `KETERANGAN`
  - Baris Hadits Arba'in dengan keterangan tuntas.
- **Blok Tanda Tangan 3 Pihak**.

### 4. Rapor DINIYAH PAS (1 Halaman)
- **Judul**:
  - `LAPORAN HASIL SUMATIF AKHIR SEMESTER`
  - `MATA PELAJARAN DINIYAH`
- **Identitas Santri (2 Kolom Ringkas)**: Identik dengan PTS.
- **Bagian A. Ketercapaian Hasil Belajar**: 6 mapel diniyah.
- **Bagian B. Catatan Hafalan Hadits**: Header `Target Hafalan Semester 1` (atau 2).
- **Blok Tanda Tangan 3 Pihak**.

## Perbaikan Teknis & Ekspor PDF
- Menggunakan `html2canvas-pro` yang mendukung CSS color modern.
- Menetapkan styling langsung menggunakan nilai hex CSS murni di elemen rapor (`#ffffff`, `#000000`, `#E0E0E0`, `#333333`) untuk mengisolasi proses canvas dari stylesheet Tailwind v4 yang memakai `oklch` / `lab`.
- Generator `renderElementToPdf` di `apps/lib/rapor-pdf.ts` memproses container `.report-sheet-page` satu per satu sehingga dokumen 2 halaman (Kurmer PAS) terbagi bersih ke 2 halaman jsPDF tanpa pemotongan teks (*zero slicing artifacts*).
- Menambahkan sakelar opsional `showKop` pada antarmuka cetak agar pengajar dapat memilih antara tampilan murni seperti template PDF resmi (tanpa KOP surat) atau menyertakan KOP dinamis SiPAKSa sesuai preferensi sekolah.

## Kriteria Penerimaan
1. Seluruh 4 berkas rujukan PDF dapat diproduksi secara identik melalui preview dan ekspor PDF.
2. Pengunduhan PDF single santri, ZIP satu kelas (file terpisah), dan 1 PDF kelas gabungan selesai tanpa galat `lab`.
3. 504 pengujian unit lolos 100%.
4. `tsc --noEmit` bersih tanpa galat.
5. 0 kebocoran kode spesifikasi teknis pada UI.
