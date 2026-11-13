# Specification: CHG-002 Sunting dan gandakan butir soal serta pengatur jumlah opsi jawaban

## Problem & Desired Behavior

- **Problem**: Paket bank soal hanya menerima butir baru. Butir yang tersimpan tidak dapat dibuka kembali untuk diperbaiki — koreksi satu huruf berarti menghapus lalu menulis ulang — dan tidak ada jalur penyimpanan perubahan butir di backend. Formulir opsi jawaban mengunci empat opsi tetap (A sampai D) tanpa tombol tambah/kurang, sehingga butir dengan pengecoh lima tidak dapat dibuat padahal kebutuhan produknya menyatakan opsi E opsional.
- **Desired Behavior**:
  1. Pengajar menekan "Sunting" pada baris butir yang sudah tersimpan; formulir terisi ulang dengan isi butir tersebut, judul kartu berubah menjadi "Sunting Butir Soal", tombol utama menjadi "Simpan perubahan", fokus pindah ke judul kartu, dan nomor urut butir tidak berubah setelah disimpan.
  2. Pengajar menekan "Batal" untuk kembali ke mode tambah butir baru.
  3. Pengajar menekan "Gandakan"; salinan utuh muncul di akhir daftar paket yang sama dengan nomor urut baru, tanpa membuka formulir, disertai umpan balik singkat bahwa salinan siap disunting.
  4. Jumlah opsi jawaban dapat ditambah atau dikurangi antara dua sampai lima (A sampai E) pada soal pilihan ganda dan PG kompleks, termasuk saat menyunting butir. Mengurangi opsi yang sedang menjadi kunci jawaban memindahkan kunci ke opsi terakhir yang tersisa, bukan menghilangkan kunci.
  5. Paket yang sedang dipakai sesi ujian berstatus aktif menolak sunting, gandakan, dan hapus butir dengan kalimat yang bisa dipahami, dan aksi tersebut ditampilkan dinonaktifkan dengan teks pendamping pada daftar butir.
  6. Upaya menyunting butir milik paket pengajar lain, dan pemanggil tanpa login, ditolak server.
  7. Tidak ada kode spesifikasi teknis (`*-FR-*`, `*-AC-*`, `CHG-*`, `Fase *`) pada teks antarmuka, dan tidak ada emoji (memakai ikon Lucide).

## Sumber Kebutuhan

- Item eksekusi: `CHG-002` pada `.planora/EXECUTION/TODO.md` (Fase 01, workflow `feature`).
- Requirements: `BANK-FR-002`, `BANK-FR-009`, `BANK-AC-003`, `BANK-AC-010`, `BANK-AC-011`.
- Kontrak UI: `.planora/UI/screens/penulisan-soal-cepat.md` (butir 2, 5), `.planora/UI/components/penulisan-soal-dan-mapel.md` (butir 7, 8), `.planora/UI/patterns/penulisan-soal-massal.md` (pola satu ajakan per layar, pola nonaktifkan bukan hapus), `.planora/UI/design-direction.md` dan `.planora/UI/content-guidelines.md`.

## Scope

- **In scope**: mutasi sunting & gandakan butir, gerbang sesi aktif, helper validasi butir yang dipakai bersama, query kunci sunting milik-pemilik, formulir butir dengan pengatur jumlah opsi, aksi per baris sunting/gandakan, tes unit & integrasi, handoff E2E.
- **Out of scope**: tempelan massal dan unduh template (`CHG-003`, `CHG-006`), kelola mata pelajaran & jenjang (`CHG-004`), kolom pembahasan serta penanda tingkat berpikir/capaian (`CHG-005`), penataan ulang nomor urut dengan drag, unggah gambar, dan perubahan skema apa pun.

## Relevant Files

- `apps/convex/bank/private/helpers.ts`: tempat helper kepemilikan paket, gerbang sesi aktif, validasi badan butir, dan penomoran berikutnya (saat ini hanya ulang-alik `requireAuthenticatedUser`).
- `apps/convex/bank/public/mutations.ts`: `createQuestion` dipakai ulang helpernya; tambah `updateQuestion` dan `duplicateQuestion`; `deleteQuestion` mendapat gerbang sesi aktif.
- `apps/convex/bank/public/queries.ts`: tambah `getBankActiveLock` (owner-scoped, kosong untuk anonim) agar daftar butir dapat menonaktifkan aksi dengan alasan.
- `apps/lib/question-options.ts` (baru): logika murni daftar opsi — label A–E, tambah, kurangi, relokasi kunci, normalisasi saat mengisi formulir sunting.
- `apps/components/bank-soal/question-options-editor.tsx` (baru): blok daftar opsi + tombol tambah/kurang, dipakai bersama oleh mode kunci tunggal dan kunci majemuk.
- `apps/components/bank-soal/question-row.tsx` (baru): kartu butir tersimpan beserta aksi sunting/gandakan/hapus.
- `apps/app/(main)/bank-soal/[id]/page.tsx`: state sunting, pengisian ulang formulir, fokus judul kartu, tombol "Simpan perubahan"/"Batal", teks pendamping kunci sunting.
- `apps/tests/question-edit-duplicate.test.ts` (baru): tes unit `lib/question-options.ts` + penjaga struktur backend.
- `specs/e2e/question-edit-duplicate.md` (baru): handoff browser.

