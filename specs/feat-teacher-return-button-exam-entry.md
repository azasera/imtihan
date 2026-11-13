# Spesifikasi: Tombol Kembali ke Dashboard untuk Pengajar pada Ruang Ujian Santri

## 1. Definisi Masalah & Perilaku yang Diharapkan
- **Masalah**:
  Saat pengajar mengklik menu *"Ruang Ujian Santri"* (`/ujian`) dari sidebar dashboard untuk keperluan uji coba atau demonstrasi:
  1. Halaman `/ujian` didesain bersih dan bebas distraksi tanpa sidebar pengajar.
  2. Namun, saat ini belum ada tombol navigasi fisik yang memungkinkan pengajar kembali ke dashboard aplikasi secara cepat tanpa harus bergantung pada tombol *Back* peramban atau mengetik ulang URL.
  3. Santri biasa yang mengerjakan ujian tidak boleh melihat navigasi kembali ke area dashboard pengajar agar fokus dan integritas ujian tetap terjaga.

- **Perilaku yang Diharapkan**:
  1. Pada halaman gerbang masuk ujian (`apps/app/ujian/page.tsx`), tambahkan bilah pintas navigasi di bagian atas formulir:
     - Tombol: `← Kembali ke Dashboard Pengajar` yang mengarah ke rute `/`.
     - Lencana penanda: `Mode Simulasi Pengajar`.
  2. **Kondisional & Aman**:
     - Bilah navigasi ini **hanya dirender jika sesi login pengajar aktif** (`authSession?.user`).
     - Untuk santri yang mengakses tanpa akun pengajar, bilah ini **sama sekali tidak dirender**, sehingga santri tetap berada di lingkungan ujian tertutup.

## 2. In / Out of Scope
- **In-Scope**:
  - `apps/app/ujian/page.tsx`: Pemeriksaan sesi pengajar melalui `authClient.useSession()` dan penambahan tombol kembali yang kondisional.
  - Penambahan pengujian unit di `apps/tests/` untuk memverifikasi proteksi kondisional tombol ini.
- **Out-of-Scope**:
  - Mengubah logika pengerjaan di `ExamWorksheet.tsx`.
  - Mengubah rute atau backend Convex.

## 3. Bukti & Berkas Terkait
- Kebutuhan kemudahan navigasi pengajar saat berpindah antara dashboard dan ruang simulasi santri.
- Berkas terkait:
  - `apps/app/ujian/page.tsx`
  - `apps/lib/auth-client.ts`
  - `apps/tests/student-preview-key-leak.test.ts` atau uji antarmuka ujian.

## 4. Kebutuhan Implementasi Terurut Dependensi
1. **Langkah 1**: Perbarui `apps/app/ujian/page.tsx`:
   - Impor `ArrowLeftIcon` dari `lucide-react`.
   - Impor `authClient` dari `@/lib/auth-client` dan baca `authSession`.
   - Tambahkan bilah kembali di atas formulir masuk yang hanya tampil saat `authSession?.user` bernilai benar.
2. **Langkah 2**: Tambahkan pengujian unit untuk memverifikasi bahwa tombol kembali hanya aktif saat pengajar terautentikasi dan tidak membocorkan kode teknis.
3. **Langkah 3**: Jalankan seluruh validasi pengujian:
   - `npm test --prefix apps`
   - `npm run typecheck --prefix apps`
   - `npm --prefix apps run test:ui-leak`

## 5. Kriteria Penerimaan yang Terukur
1. Tombol `← Kembali ke Dashboard Pengajar` tampil rapi di atas formulir `/ujian` saat pengajar sedang login.
2. Saat diklik, tombol membawa pengajar kembali ke halaman dashboard utama (`/`).
3. Tombol tersembunyi secara total jika pengguna tidak memiliki login pengajar.
4. Seluruh pengujian unit lolos 100%.
5. TypeScript check `tsc --noEmit` bersih tanpa galat.
6. Nihil kebocoran kode spesifikasi teknis dan nihil emoji.

## 6. Pertimbangan Risiko & Keamanan
- Tidak ada risiko kebocoran akses karena pemeriksaan dilakukan menggunakan kredensial session yang sah dari `authClient`. Santri tanpa kredensial tidak dapat mengklik atau melihat tombol ini.

## 7. Perintah Validasi Repositori
- `npm test --prefix apps`
- `npm run typecheck --prefix apps`
- `npm --prefix apps run test:ui-leak`
