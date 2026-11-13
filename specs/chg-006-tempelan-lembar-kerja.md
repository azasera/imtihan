# Spesifikasi Perubahan: Tempelan Baris Lembar Kerja dan Unduhan Template Kolom

- **ID**: `CHG-006`
- **Fase**: `phase-01`
- **Requirements**: `BANK-FR-012`, `BANK-FR-013`, `BANK-AC-014`, `BANK-AC-015`, `NFR-PERF-005`
- **Dependensi**: `CHG-003` (penafsir teks bernomor + layar pratinjau) dan `CHG-005` (kolom pembahasan, tingkat berpikir, capaian) — keduanya `done`.
- **Workflow**: `feature`, dengan dukungan `ui-design` dan `ui-review`.

## Masalah

Pengajar menyusun naskah soal di Excel atau Google Sheets, tetapi layar impor hanya memahami teks bernomor. Baris hasil salinan lembar kerja hari ini diberi alasan "belum dipetakan" per baris dan tidak pernah menjadi butir. Tidak ada template kolom yang bisa diunduh, sehingga pengajar harus menebak urutan kolom. Kolom pembahasan, tingkat berpikir, dan capaian yang sudah tersedia sejak `CHG-005` juga belum punya jalur masuk dari lembar kerja.

## Perilaku yang diinginkan

1. Satu kolom tempel dan satu tombol "Periksa tulisan" menerima dua bentuk naskah: teks bernomor dan baris lembar kerja berpisahkan tab. Bentuk dikenali otomatis; pengajar tidak memilih mode. Bila baris pertama atau paling sedikit dua baris tidak kosong memuat tab, pemetaan lembar kerja dipakai; bila tidak, teks bernomor dipakai.
2. Baris judul boleh ada atau tidak. Nama kolom dikenali tanpa peduli besar-kecil huruf. Tanpa baris judul, urutan kolom template dipakai: `soal, tipe, a, b, c, d, e, kunci, poin, pembahasan, berpikir, capaian, wacana`.
3. Kolom yang tidak dikenal pada baris judul diabaikan dengan keterangan pada ringkasan pratinjau, bukan menggagalkan impor.
4. Baris kosong dilewati. Baris yang memuat kolom lebih banyak daripada bentuk yang dikenali (misalnya sel tergabung atau tab di tengah kalimat) tetap tampil pada pratinjau dengan alasan yang menyebut baris ke berapa dan jumlah kolom yang ditemukan.
5. `tipe` menerima `pg`, `pg kompleks`, `benar/salah`, dan `essay` (kosong berarti `pg`). `kunci` menerima satu huruf untuk pilihan ganda, beberapa huruf berpisah koma/spasi untuk PG kompleks, dan `B`/`S` atau `benar`/`salah` untuk benar/salah. Kunci pada essay ditolak dengan alasan.
6. `poin`, `pembahasan`, `berpikir`, dan `capaian` memakai aturan yang sama dengan tempelan bernomor: bobot bawaan bila kosong, tingkat berpikir di luar empat pilihan menjadi baris bermasalah, label capaian lebih dari 80 karakter menjadi baris bermasalah.
7. `wacana` berlaku untuk baris itu dan baris-baris sesudahnya sampai isinya berubah, sehingga satu wacana untuk sepuluh baris cukup ditulis pada baris pertama.
8. Tombol "Unduh template kolom" mengunduh berkas TSV berisi baris judul dan satu contoh butir lengkap. Hasil unduhan dapat ditempel kembali apa adanya dan menghasilkan satu butir siap simpan dengan nilai yang sama.
9. Seluruh penafsiran berjalan di perangkat pengajar sebelum panggilan server; pratinjau, tombol simpan berhitung, dan penyimpanan bertahap memakai jalur yang sama dengan teks bernomor (tanpa backend baru).
10. Tempelan 200 baris selesai ditafsirkan seketika tanpa membekukan layar.

## Di luar cakupan

- Unggah berkas `.xlsx`/`.csv` (alur tetap salin-tempel; berkas tidak meninggalkan perangkat).
- Kolom `rubrik` pada lembar kerja — rubrik essay tetap ditulis lewat formulir sunting atau tempelan bernomor.
- Pengelolaan label capaian bersama dan penggantian nama massal (tercatat sebagai celah `CHG-005`).
- Perubahan skema atau mutasi Convex; jalur tulis `importQuestions` sudah menerima seluruh kolom metadata.

## Keadaan saat ini (bukti)