## Dependency-Ordered Implementation Requirements

1. **Helper backend (`convex/bank/private/helpers.ts`)** — lebih dulu, karena mutasi bergantung padanya.
   - `requireOwnedBank(ctx, bankId)` memuat paket, menolak tanpa login, menolak bukan pemilik.
   - `getActiveSessionForBank(ctx, bankId)` memakai indeks `by_bank` pada `examSessions` dan menyaring `status === "active"`.
   - `requireBankEditable(ctx, bankId)` memanggil keduanya dan menolak dengan kalimat: paket sedang dipakai sesi "<judul>" yang sedang berjalan.
   - `validateQuestionBody(type, options, points)` memindahkan aturan kunci jawaban yang kini ada di `createQuestion` (opsional ≥2 untuk PG dengan tepat satu kunci; PG kompleks ≥3 opsi dan ≥2 kunci; benar/salah tepat 2 opsi dan tepat 1 kunci; essay tanpa opsi), mengembalikan pesan galat atau `null`.
   - `nextOrderNumber(ctx, bankId)` = `max(orderNumber) + 1`, bukan `jumlah butir + 1`. **Alasan**: setelah butir boleh dihapus, `length + 1` menghasilkan nomor urut ganda.
2. **Mutasi (`convex/bank/public/mutations.ts`)**.
   - `createQuestion`: validasi lewat helper, penomoran lewat `nextOrderNumber`, perilaku sukses tetap sama.
   - `updateQuestion(args: { questionId, ...isi butir })`: muat butir → `requireBankEditable` pada `question.bankId` → validasi → `patch` tanpa menyentuh `bankId` dan `orderNumber`, `updatedAt` diperbarui.
   - `duplicateQuestion(args: { questionId })`: muat butir sumber → `requireBankEditable` → `insert` salinan dengan `orderNumber = nextOrderNumber`, salinan utuh termasuk stimulus, opsi, dan rubrik; balikan `Id<"questions">` baru.
   - `deleteQuestion`: tambahkan `requireBankEditable` sebelum hapus (`BANK-AC-003` mencakup hapus).
3. **Query kunci (`convex/bank/public/queries.ts`)** — `getBankActiveLock({ bankId })` mengembalikan `{ sessionId, title } | null`, hanya untuk pemilik paket; anonim dan bukan pemilik memperoleh `null`, mengikuti pola `getQuestionBank`.
4. **Logika opsi murni (`apps/lib/question-options.ts`)** — dipakai layar dan dites tanpa browser: `MAX_OPTIONS = 5`, `MIN_OPTIONS = 2`, `optionLabel(index)`, `addOption(list)`, `removeOption(list, index)`, `resolveOptions(question)` untuk memuat butir tersimpan ke dalam state formulir.
5. **Komponen editor opsi** — tombol tambah/kurang berikon `PlusIcon`/`MinusIcon`, batas bawah dan atas menonaktifkan tombol dengan `title` penjelas, label opsi A–E, dan badge "Kunci" tetap berlabel teks.
6. **Halaman editor** — `editingId` sebagai state; `startEdit(q)` mengisi seluruh state formulir dari `q` dan memindahkan fokus ke judul kartu (`ref` + `tabIndex={-1}`); `handleSaveQuestion` bercabang ke `updateQuestion` atau `createQuestion` lalu keluar dari mode sunting; satu aksi utama per keadaan (tombol submit tetap satu), sunting/gandakan/hapus berwujud aksi sekunder.
7. **Daftar butir** — baris memakai komponen baru; saat paket terkunci sesi aktif, tiga aksi baris dinonaktifkan dan satu teks pendamping muncul di atas daftar: menyebut judul sesi yang berjalan.
8. **Risiko regresi**: `saveStudentAnswer` dan lembar ujian santri membaca `questions` yang sama — tidak ada perubahan skema sehingga tidak ada migrasi; penghapusan butir pada sesi yang sudah berakhir tetap mungkin dan sudah menjadi perilaku lama (dicatat sebagai risiko tersisa, bukan diperluas di sini).

