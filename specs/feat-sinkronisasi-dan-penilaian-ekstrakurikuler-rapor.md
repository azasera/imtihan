# Spesifikasi Fitur: Sinkronisasi dan Penilaian Ekstrakurikuler Rapor (Wajib & Pilihan)

## Ringkasan Fitur
Menyediakan pengelolaan, sinkronisasi massal, dan penilaian ekstrakurikuler (wajib: Rohis, pilihan: 14 cabang olahraga, seni, sains, keahlian) pada modul E-Rapor. Fitur ini membaca data peserta ekskul lintas kelas dari berkas Excel resmi `ABSEN EKSKUL 2026-2027.xlsx`, mengisi nilai & deskripsi capaian baku secara otomatis dengan pilihan predikat (A / B / C), menyimpannya ke tabel `homeroomAssessments` Convex, menyediakannya di antarmuka Wali Kelas untuk penyesuaian individual, serta menampilkannya secara presisi pada lembar cetak rapor fisik (PDF).

---

## Masalah dan Perilaku yang Diharapkan
1. **Masalah Saat Ini**:
   - Santri memiliki 2 jenis ekstrakurikuler:
     - Ekskul Wajib: **Rohis** (seluruh santri).
     - Ekskul Pilihan: Beranggotakan santri campuran lintas kelas (misal: Futsal terdiri dari santri kelas 7A, 7B, 8A, 8B, 9A, dll.) dengan pembina masing-masing.
   - Di lembar cetak rapor (`ReportCardPrintView.tsx`), tabel ekstrakurikuler masih menampilkan 6 baris *dummy fallback* bertanda strip (`-`) jika data `homeroom.extracurriculars` kosong.
   - Pada halaman web Asesmen Wali Kelas (`/rapor`), belum ada seksi interaktif untuk melihat, memilih predikat (A / B / C), dan mengedit deskripsi ekstrakurikuler santri.
   - Belum ada mekanisme sinkronisasi massal dari berkas master Excel `rapor/ABSEN EKSKUL 2026-2027.xlsx` yang memetakan 334 santri ke 14 cabang ekskul.

2. **Perilaku yang Diharapkan**:
   - Terdapat kamus narasi capaian otomatis per cabang ekskul untuk predikat **A** (Sangat Baik), **B** (Baik), dan **C** (Cukup).
   - Terdapat mutasi backend Convex untuk sinkronisasi massal yang membaca data pemetaan santri dan menginjeksi 2 ekskul per santri (Rohis + Ekskul Pilihan) dengan predikat default (misal A/B) dan deskripsi terstandar.
   - Pada halaman Web Rapor Tab "Asesmen Wali Kelas":
     - Ditambahkan seksi form "Ekstrakurikuler Santri" yang memuat Rohis (Wajib) dan Ekskul Pilihan.
     - Wali kelas dapat memilih predikat (A / B / C) melalui dropdown, mengubah deskripsi, atau menambah/menghapus ekskul jika ada perubahan.
     - Disediakan tombol aksi cepat *"⚡ Sinkronkan Ekskul dari Excel"* untuk menjalankan sinkronisasi massal kapan saja.
   - Pada lembar cetak rapor (`ReportCardPrintView.tsx` Halaman 2):
     - Tabel ekstrakurikuler menampilkan baris riil milik santri: Baris 1: Rohis, Baris 2: Ekskul Pilihan (atau hanya Rohis jika tidak mengambil pilihan). Baris *dummy* strip tidak lagi muncul.

---

## Cakupan & Batasan (In / Out of Scope)

### In-Scope:
1. **Data & Modul Backend Convex**:
   - Penyediaan modul/fungsi sinkronisasi massal (`syncExtracurricularsFromRoster`) di `apps/convex/rapor/public/mutations.ts` yang menerima atau memproses daftar pemetaan santri ke cabang ekskul.
   - Pemanfaatan field `extracurriculars` yang sudah ada pada tabel `homeroomAssessments` di `apps/convex/schema.ts` (`v.array(v.object({ name: v.string(), score: v.string(), description: v.string() }))`).
   - Penyesuaian `saveHomeroomAssessment` agar menyimpan perubahan array `extracurriculars`.
