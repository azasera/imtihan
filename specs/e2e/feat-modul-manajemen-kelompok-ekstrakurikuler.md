# Handoff E2E: Modul Terpusat Manajemen Kelompok & Anggota Ekstrakurikuler

## Target & Kebutuhan Sumber
- **Fitur Sumber**: `specs/feat-modul-manajemen-kelompok-ekstrakurikuler.md`
- **Tujuan Pengujian**: Memvalidasi alur penjelajahan peramban (browser) untuk modul terpusat kelompok ekstrakurikuler di `/ekstrakurikuler`: navigasi dari sidebar, pemilihan kelompok ekskul, pencarian santri, penambahan peserta, mutasi pindah kelompok ekskul, dan perubahan predikat (A/B/C) yang reaktif tersinkronkan ke E-Rapor.
- **Rekomendasi E2E**: `Recommended`
- **Status Validasi**: `Pending`

---

## Lingkungan & Prasyarat
- **Aplikasi**: Web App E-Imtihan Next.js (`http://localhost:3000`)
- **Peran Pengguna**: Pengajar / Pembina Ekskul / Wali Kelas terautentikasi
- **Data Prasyarat**:
  - Terdapat data santri aktif di kelas VII, VIII, IX.
  - Kelompok ekstrakurikuler default (Rohis, Futsal, Badminton, Pingpong, Panahan, Agrobisnis, dll.) sudah diinisialisasi.

---

## Skenario Pengujian Browser

### Skenario 1: Navigasi Sidebar & Tampilan Daftar Kelompok Ekskul
1. Buka halaman utama aplikasi (`/`).
2. Klik menu **"Ekstrakurikuler"** di bilah sisi (Sidebar).
3. **Hasil yang Diharapkan**:
   - URL berpindah ke `/ekstrakurikuler`.
   - Muncul judul halaman *"Kelompok & Pembina Ekstrakurikuler"*.
   - Pada panel kiri, tampil daftar kelompok ekskul (Rohis bertanda "Wajib", Futsal/Badminton/dll. bertanda "Pilihan") lengkap dengan jumlah santri.
   - Panel kanan menampilkan kartu detail ekskul yang dipilih pertama kali beserta tabel data santri.

### Skenario 2: Tambah Peserta Baru ke Kelompok Ekskul
1. Pilih kelompok ekskul pilihan, misalnya **"Panahan"**.
2. Klik tombol **"Tambah Peserta"**.
3. Pada modal dialog pencarian santri:
   - Ketikkan nama santri yang belum terdaftar di ekskul tersebut.
   - Pilih predikat awal (misal: "A").
   - Klik tombol **"Daftarkan ke Ekskul"**.
4. **Hasil yang Diharapkan**:
   - Muncul notifikasi toast sukses dari Sonner *"Santri berhasil ditambahkan ke kelompok ekskul"*.
   - Santri tersebut langsung muncul pada tabel anggota Panahan di panel kanan.
   - Badge jumlah santri pada kartu Panahan di panel kiri bertambah 1.

### Skenario 3: Mutasi Pindah Kelompok Ekskul (Keluar & Masuk Ekskul Baru)
1. Pada tabel anggota ekskul pilihan (misal: **Futsal**), cari santri yang ingin dipindahkan.
2. Klik tombol **Pindah Ekskul** (ikon panah bolak-balik biru) pada kolom Aksi.
3. Pada modal dialog *"Pindah Kelompok Ekstrakurikuler"*:
   - Periksa informasi ekskul asal santri.
   - Pada dropdown kelompok tujuan, pilih cabang ekskul lain (misal: **"Agrobisnis"**).
   - Klik tombol **"Proses Pindah Ekskul"**.
4. **Hasil yang Diharapkan**:
   - Muncul notifikasi toast sukses *"Santri [Nama] berhasil dipindahkan ke ekskul tujuan"*.
   - Santri tersebut hilang dari daftar aktif kelompok asal (Futsal).
   - Buka kelompok **"Agrobisnis"** di panel kiri: santri tersebut kini terdaftar aktif sebagai anggota Agrobisnis.

### Skenario 4: Penilaian Predikat Langsung & Sinkronisasi Otomatis
1. Pada baris salah satu santri, ubah dropdown **Predikat** dari "A" menjadi "B" atau "C".
2. **Hasil yang Diharapkan**:
   - Kolom deskripsi narasi capaian rapor langsung diperbarui secara otomatis sesuai kamus capaian resmi.
   - Muncul toast konfirmasi *"Predikat diperbarui"*.
   - Buka menu **E-Rapor** (`/rapor`) untuk kelas santri tersebut pada Tab 2 (Asesmen Wali Kelas): data ekskul santri tersebut telah sinkron dengan predikat dan deskripsi yang baru tanpa perlu input ulang oleh wali kelas.

---

## Bukti Validasi (Evidence)

### Percobaan Eksekusi: 19 November 2026 (15:04 WIB)
- **Status Eksekusi**: `Blocked`
- **Kendala Lingkungan**:
  1. Server lokal Next.js (`npm run dev`) belum aktif di port 3000.
  2. Deployment backend Convex (`tough-fennec-614`) memerlukan otentikasi interaktif terminal (`npx convex login`) atau penyetelan kredensial deployment lokal di `.env.local` agar server Next.js dapat merender data reaktif Convex secara langsung.
- **Skenario Terdokumentasi**:
  - Skenario 1 (Navigasi Sidebar): Terblokir menunggu server aktif.
  - Skenario 2 (Tambah Peserta): Terblokir menunggu server aktif.
  - Skenario 3 (Mutasi Pindah Ekskul): Terblokir menunggu server aktif.
  - Skenario 4 (Penilaian Langsung & Rapor): Terblokir menunggu server aktif.
- **Tindakan Lanjutan**:
  - Jalankan `npm run dev` di terminal lokal setelah kredensial Convex dihubungkan, lalu jalankan kembali `/e2e-tester` untuk observasi visual langsung.
  - Logika bisnis, skema, kueri/mutasi, dan tata letak UI telah terverifikasi lulus 100% pada 16 pengujian unit di [apps/tests/extracurricular-module.test.ts](file:///d:/DATA/PROJEK/IMTIHAN/apps/tests/extracurricular-module.test.ts).
