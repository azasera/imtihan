# Spesifikasi: Chore - Penambahan Skrip Zip Build Artifacts (npm run zip)

## 1. Definisi Masalah & Perilaku yang Diharapkan
- **Masalah**:
  Saat pengguna selesai melakukan build (terlihat pada tangkapan layar setelah ringkasan rute Next.js static/dynamic) dan menjalankan perintah `npm run zip` di direktori proyek `D:\DATA\PROJEK\IMTIHAN`, terminal menampilkan pesan kesalahan:
  `npm error Missing script: "zip"`
  karena belum ada skrip `"zip"` yang terdaftar di `package.json` maupun `apps/package.json`.
- **Perilaku yang Diharapkan**:
  1. Perintah `npm run zip` dapat dijalankan dari direktori root maupun dari subdirektori `apps/`.
  2. Skrip secara otomatis mendeteksi artefak build (`apps/.open-next` atau `dist/`), menyinkronkan isi terbaru ke direktori `dist/`, dan mengompresinya menjadi berkas `dist.zip`.
  3. Skrip berjalan lintas platform (Windows, macOS, Linux) tanpa memerlukan dependensi npm eksternal baru (menggunakan utilitas bawaan sistem `tar` yang tersedia di Windows 10/11, macOS, dan Linux, dengan fallback PowerShell `Compress-Archive`).
  4. Memberikan feedback terminal yang jelas dan informatif yang menampilkan status keberhasilan, ukuran berkas `.zip`, dan lokasi berkas yang dihasilkan.
  5. Jika artefak build belum ada, skrip memberikan pesan petunjuk yang jelas untuk menjalankan `npm run build` atau `npm run build:worker` terlebih dahulu.

## 2. In / Out of Scope
- **In-Scope**:
  - `scripts/zip.mjs`: Skrip Node.js mandiri untuk sinkronisasi artefak build ke `dist/` dan kompresi menjadi `dist.zip`.
  - `package.json` (root): Menambahkan skrip `"zip": "node scripts/zip.mjs"`.
  - `apps/package.json`: Menambahkan skrip `"zip": "node ../scripts/zip.mjs"`.
  - `apps/tests/zip-script.test.ts`: Pengujian unit untuk memvalidasi keberadaan konfigurasi skrip dan eksekusi pembuatan zip.
- **Out-of-Scope**:
  - Mengubah logika aplikasi Next.js atau Convex backend.
  - Mengubah konfigurasi build Cloudflare/OpenNext yang sudah ada.

## 3. Bukti & Berkas Terkait
- Tangkapan layar terminal pengguna: `npm error Missing script: "zip"` di `D:\DATA\PROJEK\IMTIHAN`.
- Berkas terkait:
  - [`package.json`](file:///d:/DATA/PROJEK/IMTIHAN/package.json)
  - [`apps/package.json`](file:///d:/DATA/PROJEK/IMTIHAN/apps/package.json)
  - [`scripts/zip.mjs`](file:///d:/DATA/PROJEK/IMTIHAN/scripts/zip.mjs)
  - `apps/.open-next/`
  - `dist/`
  - `dist.zip`

## 4. Kebutuhan Implementasi Terurut Dependensi
1. **Penyusunan `scripts/zip.mjs`**:
   - Memeriksa ketersediaan direktori sumber: prioritas `apps/.open-next`, kemudian `dist`.
   - Jika sumber `apps/.open-next` ada, salin/sinkronkan isinya ke `dist/` agar folder `dist/` selalu mencerminkan build terbaru.
   - Mengompresi isi `dist/` menjadi `dist.zip` di root repository.
   - Menggunakan `tar -acf dist.zip -C dist .` atau fallback PowerShell `Compress-Archive`.
   - Mencetak ukuran berkas `dist.zip` dalam satuan MB/KB dan durasi waktu kompresi.
2. **Pembaruan `package.json`**:
   - Menambahkan `"zip": "node scripts/zip.mjs"` pada bagian scripts di root `package.json`.
3. **Pembaruan `apps/package.json`**:
   - Menambahkan `"zip": "node ../scripts/zip.mjs"` pada bagian scripts di `apps/package.json`.
4. **Pembuatan Pengujian Unit (`apps/tests/zip-script.test.ts`)**:
   - Memvalidasi bahwa skrip `zip` terdaftar di kedua `package.json`.
   - Memvalidasi bahwa `scripts/zip.mjs` dapat dijalankan dan menghasilkan berkas zip yang valid.
5. **Validasi & Verifikasi Integritas**:
   - Menjalankan `npm run zip` dan memverifikasi integritas berkas `dist.zip`.

## 5. Kriteria Penerimaan yang Terukur
- Perintah `npm run zip` berjalan sukses dari root `D:\DATA\PROJEK\IMTIHAN` dengan kode keluar `0`.
- Perintah `npm run zip` juga berjalan sukses dari direktori `apps/`.
- Berkas `dist.zip` berhasil terbuat dengan ukuran > 0 byte dan dapat diekstrak tanpa galat.
- Pesan kesalahan yang informatif muncul jika direktori build belum ada.
- Semua pengujian unit yang ada tetap lulus 100%.

## 6. Pertimbangan Risiko, Kompatibilitas, Keamanan, & Migrasi
- **Risiko**: Ukuran berkas build cukup besar (~20 MB). Proses zip perlu dijalankan secara efisien agar tidak memakan waktu lama.
- **Kompatibilitas**: Menggunakan `tar` bawaan sistem operasi (didukung native di Windows 10/11 build 17063+ dan seluruh distribusi Unix/Linux/macOS) dengan fallback PowerShell sehingga tidak menambah ketergantungan paket baru.
- **Keamanan**: Menghindari eksekusi arbitrary command injection dengan menggunakan argumen statis dan validasi path file.
- **Migrasi**: Tidak ada migrasi basis data atau breaking change terhadap konfigurasi proyek yang ada.

## 7. Perintah Validasi
- `npm run zip`: Menguji pembuatan berkas `dist.zip` dari root.
- `npm --prefix apps run zip`: Menguji eksekusi dari direktori `apps`.
- `node --test apps/tests/zip-script.test.ts`: Menjalankan pengujian unit spesifik untuk skrip zip.
- `npm test`: Memastikan seluruh pengujian aplikasi tetap lulus.

## 8. Ekspektasi Dokumentasi & Penilaian E2E
- Dokumentasi pemakaian perintah `npm run zip` disertakan pada ringkasan penyelesaian.
- **Penilaian E2E**: `Not needed` (Perubahan utilitas tooling build/CLI, tidak memengaruhi komponen interaktif peramban).
