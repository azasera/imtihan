# E2E Specification: SiPAKSa SSO Handoff & Registration Lockdown

## Skenario 1: Penutupan Pendaftaran Mandiri Publik
- **Aksi:**
  1. Pengguna membuka peramban tanpa sesi login (`anonymous`).
  2. Buka halaman utama `/`. Amati navigasi atas (`SiteHeader`).
  3. Konfirmasi tombol "Start Creating" sudah tidak ada dan digantikan dengan tombol "Masuk".
  4. Buka halaman `/signup`.
- **Hasil yang Diharapkan:**
  - Halaman `/signup` tidak menampilkan formulir input email dan password pendaftaran mandiri.
  - Kartu menampilkan judul "Pendaftaran Mandiri Ditutup" dan penjelasan bahwa sistem terintegrasi dengan SiPAKSa iCentre.
  - Terdapat tautan ke portal SiPAKSa iCentre dan tautan ke `/login` bagi akun admin.

## Skenario 2: Halaman Login Menampilkan Opsi SiPAKSa
- **Aksi:**
  1. Buka halaman `/login` dalam keadaan anonim.
- **Hasil yang Diharapkan:**
  - Tampil banner edukasi "Masuk Cepat via SiPAKSa" di bagian atas kartu formulir login.
  - Formulir login email/password tetap tersedia di bawahnya untuk administrator darurat.
  - Tautan di bagian bawah tidak lagi mengajak "Create an account", melainkan "Informasi Pendaftaran".

## Skenario 3: Penanganan Tiket SSO SiPAKSa
- **Aksi:**
  1. Buka halaman `/sso` tanpa parameter query (`/sso`).
  2. Amati tampilan kartu status.
  3. Buka halaman `/sso?handoffToken=invalid.mock.jwt&handoffUid=uid123&handoffEmail=guru@example.com`.
- **Hasil yang Diharapkan:**
  - Pada langkah 1: Sistem mendeteksi parameter tidak lengkap dan menampilkan pesan error instruktif dengan tombol "Coba Lagi" dan "Login Manual".
  - Pada langkah 3: Sistem memproses tiket, memvalidasi dengan backend `/api/auth/sipaksa`, menolak tiket yang tidak sah, dan menampilkan pesan penolakan yang aman tanpa crash aplikasi.
