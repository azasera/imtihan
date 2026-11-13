# Spesifikasi Perubahan: Mode Penegakan Integritas dan Lembar Terkunci

- **ID**: `CHG-009`
- **Fase**: `phase-03`
- **Requirements**: `SESI-FR-010`, `SESI-AC-009`, `UJIAN-FR-010`, `UJIAN-FR-011`, `UJIAN-AC-008`, `UJIAN-AC-009`
- **Dependensi**: `TASK-003`, `TASK-012` — keduanya `done`.
- **Workflow**: `feature`, dengan dukungan `ui-design` dan `ui-review`.

## Masalah

Sesi sudah menyimpan `enforcementMode` dan `violationThreshold` di `apps/convex/schema.ts`, tetapi formulir jadwal belum menampilkannya dan `recordTabViolation` (`apps/convex/examSession/public/mutations.ts`) hanya menaikkan pencacah. Akibatnya semua sesi berperilaku "catat saja": pengajar tidak dapat memilih penguncian, peserta tidak punya status terkunci, dan layar monitoring tidak punya aksi membuka kunci. Deteksi perpindahan juga dapat menghitung satu kejadian dua kali karena `visibilitychange` dan `window.blur` sama-sama menembak.

## Perilaku yang diinginkan

1. Formulir jadwal sesi menampilkan segmen "Catat saja" (bawaan) dan "Kunci setelah ambang", dengan isian ambang 1–20 yang hanya aktif pada pilihan kedua; keterangan menjelaskan bahwa lembar terkunci hanya dapat dibuka dari layar monitoring.
2. Sesi tanpa `enforcementMode` atau dengan mode `record` tidak pernah mengunci lembar; setiap perpindahan tab tetap dicatat sekali per perpindahan dan muncul di monitoring serta rekap.
3. Pada mode `lock`, `recordTabViolation` mengunci peserta hanya ketika jumlah pelanggaran **melewati** ambang sesi (ambang 3 berarti pelanggaran ke-4 mengunci). Penguncian menulis `lockedAt`; pelanggaran berikutnya tidak mengubah waktu kunci pertama.
4. `saveStudentAnswer` menolak perubahan jawaban selama peserta terkunci, sehingga penguncian berlaku di server dan bukan hanya di antarmuka.
5. Lembar santri yang terkunci menampilkan panel "Lembar Anda dikunci" berisi judul sesi, sisa waktu yang terus berjalan, jumlah jawaban tersimpan, dan penjelasan bahwa pengajar sedang dihubungi; seluruh pilihan, textarea, tombol ragu-ragu, dan tombol kumpulkan dinonaktifkan, sedangkan navigasi nomor tetap dapat dipakai untuk membaca soal.
6. Pengumpulan otomatis saat waktu habis tetap berjalan atas jawaban terakhir yang tersimpan, meskipun lembar sedang terkunci.
7. Layar monitoring menampilkan status teks "Terkunci" dan mengganti aksi baris menjadi "Buka Kunci" dengan konfirmasi yang menyebut nama santri dan jumlah jawaban tersimpan.
8. Hanya pengajar pemilik sesi yang dapat membuka kunci; setiap pembukaan menambahkan entri `unlockEvents` berisi waktu dan nama pengajar. Jawaban tersimpan tidak berubah setelah dibuka.
9. Pembukaan kunci terlihat oleh perangkat santri tanpa memuat ulang halaman karena `getStudentExamSheet` adalah langganan reaktif.

## Di luar cakupan

- Token kapabilitas per-partisipan; `saveStudentAnswer` dan `recordTabViolation` tetap memakai `participantId`.
- Pembukaan kunci otomatis atau berbasis waktu.
- Pengosongan riwayat pelanggaran saat membuka kunci; pencacah dipertahankan sesuai catatan audit.
- Penguncian layar penuh browser atau pemblokiran clipboard tambahan; perilaku yang sudah ada tidak diperluas.

## Bukti kode saat ini

- `apps/convex/schema.ts` — `examSessions` sudah punya `enforcementMode` dan `violationThreshold`; `examParticipants` belum punya status terkunci atau riwayat buka kunci.
- `apps/convex/examSession/public/mutations.ts` — `recordTabViolation` hanya menaikkan `tabViolations`; `saveStudentAnswer` belum memeriksa status terkunci.
- `apps/convex/examSession/public/queries.ts` — `getStudentExamSheet` belum mengirim `isLocked` atau jumlah jawaban tersimpan; `listSessionParticipants` mengembalikan dokumen mentah tanpa jumlah jawaban.
- `apps/app/(main)/sesi-ujian/page.tsx` — formulir belum punya segmen mode atau isian ambang.
- `apps/app/(main)/monitoring-sesi/page.tsx` — status hanya "Sedang Mengerjakan"/"Selesai"; tidak ada aksi buka kunci.
- `apps/app/ujian/ExamWorksheet.tsx` — deteksi tab menembak dari `visibilitychange` dan `blur` tanpa penjaga, semua pilihan selalu aktif, dan tidak ada panel terkunci.

