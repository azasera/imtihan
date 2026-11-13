# Spesifikasi Perbaikan Bug: Diskrepansi Jumlah Santri SMAITA Akibat Santri Kedaluwarsa (Stale/Orphan) Saat Sinkronisasi SiPAKSa

## 1. Definisi Masalah & Perilaku yang Diharapkan
- **Deskripsi Bug**:
  Saat pengguna melakukan penarikan data (*Tarik Data dari SiPAKSa*), sistem menampilkan toast:
  `"Sinkronisasi berhasil! 347 santri aktif (SMP: 246, SMA: 78, MTA: 23) siap digunakan."`
  Namun, pada kartu ringkasan statistik di antarmuka Manajemen Santri, jumlah santri SMAITA tertulis **84** (seharusnya **78**), dan Total Santri Aktif tertulis **353** (seharusnya **347**). Terdapat selisih 6 santri SMA.

- **Hasil Investigasi & Akar Penyebab (Root Cause)**:
  1. Pada backend `syncStudentsFromSipaksa` (`apps/convex/students/public/actions.ts`), proses sinkronisasi hanya memanggil `upsertStudentsBatch` (`apps/convex/students/private/mutations.ts`).
  2. `upsertStudentsBatch` hanya melakukan pencarian berdasarkan `santriId`. Jika ada data yang cocok, dokumen diperbarui (*patch*), dan jika belum ada, dokumen ditambahkan (*insert*).
  3. Di sistem SiPAKSa sebelumnya, terdapat 6 santri SMAITA yang nomor/ID santrinya diperbarui/dinomori ulang (misalnya `24.03.040` menjadi `24.03.001`, `25.03.045` menjadi `25.03.008`, `25.03.054` menjadi `25.03.014`, `25.03.055` menjadi `25.03.015`, `25.03.061` menjadi `25.03.029`, dan `25.03.065` menjadi `25.03.033`).
  4. Karena mekanisme sinkronisasi hanya melakukan *upsert*, 6 santri dengan ID lama tersebut tetap tertinggal di tabel `students` sebagai data kedaluwarsa (*stale / orphan records*), sedangkan data dengan ID baru ditambahkan.
  5. Akibatnya, tabel `students` menampung 78 santri SMA aktif + 6 santri duplikat/kedaluwarsa = 84 santri SMA.
  6. Setiap kali ada santri yang lulus, non-aktif, pindah, atau diubah ID-nya di SiPAKSa, data lama tidak pernah terhapus dari tabel `students`, sehingga data di e-IMTIHAN tidak sinkron dengan kenyataan di SiPAKSa.

- **Perilaku yang Diharapkan**:
  1. Proses sinkronisasi SiPAKSa harus memastikan tabel `students` di Convex menjadi cermin bersih (1:1) dari santri aktif yang diizinkan (SMPITA, SMAITA, MTA).
  2. Saat sinkronisasi berjalan, setelah seluruh santri aktif dari SiPAKSa di-*upsert*, sistem secara otomatis memvalidasi dan memangkas (*prune*) dokumen santri di tabel `students` yang sudah tidak ada lagi di dalam daftar aktif SiPAKSa terbaru (atau memiliki `syncedAt` sebelum sesi sinkronisasi saat ini).
  3. Jumlah santri SMAITA dan Total Santri pada kartu ringkasan harus otomatis cocok 100% dengan hasil sinkronisasi SiPAKSa (saat ini: SMP 246, SMA 78, MTA 23, Total 347).
  4. Diskrepansi tidak akan pernah terulang lagi pada sinkronisasi berikutnya di masa mendatang.

## 2. In / Out of Scope
- **In-Scope**:
  - `apps/convex/students/private/mutations.ts`: Menambahkan mutasi internal `pruneStaleStudents` untuk menghapus dokumen santri yang tidak lagi terdaftar pada respons sinkronisasi aktif terbaru.
  - `apps/convex/students/public/actions.ts`: Memperbarui `syncStudentsFromSipaksa` agar mengirimkan `syncTimestamp` yang konsisten dan memanggil `pruneStaleStudents` setelah batch upsert selesai. Mengembalikan informasi santri yang dipangkas (*pruned*) dalam hasil sinkronisasi.
  - `apps/tests/student-sync.test.ts`: Memperbarui dan menambahkan pengujian regresi untuk menjamin data kedaluwarsa dibersihkan dan konsistensi hitungan terjamin.
