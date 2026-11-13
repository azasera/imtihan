# Spesifikasi E2E: Tampilan Nama dan Profil Guru di Pengaturan Akun

- **Target**: Halaman Pengaturan Akun (`/account`)
- **Sumber Kebutuhan**: Permintaan pengguna untuk menampilkan nama guru pada menu Pengaturan Akun ([`specs/feat-tampilkan-nama-guru-di-pengaturan-akun.md`](file:///d:/DATA/PROJEK/IMTIHAN/specs/feat-tampilkan-nama-guru-di-pengaturan-akun.md))
- **Klasifikasi E2E**: `Recommended`
- **Status**: `Pending`
- **Lingkungan**: Browser lokal (`http://localhost:3000`)
- **Prasyarat**: Pengajar telah login dengan sesi aktif (nama pengajar dan email terdaftar).

## Skenario Pengujian Peramban

### Skenario 1: Menavigasi ke Pengaturan Akun dari Sidebar
1. Buka browser pada aplikasi yang berjalan dan login sebagai pengajar.
2. Klik menu **Pengaturan Akun** pada bilah sisi navigasi kiri (sidebar).
3. **Hasil yang Diharapkan**:
   - Peramban mengarah ke rute `/account`.
   - Judul halaman menampilkan "Pengaturan Akun Pengajar".

### Skenario 2: Verifikasi Kartu Profil Pengajar
1. Pada halaman `/account`, periksa kartu identitas pengajar.
2. **Hasil yang Diharapkan**:
   - Menampilkan Avatar dengan inisial nama pengajar.
   - Menampilkan **Nama Lengkap Pengajar** yang jelas (`data-testid="teacher-name"`).
   - Menampilkan alamat email yang terdaftar.
   - Menampilkan lencana status peran "Pengajar / Asatidz" dan "Sesi Terverifikasi".
   - Menampilkan informasi kelembagaan "Pesantren Islamic Centre At-Tauhid".

### Skenario 3: Keluar dari Sesi (*Logout*)
1. Klik tombol **Keluar Sesi** pada kartu profil.
2. **Hasil yang Diharapkan**:
   - Tampil pemberitahuan toast "Berhasil keluar dari akun".
   - Pengguna dialihkan kembali ke halaman `/login`.

## Bukti Pengujian
*(Bagian ini akan diisi setelah eksekusi peramban via `/e2e-tester`)*
