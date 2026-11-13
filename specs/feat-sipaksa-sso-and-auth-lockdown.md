# Spesifikasi: Integrasi Single Sign-On (SSO) SiPAKSa & Penutupan Registrasi Terbuka

## 1. Definisi Masalah & Perilaku yang Diharapkan

### Masalah Saat Ini
1. **Registrasi Akun Guru Bebas Terbuka (`/signup`):**
   - Halaman `/signup` dan tautan *"Start Creating"* di navigasi publik mengizinkan siapa saja di internet untuk mendaftarkan akun pengajar baru.
   - Belum ada restriksi domain email, whitelist staf resmi pesantren, atau sistem persetujuan admin.
2. **Friksi Otentikasi Ganda untuk Pengajar:**
   - Pengajar Pesantren At-Tauhid sudah terbiasa masuk dan aktif di sistem pusat **SiPAKSa iCentre**.
   - Mengharuskan guru mendaftar dan mengingat kredensial baru di E-Imtihan menimbulkan redundansi akun, potensi lupa password, dan inkonsistensi nama/email pengajar pada bank soal.

### Perilaku yang Diharapkan (Desired Behavior)
1. **Penerusan Sesi SiPAKSa (Seamless Single Sign-On):**
   - Pengajar yang sudah login di SiPAKSa iCentre dapat langsung membuka E-Imtihan melalui menu navigasi/tombol pintasan di SiPAKSa.
   - SiPAKSa meneruskan tiket otentikasi aman (*handoff token* Firebase ID token / signed SSO ticket) ke gerbang E-Imtihan (`/sso?handoffToken=...`).
   - E-Imtihan memverifikasi integritas token tersebut ke API SiPAKSa / Firebase verification, mencocokkan identitas pengajar, dan secara otomatis menerbitkan sesi Better Auth tanpa meminta guru mengetik password kembali.
   - Jika akun pengajar tersebut baru pertama kali masuk ke E-Imtihan, sistem melakukan *auto-provisioning* profil pengajar (nama dan email resmi sesuai data SiPAKSa).
2. **Penutupan Registrasi Mandiri Publik (`/signup` Lockdown):**
   - Rute `/signup` tidak lagi menyediakan form pendaftaran terbuka.
   - Pengunjung anonim yang membuka `/signup` diarahkan kembali ke halaman login atau ditampilkan instruksi resmi bahwa akses pengajar terpusat melalui portal SiPAKSa.
   - Tombol *"Start Creating"* pada navigasi atas (`SiteHeader`) diubah menjadi *"Masuk via SiPAKSa"* atau diarahkan ke login resmi pengajar.
3. **Ketersediaan Jalur Masuk Cadangan:**
   - Halaman `/login` tetap menyediakan opsi login manual bagi akun administrator darurat, didampingi tombol utama *"Masuk Cepat via SiPAKSa"*.

---

## 2. Ruang Lingkup (Scope)

### In-Scope:
- **E-Imtihan Frontend (`apps/app/`):**
  - Pembuatan rute penerima handoff SSO di `apps/app/sso/page.tsx` (atau endpoint `/api/auth/sso`).
  - Penutupan formulir registrasi mandiri di `apps/app/signup/page.tsx` dengan banner instruksi pengalihan.
  - Penyesuaian `apps/components/site-header.tsx` (mengganti tombol "Start Creating").
  - Penyesuaian `apps/app/login/page.tsx` untuk menampilkan opsi penyeberangan dari SiPAKSa.
- **E-Imtihan Backend (`apps/convex/`):**
  - Pembuatan modul verifikasi SSO di `apps/convex/sso/public/actions.ts` atau API route pendukung.
  - Helper auto-provisioning dan sinkronisasi sesi pengajar dari payload identitas SiPAKSa.
- **SiPAKSa iCentre (`d:/DATA/PROJEK/SiPAKSa iCentre/`):**
  - Mendaftarkan target `e-imtihan` pada `src/utils/externalHandoff.ts`.
  - Menambahkan tautan/tombol pintasan "E-Imtihan (CBT)" di menu navigasi guru/admin SiPAKSa.
