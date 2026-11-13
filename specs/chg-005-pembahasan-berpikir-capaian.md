# CHG-005 — Pembahasan butir, penanda tingkat berpikir, dan rujukan capaian materi

## Deskripsi fitur

Pengajar dapat menuliskan pembahasan yang hanya terbaca di sisi pengajar, menandai tingkat berpikir butir, dan menuliskan label rujukan capaian materi pada formulir butir maupun lewat tempelan teks. Ketiganya opsional, tersimpan bersama butirnya, tampil pada pratinjau impor dan lembar koreksi, dan tidak pernah sampai ke perangkat santri.

**Cerita pengguna**: sebagai pengajar yang mengoreksi essay dan membaca hasil ujian per pokok bahasan, saya ingin menyimpan pembahasan serta menandai level kognitif dan cakupan materi tiap butir, supaya koreksi punya rujukan yang tetap dan hasil ujian dapat dibaca per cakupan materi tanpa daftar kurikulum baku.

## Requirements

- Sumber: `.planora/EXECUTION/TODO.md` `CHG-005`; PRD `BANK-FR-014`, `BANK-FR-015`; kriteria penerimaan `BANK-AC-016`, `BANK-AC-017`, `BANK-AC-018`; `NFR-SEC-007`; kontrak UI `UI/screens/penulisan-soal-cepat.md`, `UI/components/penulisan-soal-dan-mapel.md` butir 13-15, `UI/patterns/penulisan-soal-massal.md`
- Kriteria penerimaan (verbatim dari TODO): formulir butir punya kolom pembahasan khusus pengajar, dropdown tingkat berpikir dengan bawaan belum ditandai, dan isian rujukan capaian yang menyarankan label milik mata pelajaran paket; ketiganya tersimpan dan kembali utuh saat butir dibuka lagi; butir lama tanpa penanda tetap terbaca dan ternilai normal; sunting penanda tidak mengubah nomor urut, bobot, maupun skor; panel pratinjau santri dan lembar ujian santri tidak pernah menampilkan pembahasan; query Convex yang melayani ruang ujian tidak memulangkan kolom pembahasan sebelum santri mengumpulkan.
- **Di luar cakupan**: kolom lembar kerja `pembahasan`/`berpikir`/`capaian` beserta unduhan template (`CHG-006`, yang memakai tempat tersimpan dari perubahan ini); analisis mutu butir, daya serap, dan sebaran pengecoh (`CHG-010`); pengelolaan daftar label capaian tersendiri dengan ganti nama massal — pada tahap ini label adalah teks pendek per butir yang disarankan dari label yang sudah dipakai mata pelajaran yang sama; riwayat perubahan penanda.

## Bukti / keadaan saat ini

- `questions` (`apps/convex/schema.ts:38`) hanya memuat tipe, stimulus, teks, bobot, opsi, dan rubrik; tidak ada kolom pembahasan, tingkat berpikir, maupun capaian.
- Body butir dipakai bersama oleh tambah, sunting, dan impor di `apps/convex/bank/public/mutations.ts:21`, sehingga satu penambahan kolom berlaku untuk ketiga jalur.
- `getStudentExamSheet` (`apps/convex/examSession/public/queries.ts:164`) memetakan kolom soal satu per satu dan sudah membuang kunci serta rubrik; kolom baru tidak ikut selama pemetaan ini dipertahankan.
- `getParticipantAnswersForGrading` (`apps/convex/examSession/public/queries.ts:295`) mengembalikan butir lengkap khusus pemilik sesi dan menjadi satu-satunya jalur baca pengajar untuk koreksi.
- Formulir butir di `apps/app/(main)/bank-soal/[id]/page.tsx:394` belum punya ketiga kolom; panel Live Preview merender ulang isi formulir untuk simulasi santri.
- Penafsir tempelan (`apps/lib/question-import.ts`) belum mengenal penanda pembahasan, berpikir, dan capaian; pratinjau (`apps/components/bank-soal/question-import-preview.tsx`) belum menampilkan kolom itu.
- Lembar koreksi (`apps/app/(main)/rekap-nilai/koreksi/[id]/page.tsx:211`) menampilkan teks soal, opsi, dan rubrik, tetapi tidak punya tempat untuk pembahasan.

## Berkas terkait

- `apps/convex/model/thinking-levels.ts` (baru): kosakata baku empat tingkat berpikir + label "Belum ditandai", murni tanpa impor agar dipakai server, klien, dan `node --test`.
- `apps/convex/schema.ts`: `questions.explanation`, `questions.thinkingLevel`, `questions.achievementRef` — semuanya `v.optional` sehingga tidak ada migrasi dan butir lama tetap sah.
- `apps/convex/bank/public/mutations.ts`: `questionBodyFields` memuat tiga kolom baru (tambah, sunting, impor, dan ganda otomatis ikut).
- `apps/convex/bank/public/queries.ts`: `listAchievementLabels({ bankId })` — label capaian yang sudah dipakai mata pelajaran paket itu, untuk saran isian.
- `apps/convex/examSession/public/queries.ts`: `getParticipantAnswersForGrading` mengembalikan tiga kolom baru; `getStudentExamSheet` tidak berubah.
- `apps/lib/question-import.ts`: penanda `pembahasan:`, `berpikir:`, `capaian:`, validasi tingkat berpikir, dan payload impor.
- `apps/components/bank-soal/question-import-preview.tsx`: kolom pembahasan, berpikir, dan capaian pada tabel maupun kartu ponsel.
- `apps/app/(main)/bank-soal/[id]/page.tsx`: textarea pembahasan, Select tingkat berpikir, isian capaian dengan saran, pengisian ulang saat sunting, dan pemuatan saat menyimpan.
- `apps/app/(main)/rekap-nilai/koreksi/[id]/page.tsx`: blok pembahasan, tingkat berpikir, dan capaian pada kartu butir.
- `apps/tests/question-metadata.test.ts` (baru): unit kosakata, penafsiran penanda, dan penjaga sumber kebocoran.
- `specs/e2e/pembahasan-berpikir-capaian.md` (baru): handoff E2E.

