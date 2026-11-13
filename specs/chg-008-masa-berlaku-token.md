# Spesifikasi Perubahan: Masa Berlaku Token Sesi dan Penayangan Layar Penuh

- **ID**: `CHG-008`
- **Fase**: `phase-02`
- **Requirements**: `SESI-FR-006`, `SESI-FR-007`, `SESI-AC-006`, `SESI-AC-007`, `UJIAN-FR-012`, `UJIAN-AC-010`, `NFR-SEC-008`
- **Dependensi**: `TASK-003`, `TASK-005`, `CHG-001` — semuanya `done`.
- **Workflow**: `feature`, dengan dukungan `ui-design` dan `ui-review`.

## Masalah

Token sesi saat ini hanya berganti ketika pengajar menekan tombol acak ulang di `apps/app/(main)/sesi-ujian/page.tsx`; `regenerateSessionToken` (`apps/convex/examSession/public/mutations.ts`) tidak menyimpan waktu pergantian dan tidak punya jadwal berkala. Pengawas juga belum bisa menayangkan token ke proyektor kelas: layar monitoring menampilkan token sebagai teks kecil di baris meta, tanpa tombol salin atau mode layar penuh (`apps/app/(main)/monitoring-sesi/page.tsx`). Akibatnya token mudah bocor antar-sesi dan sulit dibagikan ke ruangan.

Gerbang santri juga memakai pesan "Token ujian tidak ditemukan" untuk token yang sudah berganti, sehingga santri tidak tahu harus meminta token terbaru walau identitasnya sudah terverifikasi.

## Perilaku yang diinginkan

1. Formulir jadwal sesi memiliki pengaturan masa berlaku token: "Tetap sampai diganti" (bawaan) atau "Berganti berkala" dengan pilihan 5, 15, atau 30 menit; saat berkala dipilih, formulir memperkirakan berapa kali token berganti sampai batas akhir sesi.
2. Token berganti otomatis hanya selama sesi berstatus `active`, tepat pada waktu jatuh tempo yang dijadwalkan server, dan berhenti sendiri saat sesi berubah `ended` atau `draft`.
3. Setiap pergantian (otomatis maupun manual) memperbarui `tokenRotatedAt`, dan pengajar pemilik melihat token terbaru tanpa memuat ulang halaman.
4. Kartu token pada layar monitoring menampilkan token besar, tombol salin, tombol "Tayangkan layar penuh", tombol "Ganti token sekarang", serta hitung mundur "Berganti dalam mm:ss" yang dimulai dari nilai server bila rotasi aktif.
5. Mode tayang layar penuh hanya memuat judul sesi, token, hitung mundur, tombol salin, dan tombol keluar; tidak pernah memuat nama atau data santri.
6. Token lama atau tidak dikenal ditolak pada gerbang santri dengan kalimat yang meminta token terbaru kepada pengawas, tanpa menyebut token pengganti atau nomor sesi.
7. Penolakan token tidak membuat peserta baru, tidak mengubah status peserta yang sudah masuk, dan tidak menghentikan penyimpanan maupun pengumpulan jawaban peserta yang sudah masuk.
8. Interval rotasi, tombol ganti token, dan mode tayang hanya tersedia bagi pengajar pemilik; pemanggil tanpa login atau pengajar lain ditolak pada mutasi.

## Di luar cakupan

- Token kapabilitas per-partisipan (keputusan produk masih terbuka).
- Memulihkan lembar santri setelah halaman di-refresh melewati pergantian token; perilaku yang sudah ada (masuk ulang dengan token berlaku) tidak diperluas.
- Mode penegakan integritas dan panel terkunci milik `CHG-009`.
- Penyuntingan interval rotasi pada sesi yang sudah dibuat dari layar daftar sesi; pengaturan diisi saat sesi dijadwalkan. Nilai dapat dikirim lewat `updateExamSession` untuk kebutuhan teknis.

## Bukti kode saat ini

- `apps/convex/schema.ts:83-110` — `examSessions` belum punya kolom interval rotasi maupun waktu ganti token.
- `apps/convex/examSession/public/mutations.ts` — `regenerateSessionToken` hanya menulis `token` dan `updatedAt`.
- `apps/convex/examSession/public/queries.ts:122-132` — pesan token tidak ditemukan belum mengarahkan ke token terbaru.
- `apps/app/(main)/monitoring-sesi/page.tsx:308-312` — token tampil sebagai teks kecil tanpa salin/tayang/hitung mundur.
- `apps/app/(main)/sesi-ujian/page.tsx` — formulir jadwal belum punya pengaturan masa berlaku token.

