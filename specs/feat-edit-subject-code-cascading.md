# FEAT — Sunting Kode Mata Pelajaran dengan Pembaruan Beruntun (Cascading Update)

## Deskripsi Fitur

Memungkinkan pengajar menyunting kode mata pelajaran (`code`, misalnya `FIQIH`, `B_ARAB`) selain nama dan deskripsi melalui modal dialog sunting di `/mata-pelajaran`. Apabila kode diubah pada mata pelajaran yang telah digunakan oleh satu atau beberapa paket bank soal, sistem secara otomatis melakukan pembaruan beruntun (*cascading update*) pada seluruh baris `questionBanks` terkait dalam satu transaksi atomik Convex sehingga integritas data tetap terjaga sempurna.

**Cerita Pengguna**: Sebagai pengajar atau admin kurikulum madrasah, saya ingin dapat membetulkan atau menyelaraskan kode mata pelajaran yang salah ketik atau diperbarui tanpa merusak paket-paket bank soal yang sudah terhubung dengan mata pelajaran tersebut.

---

## Ruang Lingkup

### Dalam Cakupan (In Scope)
1. **Backend Convex (`apps/convex/bank/public/mutations.ts`)**:
   - Memperluas mutasi `renameSubject` (atau `updateSubject`) agar menerima argumen opsional `code: v.optional(v.string())`.
   - Normalisasi kode baru menggunakan `normalizeSubjectCode(code)`.
   - Validasi keunikan: memastikan kode baru belum dipakai oleh mata pelajaran lain (kecuali dirinya sendiri).
   - *Cascading Update*: jika kode berubah (`newCode !== subject.code`), kueri semua baris `questionBanks` dengan `subjectCode === oldCode` dan perbarui `subjectCode` mereka menjadi `newCode`.
   - Mutasi mengembalikan riwayat jumlah paket yang diperbarui.
2. **Frontend Dialog (`apps/components/bank-soal/rename-subject-dialog.tsx`)**:
   - Mengubah pemicu tombol dari sekadar teks `Ganti nama` menjadi `Sunting` dengan ikon `PencilIcon`.
   - Menambahkan input isian untuk `Kode Mata Pelajaran` (uppercase font-mono).
   - Menampilkan indikator informasi kontekstual:
     - Jika belum dipakai: *"Kode singkat unik. Belum ada paket yang terhubung."*
     - Jika sudah dipakai: *"Perubahan kode akan otomatis disinkronkan ke {bankCount} paket bank soal terkait."*
   - Menampilkan badge jumlah paket pemakai dan status aktif/nonaktif di dalam header dialog.
3. **Layar Kelola Mata Pelajaran (`apps/app/(main)/mata-pelajaran/page.tsx`)**:
   - Memasukkan `bankCount` ke properti dialog sunting.
   - Merapikan baris aksi pada tabel desktop dan kartu mobile agar konsisten.
4. **Pengujian (`apps/tests/subject-management.test.ts`)**:
   - Memperbarui pengujian penjaga arsitektur: menegaskan mutasi kini mendukung pembaharuan kode secara aman dengan cascading update ke `questionBanks`.
   - Memastikan pengujian memvalidasi pencegahan konflik kode ganda dan normalisasi kode.

### Di Luar Cakupan (Out of Scope)
- Mengubah struktur tabel `examSessions` (karena sesi ujian merujuk ke `bankId`, bukan `subjectCode`, sehingga perubahan `subjectCode` pada `questionBanks` sudah otomatis aman bagi sesi ujian).
- Penggabungan (*merge*) dua mata pelajaran yang berbeda menjadi satu.

---

## Bukti & Keadaan Saat Ini

- Pada `apps/convex/schema.ts`, tabel `questionBanks` memiliki indeks `.index("by_subject", ["subjectCode"])`.
- Pada `apps/convex/bank/public/mutations.ts:554` (`renameSubject`), fungsi saat ini sengaja mengunci kode dan hanya mem-patch `name` dan `description`.
- Pada `apps/components/bank-soal/rename-subject-dialog.tsx`, dialog hanya memiliki input `name` dan `description`, dengan teks statis `Kode {subject.code} tetap karena ia pengenal paket yang sudah ada`.
- Pada `apps/tests/subject-management.test.ts:140-144` dan `277-282`, unit test menguji penguncian kode tersebut sebagai invariant lama.

---

## Berkas Terkait

- `apps/convex/bank/public/mutations.ts`: Pembaruan logika `renameSubject` dengan cascading update pada `questionBanks`.
- `apps/components/bank-soal/rename-subject-dialog.tsx`: Form edit interaktif untuk nama, kode, dan deskripsi dengan indikator dampak pemakaian paket.
- `apps/app/(main)/mata-pelajaran/page.tsx`: Penyesuaian pemanggilan dialog sunting pada tabel desktop dan kartu mobile.
- `apps/tests/subject-management.test.ts`: Pembaruan assertions untuk fitur edit kode dan cascading update.
- `specs/e2e/kelola-mata-pelajaran.md`: Pembaruan skenario E2E pengujian sunting kode mata pelajaran.

