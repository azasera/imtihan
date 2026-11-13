# Spesifikasi: Bilah Filter Terpadu (Pencarian, Filter Kelas, dan Tab Status) pada Layar Monitoring Sesi

## 1. Definisi Masalah & Perilaku yang Diharapkan
- **Masalah**:
  Pada halaman Monitoring Sesi Ujian (`apps/app/(main)/monitoring-sesi/page.tsx`), ketika satu sesi ujian diikuti oleh puluhan hingga ratusan santri:
  1. Seluruh peserta ditampilkan dalam satu daftar panjang tanpa opsi pemilahan status. Pengajar kesulitan membedakan secara instan siapa yang masih aktif mengerjakan di bilik ujian dan siapa yang sudah selesai mengumpulkan lembar jawaban.
  2. Tidak ada filter rombongan belajar (rombel / kelas) seperti 7A, 7B, atau kelas putra/putri, sehingga pengawas ruangan yang hanya mengawasi satu kelas harus mencari manual di antara seluruh santri satu angkatan.
  3. Tidak ada kotak pencarian cepat (nama atau NISN santri).
  4. Kartu metrik ringkasan di bagian atas (*Sudah Masuk*, *Sedang Mengerjakan*, *Telah Selesai*, *Pelanggaran Tab*) bersifat statis dan belum dapat diklik untuk menyaring tabel.

- **Perilaku yang Diharapkan**:
  1. **Bilah Toolbar Navigasi Terpadu**:
     Diletakkan tepat di atas tabel santri:
     - **Kotak Pencarian Instan**: Input pencarian dengan ikon `SearchIcon` untuk mencari nama lengkap santri, NISN, atau kelas secara real-time.
     - **Filter Kelas Adaptif**: Dropdown pilihan kelas yang otomatis terisi berdasarkan nilai kelas (`className`) yang hadir pada sesi tersebut (*Semua Kelas*, *7A*, *7B*, dsb.). Dropdown ini adaptif dan tidak mengganggu jika data kelas seragam.
     - **Tab Status Cepat (*Segmented Pills*)**:
       - `Semua` (dilengkapi jumlah total santri)
       - `Sedang Mengerjakan` (dilengkapi jumlah santri aktif)
       - `Telah Selesai` (dilengkapi jumlah santri terkumpul)
       - `Terkunci / Bermasalah` (dilengkapi jumlah santri terkunci atau berpelanggaran tab)
  2. **Kartu Ringkasan Interaktif**:
     Kartu metrik di atas (*Sudah Masuk*, *Sedang Mengerjakan*, *Telah Selesai*, *Pelanggaran Tab*) dapat diklik oleh pengajar untuk langsung mengaktifkan filter status yang sesuai, disertai penanda visual ring aktif.
  3. **Keadaan Filter Kosong (*Empty State*)**:
     Jika kombinasi filter dan kata kunci pencarian tidak menghasilkan santri, tampilkan pesan ramah (*"Tidak ada santri yang sesuai dengan kriteria filter"*), disertai tombol praktis *"Reset Filter"*.

## 2. In / Out of Scope
- **In-Scope**:
  - `apps/app/(main)/monitoring-sesi/page.tsx`: Penambahan state filter (pencarian, status, kelas), toolbar pencarian, tab status, dan interaktivitas kartu metrik.
  - `apps/tests/exam-monitoring.test.ts`: Penambahan pengujian unit untuk memvalidasi keberadaan kontrol filter dan pencarian.
- **Out-of-Scope**:
  - Mengubah skema database Convex atau query backend (seluruh pemfilteran dilakukan secara reaktif dan instan di sisi klien pada data peserta sesi yang aktif).

## 3. Bukti & Berkas Terkait
- Kebutuhan pengajar dalam memantau sesi dengan skala peserta banyak dan beragam kelas tanpa kebingungan.
- Berkas terkait:
  - `apps/app/(main)/monitoring-sesi/page.tsx`
  - `apps/lib/exam-monitoring.ts`
  - `apps/tests/exam-monitoring.test.ts`

## 4. Kebutuhan Implementasi Terurut Dependensi
1. **Langkah 1**: Perbarui `apps/app/(main)/monitoring-sesi/page.tsx`:
   - Tambahkan state `searchQuery`, `statusFilter`, dan `classFilter`.
   - Hitung daftar unik kelas yang ada pada sesi (`availableClasses`).
   - Saring `ordered` menjadi `filteredParticipants` berdasarkan pencarian, kelas, dan status.
   - Buat kartu ringkasan di atas interaktif (`onClick` mengubah `statusFilter`).
   - Tambahkan bilah toolbar (Pencarian + Select Kelas + Segmented Button Status) di atas tabel/kartu peserta.
   - Sediakan tampilan keadaan kosong saat filter tidak menemukan hasil beserta tombol reset filter.
2. **Langkah 2**: Tambahkan pengujian unit di `apps/tests/exam-monitoring.test.ts` yang memvalidasi elemen filter status, kelas, dan kotak pencarian pada monitoring sesi.
3. **Langkah 3**: Jalankan `npm test --prefix apps`, `npm run typecheck --prefix apps`, dan `npm --prefix apps run test:ui-leak`.

## 5. Kriteria Penerimaan yang Terukur
1. Pengajar dapat memfilter daftar peserta berdasarkan status (Semua, Sedang Mengerjakan, Telah Selesai, Terkunci).
2. Pengajar dapat menyaring santri berdasarkan kelas rombel melalui dropdown kelas.
3. Pengajar dapat mencari santri secara instan berdasarkan nama atau NISN.
4. Kartu ringkasan di bagian atas dapat diklik sebagai jalan pintas (*shortcut*) filter status.
5. Seluruh rangkaian pengujian unit (410+ tes) lulus 100%.
6. TypeScript check `tsc --noEmit` lolos bersih.
7. Nihil kebocoran kode spesifikasi teknis dan nihil emoji.

## 6. Pertimbangan Risiko & Kompatibilitas
- Risiko rendah karena komputasi filter dilakukan melalui `React.useMemo` di memori klien dari daftar peserta yang sudah dimuat.
- Sangat responsif dan instan tanpa ada round-trip latensi jaringan ke server.

## 7. Perintah Validasi Repositori
- `node --test apps/tests/exam-monitoring.test.ts`
- `npm test --prefix apps`
- `npm run typecheck --prefix apps`
- `npm --prefix apps run test:ui-leak`
