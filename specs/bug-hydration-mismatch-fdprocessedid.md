# Spesifikasi: Bug Fix - Hydration Mismatch Akibat Browser Extension fdprocessedid

## 1. Deskripsi Masalah & Perilaku yang Diharapkan
- **Masalah**: Ketika santri mengakses halaman gerbang ujian (`/ujian`) menggunakan peramban (seperti Chrome, Edge, Brave) yang memiliki ekstensi autofill atau pengelola kata sandi aktif, ekstensi peramban menginjeksi atribut `fdprocessedid` ke elemen `<input>` dan `<button>` sesaat sebelum React 19 menyelesaikan proses hidrasi. Hal ini menyebabkan React mendeteksi ketidakcocokan atribut (*attribute hydration mismatch*) dan memunculkan *Console Error*:
  `A tree hydrated but some attributes of the server rendered HTML didn't match the client properties... - fdprocessedid="..."`.
- **Perilaku yang Diharapkan**:
  - Seluruh elemen kontrol formulir (`Input`, `SelectTrigger`, `Button`) dan formulir gerbang ujian santri harus memiliki perlindungan terhadap modifikasi atribut peramban luar dengan menyertakan `suppressHydrationWarning` dan `autoComplete="off"`.
  - Proses hidrasi React berjalan mulus tanpa error konsol sekalipun peramban atau ekstensi menginjeksi atribut autofill.

## 2. In / Out of Scope
- **In-Scope**:
  - `apps/components/ui/input.tsx`: Menambahkan `suppressHydrationWarning` secara default pada komponen `Input`.
  - `apps/components/ui/select.tsx`: Menambahkan `suppressHydrationWarning` pada `SelectTrigger`.
  - `apps/components/ui/button.tsx`: Menambahkan `suppressHydrationWarning` pada `Button`.
  - `apps/app/ujian/page.tsx`: Menambahkan `suppressHydrationWarning` dan `autoComplete="off"` pada `<form>` dan elemen input/select.
  - `apps/tests/hydration-safety.test.ts`: Unit test untuk memastikan komponen input, select trigger, button, dan form `/ujian` memiliki proteksi `suppressHydrationWarning`.
- **Out-of-Scope**:
  - Mengubah logika bisnis atau backend Convex.

## 3. Bukti & Berkas Terkait
- Console Error: `A tree hydrated but some attributes of the server rendered HTML didn't match the client properties ... - fdprocessedid="..."`.
- Berkas terkait:
  - `apps/components/ui/input.tsx`
  - `apps/components/ui/select.tsx`
  - `apps/components/ui/button.tsx`
  - `apps/app/ujian/page.tsx`
  - `apps/tests/hydration-safety.test.ts`

## 4. Kebutuhan Perbaikan Terurut Dependensi
1. **Pembaruan Komponen UI Inti (`Input`, `SelectTrigger`, `Button`)**:
   - Menambahkan `suppressHydrationWarning` pada komponen `Input` di `apps/components/ui/input.tsx`.
   - Menambahkan `suppressHydrationWarning` pada `SelectTrigger` di `apps/components/ui/select.tsx`.
   - Menambahkan `suppressHydrationWarning` pada `Button` di `apps/components/ui/button.tsx`.
2. **Pembaruan Halaman Pintu Ujian (`apps/app/ujian/page.tsx`)**:
   - Menambahkan `suppressHydrationWarning` dan `autoComplete="off"` pada elemen `<form>`.
   - Menambahkan `autoComplete="off"` dan `data-lpignore="true"` pada input nomor induk, token, dan nama.
3. **Pengujian & Validasi**:
   - Menulis unit test di `apps/tests/hydration-safety.test.ts`.
   - Menjalankan `npm test`, `npm run test:ui-leak`, dan `npm run typecheck`.

## 5. Kriteria Penerimaan
- Seluruh elemen input, tombol, dan trigger di `/ujian` terlindungi dari *attribute mismatch* akibat ekstensi autofill.
- TypeScript kompilasi 0 error (`npm run typecheck`).
- Seluruh unit tests lulus (`npm test`).
- Nol kebocoran kode spesifikasi teknis.

## 6. Penilaian E2E
- **Rekomendasi**: `Not needed` (Perbaikan atribut hidrasi React tercakup penuh pada level komponen dan pengujian unit DOM).