---

## Persyaratan Implementasi Berurutan

1. **Backend Mutation Enhancement**:
   - Di `apps/convex/bank/public/mutations.ts`, perbarui skema validator argumen `renameSubject` untuk menambahkan `code: v.optional(v.string())`.
   - Jika `args.code` dikirim dan berbeda dengan `subject.code`:
     - Normalisasi dengan `normalizeSubjectCode(args.code)`.
     - Validasi keabsahan format kode tidak boleh kosong.
     - Cek apakah kode baru sudah digunakan oleh dokumen `subjects` lain. Jika ya, lemparkan pesan error yang jelas.
     - Ambil seluruh `questionBanks` dengan `by_subject` sama dengan `subject.code`, lalu `ctx.db.patch` setiap `questionBank` dengan `subjectCode: newCode`.
     - Simpan `code: newCode` pada dokumen `subjects`.
2. **Komponen Dialog UI (`RenameSubjectDialog` / Sunting Mata Pelajaran)**:
   - Tambahkan state `code` di dalam dialog dengan inisialisasi dari `subject.code`.
   - Tambahkan input field Kode Mata Pelajaran dengan styling `font-mono uppercase`.
   - Tambahkan props `bankCount: number` dan badge status ke dialog.
   - Ganti teks tombol trigger dari sekadar `Ganti nama` menjadi `Sunting` dengan `PencilIcon`.
   - Berikan teks edukatif mengenai dampak cascading update bila kode diubah.
3. **Integrasi Halaman (`apps/app/(main)/mata-pelajaran/page.tsx`)**:
   - Lewatkan `bankCount={subject.bankCount}` ke dalam `<RenameSubjectDialog>`.
   - Perbarui handler `handleRename` agar menerima `(nextName, nextDescription, nextCode)`.
4. **Penyesuaian & Penambahan Pengujian Unit**:
   - Sesuaikan pengujian di `apps/tests/subject-management.test.ts` untuk memverifikasi kemampuan baru ini: cascading update ke `questionBanks`, penolakan kode duplikat saat edit, dan ketersediaan input kode pada dialog.

---

## Kriteria Penerimaan Terukur

1. Pengajar dapat membuka modal "Sunting" pada mata pelajaran mana pun.
2. Mengubah nama atau deskripsi tanpa mengubah kode berjalan sukses seperti sebelumnya.
3. Mengubah kode mata pelajaran (misal dari `FIQIH` ke `FIQIH_DASAR`):
   - Jika kode baru sudah dipakai mata pelajaran lain, sistem menampilkan pesan error dan membatalkan simpan.
   - Jika kode valid dan belum dipakai, kode berhasil diubah, dan seluruh paket bank soal yang sebelumnya berkode `FIQIH` otomatis terbarui menjadi `FIQIH_DASAR`.
4. Dialog menampilkan peringatan ramah yang memberitahukan berapa paket bank soal yang akan ikut terbarui kodenya.
5. Seluruh suite pengujian otomatis (`npm test`) berhasil tanpa regresi (100% pass).
6. TypeScript typecheck (`npm run typecheck`) bersih tanpa kesalahan ketik.
7. Tidak ada kebocoran kode teknis (`SCR-*`, `TASK-*`, dll.) maupun penggunaan emoji pada antarmuka.

---

## Penilaian E2E

- **Rekomendasi**: `Recommended`
- **Alasan**: Fitur ini melibatkan perubahan data beruntun (*cascading state*) pada level basis data yang tercermin langsung pada tampilan tabel mata pelajaran dan daftar bank soal.
- **Skenario Pengujian**:
  1. Login sebagai pengajar, buka `/mata-pelajaran`.
  2. Klik tombol "Sunting" pada mata pelajaran yang memiliki paket soal.
  3. Ubah kode singkat mata pelajaran, simpan, dan verifikasi bahwa toast sukses muncul serta kode baru tampil di tabel.
  4. Buka `/bank-soal`, verifikasi paket soal terkait tetap terhubung dengan mata pelajaran tersebut dan menampilkan filter kode yang sesuai.

---

## Perintah Validasi

- `npx convex dev --once`: Memvalidasi sinkronisasi mutasi dan fungsi Convex.
- `npm test`: Menjalankan seluruh rangkaian unit test dan architecture guards.
- `npm run typecheck`: Menjamin kepatuhan tipe TypeScript di seluruh aplikasi.
- `npm --prefix apps run test:ui-leak`: Memastikan tidak ada kebocoran token teknis atau emoji di antarmuka.
