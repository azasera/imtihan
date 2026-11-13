# Fase 06 — Penyempurnaan Fitur CBT & Integritas Ujian

Pengembangan model soal lanjutan (Pilihan Ganda Kompleks dan Benar/Salah), konten stimulus wacana/media, formulir pembuatan soal dengan Live Preview real-time, tata letak ruang ujian 3-panel responsif ala ANBK, serta sistem pemantauan integritas ujian (anti-curang dan pencatatan pelanggaran tab).

## Dependensi

Fase 01, Fase 03, & Fase 04 (Bank Soal, Ruang Ujian, dan Penilaian Rekap telah beroperasi).

## Workflow eksekusi

- `feature` — Skema butir soal lanjutan (`pg_kompleks`, `true_false`, stimulus) dan formulir bank soal dengan Live Preview (`BANK-FR-005`, `BANK-FR-006`, `BANK-FR-007`).
- `feature` — Ruang ujian 3-panel responsif, proteksi anti-curang (tab blur detection, clipboard blocker), auto-scoring soal lanjutan, dan badge pelanggaran tab di rekap nilai (`UJIAN-FR-008`, `UJIAN-FR-009`, `NILAI-FR-005`, `NILAI-FR-006`).

## Kriteria keluar

- Pengajar dapat membuat butir soal berstimulus dengan tipe PG Kompleks dan Benar/Salah serta melihat Live Preview instan.
- Ruang ujian santri menampilkan layout 3-panel adaptif (desktop 3-kolom, drawer pada tablet/mobile).
- Deteksi perpindahan tab merekam akumulasi pelanggaran santri secara real-time ke Convex dan tampil di dashboard rekap nilai pengajar.
- Penilaian instan di backend menghitung skor PG Kompleks dan Benar/Salah dengan akurat seketika ujian disubmit.

## Catatan revisi

Pemantauan pelanggaran tab pada awalnya hanya mencatat. Opsi menegakkan lebih jauh (mengunci lembar setelah ambang tertentu, membuka kuncinya dari layar monitoring, dan menolak token sesi yang sudah berganti) ditambahkan oleh revisi pembanding pasar dan sudah dikerjakan sebagai `CHG-009` pada Fase 03 serta sebagian `CHG-008` pada Fase 02, bukan sebagai perubahan pada fase ini. Bukti peramban kedua item itu dijalankan 2026-11-05 pada berkas spek E2E masing-masing: `specs/e2e/mode-penegakan-integritas.md` 10 `Passed` dan skenario 13 `Passed` sesudah `BUG-001`, sisanya `Blocked`; `specs/e2e/token-rotation-display.md` 9 `Passed` dari 12, `Blocked`. Yang belum teratasi adalah pengamatan yang membutuhkan perubahan viewport dan pembaruan lintas tab pada otomasi satu tab.
