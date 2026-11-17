# Spesifikasi Perbaikan: Penanganan Galat Minified React Error #418 (Hydration Mismatch)

## 1. Definisi Masalah & Analisis Akar Penyebab (Root Cause)
- **Gejala / Error**:
  ```
  16hyesa5rpg0e.js:1 Uncaught Error: Minified React error #418; visit https://react.dev/errors/418?args[]=HTML&args[]=
  ```
- **Akar Masalah (Root Cause)**:
  1. **Atribut `suppressHydrationWarning` pada Root Layout**:
     Error #418 dengan parameter `args[]=HTML` di React 19 menunjukkan ketidaksesuaian hidrasi (*hydration mismatch*) antara DOM yang di-render di server dengan DOM yang di-mount pada klien.
     Di `apps/app/layout.tsx`, atribut `suppressHydrationWarning` hanya dipasang pada tag `<html>`, sedangkan React `suppressHydrationWarning` hanya bekerja 1 level ke bawah (*one level deep*).
     Ketika aplikasi berjalan di balik Cloudflare Worker (yang menginjeksi skrip analitik / proteksi email / rocket loader ke `<head>` dan `<body>`) atau ketika pengguna menggunakan ekstensi peramban (Dark Reader, Grammarly, password manager, penerjemah halaman), atribut dinamis disuntikkan ke `<body>` atau elemen head. Ketiadaan `suppressHydrationWarning` pada `<head>` dan `<body>` menyebabkan React 19 memicu Error #418 saat proses rekonsiliasi hidrasi.
  2. **Elemen `<button>` murni tanpa guard di `rapor/page.tsx`**:
     Dua tombol aksi langsung (`button`) di tabel `rapor/page.tsx` belum dilengkapi `suppressHydrationWarning`, rentan terintervensi oleh ekstensi browser yang menyuntikkan atribut pelacak/event listener.
  3. **Penutupan Tag `<div>` di `ReportCardPrintView.tsx`**:
     Terdapat 9 penggunaan tag `<div style={{ height: "46px" }} />` (self-closing div) pada blok tanda tangan, yang dalam format HTML standar non-void dapat memicu ambiguasi parser DOM peramban tertentu.

## 2. Tindakan Perbaikan
1. Menambahkan `suppressHydrationWarning` pada tag `<head>` dan `<body>` di `apps/app/layout.tsx`.
2. Menambahkan `suppressHydrationWarning` pada tombol aksi tabel di `apps/app/(main)/rapor/page.tsx`.
3. Mengubah tag self-closing `<div style={{ height: "46px" }} />` menjadi pasangan tag eksplisit `<div style={{ height: "46px" }}></div>` di `apps/components/rapor/ReportCardPrintView.tsx`.
4. Menambahkan tes otomatis pada `apps/tests/hydration-safety.test.ts` untuk memverifikasi proteksi hidrasi pada `layout.tsx`.

## 3. Hasil Validasi
- `node --test apps/tests/hydration-safety.test.ts`: 8/8 passed (100%).
- `npm --prefix apps run typecheck`: 0 error.
- `npm --prefix apps test`: 534/534 passed (100%).
