# Spesifikasi Fitur: Pengaturan Wali Kelas & Tanggal Dokumen

## Ringkasan Fitur
Menyediakan menu dan tabel basis data khusus "Pengaturan Wali Kelas & Tanggal Dokumen" pada modul E-Rapor agar data Guru Kelas/Wali Kelas (Nama & NIY), Tanggal Dokumen Rapor (Titimangsa), serta Kepala Sekolah (Nama & NIY) dapat diatur dan disimpan secara dinamis per rombel/kelas, semester, dan tahun ajaran.

Sebelumnya, nama Wali Kelas dan Kepala Sekolah masih menggunakan nilai bawaan statis (*hardcoded fallback*) yang sama untuk semua rombel (Muhammad Yasser, S.Pd. & Meditoma, S.Pd.). Dengan fitur ini, setiap kelas (misal: 7A, 7B, 8A, 8B, 9A, 9B, 10, 11, 12, MTA) akan menampilkan identitas Guru Kelas dan titimangsa dokumen cetak yang sesuai dan akurat.

---

## Cakupan & Batasan (In / Out of Scope)

### In-Scope:
1. **Skema Basis Data (Convex)**:
   - Tabel `classSettings` untuk menyimpan konfigurasi per rombel (`className`, `academicYear`, `semester`):
     - `homeroomTeacherName`: Nama Wali Kelas / Guru Kelas
     - `homeroomTeacherNiy`: NIY Wali Kelas
     - `reportDate`: Tanggal dokumen cetak (contoh: "Pangkalpinang, 19 Desember 2025")
     - `principalName`: Nama Kepala Sekolah (opsional, fallback ke kepala sekolah jenjang)
     - `principalNiy`: NIY Kepala Sekolah (opsional)
     - `updatedBy`, `updatedAt`
2. **Backend API (Queries & Mutations)**:
   - Query `getClassSettings`: Mengambil pengaturan untuk 1 kelas tertentu dengan fallback cerdas.
   - Query `getAllClassSettings`: Mengambil seluruh pengaturan kelas pada tahun ajaran & semester aktif.
   - Mutation `saveClassSetting`: Menyimpan/memperbarui pengaturan satu kelas.
   - Mutation `batchApplyDateAndPrincipal`: Menerapkan tanggal rapor dan/atau kepala sekolah ke semua kelas sekaligus untuk kemudahan kurikulum.
   - Integrasi ke `getStudentReportCard` dan `getClassReportCards` agar otomatis memuat pengaturan kelas terkait.
3. **Antarmuka Pengguna (UI/UX)**:
   - Tombol dialog *"Pengaturan Wali Kelas & Tanggal Dokumen"* di bilah kontrol halaman E-Rapor (`/rapor`).
   - Modal/Dialog berbasis shadcn (`Dialog`, `Table`, `Input`, `Button`, `Tabs`) tanpa emoji (menggunakan ikon Lucide).
   - Form grid per kelas dengan input:
     - Nama Wali Kelas
     - NIY
     - Tanggal Rapor
     - Tombol aksi *"Terapkan Tanggal ke Semua Kelas"*
   - Integrasi langsung ke pratinjau `ReportCardPrintView`, cetak satuan, cetak massal, dan ekspor ZIP/PDF.

### Out-of-Scope:
- Manajemen akun login guru baru (fitur ini fokus pada data profil cetak wali kelas per rombel rapor).
- Modifikasi format layout rapor yang sudah disepakati (font Times New Roman, margin Moderate, dsb tetap dipertahankan).

---

## Berkas yang Relevan

1. `apps/convex/schema.ts` — Penambahan tabel `classSettings`.
2. `apps/convex/rapor/public/queries.ts` — Query `getClassSettings`, `getAllClassSettings`, serta pemuatan setting pada `getStudentReportCard` dan `getClassReportCards`.
3. `apps/convex/rapor/public/mutations.ts` — Mutation `saveClassSetting` dan `batchApplyDateAndPrincipal`.
4. `apps/components/rapor/ClassSettingsModal.tsx` (Berkas Baru) — Komponen dialog interaktif pengaturan wali kelas & tanggal dokumen.
5. `apps/app/(main)/rapor/page.tsx` — Tombol pemicu dialog, sinkronisasi state pengaturan kelas aktif, dan pengiriman props ke `ReportCardPrintView`.
6. `apps/components/rapor/ReportCardPrintView.tsx` — Memastikan props `homeroomTeacherName`, `homeroomTeacherNiy`, `reportDate`, `principalName`, `principalNiy` digunakan secara dinamis dengan fallback yang aman.
7. `apps/tests/class-settings.test.ts` (Berkas Baru) — Unit & integration test untuk skema, query, mutasi, dan komponen pengaturan kelas.