## Urutan implementasi

1. Skema: tambah `tokenRotationMinutes` dan `tokenRotatedAt` opsional pada `examSessions`.
2. Helper: validasi interval 5/15/30, pembangkit token unik dipindah ke modul privat, dan perhitungan sisa detik dari nilai server.
3. Mutasi internal `rotateSessionTokenIfDue` dengan penjadwalan berantai `ctx.scheduler.runAt`, berhenti bila sesi tidak aktif atau rotasi dimatikan.
4. Mutasi publik: terima interval saat membuat sesi, mulai rotasi saat sesi diaktifkan, perbarui `tokenRotatedAt` pada pergantian manual, dan kembalikan waktu ganti.
5. Query pemilik: kirim `tokenRotationMinutes`, `tokenRotatedAt`, dan `tokenSecondsRemaining`; payload santri tetap tanpa data rotasi.
6. Pesan gerbang santri diperbarui pada query verifikasi dan mutasi masuk.
7. Formulir jadwal: segmen tetap/berkala, pilihan interval, dan perkiraan jumlah pergantian.
8. Komponen kartu token monitoring dengan salin, ganti, hitung mundur, dan lapisan layar penuh.
9. Tes unit/sumber + probe CLI rotasi, penolakan token lama, dan pembersihan data.
10. Tutup TODO dengan bukti dan serahkan E2E.

## Risiko

- Penjadwalan berantai dapat meninggalkan pekerjaan no-op setelah sesi selesai; fungsi internal memeriksa status dan interval sebelum menulis sehingga tidak ada pergantian liar.
- Dua pekerjaan terjadwal untuk sesi yang sama tidak menggandakan pergantian karena jatuh tempo dihitung dari `tokenRotatedAt`.
- Perbedaan jam perangkat tidak memengaruhi hitung mundur karena nilai awal berasal dari server; klien hanya menurunkan angka per detik.
- Token enam karakter tetap dapat ditebak secara brute force dalam jangka panjang; rotasi memperkecil jendela, bukan menggantikan token kapabilitas.

## Kriteria penerimaan terukur

- Membuat sesi tanpa pengaturan rotasi menyimpan `tokenRotationMinutes` kosong dan token tidak berubah setelah sesi aktif.
- Memilih 5/15/30 menit menyimpan interval tersebut; aktivasi mengisi `tokenRotatedAt` dan menjadwalkan pergantian tepat satu interval kemudian.
- Menjalankan `rotateSessionTokenIfDue` sebelum jatuh tempo tidak mengubah token; sesudah jatuh tempo mengganti token dan memperbarui `tokenRotatedAt`; pada sesi `ended` tidak mengganti token.
- `regenerateSessionToken` pemilik memperbarui token dan `tokenRotatedAt`; pengajar lain dan pemanggil anonim ditolak.
- `listExamSessions`/`getExamSession` pemilik mengembalikan tiga kolom rotasi; `verifySessionToken` dan `getStudentExamSheet` tidak.
- Token lama menghasilkan pesan "token tidak berlaku lagi" pada verifikasi dan masuk, tanpa membuat peserta baru; peserta yang sudah ada tetap dapat menyimpan dan mengumpulkan jawaban.
- Kartu token dan mode layar penuh hanya memuat judul, token, hitung mundur, salin, dan keluar — tidak ada nama, NISN, atau kelas santri.
- Seluruh tes lolos, typecheck bersih, lint tanpa error, build sukses, `npx convex dev --once` melaporkan `Convex functions ready!`, dan pemindaian kebocoran kode spesifikasi 0 kecocokan.

## Validasi

- `npm test`
- `npm run typecheck`
- `npm run lint`
- `npm run build`
- `npx convex dev --once`
- Probe CLI: buat sesi rotasi, aktifkan, paksa jatuh tempo lewat modul sementara, jalankan rotasi, uji token lama, akhiri sesi, jalankan rotasi lagi, lalu bersihkan data dan modul sementara.

## E2E

`Required` — pergantian token dan tayangan layar penuh adalah perjalanan pengawas di ruang kelas yang tidak dapat dibuktikan hanya dari sumber. Handoff ke `specs/e2e/token-rotation-display.md`; status `Pending` sampai dijalankan `/e2e-tester`.
