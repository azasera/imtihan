# E-Imtihan At-Tauhid

Platform evaluasi dan Computer-Based Assessment untuk madrasah dan pondok pesantren. Pengajar menyusun bank soal dan menjadwalkan sesi ujian berwaktu dengan token, santri mengerjakan ujian cukup dengan nomor induk dan token tanpa perlu akun email, lalu nilai direkap dan jawaban essay dikoreksi dari satu tempat.

## Teknologi

| Lapisan | Yang dipakai |
| --- | --- |
| Frontend | Next.js 16.3.5 (App Router), React 19.2.4, TypeScript, Tailwind CSS v4, komponen shadcn/ui |
| Backend | Convex 1.45 — database, fungsi server, penjadwal, realtime |
| Autentikasi | Convex Auth + `@convex-dev/better-auth` (Google dan/atau email-password) |
| Tooling | ESLint 9, Prettier, `node --test`, npm workspaces tanpa monorepo tool |
| Prasyarat | Node `>=20.9.0`, npm `>=10`, akun Convex (gratis untuk development) |

## Struktur direktori

```
apps/                 aplikasi yang benar-benar dijalankan
  app/                route Next.js: (main), ujian, login, signup, dashboard, api
  components/         komponen aplikasi + shadcn/ui dan AI Elements
  convex/             backend Convex: bank, examSession, students, model, schema.ts, auth.config.ts
  tests/              68 test node --test
  .env.sample         nama variabel yang dibutuhkan
  .env.local          nilai lokal Anda (tidak ikut ke repo)
specs/e2e/            spesifikasi perjalanan browser untuk /e2e-tester
.planora/             PRD, panduan UI, dokumen eksekusi dan kesiapan rilis
scripts/setup.mjs     panduan setup interaktif
package.json          pembungkus perintah: npm --prefix apps run <perintah>
```

Catatan: direktori kerja ini juga berisi checkout proyek lain (TCExam, AGPL-3.0) yang
sengaja tidak dimasukkan ke repo Git ini. Jika Anda melihat berkas seperti `admin/`,
`public/`, `composer.json`, atau `README.tcexam.md`, itu bukan bagian E-Imtihan.

## Setup pertama kali

Jalankan dari akar proyek.

```bash
npm run setup
```

Setup akan memasang dependensi dengan `npm ci`, membuat `apps/.env.local` dari
`apps/.env.sample`, menanyakan metode login yang diaktifkan (Google + email/password,
Google saja, atau email/password saja), meminta Anda login serta memilih project Convex,
lalu menulis konfigurasi deployment ke `apps/.env.local`.

Setup manual bila lebih suka mengontrol tiap langkah:

```bash
npm run setup:deps
cp apps/.env.sample apps/.env.local
npm run convex:init
```

Perintah terakhir menjalankan `convex dev --once` di dalam `apps/`, membuka login Convex,
dan menuliskan `CONVEX_DEPLOYMENT`, `NEXT_PUBLIC_CONVEX_URL`, serta
`NEXT_PUBLIC_CONVEX_SITE_URL`. Setelah itu kirim rahasia server ke deployment:

```bash
cd apps
npx convex env set BETTER_AUTH_SECRET
```

Login Google bersifat opsional. Kalau diaktifkan, buat Web OAuth client dan daftarkan URL
callback yang dibentuk dari `basePath` di `apps/convex/auth.ts`, yaitu
`<SITE_URL>/api/auth/callback/google`. Simpan `GOOGLE_CLIENT_ID` dan `GOOGLE_CLIENT_SECRET`
lewat `npx convex env set`, pastikan `SITE_URL` dan `GOOGLE_AUTH_ENABLED=true` juga terpasang
di deployment, lalu aktifkan `NEXT_PUBLIC_GOOGLE_AUTH_ENABLED=true` di `apps/.env.local`.

## Menjalankan aplikasi

```bash
npm run dev
```

Perintah ini menjalankan `convex dev` dan `next dev` sekaligus. Buka
`http://localhost:3000`; jika browser Anda tidak menampilkan halaman, gunakan
`http://127.0.0.1:3000`.