- **Out-of-Scope**:
  - Mengubah tabel `examParticipants` atau jawaban ujian sebelumnya.
  - Mengubah format data yang diterima dari API SiPAKSa.

## 3. Bukti & Berkas Terkait
- Screenshot dari pengguna yang menampilkan kartu SMAITA = 84 sedangkan toast = 78.
- Log inline query Convex yang mengidentifikasi 6 record santri SMAITA dengan `syncedAt` lama dan santriId lama (`24.03.040`, `25.03.045`, `25.03.054`, `25.03.055`, `25.03.061`, `25.03.065`).
- Berkas terkait:
  - `apps/convex/students/private/mutations.ts`
  - `apps/convex/students/public/actions.ts`
  - `apps/tests/student-sync.test.ts`

## 4. Kebutuhan Implementasi Terurut Dependensi
1. **Langkah 1**: Perbarui `apps/convex/students/private/mutations.ts`:
   - Pada `upsertStudentsBatch`, terima argumen opsional `syncTimestamp: v.optional(v.number())`.
   - Tambahkan mutasi internal `pruneStaleStudents` dengan argumen `currentSyncTimestamp: v.number()` dan `activeSantriIds: v.array(v.string())`.
   - Di dalam handler, cari semua dokumen santri yang `santriId`-nya tidak ada di `activeSantriIds` (atau `syncedAt < currentSyncTimestamp`), hapus dengan `ctx.db.delete`, dan kembalikan jumlah yang dipangkas.
2. **Langkah 2**: Perbarui `apps/convex/students/public/actions.ts`:
   - Di awal handler, tetapkan `const syncTimestamp = Date.now()`.
   - Teruskan `syncTimestamp` ke `upsertStudentsBatch`.
   - Setelah loop batch selesai, panggil `internal.students.private.mutations.pruneStaleStudents` dengan `currentSyncTimestamp: syncTimestamp` dan seluruh `santriId` dari payload.
   - Sertakan `totalPruned` dalam hasil respons `syncStudentsFromSipaksa`.
3. **Langkah 3**: Sinkronkan kode ke deployment Convex (`npx convex dev --once`).
4. **Langkah 4**: Jalankan aksi sinkronisasi atau inline query untuk memverifikasi 6 santri stale telah dibersihkan dan total SMA menjadi 78, total menjadi 347.
5. **Langkah 5**: Perbarui pengujian di `apps/tests/student-sync.test.ts` untuk memverifikasi logika pemangkasan santri stale.
6. **Langkah 6**: Validasi penuh dengan `npm test`, `npm run typecheck`, dan `npm run test:ui-leak`.

## 5. Kriteria Penerimaan yang Terukur
1. Kartu SMAITA di antarmuka menampilkan angka **78** (bukan 84).
2. Kartu Total Santri Aktif menampilkan angka **347** (bukan 353).
3. 6 santri SMAITA duplikat dengan nomor lama dibersihkan secara tuntas dari tabel `students`.
4. Setiap pemanggilan `syncStudentsFromSipaksa` berikutnya selalu otomatis memangkas santri yang sudah tidak aktif/terhapus di SiPAKSa.
5. Seluruh tes unit lulus 100% (termasuk tes regresi baru).
6. `npx convex dev --once` berhasil tanpa error.
7. TypeScript check `tsc --noEmit` lolos bersih.

## 6. Pertimbangan Risiko & Kompatibilitas
- Penghapusan hanya terjadi pada dokumen master `students` yang ID-nya sudah tidak ada di SiPAKSa.
- Riwayat ujian pada `examParticipants` tidak terpengaruh karena menyimpan identitas santri secara independen.

## 7. Perintah Validasi Repositori
- `cd apps && npx convex dev --once`
- `node --test apps/tests/student-sync.test.ts`
- `npm test --prefix apps`
- `npm run typecheck --prefix apps`