---

## Persyaratan Implementasi Berurutan (Dependency-Ordered)

1. **Langkah 1: Skema Convex**
   - Tambahkan tabel `classSettings` pada `apps/convex/schema.ts`.
   - Tambahkan index `by_class_and_period` dan `by_period`.
2. **Langkah 2: Mutasi & Kueri Convex**
   - Buat fungsi query `getClassSettings` dan `getAllClassSettings`.
   - Buat fungsi mutasi `saveClassSetting` dan `batchApplyDateAndPrincipal`.
   - Perbarui kueri rapor santri agar menyertakan data setting kelas yang aktif.
   - Validasi dengan `npx convex dev --once`.
3. **Langkah 3: Komponen Modal UI**
   - Bangun `ClassSettingsModal.tsx` menggunakan komponen shadcn (`Dialog`, `Table`, `Input`, `Label`, `Button`).
   - Terapkan validasi form dan feedback toast (Sonner) saat simpan berhasil.
   - Sediakan tombol cepat *"Terapkan Tanggal ke Semua Rombel"* agar pengguna tidak perlu mengetik tanggal berulang kali untuk tiap kelas.
4. **Langkah 4: Integrasi Halaman Rapor & Pratinjau**
   - Pasang tombol *"Pengaturan Wali Kelas & Tanggal Dokumen"* di header/toolbar kontrol rapor.
   - Hubungkan data setting kelas ke props `ReportCardPrintView` baik pada single preview maupun batch print/PDF.
5. **Langkah 5: Pengujian & Validasi**
   - Buat pengujian otomatis di `apps/tests/class-settings.test.ts`.
   - Pastikan bebas emoji dan tidak ada kebocoran kode spesifikasi teknis (`SCR-*`, `TASK-*`, dll.).
   - Jalankan `npm --prefix apps run typecheck` dan `npm --prefix apps test`.
   - Bangun dan deploy worker Cloudflare.

---

## Kriteria Penerimaan (Measurable Acceptance Criteria)

1. Terdapat tombol *"Pengaturan Wali Kelas & Tanggal Dokumen"* yang jelas di halaman `/rapor`.
2. Ketika dialog dibuka, pengguna dapat melihat daftar kelas, mengisi Nama Wali Kelas, NIY, dan Tanggal Dokumen untuk masing-masing kelas.
3. Terdapat opsi *"Terapkan Tanggal ke Semua Kelas"* untuk menyamakan tanggal rapor ke seluruh rombel dalam satu klik.
4. Data yang disimpan tersimpan di tabel `classSettings` Convex dan tetap bertahan setelah halaman direfresh.
5. Saat pengguna memilih kelas (misal: 7A), lembar cetak rapor santri di kelas tersebut otomatis menampilkan nama Guru Kelas, NIY, dan tanggal dokumen yang telah dikonfigurasi untuk kelas 7A.
6. Kelas lain (misal: 8A atau 9A) menampilkan nama Wali Kelas masing-masing sesuai pengaturan rombelnya.
7. Jika suatu kelas belum dikonfigurasi, sistem menggunakan fallback default yang aman tanpa menyebabkan error.
8. Seluruh pengujian (508+ existing + tests baru) lulus 100%.
9. Nol emoji pada antarmuka pengguna (menggunakan Lucide icons).
10. Nol kebocoran kode teknis pada label, placeholder, dan teks UI.

---

## Pertimbangan Risiko & Kompatibilitas
- **Kompatibilitas Data Lama**: Tabel `classSettings` bersifat opsional dan aditif. Rapor lama yang belum memiliki entri `classSettings` tetap aman menggunakan fallback nilai default sehingga tidak ada data yang rusak atau *breaking change*.
- **Offline / Transient State**: State form lokal di modal di-*cache* selama dialog terbuka untuk mencegah kehilangan isian saat berganti tab.

---

## Perintah Validasi Repositori
```powershell
# 1. Validasi Convex
cd apps; npx convex dev --once; cd ..

# 2. Typecheck TypeScript
npm --prefix apps run typecheck

# 3. Unit & Integration Tests
npm --prefix apps test

# 4. Build Worker
npm --prefix apps run build:worker
```
