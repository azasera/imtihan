# Spesifikasi Fitur: Manajemen Multi-Pembina Ekstrakurikuler Tanpa NIY

## 1. Definisi Masalah & Perilaku yang Diharapkan
Saat ini, setiap kelompok ekstrakurikuler hanya dapat menyimpan satu nama pembina dan satu NIY (`coachName` & `coachNiy`). Pada realitas di sekolah dan pesantren:
- Suatu kegiatan ekstrakurikuler sering diampu oleh lebih dari satu orang pembina (misalnya: pembina putra/ikhwan dan pembina putri/akhwat, atau koordinator pembina didampingi pelatih teknis).
- Nomor Induk Yayasan (NIY) membuat tampilan antarmuka menjadi terlalu padat dan formal untuk konteks papan kegiatan ekstrakurikuler santri.
- Pengguna meminta agar:
  1. Kelompok ekstrakurikuler dapat memiliki lebih dari satu pembina (multi-pembina).
  2. Tampilan header kelompok dibuat lebih bersih **tanpa menampilkan NIY**.
  3. Dialog pengaturan pembina memungkinkan penambahan/penghapusan pembina secara dinamis dan ringkas tanpa kolom isian NIY yang membebani.

## 2. Ruang Lingkup (Scope)
- **In-Scope**:
  - Modifikasi skema tabel `extracurricularGroups` untuk mendukung array `coaches` berisi objek `{ name: string, role?: string }`.
  - Pembaruan mutasi `updateGroupCoach` untuk menerima array pembina `coaches` dan memperbarui `coachName` gabungan sebagai fallback ramah kompatibilitas.
  - Pembaruan antarmuka dialog `EditCoachModal.tsx`:
    - Mengeliminasi seluruh input/label NIY.
    - Menghadirkan antarmuka pengelolaan daftar pembina: pilih guru dari SiPAKSa atau ketik nama manual, opsi peran (Umum, Ikhwan, Akhwat, Pelatih), tombol tambah pembina, dan tombol hapus pembina terpilih.
  - Pembaruan tampilan header kelompok pada `apps/app/(main)/ekstrakurikuler/page.tsx`:
    - Menampilkan lencana (badge) bersih untuk setiap pembina (Nama Pembina + Peran bila ada) tanpa teks NIY.
    - Menjaga estetika ringkas, konsisten dengan tema desain, dan tanpa emoji.
  - Penyesuaian dan penambahan unit test untuk memvalidasi fitur multi-pembina tanpa NIY.
- **Out-of-Scope**:
  - Mengubah format cetak rapor santri (rapor santri sudah hanya mencetak nama ekskul, predikat, dan narasi capaian).
  - Mengubah tabel keanggotaan santri (`extracurricularEnrollments`).

## 3. Bukti & Dasar Kebutuhan
- Instruksi pengguna: *"bagaimana, pembina lebih dari satu. rencana terbaik antum akhi"* disusul *"agar lebih bersih. buat tanpa NIY"*.
- Tangkapan layar referensi mockup yang dikonfirmasi oleh pengguna.

## 4. Berkas Terkait
- `apps/convex/schema.ts` — Skema tabel `extracurricularGroups`.
- `apps/convex/extracurricular/public/mutations.ts` — Mutasi pembaruan pembina kelompok.
- `apps/convex/extracurricular/public/queries.ts` — Kueri data kelompok ekskul.
- `apps/components/ekstrakurikuler/EditCoachModal.tsx` — Modal dialog penambahan dan pengaturan multi-pembina.
- `apps/app/(main)/ekstrakurikuler/page.tsx` — Header detail kelompok ekstrakurikuler.
- `apps/tests/extracurricular-module.test.ts` — Unit test pengujian modul ekstrakurikuler.

## 5. Rencana Implementasi Bertahap
1. **Pembaruan Skema Convex (`apps/convex/schema.ts`)**:
   - Menambahkan field `coaches: v.optional(v.array(v.object({ name: v.string(), role: v.optional(v.string()) })))` pada tabel `extracurricularGroups`.
   - Tetap mempertahankan `coachName` dan `coachNiy` sebagai field opsional untuk data historis.
2. **Pembaruan Backend Mutations (`apps/convex/extracurricular/public/mutations.ts`)**:
   - Mutasi `updateGroupCoach` diperbarui agar menerima:
     - `groupId: v.id("extracurricularGroups")`
     - `coaches: v.array(v.object({ name: v.string(), role: v.optional(v.string()) }))`
     - `description: v.optional(v.string())`
   - Sinkronisasi otomatis `coachName = coaches.map(c => c.name).join(", ")`.
3. **Penyempurnaan Modal (`apps/components/ekstrakurikuler/EditCoachModal.tsx`)**:
   - Menghapus input NIY dan tampilan NIY.
   - Menyediakan daftar tag/badge pembina yang sudah ditambahkan dengan tombol hapus (ikon X/Trash).
   - Menyediakan pemilihan guru dari daftar guru SiPAKSa (`DEFAULT_TEACHERS`) atau mode ketik manual nama pembina.
   - Pilihan peran: `Umum`, `Ikhwan`, `Akhwat`, `Pelatih`.
   - Tombol "Tambah Pembina" untuk memasukkan ke dalam daftar sebelum disimpan.
4. **Penyempurnaan Tampilan Header (`apps/app/(main)/ekstrakurikuler/page.tsx`)**:
   - Menggantikan string tunggal pembina dengan deretan badge bersih:
     - Contoh: `[Muhammad Yasser, S.Pd. (Koordinator)] [Ustadzah Fatimah, S.Pd. (Pembina Akhwat)]`
     - Tanpa angka NIY.
5. **Validasi & Pengujian**:
   - Typecheck TypeScript (`npm run typecheck`).
   - Unit tests (`npm test`).
   - Verifikasi tidak ada kebocoran kode spesifikasi teknis dan tidak ada emoji.

## 6. Kriteria Keberterimaan (Acceptance Criteria)
1. Kelompok ekskul dapat memiliki 1, 2, atau lebih pembina sekaligus.
2. Tidak ada angka NIY yang ditampilkan pada badge pembina di header kelompok ekskul.
3. Form pengaturan pembina bersih tanpa kolom NIY.
4. Guru SiPAKSa dapat dipilih langsung atau diketik manual nama pembina/pelatih luarnya.
5. Pembina dapat memiliki label peran (misal: "Koordinator", "Ikhwan", "Akhwat", "Pelatih") yang tampil anggun di samping namanya.
6. Seluruh test suite (590+ tests) lulus tanpa regresi.

## 7. Risiko & Mitigasi
- **Risiko Kelompok Ekskul yang Belum Dimigrasi**: Kelompok lama yang hanya memiliki `coachName` string tetap ditampilkan dengan anggun sebagai pembina tunggal (fallback otomatis).
- **Risiko UI Overflow**: Menggunakan flex-wrap pada baris badge pembina agar rapi di layar ponsel maupun desktop.
