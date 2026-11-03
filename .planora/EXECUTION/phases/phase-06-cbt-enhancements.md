# Fase 06 — Penyempurnaan Fitur CBT & Integritas Ujian

Pengembangan model soal lanjutan (Pilihan Ganda Kompleks dan Benar/Salah), konten stimulus wacana/media, formulir pembuatan soal dengan Live Preview real-time, tata letak ruang ujian 3-panel responsif ala ANBK, serta sistem pemantauan integritas ujian (anti-curang dan pencatatan pelanggaran tab).

## Dependensi

Fase 01, Fase 03, & Fase 04 (Bank Soal, Ruang Ujian, dan Penilaian Rekap telah beroperasi).

## Workflow eksekusi

- `feature` — Skema butir soal lanjutan (`pg_kompleks`, `true_false`, stimulus) dan formulir bank soal dengan Live Preview.
- `feature` — Ruang ujian 3-panel responsif, proteksi anti-curang (tab blur detection, clipboard blocker), auto-scoring soal lanjutan, dan badge pelanggaran tab di rekap nilai.

## Kriteria keluar

- Pengajar dapat membuat butir soal berstimulus dengan tipe PG Kompleks dan Benar/Salah serta melihat Live Preview instan.
- Ruang ujian santri menampilkan layout 3-panel adaptif (desktop 3-kolom, drawer pada tablet/mobile).
- Deteksi perpindahan tab merekam akumulasi pelanggaran santri secara real-time ke Convex dan tampil di dashboard rekap nilai pengajar.
- Penilaian instan di backend menghitung skor PG Kompleks dan Benar/Salah dengan akurat seketika ujian disubmit.
