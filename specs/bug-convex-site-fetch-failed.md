# Spesifikasi: Bug Fix - Resiliensi Server Auth SSR Terhadap Kegagalan Jaringan & DNS Convex Site (ENOTFOUND)

## 1. Deskripsi Masalah & Perilaku yang Diharapkan
- **Masalah**:
  Saat pengajar membuka halaman pengelolaan (seperti `/bank-soal`, `/sesi-ujian`, `/rekap-nilai`, `/monitoring-sesi`), server Next.js (SSR) mengeksekusi `getToken()` pada `apps/app/layout.tsx` dan `isAuthenticated()` pada `apps/app/(main)/layout.tsx`. Kedua fungsi tersebut memanggil server HTTP Actions Convex (`NEXT_PUBLIC_CONVEX_SITE_URL`).
  Jika koneksi internet pengajar terputus, DNS resolver jaringan gagal melakukan lookup terhadap domain Convex (misal `quirky-rat-737.convex.site`), atau deployment tidak dapat dijangkau, pemanggilan `fetch` Node.js melemparkan error:
  `TypeError: fetch failed (Caused by: Error: getaddrinfo ENOTFOUND quirky-rat-737.convex.site)`.
  Karena fungsi di `apps/lib/auth-server.ts` tidak membungkus pemanggilan dengan penanganan kesalahan (*error handling*), error tersebut merambat ke komponen server Next.js dan menyebabkan **HTTP 500 (Internal Server Error)** serta merusak tampilan peramban (*crash*).
- **Perilaku yang Diharapkan**:
  - `apps/lib/auth-server.ts` harus memiliki lapisan resiliensi (*graceful degradation*) dengan membungkus `getToken()` dan `isAuthenticated()` dalam blok `try...catch`.
  - Jika terjadi kegagalan jaringan, lookup DNS (`ENOTFOUND`), atau timeout ke server Convex:
    - Server mencatat log peringatan diagnostik yang jelas tanpa melempar *unhandled exception*.
    - `getToken()` mengembalikan nilai aman `undefined` (token kosong).
    - `isAuthenticated()` mengembalikan nilai aman `false` (*fail-secure*).
  - Halaman Next.js tidak mengalami *crash 500*, melainkan tetap me-render antarmuka dengan status belum terotentikasi (*guest fallback*) sehingga pengguna tetap dapat melihat halaman atau diarahkan ke login secara wajar.

## 2. In / Out of Scope
- **In-Scope**:
  - `apps/lib/auth-server.ts`: Membungkus ekspor `getToken` dan `isAuthenticated` dengan penanganan galat aman (*resilient try/catch*).
  - `apps/tests/auth-server-resilience.test.ts`: Unit test untuk memverifikasi bahwa kegagalan jaringan atau DNS tidak menyebabkan `auth-server` melemparkan exception ke pemanggil.
- **Out-of-Scope**:
  - Mengubah logika bisnis atau skema Convex backend.
  - Mengubah konfigurasi otentikasi client-side di `apps/lib/auth-client.ts`.

## 3. Bukti & Berkas Terkait
- **Bukti Error**:
  ```
  react-server-dom-turbopack-client.browser.development.js:3315 Uncaught TypeError: fetch failed
  Caused by: Error: getaddrinfo ENOTFOUND quirky-rat-737.convex.site
  Failed to load resource: the server responded with a status of 500 (Internal Server Error)
  ```
- **Berkas Terkait**:
  - `apps/lib/auth-server.ts`
  - `apps/app/(main)/layout.tsx`
  - `apps/app/layout.tsx`
  - `apps/tests/auth-server-resilience.test.ts`

## 4. Kebutuhan Perbaikan Terurut Dependensi
1. **Pembaruan Resiliensi `apps/lib/auth-server.ts`**:
   - Memanggil `convexBetterAuthNextJs` untuk mendapatkan instance dasar auth.
   - Mengekspor wrapper aman `getToken` yang menangkap exception dan mengembalikan `undefined`.
   - Mengekspor wrapper aman `isAuthenticated` yang menangkap exception dan mengembalikan `false`.
   - Tetap meneruskan `handler`, `preloadAuthQuery`, `fetchAuthQuery`, `fetchAuthMutation`, `fetchAuthAction`.
2. **Pembuatan Pengujian Unit (`apps/tests/auth-server-resilience.test.ts`)**:
   - Memastikan fungsi `getToken` dan `isAuthenticated` mengembalikan nilai fallback yang aman tanpa melempar unhandled error saat backend tidak dapat dijangkau.
3. **Validasi Repositori**:
   - Menjalankan `npm run typecheck`, `npm test`, dan `npm run test:ui-leak`.

## 5. Kriteria Penerimaan
- Pemanggilan `getToken()` dan `isAuthenticated()` saat server Convex offline/DNS gagal tidak lagi memicu HTTP 500.
- `isAuthenticated()` bersifat *fail-secure* (mengembalikan `false`).
- Seluruh unit test lulus 100% tanpa regresi.
- Bebas kebocoran kode spesifikasi teknis.

## 6. Penilaian E2E
- **Rekomendasi**: `Not needed` (Masalah ketahanan jaringan di tingkat server Next.js divalidasi penuh secara deterministik melalui pengujian unit).
