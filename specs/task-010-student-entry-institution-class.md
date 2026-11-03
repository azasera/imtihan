# Spesifikasi Implementasi: Pilihan Lembaga, Kelas Dinamis, & Validasi Identitas Gerbang Ujian Santri (TASK-010)

## 1. Masalah & Perilaku yang Diharapkan
- **Masalah**: Sebelumnya, halaman masuk ujian santri (`/ujian`) hanya menampilkan input NISN, Nama Lengkap, Tingkat Kelas (dropdown statis umum), dan Token Ujian. Hal ini menyebabkan risiko santri salah memilih jenjang/kelas, potensi manipulasi kelas atau nama santri di sisi browser, serta belum adanya pemisahan lembaga resmi (SMPITA, SMAITA, MTA) yang terhubung langsung dengan basis data master santri pesantren.
- **Perilaku yang Diharapkan**:
  1. **Urutan Formulir Masuk Ujian**:
     - Tahap 1: Nomor Induk Santri (NISN / NIS / ID Santri)
     - Tahap 2: Pilih Lembaga (SMPITA, SMAITA, MTA)
     - Tahap 3: Pilih Kelas (Dinamis bergantung lembaga yang dipilih)
     - Tahap 4: Nama Lengkap Santri (Otomatis terisi dari database master, terverifikasi)
     - Tahap 5: Token Ujian 6 Karakter (Uppercase otomatis)
     - Tahap 6: Tombol Konfirmasi & Masuk Ruang Ujian
  2. **Pilihan Lembaga Resmi**:
     - Pilihan lembaga: `SMPITA`, `SMAITA`, `MTA`.
  3. **Pilihan Kelas Dinamis**:
     - Jika memilih `SMPITA`: hanya menampilkan kelas 7 sampai kelas 9 (misal: 7A, 7B, 8A, 9A, atau Kelas 7 - 9).
     - Jika memilih `SMAITA`: hanya menampilkan kelas 10 sampai kelas 12 (misal: 10A, 11A, 12A, atau Kelas 10 - 12).
     - Jika memilih `MTA`: hanya menampilkan `MTA 1` sampai `MTA 6` sesuai data resmi pesantren.
     - Jangan menampilkan kelas dari lembaga lain.
     - Sebelum lembaga dipilih, pilihan kelas harus dinonaktifkan (`disabled`).
     - Ketika pilihan lembaga diubah, pilihan kelas sebelumnya otomatis dikosongkan.
     - Mengambil data kelas dari basis data santri (`students`). Jika kelas pada lembaga tersebut belum tersedia di database, tampilkan pesan informatif yang jelas dan jangan membuat kelas fiktif.
  4. **Validasi Identitas Berlapis**:
     - Nomor induk adalah identitas utama.
     - Melakukan pencarian otomatis ke tabel master `students` (berdasarkan `santriId`, `nisn`, atau `nis`).
     - Saat santri ditemukan, nama santri langsung ditampilkan otomatis dan lembaga serta kelas santri tersinkronisasi.
     - Validasi server-side di mutasi `enterExamSession`: memastikan nomor induk terdaftar di database, lembaga dan kelas yang dipilih cocok 100% dengan data resmi santri, serta nama santri diambil langsung dari database untuk mencegah manipulasi identitas.
  5. **Validasi Token Ujian di Server**:
     - Token diverifikasi di server, harus terikat pada sesi yang berstatus aktif (bukan draf dan belum berakhir).
     - Memastikan santri hanya mengakses ujian yang sesuai dengan tingkat/kelas dan jadwalnya.
     - Tidak membocorkan token lain atau kunci jawaban butir soal.
  6. **Desain & Estetika**:
     - Modern, profesional, responsif di ponsel, tablet, dan desktop.
     - Tema warna: hijau tua, hijau zamrud (emerald), putih, dan aksen emas secukupnya.
     - Mempertahankan logo resmi E-Imtihan At-Tauhid.
     - Bebas emoji (menggunakan ikon Lucide).
     - Zero technical code leaks (`SCR-*`, `TASK-*`, dsb.).

## 2. In / Out of Scope
- **In-Scope**:
  - Penambahan query Convex `getAvailableClasses` di `apps/convex/students/public/queries.ts` untuk mengambil daftar kelas unik per lembaga dari tabel master `students`.
  - Pembaruan mutasi Convex `enterExamSession` di `apps/convex/examSession/public/mutations.ts` untuk menerima `institution` / `lembaga` dan memvalidasi kecocokan nomor induk, lembaga, kelas, dan nama santri secara ketat di server.
  - Perombakan antarmuka formulir di `apps/app/ujian/page.tsx` sesuai urutan dan aturan dinamis (A-F).
  - Penambahan unit test komprehensif di `apps/tests/student-entry.test.ts` untuk memverifikasi struktur form, cascading dropdown lembaga-ke-kelas, clearing kelas saat lembaga berubah, validasi server, dan zero technical leak.
  - Spek E2E di `specs/e2e/student-exam-entry.md`.