- `apps/lib/question-import.ts:264` memberi alasan "berpisahkan tab … belum dipetakan" untuk setiap baris bertab dan tidak pernah membuat butir.
- `apps/lib/question-import.ts:415` hanya menandai `looksLikeSpreadsheetRows` dengan hitungan baris bertab; tidak ada pemetaan kolom.
- `apps/components/bank-soal/question-import-panel.tsx:210` menampilkan "tempelan berpisahkan tab belum dipetakan" dan tidak ada tombol unduh template.
- `apps/tests/question-import.test.ts:293` dan `:514` mengunci perilaku lama tersebut, jadi keduanya harus diperbarui.
- `convex/bank/public/mutations.ts:263` (`importQuestions`) sudah menerima `explanation`, `thinkingLevel`, dan `achievementRef`; tidak perlu perubahan backend.

## Urutan implementasi

1. `apps/lib/question-import.ts`: kosakata kolom + pembangun teks template, deteksi bentuk, penafsir baris lembar kerja, hasil tafsiran diperluas (`format`, `headerDetected`, `ignoredColumns`), petunjuk format lembar kerja.
2. `apps/components/bank-soal/question-import-panel.tsx`: tombol "Unduh template kolom", petunjuk dua bentuk, pesan kosong yang menyebut kolom yang diharapkan, teruskan keterangan bentuk ke pratinjau.
3. `apps/components/bank-soal/question-import-preview.tsx`: keterangan bentuk terbaca, status baris judul, dan daftar kolom yang diabaikan pada ringkasan.
4. `apps/tests/question-import.test.ts`: ganti tes perilaku lama (tab "belum dipetakan") dengan perilaku baru.
5. `apps/tests/question-import-spreadsheet.test.ts`: tes baru deteksi, pemetaan kolom, validasi per baris, wacana, template, 200 baris, dan penjagaan sumber UI.
6. `specs/e2e/tempelan-lembar-kerja.md`: handoff perjalanan browser.

## Risiko dan mitigasi

- **Naskah bernomor dengan satu baris bertab** tetap dibaca sebagai teks bernomor; baris bertab itu ditandai per baris (bukan dilebur diam-diam). Tampilan keterangan bentuk membuat pemilihan mode terlihat.
- **Baris judul yang mirip nama kolom** (misalnya soal berbunyi "soal tipe") dapat salah dikenali sebagai judul. Mitigasi: baris dianggap judul hanya bila memuat minimal dua nama kolom yang dikenal dan pengajar melihat keterangan "baris judul dikenali" pada pratinjau.
- **Baris lebih panjang karena sel tergabung** tidak dipotong diam-diam; baris muncul sebagai baris bermasalah dengan jumlah kolom yang ditemukan.
- **Kompatibilitas Excel**: unduhan memakai UTF-8 dengan BOM agar teks Arab tampil benar; penafsir membuang BOM pada sel pertama sehingga tempel-balik tetap bersih.

## Kriteria penerimaan terukur

- Tempelan template yang diunduh (dengan BOM dibuang peramban) menghasilkan tepat 1 butir siap simpan dengan teks soal, tipe, opsi A-D, kunci A, poin 5, pembahasan, tingkat berpikir "memahami", dan capaian "Thaharah — rukun wudhu".
- Baris judul dengan huruf besar dan urutan kolom berbeda tetap memetakan kolom yang benar.
- Kolom `catatan` pada baris judul dilaporkan sebagai diabaikan dan tidak menggagalkan impor.
- Baris dengan kolom lebih banyak daripada baris judul muncul sebagai baris bermasalah dengan alasan yang menyebut nomor baris dan jumlah kolom.
- Kunci `B`/`S` pada benar/salah dan kunci `A, C` pada PG kompleks tersimpan sebagai opsi yang benar; kunci huruf di luar opsi terisi menjadi alasan per baris.
- Tingkat berpikir `sintesis` dan capaian 85 karakter menjadi alasan per baris, bukan label kosong.
- Wacana pada baris 1 terbaca oleh baris 1–3, lalu berganti pada baris 4.
- 200 baris bertab selesai ditafsirkan di bawah 800 ms pada mesin pengembangan dan menghasilkan 200 butir.
- Teks Arab berharakat di kolom `soal` dan `pembahasan` tetap utuh.
- Naskah bernomor yang sudah ada tetap menghasilkan tafsiran yang sama dan tes lamanya lolos.

## Perintah validasi

- `node --test tests/question-import-spreadsheet.test.ts` dan `node --test tests/question-import.test.ts` dari `apps/`.
- `npm test` (seluruh rangkaian).
- `npm run typecheck`, `npm run lint`, `npm run build`.
- Tidak ada perubahan `apps/convex/`, sehingga `npx convex dev --once` tidak wajib; tetap dijalankan sekali bila ada keraguan.

## E2E

`Required` — perilaku tempel-bentuk-otomatis, unduhan template, dan pratinjau per baris hanya terbukti penuh lewat peramban. Handoff ke `specs/e2e/tempelan-lembar-kerja.md` dengan status `Pending`.
