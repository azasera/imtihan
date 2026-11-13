# Spesifikasi: Chore - Pembaruan Subtitle Header Sidebar Menjadi "Pesantren Islamic Centre At-Tauhid"

## 1. Deskripsi Masalah & Perilaku yang Diharapkan
- **Masalah**:
  Header sidebar pada [`apps/components/app-sidebar.tsx`](file:///d:/DATA/PROJEK/IMTIHAN/apps/components/app-sidebar.tsx) saat ini menampilkan teks subtitle `"Pesantren & Madrasah"` di bawah judul brand `"E-Imtihan At-Tauhid"`. Berdasarkan kebutuhan branding instansi, teks tersebut perlu diperbarui menjadi `"Pesantren Islamic Centre At-Tauhid"`.
- **Perilaku yang Diharapkan**:
  - Subtitle pada header sidebar berubah menjadi `"Pesantren Islamic Centre At-Tauhid"`.
  - Fungsi tombol navigasi, logo, tautan (`Link href="/"`), tata letak, dan komponen lainnya tetap utuh tanpa perubahan fungsi apa pun.

## 2. In / Out of Scope
- **In-Scope**:
  - `apps/components/app-sidebar.tsx`: Memperbarui teks subtitle dari `"Pesantren & Madrasah"` menjadi `"Pesantren Islamic Centre At-Tauhid"`.
  - `apps/tests/sidebar-navigation.test.ts`: Menambahkan assertion unit test untuk memverifikasi bahwa header sidebar memuat subtitle `"Pesantren Islamic Centre At-Tauhid"`.
  - `specs/e2e/app-branding.md`: Memperbarui skenario ekspektasi E2E sidebar branding.
- **Out-of-Scope**:
  - Mengubah fungsi navigasi tombol logo atau komponen lain di sidebar.
  - Mengubah backend Convex, skema database, atau rute Next.js.
  - Mengubah styling atau layout komponen lain.

## 3. Bukti & Berkas Terkait
- **Bukti Pengguna**: Tangkapan layar yang menampilkan logo E-Imtihan At-Tauhid dengan teks baris kedua `"Pesantren & Madrasah"`.
- **Berkas Terkait**:
  - `apps/components/app-sidebar.tsx`
  - `apps/tests/sidebar-navigation.test.ts`
  - `specs/e2e/app-branding.md`

## 4. Kebutuhan Perbaikan Terurut Dependensi
1. **Pembaruan Teks Subtitle**:
   - Edit baris 144 pada `apps/components/app-sidebar.tsx` mengganti `"Pesantren & Madrasah"` dengan `"Pesantren Islamic Centre At-Tauhid"`.
2. **Pembaruan Pengujian Unit**:
   - Tambahkan verifikasi di `apps/tests/sidebar-navigation.test.ts` untuk memastikan subtitle `"Pesantren Islamic Centre At-Tauhid"` tampil di header sidebar dan teks lama `"Pesantren & Madrasah"` tidak lagi digunakan.
3. **Pembaruan Dokumentasi E2E**:
   - Selaraskan `specs/e2e/app-branding.md` pada skenario 3 (Authenticated Sidebar Branding).
4. **Validasi**:
   - Jalankan `npm test` dan pemeriksaan kebocoran kode spesifikasi teknis.

## 5. Kriteria Penerimaan
- Header sidebar menampilkan teks `"Pesantren Islamic Centre At-Tauhid"`.
- Tautan tombol logo tetap mengarah ke `"/"` tanpa gangguan fungsionalitas.
- Seluruh tes unit lulus 100%.
- Tidak ada kebocoran kode spesifikasi teknis.

## 6. Penilaian E2E
- **Rekomendasi**: `Recommended` (Perubahan teks rendered UI pada komponen navigasi sidebar).
- **Handoff**: `specs/e2e/app-branding.md`.
