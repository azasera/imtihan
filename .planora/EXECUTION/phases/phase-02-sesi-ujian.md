# Fase 02 — Sesi Ujian dan Token

Implementasi modul penjadwalan ujian, alokasi durasi waktu, generator token akses, masa berlaku token, batas nilai tuntas, sesi lanjutan remedial/susulan, dan pemantauan langsung sesi yang sedang berjalan. Cakupan kebutuhan: `SESI-FR-001` sampai `SESI-FR-010`.

## Dependensi

Fase 01 (Paket bank soal telah tersedia).

## Workflow eksekusi

- `feature` — Backend generator token 6 digit alfanumerik (`SESI-FR-001`, `SESI-FR-002`).
- `feature` — Antarmuka penjadwalan, kontrol sesi ujian aktif, dan toggle pengacakan soal/opsi bagi pengawas (`SESI-FR-002`, `SESI-FR-003`).
- `feature` — Layar Monitoring Sesi Ujian pada menu utama pengajar beserta entri sidebar (`SESI-FR-004`, `SESI-FR-005`, `SESI-AC-004`, `SESI-AC-005`).
- `feature` — Masa berlaku token yang dapat diatur (tetap sebagai bawaan, berganti tiap 5/15/30 menit), kartu token dengan hitung mundur dan mode tayang layar penuh, serta penolakan token lama pada gerbang santri tanpa memotong pengerjaan yang berjalan (`SESI-FR-006`, `SESI-FR-007`, `SESI-AC-006`, `SESI-AC-007`, `UJIAN-FR-012`, `UJIAN-AC-010`, `NFR-SEC-008`). Selesai sebagai `CHG-008`.
- `feature` — Batas nilai tuntas per sesi dan pembuatan sesi lanjutan berjenis remedial atau susulan dari sesi yang sudah berjalan, dengan peserta dipilih ulang (`SESI-FR-008`, `SESI-FR-009`, `SESI-AC-008`). Selesai sebagai `CHG-007`.
- `feature` — Penyimpanan mode penegakan integritas dan ambang pelanggaran pada sesi (`SESI-FR-010`, `SESI-AC-009`); perilakunya pada ruang ujian dikerjakan pada Fase 03 sebagai `CHG-009`.

## Kriteria keluar

- Sesi ujian dapat dijadwalkan dengan durasi menit yang akurat.
- Token ujian aktif dapat diverifikasi oleh sistem.
- Pengajar dapat membuka layar monitoring dari menu utama, memilih sesinya sendiri, dan melihat status tiap peserta yang sudah masuk beserta badge pelanggaran tab dan tautan koreksi.
- Sesi dan peserta milik pengajar lain tidak muncul, dan permintaan tanpa login menghasilkan daftar kosong.
- Pengajar dapat memilih masa berlaku token, menayangkan token ke layar penuh, dan melihat hitungan mundur pergantian token tanpa memuat ulang halaman.
- Sesi remedial atau susulan dapat dibuat dari sesi yang sudah selesai tanpa mengubah sesi sumbernya, dan pesertanya atas pilihan pengajar.
- Batas tuntas tersimpan per sesi dan menjadi acuan penanda tuntas pada laporan Fase 04.

## Status fase

Tiga workflow pertama terpasang. Kriteria monitoring diverifikasi pada level sumber dan tes otomatis (`npm test` → 84/84, typecheck bersih, lint 0 error, build menyertakan rute `/monitoring-sesi`); pembuktian perjalanan browser sudah dieksekusi 2026-11-05 pada `specs/e2e/monitoring-sesi.md` → `Passed` 9/9 skenario (dengan substitusi viewport dan catatan pada skenario 7 dan 9). Hitungan "belum mulai" sengaja ditampilkan sebagai "Belum terhitung" sampai ada keputusan penautan sesi ke daftar kelas santri.

`CHG-007` selesai: batas tuntas tersimpan per sesi (opsional, tanpa nilai cadangan dari bank), sesi remedial/susulan hanya dibuat dari sesi selesai milik pengajar dengan salinan pengaturan yang dapat diubah, peserta dipilih ulang dari peserta sesi sumber, sesi sumber tidak berubah, dan label jenis/sumber hanya terbaca pemilik. Verifikasi: `npm test` → 270/270, typecheck bersih, lint 0 error / 47 warning, build sukses, `npx convex dev --once` → `Convex functions ready!`, probe CLI dengan identitas pengajar/lain/tanpa login sesuai harapan, data probe dibersihkan. E2E `Required` pada `specs/e2e/batas-tuntas-sesi-lanjutan.md` dieksekusi 2026-11-05 → `Blocked`: 9 dari 10 skenario `Passed` (termasuk gerbang santri), skenario 10 terblokir karena viewport otomasi tidak dapat diubah.

Dua workflow tambahan hasil revisi pembanding pasar: `CHG-008` (rotasi dan penayangan token) selesai — interval 5/15/30 menit dijadwalkan berantai lewat `ctx.scheduler.runAt`, rotasi berhenti saat sesi berakhir, hitung mundur berasal dari jam server dan tampil tanpa muat ulang, layar penuh hanya memuat judul dan token, token lama ditolak pada gerbang dengan identitas santri tetap terisi, dan peserta yang sudah masuk tetap dapat menyimpan jawaban serta mengumpulkan. Verifikasi: `npm test` → 296/296, typecheck bersih, lint 0 error / 47 warning, build sukses, `npx convex dev --once` → `Convex functions ready!`, probe CLI membuktikan rotasi, penolakan token lama, penghentian saat sesi berakhir, dan otorisasi token; data serta modul probe dibersihkan. E2E `Required` pada `specs/e2e/token-rotation-display.md` dieksekusi 2026-11-05 → `Blocked`: 9 dari 12 skenario `Passed` penuh, tiga sisanya terhalang batasan alat/lingkungan. Penyimpanan mode penegakan pada sesi tetap menjadi bagian `CHG-009` di Fase 03.
