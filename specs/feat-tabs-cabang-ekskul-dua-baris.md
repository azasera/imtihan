# Spesifikasi Fitur: Tata Letak Tabs 2 Baris Cabang Ekstrakurikuler

## 1. Definisi Masalah & Perilaku yang Diharapkan
- **Masalah Saat Ini**:
  - Daftar cabang ekskul saat ini berada di panel samping kiri (*left sidebar*) dengan bilah gulir vertikal (*vertical scroll*). Tampilan ini memakan ruang horizontal tabel santri di sebelah kanan sehingga tabel santri terasa sempit dan nama pembina terpotong.
  - Pengguna merasa tampilan daftar cabang ekskul kurang rapi dan kurang nyaman dilihat, serta harus menggulir ke atas-bawah untuk memilih ekskul.
- **Perilaku yang Diharapkan**:
  - Memindahkan daftar cabang ekstrakurikuler ke bagian atas sebagai deretan **Tabs/Pills 2 baris** yang rapi dan terorganisir.
  - Menyesuaikan pembagian baris dengan jumlah cabang ekskul (contoh: 16 cabang dibagi 2 baris menjadi 8 kolom per baris di layar besar, atau grid proporsional) **tanpa scroll horizontal maupun vertikal**.
  - Seluruh cabang ekskul terlihat seketika (*visible at a glance*).
  - Area utama di bawah tabs kini menjadi **lebar penuh (*full width*)**, memberikan ruang yang sangat luas, lega, dan nyaman bagi tabel santri, input predikat, dan narasi rapor.

## 2. Ruang Lingkup (Scope)
- **In-Scope**:
  - Restrukturisasi antarmuka `apps/app/(main)/ekstrakurikuler/page.tsx`:
    - Mengganti layout `grid-cols-1 md:grid-cols-3 xl:grid-cols-4` (sidebar kiri + detail kanan) menjadi layout vertikal penuh:
      1. Header halaman & tombol inisialisasi/sinkronisasi.
      2. Bilah Tabs 2 Baris Cabang Ekskul di bagian atas.
      3. Kartu Detail Kelompok & Tabel Santri Lebar Penuh di bagian bawah.
    - Tabs 2 baris:
      - Menampilkan nama cabang ekskul, jumlah santri (`XX Santri`), dan penanda ekskul wajib/pilihan.
      - Status aktif: Berwarna tegas (emerald/primary) dengan kontras tinggi.
      - Status tidak aktif: Latar belakang kartu bersih dengan efek hover lembut.
      - Grid 2 baris proporsional: Di desktop menggunakan `grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-2` (sehingga 16 ekskul pas menjadi 2 baris rapi) tanpa overflow scroll.
  - Penyesuaian unit test pada `apps/tests/extracurricular-module.test.ts`.
- **Out-of-Scope**:
  - Mengubah logika mutasi dan kueri backend Convex.

## 3. Berkas Terkait
- `apps/app/(main)/ekstrakurikuler/page.tsx` — Halaman utama manajemen ekstrakurikuler.
- `apps/tests/extracurricular-module.test.ts` — Pengujian modul ekstrakurikuler.

## 4. Kriteria Keberterimaan (Acceptance Criteria)
1. Seluruh cabang ekskul tampil di bagian atas dalam 2 baris rapi di desktop tanpa bilah gulir horizontal maupun vertikal.
2. Setiap tab menampilkan nama ekskul dan jumlah peserta santri aktif.
3. Tab yang aktif memiliki penanda visual tegas dan jelas.
4. Tabel santri dan pengaturan pembina berada di bawah tabs dengan ruang penuh (*full width*).
5. Tidak ada kebocoran kode spesifikasi teknis dan tidak ada emoji.
6. Seluruh test suite (592 tests) lolos tanpa regresi.