## Risk, Compatibility, Security

- Tanpa perubahan skema → nol dampak migrasi; fungsi yang sudah berjalan tidak berganti tanda tangan.
- Nomor urut tidak boleh ikut berubah saat sunting; `duplicateQuestion` tidak boleh menyisip di tengah daftar.
- Otorisasi selalu dari `ctx.auth`, dan id paket/butir dari pemanggil diverifikasi ke pemiliknya sebelum tulis (`convex-authz` bentuk (b) dan (d)).
- Query kunci bersifat owner-scoped dan tidak memulangkan data santri maupun kunci jawaban.

## Acceptance Criteria Terukur

- `BANK-AC-003`: sunting/hapus/gandakan pada paket dengan sesi `active` ditolak server dengan pesan berisi judul sesi; tanpa sesi aktif berhasil.
- `BANK-AC-010`: sunting menyimpan perubahan dengan `orderNumber` sama dan `bankId` sama; gandakan menambah satu butir bernomor terakhir di paket yang sama.
- `BANK-AC-011`: jumlah opsi dapat diubah 2..5 pada PG, PG kompleks, dan formulir sunting; di luar rentang itu tombol tidak dapat dipakai.
- `BANK-FR-002`: opsi kelima berlabel E dapat disimpan dan terbaca kembali.
- Pemanggil anonim dan pengajar bukan pemilik ditolak pada `updateQuestion`, `duplicateQuestion`, dan `deleteQuestion`.

## Testing Strategy

- **Static**: `npx convex dev --once` (wajib `Convex functions ready!`), `npm run typecheck`, `npm run lint` (baseline 0 error/48 warning), `npm run build`.
- **Unit** (`apps/tests/question-edit-duplicate.test.ts`): tambah opsi sampai lima dan berhenti di lima; kurangi sampai dua dan berhenti di dua; mengurangi opsi kunci memindahkan kunci; opsi ke-X berlabel benar; `resolveOptions` untuk butir tersimpan tanpa opsi (essay/benar-salah) tidak melempar; validasi badan butir menolak nol kunci dan multi-kunci pada PG.
- **Integration** (probe CLI pada deployment dev, dua arah): `updateQuestion` dan `duplicateQuestion` ditolak tanpa `--identity`; berhasil sebagai pemilik; ditolak sebagai identitas lain; `deleteQuestion`/`updateQuestion` ditolak saat paket punya sesi `active`.
- **Regression**: `npm test` menyeluruh, `tests/ui-leakage.test.ts`, `tests/convex-public-authz.test.ts` (fungsi publik baru harus mengautentikasi).
- **E2E**: `Recommended` — spesifikasi lihat bagian di bawah.

## E2E Assessment

- **Recommendation**: Recommended (bukan journeys autentikasi/penilaian; pembuktian runtime sudah tertutup probe CLI Convex).
- **Scenarios**: sunting butir lalu cek nomor urut tidak berubah; gandakan dan salinan muncul di akhir daftar; tambah/kurang opsi 2..5; kunci berpindah saat opsi kunci dihapus; daftar butir pada paket bersesi aktif menampilkan aksi dinonaktifkan beserta teks pendamping; layar ponsel aksi baris tetap tersentuh.
- **Preconditions**: login `http://localhost:3000` sebagai `pengajar.uji@example.com`, satu paket milik akun itu berisi minimal satu butir, satu paket lain punya sesi berstatus `active`.
- **Execution**: ditangguhkan ke `/e2e-tester` sesuai kebijakan workflow `feature`.

## Validasi Perintah

- `npx convex dev --once`: fungsi baru terdeploi dan kodegen cocok.
- `npm test`: unit logika opsi + penjaga struktur + kebocoran UI lulus.
- `npm run typecheck && npm run lint && npm run build`: kompilasi bersih dan rute tetap terbentuk.
- `npx convex run 'bank/public/mutations:updateQuestion' '{...}'` tanpa dan dengan `--identity`: membuktikan gerbang autentikasi dua arah.

## Completion Criteria

- Sunting, gandakan, dan pengatur jumlah opsi berfungsi sesuai lima kriteria penerimaan di atas dengan bukti perintah.
- Tidak ada kebutuhan atau kriteria yang dilonggarkan untuk menyatakan selesai; sisa risiko (nomor urut pada sesi berakhir yang menyimpan jawaban, 48 warning lint baseline, E2E belum jalan) dilaporkan apa adanya.
- `CHG-002` di TODO, `phases/phase-01-bank-soal.md`, dan `release-readiness.md` diperbarui dengan bukti nyata.
