# Kesiapan rilis

Daftar periksa kesiapan rilis produk E-Imtihan At-Tauhid.

Status setiap baris mengikuti bukti, bukan asumsi. Kunci status:

- `[x]` = sudah dibuktikan dengan perintah atau pengujian yang hasilnya dibaca.
- `[~]` = terimplementasi di kode dan lolos pemeriksaan statis, tetapi belum dibuktikan berjalan di browser.
- `[ ]` = belum diuji.

## Backend & data

- [x] Skema Convex terdefinisi dengan indeks yang dipakai query.
  - Bukti: `npx convex dev --once` → `Convex functions ready!`; kodegen `api.d.ts` cocok dengan seluruh pemanggil.
- [x] Koreksi otomatis dinilai dari kunci jawaban pada server untuk tipe `multiple_choice` dan `true_false`.
  - Bukti: alur nyata lewat CLI pada deployment dev — masuk sesi → simpan jawaban → kumpulkan = `multipleChoiceScore 10 / totalScore 10 / gradingStatus graded`, butir yang tidak dijawab bernilai 0.
- [ ] Koreksi otomatis tipe `pg_kompleks` dan penilaian essay belum dijalankan pada data uji.
- [x] Otorisasi fungsi publik Convex diaudit dan dikuatkan.
  - Bukti: aksi sinkron SiPAKSa dan seed mata pelajaran menolak pemanggil anonim; `sourceUrl` pengendali URL dihapus; daftar & statistik santri serta proyeksi `lookupStudent` tidak lagi membocarkan PII ke pemanggil tanpa login. Diverifikasi dengan panggilan CLI tanpa identitas dan dengan identitas pengajar.
  - Penjaga regresi: `apps/tests/convex-public-authz.test.ts` (setiap fungsi publik harus mengautentikasi atau terdaftar sebagai gerbang santri).
- [ ] Kunci sesi per-partisipan belum ada: `saveStudentAnswer`, `recordTabViolation`, `submitStudentExam`, dan `getStudentExamSheet` masih mempercayai `participantId` dari pemanggil tanpa bukti kepemilikan. Risiko praktis rendah (ID tidak dapat ditebak dan tidak terbocor lewat query mana pun), tetapi perlu token kemampuan bila ingin ditutup rapat.

## Frontend & alur pengguna

- [~] Gerbang ujian santri (pilih lembaga, kelas dinamis, verifikasi token, auto-fill identitas dari master data).
  - Auto-fill kini diturunkan langsung dari hasil query master data, tidak lagi disalin melalui efek. Belum dijalankan di browser.
- [x] Cacat crash "Rendered fewer hooks than expected" pada pintu gerbang ujian diperbaiki.
  - Bukti: `useMemo` dipindah di atas `return` bersyarat; aturan `react-hooks/rules-of-hooks` bersih pada berkas tersebut; tes penjaga urutan hook `apps/tests/hook-order.test.ts` lulus.
- [ ] Hitung mundur pengerjaan dan pengumpulan otomatis saat waktu habis belum dibuktikan berjalan di browser. Logika diubah menjadi berdetak dari callback waktu dengan nilai awal dari server, sehingga justru paling membutuhkan pemeriksaan manual.
- [ ] Tampilan responsif diuji pada resolusi desktop (1920x1080), laptop (1366x768), dan tablet (768x1024): belum pernah dijalankan.
- [ ] Fitur penyimpanan otomatis (auto-save) tahan terhadap simulasi koneksi internet terputus: jalur galat ada di kode tetapi belum pernah disimulasikan.
- [~] Fitur CBT lanjutan (tata letak 3-panel, PG Kompleks & Benar/Salah, stimulus wacana, pratinjau langsung, proteksi integritas anti-curang) terimplementasi; validasi perilakunya baru sampai level sumber dan backend.

## Kualitas kode

- [x] Rangkaian tes regresi lulus tanpa kegagalan.
  - Bukti: `npm test` → 68/68. Catatan penting: sebagian besar tes memeriksa teks sumber, jadi lulusnya tes tidak membuktikan perilaku runtime; bukti runtime berasal dari panggilan CLI Convex dan pemeriksaan browser.
- [x] Lint bersih dari error.
  - Bukti: `npm run lint` → 0 error, 49 → 48 warning (warning tersisa adalah impor tak terpakai dan aturan `set-state-in-*` pada komponen lain).
- [x] Typecheck dan build produksi lolos.
  - Bukti: `npm run typecheck` tanpa keluaran; `npm run build` menghasilkan daftar route.
- [x] Tidak ada kebocoran kode spesifikasi teknis pada teks UI (tes `ui-leakage`).

## Pekerjaan tersisa sebelum rilis

1. Jalankan spek E2E di bawah `specs/e2e/` pada Chrome sungguhan — 13 spek belum pernah dieksekusi, termasuk `student-exam-entry.md` yang berstatus `Required` untuk perbaikan crash hook.
2. Putuskan apakah kunci sesi per-partisipan (token kemampuan) dibuat sebelum produk dipakai ujian nyata.
3. Bersihkan 48 warning lint, kode mati (`/prototype`, `components/ai-elements/`), dan `ExamWorksheet.tsx` yang melewati 1000 baris.
4. Meninjau 48 kerentanan dependensi (`npm audit`, 4 di antaranya kritis: dompurify, next, proxy-addr, better-auth).
