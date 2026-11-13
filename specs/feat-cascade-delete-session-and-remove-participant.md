# Spesifikasi: Hapus Bersih Sesi Ujian (Cascade Delete) & Pengeluaran Peserta di Monitoring Sesi

## 1. Definisi Masalah & Perilaku yang Diharapkan
- **Masalah**:
  1. Pada halaman Jadwal Sesi Ujian (`apps/app/(main)/sesi-ujian/page.tsx`), tombol hapus sesi (`Trash2Icon`) tidak terlihat pada kartu sesi yang berstatus selesai/telah berakhir. Tombol status (`Buka Kembali`) menggunakan kelas `w-full` (100%) di dalam kontainer flex, sehingga mendesak tombol hapus keluar dari area tampak kartu.
  2. Di backend Convex (`apps/convex/examSession/public/mutations.ts`), mutasi `deleteExamSession` hanya menghapus dokumen di tabel `examSessions`, namun tidak menghapus rekaman peserta (`examParticipants`) maupun rekaman jawaban santri (`studentAnswers`) yang terikat pada sesi tersebut. Hal ini meninggalkan data yatim (*orphaned records*) di basis data.
  3. Pada halaman Monitoring Sesi (`apps/app/(main)/monitoring-sesi/page.tsx`), belum ada mekanisme bagi pengajar untuk menghapus atau mengeluarkan peserta uji coba secara individual tanpa menghapus seluruh sesi ujian.

- **Perilaku yang Diharapkan**:
  1. **Tombol Hapus Sesi di `/sesi-ujian`**:
     - Tombol status sesi (`Aktifkan Sesi`, `Tutup Sesi`, `Buka Kembali`) menggunakan kelas `flex-1` alih-alih `w-full`, sehingga tombol **Hapus Sesi** (ikon tempat sampah merah) selalu tampil berdampingan secara proporsional dan jelas terlihat pada setiap kartu sesi.
     - Saat tombol hapus diklik, muncul dialog konfirmasi yang menegaskan bahwa seluruh data peserta dan jawaban terkait akan ikut dihapus permanen.
  2. **Cascade Delete di Backend Convex**:
     - Mutasi `deleteExamSession` menghapus seluruh `studentAnswers` dari setiap peserta sesi tersebut, kemudian menghapus seluruh `examParticipants` yang terikat pada `sessionId`, dan terakhir menghapus dokumen `examSessions`.
  3. **Aksi Keluarkan Peserta di `/monitoring-sesi`**:
     - Ditambahkan mutasi baru `removeSessionParticipant` di Convex yang mengautentikasi pengajar pemilik sesi, memvalidasi peserta, lalu menghapus seluruh `studentAnswers` peserta tersebut dan menghapus rekaman `examParticipants`.
     - Pada tabel desktop dan kartu mobile di `/monitoring-sesi`, disediakan tombol aksi hapus/keluarkan peserta dengan konfirmasi konfirmasi aman: *"Keluarkan [Nama Santri] ([NISN]) dari sesi ini? Seluruh jawaban santri pada sesi ini akan dihapus."*

## 2. In / Out of Scope
- **In-Scope**:
  - `apps/convex/examSession/public/mutations.ts`: Pembaruan `deleteExamSession` dengan cascade delete dan penambahan mutasi `removeSessionParticipant`.
  - `apps/app/(main)/sesi-ujian/page.tsx`: Penataan tombol aksi kartu sesi (`flex-1`) dan pemastian keterlihatan tombol hapus.
  - `apps/app/(main)/monitoring-sesi/page.tsx`: Penambahan aksi keluarkan peserta pada tabel dan kartu santri.
  - Penambahan uji unit di `apps/tests/` untuk memverifikasi logika cascade delete dan keberadaan aksi di UI.
- **Out-of-Scope**:
  - Mengubah skema tabel atau indeks basis data di `schema.ts`.
  - Mengubah alur pengerjaan ujian santri di `ExamWorksheet.tsx`.

## 3. Bukti & Berkas Terkait
- Tangkapan layar dari pengguna (`media_1794030227534_73250e7e.png`) menunjukkan kartu sesi `adab akhlaq` dengan bank soal terhapus dan tombol aksi `Buka Kembali` yang memenuhi seluruh baris footer tanpa tombol hapus.
- Berkas terkait:
  - `apps/convex/examSession/public/mutations.ts`
  - `apps/app/(main)/sesi-ujian/page.tsx`
  - `apps/app/(main)/monitoring-sesi/page.tsx`
  - `apps/tests/sesi-ujian-ui.test.ts`
  - `apps/tests/exam-monitoring.test.ts`

## 4. Kebutuhan Implementasi Terurut Dependensi
1. **Langkah 1**: Perbarui `apps/convex/examSession/public/mutations.ts`:
   - Di `deleteExamSession`: tambahkan cascade delete untuk `studentAnswers` dan `examParticipants`.
   - Tambahkan mutasi `removeSessionParticipant` dengan validasi autentikasi dan kepemilikan sesi.
2. **Langkah 2**: Jalankan `npx convex dev --once` dari direktori `apps/` untuk memvalidasi fungsi backend Convex.
3. **Langkah 3**: Perbarui `apps/app/(main)/sesi-ujian/page.tsx`:
   - Ubah `className="w-full text-xs gap-1.5"` pada tombol status kartu menjadi `className="flex-1 text-xs gap-1.5"`.
4. **Langkah 4**: Perbarui `apps/app/(main)/monitoring-sesi/page.tsx`:
   - Tambahkan mutasi `removeSessionParticipant` dan fungsi `handleRemoveParticipant`.
   - Tambahkan tombol aksi hapus pada kolom aksi tabel dan kartu mobile.
5. **Langkah 5**: Tambahkan pengujian unit di `apps/tests/` untuk memvalidasi fitur hapus sesi dan keluarkan peserta.
6. **Langkah 6**: Jalankan seluruh validasi pengujian repositori (`npm test --prefix apps`, `npm run typecheck --prefix apps`, dan `test:ui-leak`).

## 5. Kriteria Penerimaan yang Terukur
1. Tombol hapus sesi (ikon tempat sampah merah) tampak jelas di setiap kartu sesi ujian di `/sesi-ujian`.
2. Menghapus sesi ujian menghapus bersih dokumen sesi beserta semua peserta dan jawaban terkait dari basis data.
3. Pengajar dapat mengeluarkan santri individual dari halaman monitoring sesi dengan konfirmasi aman.
4. Seluruh pengujian unit (410+ tes) lulus 100%.
5. TypeScript check `tsc --noEmit` lolos tanpa kesalahan.
6. `npx convex dev --once` menghasilkan pesan `Convex functions ready!`.
7. Nihil kebocoran kode spesifikasi teknis dan nihil emoji.

## 6. Pertimbangan Risiko & Keamanan
- Autentikasi dan otorisasi ketat: hanya pengajar pembuat sesi (`session.creatorTokenIdentifier === user.tokenIdentifier`) yang dapat menghapus sesi atau mengeluarkan peserta.
- Kotak konfirmasi peramban mencegah klik tidak sengaja.

## 7. Perintah Validasi Repositori
- `npx convex dev --once` (di `apps/`)
- `node --test apps/tests/sesi-ujian-ui.test.ts`
- `npm test --prefix apps`
- `npm run typecheck --prefix apps`
- `npm --prefix apps run test:ui-leak`
