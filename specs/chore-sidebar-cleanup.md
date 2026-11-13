# Spesifikasi: Chore - Pembersihan & Perapihan Menu Navigasi Sidebar Pengajar

## 1. Deskripsi Masalah & Perilaku yang Diharapkan
- **Masalah**:
  Sidebar pada [`apps/components/app-sidebar.tsx`](file:///d:/DATA/PROJEK/IMTIHAN/apps/components/app-sidebar.tsx) masih memuat artefak starter template bawaan:
  1. Bagian grup `Documents` menduplikasi menu navigasi utama ("Bank Soal", "Rekap Nilai", "Jadwal Ujian") dan memiliki dropdown titik tiga statis (`... More`, `Share`, `Delete`) yang tidak berfungsi.
  2. Bagian navigasi sekunder bawah memuat tautan mati (`Settings`, `Get Help`, `Search` dengan `url: "#"`).
  3. Dropdown profil pengguna (`NavUser`) memuat item dummy yang tidak relevan untuk aplikasi ujian madrasah (`Billing`, `Notifications`).
  4. Menu untuk fitur "Mata Pelajaran" (`/mata-pelajaran`) belum ada di navigasi utama sidebar, sehingga pengajar harus membuka halaman Bank Soal terlebih dahulu untuk mengelolanya.
- **Perilaku yang Diharapkan**:
  1. Seluruh item di sidebar memiliki rute aktif dan 100% fungsional (tidak ada lagi tautan mati `#`).
  2. `navMain` memuat menu **Mata Pelajaran** (`/mata-pelajaran`) berdampingan dengan **Bank Soal**.
  3. Grup `Documents` duplikasi dihapus dari sidebar sehingga tampilan bersih dan fokus.
  4. Navigasi sekunder menyediakan tautan fungsional ke **Pengaturan Akun** (`/account`) dan menghapus placeholder dummy.
  5. Dropdown profil pengguna (`NavUser`) menautkan langsung ke `/account` dan menghapus item dummy `Billing`/`Notifications`.
  6. Navigasi menggunakan komponen `Link` dari `next/link` untuk transisi halaman yang cepat tanpa muat ulang peramban.

## 2. In / Out of Scope
- **In-Scope**:
  - `apps/components/app-sidebar.tsx`: Menambahkan rute `/mata-pelajaran`, menghapus grup `Documents` dan data template tak terpakai (`documents`, `navClouds`), mengarahkan navigasi sekunder ke `/account`.
  - `apps/components/nav-secondary.tsx`: Menggunakan `Link` dari `next/link` untuk navigasi client-side.
  - `apps/components/nav-user.tsx`: Menautkan item Akun ke `/account` dan menghapus dummy `Billing`/`Notifications`.
  - `apps/tests/sidebar-navigation.test.ts`: Pengujian unit untuk memvalidasi kelengkapan menu navigasi, ketiadaan tautan mati `#`, dan ketiadaan grup `Documents` duplikat.
- **Out-of-Scope**:
  - Mengubah skema atau fungsi backend Convex.
  - Mengubah struktur halaman di luar sidebar.

## 3. Bukti & Berkas Terkait
- Tangkapan layar dari pengguna yang memperlihatkan duplikasi grup "Documents" dan link mati `#` di sidebar.
- Berkas terkait:
  - `apps/components/app-sidebar.tsx`
  - `apps/components/nav-secondary.tsx`
  - `apps/components/nav-user.tsx`
  - `apps/tests/sidebar-navigation.test.ts`

## 4. Kebutuhan Perbaikan Terurut Dependensi
1. **Pembaruan `apps/components/nav-secondary.tsx`**:
   - Mengimpor `Link` dari `next/link`.
   - Mengganti `<a href={item.url} />` dengan `<Link href={item.url} />`.
2. **Pembaruan `apps/components/nav-user.tsx`**:
   - Mengimpor `Link` dari `next/link`.
   - Membungkus item `Account` dengan navigasi ke `/account`.
   - Menghapus item dummy `Billing` dan `Notifications`.
3. **Pembaruan `apps/components/app-sidebar.tsx`**:
   - Menambahkan ikon `<BookOpenIcon />` untuk menu "Mata Pelajaran" (`/mata-pelajaran`).
   - Menghapus `NavDocuments` dari render dan data `documents`, `navClouds`.
   - Mengubah `navSecondary` menjadi satu entri nyata: "Pengaturan Akun" (`/account`).
4. **Pembuatan Pengujian Unit (`apps/tests/sidebar-navigation.test.ts`)**:
   - Memastikan seluruh menu utama (`Dashboard`, `Bank Soal`, `Mata Pelajaran`, `Sesi Ujian`, `Monitoring Sesi`, `Rekap Nilai`, `Data Santri`, `Ruang Ujian Santri`) hadir dan terhubung ke rute yang valid.
   - Memastikan tidak ada tautan `href="#"` atau `url: "#"`.
   - Memastikan grup `NavDocuments` tidak lagi dirender.
5. **Validasi Repositori**:
   - Menjalankan `npm run typecheck`, `npm test`, dan `npm --prefix apps run test:ui-leak`.

## 5. Kriteria Penerimaan
- Seluruh tautan di sidebar memiliki rute aktif Next.js yang sah (0 tautan `#`).
- Menu "Mata Pelajaran" hadir di posisi yang tepat di navigasi utama.
- Grup "Documents" tidak lagi tampil di sidebar.
- Seluruh 372+ tes unit lulus 100%.
- Nol kebocoran kode spesifikasi teknis.

## 6. Penilaian E2E
- **Rekomendasi**: `Recommended` (Perubahan navigasi visual dan tata letak sidebar pengajar).
- **Handoff**: `specs/e2e/sidebar-navigation-cleanup.md`.
