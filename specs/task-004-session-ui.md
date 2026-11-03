# Spesifikasi Implementasi: Antarmuka Sesi Ujian & Manajemen Token (TASK-004)

## 1. Masalah & Perilaku yang Diharapkan
- **Masalah**: Pengajar dan panitia ujian memerlukan antarmuka web yang intuitif dan praktis untuk menjadwalkan pelaksanaan ujian, memilih paket bank soal, menentukan batas durasi menit pengerjaan, mengontrol token 6 digit secara langsung (termasuk regenerate token), serta mengaktifkan/menonaktifkan status sesi ujian secara instan saat ujian dimulai atau selesai.
- **Perilaku yang Diharapkan**:
  1. Halaman `/sesi-ujian` menyajikan daftar kartu / tabel sesi ujian lengkap dengan informasi judul sesi, bank soal rujukan, mata pelajaran, tingkat kelas, rentang waktu, durasi menit, status sesi (`Draf`, `Aktif`, `Selesai`), dan token 6 digit.
  2. Dialog pembuatan sesi ujian baru (`Buat Jadwal Sesi Ujian`) yang memungkinkan pengajar memilih bank soal yang sudah dibuat, memasukkan judul sesi, waktu mulai, waktu selesai, durasi menit pengerjaan, serta toggle acak urutan soal dan acak opsi jawaban.
  3. Fitur token interaktif:
     - Tampilan token besar & jelas dengan font monospace.
     - Tombol salin token ke clipboard dengan umpan balik toast.
     - Tombol regenerasi / acak ulang token dengan konfirmasi pengajar.
  4. Pengubahan status sesi yang cepat:
     - Tombol "Aktifkan Sesi" untuk membuka sesi bagi santri.
     - Tombol "Tutup Sesi" saat waktu pengerjaan berakhir.
  5. Nol kebocoran kode spesifikasi teknis (`SCR-*`, `TASK-*`, `*-FR-*`, dsb.) dan bebas emoji (menggunakan ikon Lucide).

## 2. In / Out of Scope
- **In-Scope**:
  - Halaman antarmuka `/sesi-ujian` (`apps/app/(main)/sesi-ujian/page.tsx`).
  - Dialog pembuatan sesi baru dengan integrasi Convex mutation `createExamSession`.
  - Integrasi mutasi Convex: `updateExamSession`, `regenerateSessionToken`, `setSessionStatus`, `deleteExamSession`.
  - Integrasi query Convex: `listExamSessions`, `listQuestionBanks`.
  - Status badges, token viewer, tombol copy token, dan filter status (Semua, Aktif, Draf, Selesai).
  - Pengujian unit otomatis di `apps/tests/sesi-ujian-ui.test.ts`.
  - Spek E2E di `specs/e2e/sesi-ujian-management.md`.
- **Out-of-Scope**:
  - Halaman santri untuk memasukkan token (akan dikerjakan pada `TASK-005`).
  - Monitoring kehadiran santri per butir soal (akan dikerjakan pada monitoring sesi real-time).

## 3. Berkas Terkait
- `apps/app/(main)/sesi-ujian/page.tsx`
- `apps/tests/sesi-ujian-ui.test.ts`
- `specs/e2e/sesi-ujian-management.md`
- `.planora/EXECUTION/TODO.md`

## 4. Kebutuhan Implementasi Terurut Dependensi
1. **Penyusunan Halaman Utama (`apps/app/(main)/sesi-ujian/page.tsx`)**:
   - Header halaman: Judul, deskripsi, tombol "Jadwalkan Sesi Ujian".
   - Dialog pembuatan sesi baru:
     - Input judul sesi.
     - Select paket bank soal (dari `api.bank.public.queries.listQuestionBanks`).
     - Input tanggal/waktu mulai & tanggal/waktu selesai (`datetime-local`).
     - Input durasi (menit) dengan default 60 menit.
     - Checkbox/switch: Acak nomor soal & acak opsi jawaban.
   - Filter bar: Pencarian nama sesi dan filter status (Semua, Aktif, Draf, Selesai).
   - Tampilan daftar kartu sesi:
     - Badge status warna semantik (Hijau untuk Aktif, Abu-abu untuk Draf, Merah/Muted untuk Selesai).
     - Token 6 digit dengan tombol copy dan tombol regenerate.
     - Rincian durasi menit, bank soal, jumlah soal, bobot nilai.
     - Aksi: Tombol Aktifkan/Selesai, Edit, Hapus.
2. **Pengujian Unit (`apps/tests/sesi-ujian-ui.test.ts`)**:
   - Memastikan berkas halaman ada dan komponen terhubung ke Convex query/mutation.
   - Verifikasi sanitasi token, validasi formulir sesi.
   - Verifikasi pencegahan kebocoran kode teknis (`SCR-*`, `TASK-*`, dsb.).
3. **Penyusunan Spek E2E (`specs/e2e/sesi-ujian-management.md`)**:
   - Skenario pengujian browser untuk alur pembuatan sesi, aktivasi token, dan penyalinan token.

## 5. Kriteria Penerimaan Terukur (Acceptance Criteria)
- Pengajar dapat membuat sesi baru dan token 6 digit langsung muncul.
- Pengajar dapat menyalin token ke clipboard.
- Pengajar dapat meregenerasi token baru dengan satu klik.
- Pengajar dapat mengubah status sesi dari Draf menjadi Aktif, dan dari Aktif menjadi Selesai.
- TypeScript compilation 0 error (`npm run typecheck`).
- Tidak ada emoji dalam desain antarmuka, hanya ikon Lucide.
- Zero technical code leaks.

## 6. Risiko & Kompatibilitas
- Komponen `@base-ui/react`: Menggunakan `render={<Button ... />}` untuk `DialogTrigger` dan handler `(val) => setState(val ?? "")` untuk `Select`.
- Clipboard API: Menyediakan fallback aman jika browser tidak mendukung `navigator.clipboard`.