2. **Kamus Narasi & Logika Predikat (A/B/C)**:
   - Kamus capaian untuk 14 cabang ekskul: Agrobisnis, Badminton, Futsal, Jurnalis, Pingpong, Panahan, TIK, Volly, IPA, IPS, Jurnalis Akhwat, Matematika, Tata Boga, TIK Akhwat, serta Rohis (Wajib).
   - Logika generator narasi berdasarkan predikat (A: Sangat Baik, B: Baik, C: Cukup).
3. **Antarmuka Pengguna (UI/UX)**:
   - Di `apps/app/(main)/rapor/page.tsx` Tab "Asesmen Wali Kelas":
     - Komponen kartu/seksi form Ekstrakurikuler dengan pemilih predikat (A, B, C) dan textarea deskripsi.
     - Tombol sinkronisasi massal *"⚡ Sinkronkan Nilai Ekskul dari Berkas Excel"* dengan konfirmasi dan notifikasi toast (Sonner).
     - Sinkronisasi state lokal form saat santri aktif berganti.
4. **Tampilan Cetak Rapor (Print View / PDF)**:
   - Di `apps/components/rapor/ReportCardPrintView.tsx`: Menampilkan baris ekskul riil santri tanpa merusak tata letak Halaman 2 rapor resmi.
5. **Skrip Otomasi / Impor**:
   - Skrip pembaca Excel `ABSEN EKSKUL 2026-2027.xlsx` yang dapat dieksekusi atau dipanggil mutasi Convex untuk memperbarui 334 santri.

### Out-of-Scope:
- Pengubahan skema database tabel lain (hanya menggunakan tabel `homeroomAssessments`).
- Perubahan layout atau ukuran font lembar rapor di luar tabel ekstrakurikuler.

---

## Berkas yang Relevan

1. `apps/lib/extracurricular-constants.ts` (Berkas Baru) — Kamus nama ekskul resmi, daftar 14 cabang ekskul pilihan, template deskripsi capaian untuk predikat A, B, C, dan helper generator narasi.
2. `apps/convex/rapor/public/mutations.ts` — Mutasi `syncExtracurricularsBatch` untuk menerapkan ekskul massal ke `homeroomAssessments`, serta pembaruan `saveHomeroomAssessment` agar mendukung mutasi `extracurriculars`.
3. `apps/app/(main)/rapor/page.tsx` — Integrasi UI form Ekstrakurikuler di Tab "Asesmen Wali Kelas", tombol sinkronisasi massal, dan handling state `extracurriculars`.
4. `apps/components/rapor/ReportCardPrintView.tsx` — Penyesuaian fallback tabel ekstrakurikuler agar memprioritaskan data riil santri.
5. `scripts/sync-ekskul-data.mjs` — Skrip pembaca Excel `rapor/ABSEN EKSKUL 2026-2027.xlsx` dan penyiap payload batch sinkronisasi.
6. `apps/tests/extracurricular.test.ts` (Berkas Baru) — Unit test untuk kamus narasi ekskul, pemetaan nama santri, dan logika validasi predikat A/B/C.
7. `specs/e2e/feat-sinkronisasi-ekskul-rapor.md` — Spesifikasi handoff pengujian browser E2E.

---

## Persyaratan Implementasi Berurutan (Dependency-Ordered)

1. **Langkah 1: Modul Konstanta & Generator Narasi Capaian Ekskul**
   - Buat `apps/lib/extracurricular-constants.ts` yang memuat:
     - Daftar cabang ekskul resmi (Rohis, Futsal, Badminton, Pingpong, Panahan, Volly, Agrobisnis, TIK, Tata Boga, Jurnalis, IPA, IPS, Matematika).
     - Fungsi `getExtracurricularNarrative(ekskulName: string, score: "A" | "B" | "C"): string`.
     - Data default mapping dari berkas `ABSEN EKSKUL 2026-2027.xlsx`.
2. **Langkah 2: Mutasi Backend Convex**
   - Di `apps/convex/rapor/public/mutations.ts`:
     - Pastikan `saveHomeroomAssessment` memproses dan menyimpan parameter `extracurriculars`.
     - Buat mutasi baru `batchUpsertExtracurriculars` yang menerima array `{ santriId, studentName, className, academicYear, semester, extracurriculars }` dan memperbarui/membuat record `homeroomAssessments`.
   - Jalankan `npx convex dev --once` untuk memastikan backend valid dan siap.