- **Out-of-Scope**:
  - Perubahan skema tabel bank soal atau sesi ujian selain penyesuaian parameter validasi.

## 3. Berkas Terkait
- `apps/convex/students/public/queries.ts`
- `apps/convex/examSession/public/mutations.ts`
- `apps/app/ujian/page.tsx`
- `apps/tests/student-entry.test.ts`
- `specs/e2e/student-exam-entry.md`
- `.planora/EXECUTION/TODO.md`

## 4. Kebutuhan Implementasi Terurut Dependensi
1. **Backend Query Kelas Berdasarkan Lembaga (`apps/convex/students/public/queries.ts`)**:
   - Query `getAvailableClasses`: menerima `jenjang` ("SMPITA" | "SMAITA" | "MTA"), mencari seluruh santri pada jenjang tersebut, mengumpulkan kelas unik yang sesuai rentang resmi pesantren (SMP: 7-9, SMA: 10-12, MTA: 1-4), dan mengembalikan daftar kelas yang terurut rapi. Jika belum ada santri terdaftar, mengembalikan array kosong.
2. **Backend Validasi Ketat Masuk Ujian (`apps/convex/examSession/public/mutations.ts`)**:
   - Mutasi `enterExamSession`: menerima `token`, `nisn`, `studentName`, `institution` ("SMPITA" | "SMAITA" | "MTA"), dan `className`.
   - Melakukan validasi:
     - Nomor induk wajib terdaftar di master `students`.
     - Lembaga yang dipilih harus sama dengan `student.jenjang`.
     - Kelas yang dipilih harus cocok dengan `student.kelas`.
     - Nama santri diambil langsung dari record database untuk menjamin integritas data (mencegah peniruan nama santri lain).
     - Memeriksa sesi ujian dan hak akses kelas (jika sesi dibatasi untuk tingkat tertentu).
3. **Pembaruan Antarmuka Gerbang Ujian (`apps/app/ujian/page.tsx`)**:
   - Menata ulang urutan form:
     1. Nomor Induk Santri (NISN / NIS / ID Santri) dengan status verifikasi database.
     2. Pilihan Lembaga (SMPITA, SMAITA, MTA).
     3. Pilihan Kelas (Select dinamis, disabled jika lembaga belum dipilih, otomatis kosong saat lembaga berganti, pesan informatif jika kelas belum ada di database).
     4. Nama Lengkap Santri (otomatis terisi dari lookup santri, read-only dengan indikator terverifikasi).
     5. Token Ujian 6 Karakter (uppercase & batasan 6 karakter).
     6. Tombol Konfirmasi & Masuk Ruang Ujian.
4. **Pengujian & Validasi**:
   - Menambahkan pengujian di `apps/tests/student-entry.test.ts` untuk seluruh kriteria A s.d. G.
   - Menjalankan `npm test` dan `npm run typecheck`.

## 5. Kriteria Penerimaan Terukur (Acceptance Criteria)
- Urutan formulir login sesuai poin A (Nomor Induk -> Lembaga -> Kelas -> Nama -> Token -> Tombol Masuk).
- Pilihan lembaga menyediakan SMPITA, SMAITA, MTA.
- Dropdown kelas dinonaktifkan jika lembaga belum dipilih.
- Mengubah lembaga mengosongkan nilai kelas yang sebelumnya dipilih.
- Kelas SMPITA hanya menampilkan kelas 7-9; SMAITA 10-12; MTA MTA 1-6; tidak ada kebocoran kelas antar lembaga.
- Jika kelas pada lembaga belum ada di database, muncul notifikasi/pesan yang jelas dan tidak membuat kelas fiktif.
- Menginput nomor induk yang valid otomatis mengisi nama santri, lembaga, dan kelas.
- Server menolak jika santri tidak terdaftar atau jika lembaga/kelas tidak sesuai data santri.
- TypeScript 0 error (`npm run typecheck`), Unit tests 100% lulus, zero technical leaks.

## 6. Risiko & Mitigasi
- **Risiko**: Database belum disinkronkan sehingga daftar santri masih kosong.
  - *Mitigasi*: Query mengembalikan array kosong dan UI menampilkan pesan ramah bahwa data kelas pada lembaga tersebut belum disinkronkan di database, meminta santri menghubungi pengawas untuk sinkronisasi.
- **Risiko**: Santri MTA memiliki format nomor induk lokal (`21.04.xxx`), bukan NISN 10 digit.
  - *Mitigasi*: Validasi nomor induk mendukung multi-kolom (`santriId`, `nisn`, `nis`).