- **Pengujian & Validasi:**
  - Unit test alur verifikasi token SSO dan isolasi registrasi terbuka (`apps/tests/sipaksa-sso.test.ts`).
  - Spek E2E alur handoff dan gerbang login (`specs/e2e/sipaksa-sso.md`).

### Out-of-Scope:
- Mengubah alur masuk peserta santri di `/ujian` (santri tetap masuk menggunakan Nomor Induk / NISN dan Token Sesi 6-digit).
- Mengubah skema data utama ujian (`questionBanks`, `questions`, `examSessions`).

---

## 3. Bukti & Analisis Kode Eksisting (Evidence)

1. **Pola Handoff yang Sudah Terbukti di SiPAKSa:**
   - Berkas `d:\DATA\PROJEK\SiPAKSa iCentre\src\utils\externalHandoff.ts` telah memiliki fungsi `openExternalLink()` dan `buildHandoffUrl()` yang sudah dipakai secara sukses untuk aplikasi saudara `E-Koreksi` dan `Mootaba'ah`.
   - Format parameter yang dikirimkan oleh SiPAKSa:
     ```ts
     targetUrl.searchParams.set('handoffToken', idToken);
     targetUrl.searchParams.set('handoffSource', 'sipaksa');
     targetUrl.searchParams.set('handoffUid', user.uid);
     targetUrl.searchParams.set('handoffEmail', user.email || '');
     targetUrl.searchParams.set('handoffName', user.displayName || user.email || 'User');
     ```
2. **Koneksi SiPAKSa Worker yang Sudah Ada:**
   - E-Imtihan sudah memiliki koneksi terverifikasi ke Cloudflare Worker SiPAKSa pada `apps/convex/students/public/actions.ts` (`https://sipaksa.azaseradigital.workers.dev`).
3. **Sistem Autentikasi E-Imtihan:**
   - E-Imtihan menggunakan `@convex-dev/better-auth` yang terdaftar pada `apps/convex/auth.ts` dan `apps/lib/auth-server.ts`.

---

## 4. Berkas-Berkas yang Terlibat (Relevant Files)

- `specs/feat-sipaksa-sso-and-auth-lockdown.md` (Spesifikasi ini)
- `apps/app/signup/page.tsx` (Penutupan form pendaftaran terbuka)
- `apps/app/login/page.tsx` (Penyempurnaan tombol SSO SiPAKSa)
- `apps/components/site-header.tsx` (Pembaruan tombol navigasi guest)
- `apps/app/sso/page.tsx` (Halaman penerima dan pemroses handoff)
- `apps/convex/sso/public/actions.ts` (Aksi validasi token identitas SiPAKSa)
- `apps/convex/sso/private/mutations.ts` (Internal mutation untuk memastikan user terdaftar)
- `apps/tests/sipaksa-sso.test.ts` (Unit test suite)
- `specs/e2e/sipaksa-sso.md` (Spesifikasi E2E handoff)
- `d:/DATA/PROJEK/SiPAKSa iCentre/src/utils/externalHandoff.ts` (Target E-Imtihan)

---

## 5. Kebutuhan Implementasi Berurutan (Dependency-Ordered)

1. **Fase 1: Logika Verifikasi Token & Sesi di E-Imtihan (Backend)**
   - Buat endpoint atau aksi verifikasi token handoff SiPAKSa.
   - Validasi klaim token (issuer Firebase / SiPAKSa, expiration timestamp, audience).
   - Buat helper mutasi internal untuk *upsert* data pengajar ke akun lokal E-Imtihan dan sinkronisasi session token.

2. **Fase 2: Antarmuka Penerima Handoff (`/sso`)**
   - Buat halaman `apps/app/sso/page.tsx` dengan indikator loading bersih (*"Memverifikasi sesi SiPAKSa..."*).
   - Ekstrak parameter URL (`handoffToken`, `handoffEmail`, dll).
   - Panggil mutasi/aksi login, set cookie sesi, dan redirect pengguna ke `/bank-soal`.
   - Tampilkan pesan kesalahan informatif jika token tidak sah atau kadaluarsa.

