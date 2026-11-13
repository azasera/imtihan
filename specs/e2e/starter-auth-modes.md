# E2E: Starter authentication modes

- Source: starter template authentication configuration
- Recommendation: Recommended
- Status: Blocked (mode email/password dan proteksi akses lulus; mode Google diblokir konfigurasi)
- Environment: local Next.js app with a personal Convex development deployment (`quirky-rat-737`)
- Browser: host agent browser capability; do not use Playwright or Cypress

## Prerequisites

- Complete `npm run setup` and confirm `npx convex dev --once` succeeds.
- Use a dedicated test email address and a non-production Google OAuth client.
- Start the application with `npm run dev` and use `http://localhost:3000`.
- Run each mode with matching public flags and Convex deployment flags, then
  restart the local app between modes.

## Scenarios

1. Google plus email/password
   - Set both authentication methods to enabled.
   - Open `/login` and `/signup`.
   - Confirm the Google action and email/password form are both visible.
   - Create an email/password account, sign out, then sign in again.
   - Sign in with Google and confirm the protected account page loads.
2. Email/password only
   - Disable Google and enable email/password on both frontend and backend.
   - Confirm no Google action is rendered on `/login` or `/signup`.
   - Create an account, sign out, sign in, and reach the protected account page.
3. Google only
   - Enable Google and disable email/password on both frontend and backend.
   - Confirm the email/password form is absent on `/login` and `/signup`.
   - Sign in with Google and reach the protected account page.
4. Access protection
   - While signed out, open `/account` and confirm the app redirects to login.
   - While signed in, open `/login` and `/signup` and confirm the app redirects
     away from authentication pages.
5. Browser health
   - During every scenario, confirm there are no unexpected browser-console or
     backend errors.

## Evidence

### Eksekusi 2026-11-05

- Result: Blocked (2 lulus, 1 diblokir, 1 diblokir karena mode Google, 1 lulus)
- Tested at: 2026-11-05, browser sesi agent, viewport 474x570
- Konfigurasi aktif (`apps/.env.local`): `NEXT_PUBLIC_GOOGLE_AUTH_ENABLED=false`, `NEXT_PUBLIC_EMAIL_PASSWORD_AUTH_ENABLED=true`, `E2E_EMAIL_PASSWORD_AUTH_ENABLED=false`, deployment Convex `quirky-rat-737`.
- Tester: `/e2e-tester` (agent browser), tanpa Playwright/Cypress.

1. Google plus email/password — Blocked
   - Actions: diperiksa konfigurasi frontend dan halaman `/login`/`/signup` pada mode aktif.
   - Actual: tombol Google tidak dirender karena `NEXT_PUBLIC_GOOGLE_AUTH_ENABLED=false` dan tidak ada Google OAuth client non-produksi pada environment ini. Mengubah env dan me-restart server dev bersama berada di luar wewenang sesi pengujian, jadi alur masuk Google tidak dapat dijalankan.
2. Email/password only — Passed
   - Actions: buka `/login` dan `/signup` tanpa sesi; amati aksi yang tersedia; buat akun `e2e.starter.1105@example.com` (nama "Pengajar Starter E2E", password `UjiDev2026`); setelah akun dibuat aplikasi langsung membuka `/account`; sign-out; masuk kembali dengan akun yang sama.
   - Actual: hanya formulir email/password yang tampil, tidak ada aksi Google di kedua halaman; pendaftaran berhasil dan mengarah ke `/account`; setelah keluar, login ulang berhasil dan kembali ke `/account`.
3. Google only — Blocked
   - Alasan: sama dengan skenario 1 (Google dinonaktifkan dan tidak ada OAuth client). Mode "Google saja" tidak dapat diuji tanpa mengubah env dan me-restart server.
4. Access protection — Passed
   - Actions: tanpa sesi buka `/account`; lalu (dalam keadaan login) buka `/login` dan `/signup`.
   - Actual: `/account` saat anonim dialihkan ke `/login`; `/login` saat login dialihkan ke `/`; `/signup` saat login dialihkan ke `/account`.
5. Browser health — Passed
   - Actual: tidak ada error React/Convex tak tertangani pada skenario yang dijalankan; tidak ada panggilan jaringan yang gagal pada alur email/password.

- Failures or blockers: Mode Google (skenario 1 dan 3) diblokir oleh konfigurasi environment, bukan oleh cacat produk. Untuk menuntaskannya: sediakan Google OAuth client non-produksi, set `NEXT_PUBLIC_GOOGLE_AUTH_ENABLED=true` beserta flag Convex terkait, restart server dev, lalu ulangi skenario 1 dan 3.
- Catatan media: sesi browser agent ini tidak menyediakan tangkapan layar native (`NATIVE_BROWSER_VIEWPORT_UNAVAILABLE`); bukti berupa observasi DOM/URL dan respons `/api/auth/get-session`.
- Data uji: akun `e2e.starter.1105@example.com` sengaja dipertahankan karena belum ada jalur hapus akun di UI; ini satu-satunya sisa data dari spek ini.
