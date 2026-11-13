# Spesifikasi: Tampilan Nama dan Profil Pengajar di Menu Pengaturan Akun

## 1. Definisi Masalah & Perilaku yang Diharapkan
- **Masalah**:
  Halaman Pengaturan Akun (`apps/app/(main)/account/page.tsx`) saat ini masih berupa halaman dasar (*starter boilerplate*) dengan teks statis bahasa Inggris ("Protected account", "Your e-IMTIHAN account"). Halaman ini belum menampilkan identitas guru/pengajar yang sedang login, seperti nama lengkap pengajar, alamat email, maupun status verifikasi sesi akun.
- **Perilaku yang Diharapkan**:
  1. Halaman Pengaturan Akun (`/account`) menampilkan kartu profil guru/pengajar yang rapi, profesional, dan informatif.
  2. Menampilkan **Nama Lengkap Guru/Pengajar** secara dinamis yang bersumber dari sesi login aktif pengguna (`authClient.useSession()`).
  3. Menampilkan avatar dengan inisial nama pengajar atau foto profil.
  4. Menampilkan alamat email pengajar dan lencana (*badge*) status akun (misalnya "Akun Pengajar / Asatidz" dan "Sesi Terverifikasi").
  5. Menampilkan informasi kelembagaan ("Pesantren Islamic Centre At-Tauhid") dan ringkasan hak akses asesmen.
  6. Menggunakan komponen resmi *shadcn/ui* (`Card`, `Badge`, `Avatar`, `Separator`), ikon Lucide (tanpa emoji), dan konsisten dengan tema desain aplikasi.

## 2. In / Out of Scope
- **In-Scope**:
  - `apps/app/(main)/account/page.tsx`: Transformasi halaman dari boilerplate statis menjadi halaman profil pengajar interaktif.
  - Membaca data pengguna aktif dari `authClient.useSession()`.
  - Penambahan unit test baru di `apps/tests/account-profile.test.ts` untuk memverifikasi penampilan nama guru, komponen UI, dan nihil kebocoran teknis.
- **Out-of-Scope**:
  - Mengubah skema database Convex atau tabel internal Better Auth.
  - Mengubah konfigurasi otentikasi sosial/kredensial pada server.

## 3. Bukti & Berkas Terkait
- Permintaan pengguna: "tampilkan nama guru" pada konteks menu Pengaturan Akun.
- Berkas terkait:
  - `apps/app/(main)/account/page.tsx`
  - `apps/lib/auth-client.ts`
  - `apps/components/app-sidebar.tsx`
  - `apps/components/nav-user.tsx`

## 4. Kebutuhan Implementasi Terurut Dependensi
1. **Langkah 1**: Buat pengujian unit di `apps/tests/account-profile.test.ts` untuk memvalidasi bahwa halaman akun memuat komponen nama guru, email, avatar inisial, dan lencana peran pengajar.
2. **Langkah 2**: Perbarui `apps/app/(main)/account/page.tsx`:
   - Tetap pertahankan perlindungan server via `isAuthenticated()`.
   - Gunakan komponen klien untuk membaca data sesi dari `authClient.useSession()`.
   - Render kartu profil pengajar dengan tata letak:
     - Avatar besar dengan inisial nama pengajar.
     - Nama guru / nama akun dengan tipografi heading yang jelas.
     - Email pengajar dan lencana "Pengajar / Asatidz".
     - Bagian ringkasan informasi akun (Lembaga, Hak Akses Penyusunan Soal, Pelaksanaan Ujian, Keamanan Sesi).
3. **Langkah 3**: Jalankan seluruh validasi pengujian:
   - `npm test --prefix apps`
   - `npm run typecheck --prefix apps`
   - `npm --prefix apps run test:ui-leak`

## 5. Kriteria Penerimaan yang Terukur
1. Halaman `/account` menampilkan nama guru/pengajar secara dinamis dari sesi yang sedang login.
2. Menampilkan fallback yang ramah jika nama belum diisi (misalnya bagian lokal dari email atau "Ustadz / Pengajar").
3. Tampilan antarmuka berbahasa Indonesia yang sopan, rapi, dan sesuai dengan identitas Pesantren Islamic Centre At-Tauhid.
4. Nihil penggunaan emoji pada desain antarmuka (hanya ikon Lucide).
5. Nihil kebocoran kode spesifikasi teknis (`SCR-*`, `TASK-*`, dll.).
6. Semua pengujian unit lolos 100% dan TypeScript check bersih tanpa error.

## 6. Pertimbangan Risiko, Kompatibilitas, & Keamanan
- Risiko sangat rendah: Tidak memodifikasi alur otentikasi login/logout yang sudah ada.
- Keamanan: Data profil dibaca dari sesi terenkripsi pengguna yang valid dan tetap dijaga oleh server-side redirect `isAuthenticated()`.

## 7. Perintah Validasi Repositori
- `npm test --prefix apps`
- `npm run typecheck --prefix apps`
- `npm --prefix apps run test:ui-leak`

## 8. Ekspektasi Dokumentasi
- Mencatat pembaruan antarmuka pengaturan akun dan memastikan keterlacakan terhadap kebutuhan pengguna.