## Urutan implementasi

1. Skema: tambah `lockedAt` dan `unlockEvents` opsional pada `examParticipants`.
2. Helper privat: aturan `shouldLockAfterViolation(mode, threshold, count)` dan penghitung jawaban terisi.
3. `recordTabViolation`: baca sesi, hormati mode/ambang, tulis `lockedAt` sekali, kembalikan `locked`.
4. `saveStudentAnswer`: tolak simpan saat `lockedAt` terisi dengan pesan yang menyebut pengawas.
5. Mutasi baru `unlockParticipant`: autentikasi, kepemilikan sesi, tolak peserta selesai, lepas `lockedAt`, catat `unlockEvents`.
6. Query: `getStudentExamSheet` mengirim `isLocked`, `lockedAt`, `savedAnswerCount`, dan judul sesi; `listSessionParticipants` menambahkan `savedAnswerCount`.
7. Formulir jadwal: segmen mode, ambang, validasi, payload, dan ringkasan pada kartu sesi.
8. Ruang ujian: panel terkunci, penonaktifan input, penjaga dedupe perpindahan, dan penghentian perekaman saat terkunci.
9. Monitoring: badge "Terkunci", aksi "Buka Kunci" dengan konfirmasi, dan pembaruan reaktif.
10. Tes unit/sumber, probe CLI aturan ambang dan otorisasi, pembersihan data, lalu tutup TODO dan serahkan E2E.

## Risiko

- Ambang yang salah tafsir (>= vs >) dapat mengunci terlalu cepat; aturan dipusatkan pada satu helper dan diuji pada nilai tepat ambang.
- Peserta yang terkunci dapat kehilangan akses simpan karena galat jaringan; panel menjelaskan jawaban yang sudah tersimpan tetap utuh dan pengajar dapat membuka kunci.
- Membuka kunci tanpa mengosongkan pencacah berarti pelanggaran berikutnya langsung mengunci lagi; ini disengaja agar pengajar menangani kasus berulang.
- `savedAnswerCount` menambah satu query per peserta pada monitoring; jumlah peserta per sesi masih wajar dan hanya dibaca pengajar pemilik.
- Deteksi `blur` dapat terpicu oleh dialog browser atau pilihan berkas; penjaga "satu perpindahan sampai kembali" membatasi hitungan ganda, tetapi definisi kembali mengikuti `focus`/`visibilitychange`.

## Kriteria penerimaan terukur

- Sesi `record` atau tanpa kolom mode: 10 pelanggaran berturut-turut tetap tidak menulis `lockedAt`.
- Sesi `lock` ambang 3: pelanggaran ke-3 belum mengunci, pelanggaran ke-4 menulis `lockedAt`; pelanggaran ke-5 tidak mengubah `lockedAt` pertama.
- `saveStudentAnswer` pada peserta terkunci ditolak; setelah `unlockParticipant` oleh pemilik, simpan berhasil dan jawaban sebelumnya masih ada.
- `unlockParticipant` oleh pengajar lain atau pemanggil anonim ditolak; pembukaan oleh pemilik menambah satu entri `unlockEvents` dengan waktu dan nama.
- `getStudentExamSheet` mengirim `isLocked`, `lockedAt`, dan `savedAnswerCount` yang hanya menghitung jawaban berisi.
- UI formulir mengirim `enforcementMode` dan `violationThreshold` hanya saat mode kunci dipilih; kartu sesi menampilkan ringkasan mode.
- Baris monitoring peserta terkunci menampilkan label "Terkunci" dan tombol "Buka Kunci"; konfirmasi menyebut nama dan jumlah jawaban tersimpan.
- Lembar terkunci menampilkan judul, sisa waktu, dan jumlah jawaban tersimpan; seluruh input jawaban nonaktif; pengumpulan otomatis saat waktu habis tetap ada.
- Seluruh tes lolos, typecheck bersih, lint tanpa error, build sukses, `npx convex dev --once` melaporkan `Convex functions ready!`, dan pemindaian kebocoran kode spesifikasi 0 kecocokan.

## Validasi

- `npm test`
- `npm run typecheck`
- `npm run lint`
- `npm run build`
- `npx convex dev --once`
- Probe CLI: buat sesi mode kunci ambang 3, aktifkan, masuk peserta, catat 3 lalu 4 pelanggaran, buktikan simpan ditolak saat terkunci, buka kunci sebagai pemilik, simpan jawaban, tolak buka kunci dari pengajar lain dan pemanggil anonim, lalu bersihkan data dan modul sementara.

## E2E

`Required` — penguncian, panel terkunci, pembukaan oleh pengajar, dan pengumpulan otomatis adalah perjalanan dua perangkat yang tidak dapat dibuktikan hanya dari sumber. Handoff ke `specs/e2e/mode-penegakan-integritas.md`; status `Pending` sampai dijalankan `/e2e-tester`.
