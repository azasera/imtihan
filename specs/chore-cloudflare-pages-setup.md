# Spesifikasi: Chore - Penyiapan Konfigurasi Deployment Cloudflare (Workers / Pages)

## 1. Deskripsi Masalah & Perilaku yang Diharapkan
- **Masalah**:
  Repositori aplikasi `next-convex-app` (Next.js 16 App Router) saat ini belum memiliki konfigurasi deployment untuk Cloudflare (Workers / Pages). Karena aplikasi memiliki server route handler (`/api/auth/[...all]/route.ts`) dan server-side auth Convex Better Auth, aplikasi tidak dapat menggunakan static export murni (`output: 'export'`), melainkan memerlukan runtime Cloudflare dengan adapter OpenNext (`@opennextjs/cloudflare`) dan runtime `nodejs_compat`.
- **Perilaku yang Diharapkan**:
  1. Terpasang konfigurasi adapter modern Cloudflare `@opennextjs/cloudflare` dan `wrangler`.
  2. Berkas konfigurasi `open-next.config.ts` dan `wrangler.jsonc` terdefinisi dengan konfigurasi `nodejs_compat` dan aset statis `.open-next/assets`.
  3. `next.config.ts` mendukung output standalone untuk kompatibilitas build OpenNext.
  4. Tersedia skrip build Cloudflare di `package.json` (`build:cloudflare` atau integrasi build).
  5. Seluruh tes unit yang sudah ada tetap lulus 100%.

## 2. In / Out of Scope
- **In-Scope**:
  - `apps/open-next.config.ts`: Konfigurasi OpenNext Cloudflare adapter.
  - `apps/wrangler.jsonc`: Konfigurasi nama aplikasi, compatibility flag `nodejs_compat`, binding aset, dan worker entry point.
  - `apps/next.config.ts`: Menambahkan `output: "standalone"`.
  - `apps/package.json`: Menambahkan skrip pembantu deployment Cloudflare dan dependensi yang diperlukan.
  - Dokumentasi petunjuk penyetelan Environment Variables di Cloudflare Dashboard.
- **Out-of-Scope**:
  - Mengubah fungsi backend Convex atau skema basis data.
  - Melakukan deploy langsung ke akun Cloudflare pengguna tanpa kredensial/token autentikasi pengguna.
  - Mengubah logika bisnis atau UI aplikasi.

## 3. Bukti & Berkas Terkait
- Panduan resmi Cloudflare Next.js 15/16 Adapter (OpenNext Cloudflare).
- Berkas terkait:
  - `apps/package.json`
  - `apps/next.config.ts`
  - `apps/open-next.config.ts`
  - `apps/wrangler.jsonc`

## 4. Kebutuhan Implementasi Terurut Dependensi
1. **Pembaruan `apps/next.config.ts`**:
   - Menambahkan opsi `output: "standalone"`.
2. **Penyusunan `apps/open-next.config.ts`**:
   - Menggunakan `defineCloudflareConfig` dari `@opennextjs/cloudflare`.
3. **Penyusunan `apps/wrangler.jsonc`**:
   - Mengatur nama worker `e-imtihan-at-tauhid`, `main: ".open-next/worker.js"`, `compatibility_flags: ["nodejs_compat"]`, dan binding `ASSETS` ke `.open-next/assets`.
4. **Instalasi Dependensi & Penambahan Skrip**:
   - Menambahkan dependensi `@opennextjs/cloudflare` dan `wrangler`.
   - Menambahkan skrip `"build:worker": "opennextjs-cloudflare"` dan `"deploy:cf": "npm run build:worker && wrangler deploy"`.
5. **Validasi**:
   - Menjalankan `npm run typecheck` dan `npm test` untuk menjamin tidak ada regresi kode.

## 5. Kriteria Penerimaan
- Berkas `open-next.config.ts` dan `wrangler.jsonc` ada dan terkonfigurasi valid.
- `next.config.ts` memiliki `output: "standalone"`.
- Seluruh 424 pengujian unit tetap lulus 100%.
- Panduan langkah pengisian Environment Variables di Cloudflare Pages/Workers tersedia lengkap untuk pengguna.

## 6. Penilaian E2E
- **Rekomendasi**: `Not needed` (Penambahan konfigurasi build dan deployment tooling non-UI).