3. **Fase 3: Penguncian Pendaftaran Mandiri (`/signup`) & Navigasi Publik**
   - Hapus formulir pendaftaran bebas pada `apps/app/signup/page.tsx`.
   - Ganti isi halaman `/signup` dengan pemberitahuan edukatif: *"Pendaftaran mandiri ditutup. Silakan masuk melalui akun SiPAKSa Anda."* dengan tombol kembali ke SiPAKSa / Login.
   - Ubah label tombol di `apps/components/site-header.tsx` dari *"Start Creating"* menjadi *"Masuk via SiPAKSa"* (atau tautkan langsung ke gerbang masuk terpadu).

4. **Fase 4: Penambahan Target di SiPAKSa iCentre**
   - Daftarkan pola domain E-Imtihan (`e-imtihan.online`) ke `HANDOFF_TARGETS` di `d:\DATA\PROJEK\SiPAKSa iCentre\src\utils\externalHandoff.ts`.
   - Tambahkan tombol menu navigasi "E-Imtihan (CBT)" di antarmuka SiPAKSa agar guru dapat berpindah dengan 1 klik.

5. **Fase 5: Validasi & Pengujian**
   - Buat dan jalankan unit test otomatis untuk memeriksa penolakan pendaftaran sembarangan dan validitas token handoff.
   - Jalankan `npm run typecheck` dan `npm run test` di `apps/`.
   - Jalankan `npx convex dev --once` untuk memastikan backend Convex sinkron.

---

## 6. Kriteria Keberhasilan Terukur (Measurable Acceptance Criteria)

1. **Akses Pendaftaran Mandiri Tertutup 100%:**
   - Tidak ada pengunjung yang bisa membuat akun baru di `/signup` tanpa melalui SiPAKSa.
2. **Seamless Handoff Berfungsi:**
   - Ketika guru mengklik tautan E-Imtihan dari SiPAKSa, browser membuka E-Imtihan dan langsung berada dalam kondisi login aktif di halaman utama/bank soal tanpa form isian password.
3. **Integritas Identitas Terjaga:**
   - Nama pengajar pada Bank Soal dan Sesi Ujian otomatis mengambil nama resmi dari akun SiPAKSa.
4. **Keamanan Token Terjamin:**
   - Token palsu, token tanpa klaim valid, atau token kadaluarsa ditolak dengan status error aman dan tidak membuka sesi.
5. **Kepatuhan Kualitas Kode:**
   - Seluruh tes lulus (100% pass), tidak ada error TypeScript, dan tidak ada kebocoran kode spesifikasi teknis di teks UI.

---

## 7. Risiko, Kompatibilitas, & Mitigasi

- **Risiko: Token kedaluwarsa saat koneksi lambat.**
  - *Mitigasi:* Berikan batas waktu toleransi yang wajar (1-5 menit) dan jika kedaluwarsa, sediakan tombol *"Buka kembali dari SiPAKSa"*.
- **Risiko: Popup Blocker pada Browser.**
  - *Mitigasi:* Sesuai implementasi `openExternalLink()` yang sudah ada di SiPAKSa, tab dibuka secara sinkron saat klik pengguna berlangsung (`window.open('about:blank')`), lalu di-redirect.
- **Risiko: Guru tanpa email di SiPAKSa.**
  - *Mitigasi:* Buat fallback identifier berbasis UID SiPAKSa unik (`sipaksa_{uid}@imtihan.internal`) agar data tetap tersimpan rapi.

---

## 8. Perintah Validasi Repositori

```bash
# Validasi unit tests
npm --prefix apps run test

# Validasi typecheck Next.js & Convex
npm --prefix apps run typecheck

# Validasi sinkronisasi fungsi backend Convex
npx --prefix apps convex dev --once
```
