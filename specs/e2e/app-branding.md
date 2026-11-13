# E2E: App Branding & Logo Display

- Source: User request to update App name and logo to E-Imtihan At-Tauhid
- Recommendation: Recommended
- Status: Passed
- Environment: local Next.js development server
- Base URL: http://localhost:3000
- Last updated: 2026-11-05

## Prerequisites

- Start the application with `npm run dev` (or `npm --prefix apps run dev:web`).
- Access via standard browser.

## Scenarios

1. Public Header Branding
   - Actions: Navigate to `/` as an unauthenticated visitor.
   - Expected: Header displays the logo image (`/logo.png`) and "E-Imtihan At-Tauhid" text branding.
2. Document Title & Favicon
   - Actions: Inspect page `<title>` and `<link rel="icon">`.
   - Expected: Document title is "E-Imtihan At-Tauhid", favicon reflects the new logo.
3. Authenticated Sidebar Branding
   - Actions: Log in and view the sidebar header.
   - Expected: Sidebar header displays the logo image, "E-Imtihan At-Tauhid", and subtitle "Pesantren Islamic Centre At-Tauhid".
4. Main Page Content
   - Actions: View `/`.
   - Expected: Heading displays "E-Imtihan At-Tauhid".

## Evidence

### Eksekusi 2026-11-05

- Result: Passed (4/4)
- Tested at: 2026-11-05, browser sesi agent, viewport 474x570
- Tester: `/e2e-tester` (agent browser), tanpa Playwright/Cypress

1. Public Header Branding — Passed
   - Actions: buka `http://localhost:3000/` sebagai pengunjung anonim, ambil DOM header.
   - Actual: `<img src="/logo.png" alt="E-Imtihan At-Tauhid">` tampil bersama teks "E-Imtihan At-Tauhid" pada header publik.
2. Document Title & Favicon — Passed
   - Actions: baca `document.title` dan node `link[rel~="icon"]`.
   - Actual: `document.title` = "E-Imtihan At-Tauhid"; favicon = `/icon.png?icon...png` (ikon aplikasi baru, bukan favicon bawaan Next.js).
3. Authenticated Sidebar Branding — Passed
   - Actions: login `pengajar.uji@example.com`, buka sidebar via tombol "Toggle Sidebar".
   - Actual: header sidebar menampilkan `<img src="/logo.png">` dengan alt "E-Imtihan At-Tauhid" dan teks nama aplikasi. Item navigasi yang terbaca: Dashboard, Bank Soal, Sesi Ujian, Monitoring Sesi, Rekap Nilai, Data Santri, Ruang Ujian Santri; footer akun "Pengajar Uji / pengajar.uji@example.com".
4. Main Page Content — Passed
   - Actions: baca heading pada `/`.
   - Actual: `<h1>` berbunyi "E-Imtihan At-Tauhid".

- Failures or blockers: Tidak ada.
- Catatan media: sesi browser agent ini tidak menyediakan tangkapan layar native (`NATIVE_BROWSER_VIEWPORT_UNAVAILABLE`); bukti yang disimpan berupa observasi DOM (judul, src/alt logo, teks header dan heading) dari halaman yang dirender.