| Perintah | Kegunaan |
| --- | --- |
| `npm run dev` | backend Convex + web Next.js bersamaan |
| `npm run dev:web` | hanya Next.js |
| `npm run dev:convex` | hanya Convex (function sync + dashboard) |
| `npm run build` | build produksi |
| `npm start` | jalankan hasil build |

Setelah mengubah berkas apa pun di `apps/convex/`, sinkronkan dan pastikan outputnya
berakhir dengan `Convex functions ready!`:

```bash
cd apps && npx convex dev --once
```

## Variabel lingkungan

Sisi klien (`apps/.env.local`, dikelola CLI Convex setelah `npm run convex:init`):

| Nama | Isi |
| --- | --- |
| `CONVEX_DEPLOYMENT` | project dan deployment yang dipakai |
| `NEXT_PUBLIC_CONVEX_URL` | URL fungsi Convex |
| `NEXT_PUBLIC_CONVEX_SITE_URL` | URL HTTP Actions |
| `NEXT_PUBLIC_SITE_URL` | asal aplikasi, tanpa garis miring di akhir |
| `NEXT_PUBLIC_GOOGLE_AUTH_ENABLED` | tampilkan login Google |
| `NEXT_PUBLIC_EMAIL_PASSWORD_AUTH_ENABLED` | tampilkan login email-password |

Sisi server (set lewat `npx convex env set`, jangan ditaruh di `.env.local`):
`BETTER_AUTH_SECRET`, `SITE_URL`, `GOOGLE_AUTH_ENABLED`, `GOOGLE_CLIENT_ID`,
`GOOGLE_CLIENT_SECRET`, `EMAIL_PASSWORD_AUTH_ENABLED`.

## Verifikasi perubahan

```bash
npm run lint         # ESLint; target saat ini 0 error
npm run typecheck    # tsc --noEmit
npm test             # node --test apps/tests
npm run build        # build produksi seluruh route
npm run check        # lint + typecheck + test + audit, lalu build
```

`npm test` sebagian besar memeriksa pola pada berkas sumber, jadi hasil hijau belum
membuktikan perilaku di browser. Untuk alur kritis (gerbang ujian santri, timer,
pengumpulan jawaban) jalankan spesifikasi di `specs/e2e/` melalui `/e2e-tester` pada
Chrome nyata. Status validasi terakhir dicatat di `.planora/EXECUTION/release-readiness.md`.

## Alur penggunaan singkat

1. Pengajar masuk lewat `/login`, menyiapkan paket soal di `/bank-soal`.
2. Jadwal sesi ujian di `/sesi-ujian`: pilih paket soal, tentukan waktu mulai dan batas
   akhir, durasi, pengacakan soal dan opsi; sistem menerbitkan token 6 karakter.
3. Data santri diambil dari SiPAKSa lewat halaman `/santri`, bukan diketik manual.
4. Santri membuka `/ujian`, memasukkan nomor induk dan token, mengerjakan dengan hitung
   mundur, dan jawaban tersimpan otomatis saat diketuk.
5. Pengajar mengoreksi essay dan melihat rekap di `/rekap-nilai`.

## Otorisasi

Fungsi Convex yang menghadap frontend memverifikasi identitas pemanggil lewat
`apps/convex/model/auth.ts`. Pengecualian yang sengaja anonim adalah gerbang ujian santri:
memasuki sesi, membaca kartu soal, menyimpan jawaban, mencatat pelanggaran tab, mengumpulkan
lembar, memverifikasi token, mencari nama santri, daftar kelas, dan daftar mata pelajaran —
karena santri tidak punya akun. Daftar
itu dikunci di `apps/tests/convex-public-authz.test.ts`: fungsi publik baru yang tidak
menyertakan pemeriksaan identitas akan menggagalkan test.

## Pengembangan lebih lanjut

- `AGENTS.md` memuat aturan kerja agen dan alur pengujian yang berlaku di repo ini.
- Skill Convex dan workflow Planora tersedia di `.agents/skills` serta `.claude/skills`.
- Perencanaan produk ada di `.planora/PRD`, panduan tampilan di `.planora/UI`, dan
  daftar pengerjaan di `.planora/EXECUTION/TODO.md`.
