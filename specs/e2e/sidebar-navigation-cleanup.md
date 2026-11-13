# E2E Specification: Pembersihan & Perapihan Navigasi Sidebar Pengajar

## Target
Pengujian antarmuka peramban untuk memastikan seluruh menu pada bilah samping (sidebar) pengajar terpasang dengan benar, fungsional, dan bersih dari elemen duplikat atau tautan mati.

## Sumber
- Permintaan pengguna: "mulai dari rencana 1" (Pembersihan & Perapihan Sidebar).
- Spesifikasi chore: `specs/chore-sidebar-cleanup.md`.
- Rekomendasi E2E: `Recommended` (Status: `Pending`).

## Lingkungan & Prasyarat
- Server Next.js lokal berjalan pada `http://localhost:3000`.
- Akun pengajar aktif telah masuk (*logged in*).

## Skenario Pengujian

### Skenario 1: Tautan Menu Mata Pelajaran di Navigasi Utama
1. Buka halaman beranda pengajar `http://localhost:3000/`.
2. Amati elemen navigasi utama pada sidebar.
3. **Hasil yang Diharapkan**:
   - Menu "Mata Pelajaran" tampil tepat setelah "Bank Soal".
   - Mengklik "Mata Pelajaran" membawa peramban ke rute `/mata-pelajaran`.
   - Judul halaman dan daftar mata pelajaran tampil dengan benar.

### Skenario 2: Ketiadaan Grup Duplikat "Documents"
1. Amati seluruh bagian sidebar dari atas ke bawah.
2. **Hasil yang Diharapkan**:
   - Tidak ada lagi label atau grup "Documents" yang memuat item duplikat ("Bank Soal", "Rekap Nilai", "Jadwal Ujian").
   - Tidak ada lagi dropdown tombol titik tiga (`... More`) yang tidak berfungsi.

### Skenario 3: Ketiadaan Tautan Mati / Placeholder Hash (`#`)
1. Periksa atribut tautan pada seluruh tombol dan item di sidebar.
2. **Hasil yang Diharapkan**:
   - Logo brand mengarahkan ke Dashboard (`/`).
   - Tidak ada elemen menu dengan atribut `href="#"`.
   - Bagian navigasi sekunder bawah hanya menampilkan tautan nyata "Pengaturan Akun" yang mengarah ke `/account`.

### Skenario 4: Dropdown Profil Pengguna (NavUser)
1. Klik pada kartu profil pengajar di sudut kiri bawah sidebar.
2. Periksa item menu yang muncul di dalam dropdown.
3. **Hasil yang Diharapkan**:
   - Menu menampilkan nama dan email akun pengajar.
   - Menu memuat opsi "Akun Saya" yang terhubung ke `/account`.
   - Menu memuat opsi "Keluar" (*Sign out*).
   - Opsi dummy template ("Billing", "Notifications") tidak lagi ditampilkan.

## Bukti Eksekusi
*(Akan dilengkapi pada eksekusi terpisah lewat `/e2e-tester`)*
- Status: `Pending`