## Urutan implementasi

1. **Kosakata** — `thinking-levels.ts`: kunci `mengingat`, `memahami`, `mengaplikasikan`, `menganalisis`; label berhuruf awal besar; `normalizeThinkingLevel` menerima beda besar-kecil huruf dan spasi tepi, menolak nilai lain; label "Belum ditandai" untuk nilai kosong. Tanpa impor apa pun.
2. **Skema dan tulis** — tambah tiga kolom `v.optional` pada `questions`; masukkan ke `questionBodyFields`; trim dan ubah string kosong menjadi `undefined` saat menulis; `duplicateQuestion` menyalin ketiganya.
3. **Query saran capaian** — `listAchievementLabels({ bankId })`: autentikasi, paket milik pemanggil, lalu kumpulkan `achievementRef` unik dari seluruh butir paket yang bermata pelajaran sama (lintas pengajar) dan urutkan. Tanpa tabel baru.
4. **Formulir** — textarea "Pembahasan (tidak dilihat santri)", Select "Tingkat berpikir" dengan bawaan "Belum ditandai", Input "Rujukan capaian materi" memakai `<datalist>` dari query saran; state reset dan `startEdit` memuat ketiganya; `buildBody` mengirim `undefined` untuk nilai kosong.
5. **Impor** — tiga penanda baris baru di penafsir, validasi tingkat berpikir sebagai baris bermasalah dengan alasan berposisi baris, `toImportPayload` membawa ketiganya, petunjuk format dan contoh ikut diperbarui; pratinjau menampilkan tiga kolom (kartu pada layar kecil).
6. **Koreksi** — query koreksi menambahkan tiga kolom; halaman koreksi menampilkan pembahasan, tingkat berpikir, dan capaian di kartu butir, dengan label teks dan tanpa mengubah alur penilaian.
7. **Tes dan handoff** — unit + penjaga sumber, probe CLI kepemilikan dan kebocoran santri, E2E `Required` ditangguhkan.

## Risiko

- Kolom baru dapat bocor ke santri bila suatu saat ada query yang mengembalikan dokumen `questions` apa adanya. Mitigasi: `getStudentExamSheet` tetap memetakan kolom satu per satu, ditambah tes penjaga sumber dan probe CLI yang memeriksa kunci respons.
- Label capaian berupa teks bebas per butir, sehingga mengganti nama satu label tidak merambat ke butir lain. Mitigasi: dicatat sebagai celah yang disadari; saran isian mendorong pemakaian label yang sama, dan penggantian massal menunggu keputusan produk.
- Penanda baru pada tempelan bisa bertabrakan dengan teks soal yang kebetulan diawali `pembahasan:`; mitigasi: penanda hanya dikenali sebagai baris utuh berpola `kata kunci:`/`kata kunci=`, ditulis apa adanya pada panel petunjuk, dan teks soal yang memuatnya di tengah kalimat tidak terpengaruh.
- Select dengan nilai kosong pada primitif Base UI; mitigasi: nilai kosong dipetakan ke sentinel "belum" di state dan dikembalikan ke `undefined` saat menyimpan.

## Kriteria penerimaan terukur

- Formulir butir menampilkan tiga kolom: pembahasan (dengan keterangan tidak dilihat santri), tingkat berpikir (bawaan "Belum ditandai", empat pilihan), capaian (menyarankan label mapel paket). Simpan lalu buka ulang → ketiganya kembali utuh; butir lama tanpa ketiganya tetap terbuka dan tersimpan normal.
- Menyunting hanya penanda → `orderNumber` dan `points` tidak berubah, dan nilai total peserta tidak berubah (probe CLI).
- Simulasi Live Preview dan `getStudentExamSheet` (sebelum maupun sesudah dikumpulkan) tidak memuat pembahasan/berpikir/capaian; `getParticipantAnswersForGrading` memuatnya dan halaman koreksi menampilkannya.
- Tempelan dengan `berpikir: sulit` → baris "Perlu perbaikan" dengan alasan yang menyebut baris ke-N; tempelan valid → ketiga kolom tampil pada pratinjau dan tersimpan.
- Tidak ada kode spesifikasi teknis pada teks antarmuka.

## Perintah validasi

- `npx convex dev --once`: kolom skema dan query baru terdeploi tanpa migrasi.
- `npm test`: unit kosakata, penafsir penanda, dan penjaga sumber kebocoran lulus.
- `npx convex run 'bank/public/mutations:createQuestion|updateQuestion' …` dengan `--identity`: membuktikan round-trip tiga kolom, nomor urut dan bobot tetap saat sunting penanda.
- `npx convex run 'examSession/public/queries:getStudentExamSheet' …` tanpa dan dengan `--identity`: membuktikan respons tidak memuat pembahasan.
- `npm run typecheck && npm run build`, `npm run lint`: bersih dari baseline.

## Penilaian E2E

- Rekomendasi: `Required` — menambah kolom pada formulir butir, mengubah pratinjau impor, dan mengubah lembar koreksi; kriteria "tidak pernah tampil di panel santri" dan "kembali utuh saat dibuka lagi" butuh bukti browser.
- Eksekusi: ditangguhkan ke `/e2e-tester` (otomasi peramban tidak diminta pada sesi ini); spesifikasi dibuat di `specs/e2e/pembahasan-berpikir-capaian.md`.