3. **Langkah 3: Pembaruan Antarmuka Web Rapor**
   - Di `apps/app/(main)/rapor/page.tsx`:
     - Tambahkan state `extracurriculars` pada Tab "Asesmen Wali Kelas".
     - Tambahkan efek sinkronisasi state saat `singleReport?.homeroom` dimuat.
     - Buat form visual interaktif per ekskul: nama ekskul, badge wajib/pilihan, dropdown predikat (A, B, C), dan textarea deskripsi.
     - Tambahkan tombol *"⚡ Sinkronkan Nilai Ekskul dari Berkas Excel"* di header Tab 2.
4. **Langkah 4: Tampilan Cetak Rapor (`ReportCardPrintView.tsx`)**
   - Pastikan jika santri memiliki data `extracurriculars`, tabel hanya merender ekskul yang diikuti (Rohis + Ekskul Pilihan).
   - Jaga agar baris tabel tetap proporsional dan rapi pada A4 Halaman 2.
5. **Langkah 5: Pengujian & Validasi**
   - Tulis unit test di `apps/tests/extracurricular.test.ts` untuk memverifikasi logika generator narasi, opsi predikat A/B/C, dan normalisasi nama/kelas.
   - Jalankan `npm run test` di `apps/` untuk memastikan seluruh tes lulus.
   - Buat spesifikasi E2E handoff di `specs/e2e/feat-sinkronisasi-ekskul-rapor.md`.

---

## Kriteria Penerimaan yang Terukur (Acceptance Criteria)
1. **AC-01**: Seluruh 334 santri di berkas Excel terpetakan dengan tepat ke cabang ekskul pilihannya tanpa tertukar.
2. **AC-02**: Setiap santri otomatis mendapatkan 2 entri ekskul: **Rohis** (Ekskul Wajib) dan **Ekskul Pilihan** (atau 1 entri Rohis jika tidak mengambil pilihan).
3. **AC-03**: Tersedia pilihan predikat **A** (Sangat Baik), **B** (Baik), dan **C** (Cukup), di mana setiap perubahan predikat memperbarui deskripsi narasi capaian yang relevan.
4. **AC-04**: Wali kelas dapat mengedit nilai dan deskripsi ekskul secara langsung per santri di Tab "Asesmen Wali Kelas" dan menyimpannya ke database via `saveHomeroomAssessment`.
5. **AC-05**: Tombol *"⚡ Sinkronkan Nilai Ekskul dari Berkas Excel"* berhasil mengeksekusi pengisian data massal untuk seluruh rombel aktif dan memunculkan toast sukses.
6. **AC-06**: Pratinjau dan lembar cetak rapor (`ReportCardPrintView.tsx`) Halaman 2 menampilkan tabel Ekstrakurikuler yang bersih dan akurat (hanya menampilkan ekskul santri bersangkutan).
7. **AC-07**: Tidak ada teks emoji pada komponen UI baru, dan tidak membocorkan kode teknis internal.
8. **AC-08**: Seluruh unit test lulus dan `npx convex dev --once` berhasil tanpa error.

---

## Penilaian Risiko & Mitigasi
- **Risiko**: Perbedaan penulisan nama santri antara berkas Excel dan database SiPAKSa (misal spasi ganda, tanda petik, singkatan M. vs Muhammad).
  - *Mitigasi*: Buat fungsi pembersihan dan pencocokan nama bertingkat (exact match -> normalized lowercase no spaces -> fuzzy/substring match) dengan mencocokkan juga rombel/kelas santri.
- **Risiko**: Penimpaan data asesmen kehadiran santri yang sudah diinput oleh wali kelas.
  - *Mitigasi*: Mutasi `batchUpsertExtracurriculars` hanya memperbarui field `extracurriculars` tanpa mereset data `sickDays`, `permissionDays`, `absentDays`, `haditsTarget`, atau `homeroomNotes` yang sudah ada.

---

## Perintah Validasi Repositori
- `cd apps && npm run typecheck`
- `cd apps && node --test tests/extracurricular.test.ts`
- `cd apps && npx convex dev --once`

---

## Penilaian E2E
- **Rekomendasi**: `Recommended`
- **Alasan**: Fitur memiliki antarmuka pengguna interaktif pada Tab "Asesmen Wali Kelas" (dropdown predikat, textarea deskripsi, tombol sinkronisasi massal) dan mengubah output visual pada lembar cetak rapor Halaman 2.
