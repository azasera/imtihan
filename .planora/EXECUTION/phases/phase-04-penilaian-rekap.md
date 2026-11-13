# Fase 04 — Penilaian dan Rekap Nilai

Implementasi koreksi otomatis pilihan ganda, modul periksa essay pengajar, rekapitulasi nilai kelas, penanda tuntas terhadap batas tuntas, dan analisis mutu butir soal per sesi. Cakupan kebutuhan: `NILAI-FR-001` sampai `NILAI-FR-009`.

## Dependensi

Fase 03 (Lembar jawaban santri telah terekam) dan Fase 02 (batas tuntas serta jenis sesi tersimpan pada sesi).

## Workflow eksekusi

- `feature` — Algoritma kalkulasi nilai otomatis pilihan ganda (`NILAI-FR-001`, `NILAI-FR-003`).
- `feature` — Antarmuka koreksi essay pengajar dan ekspor rekap nilai (`NILAI-FR-002`, `NILAI-FR-004`).
- `feature` — Pembahasan butir pada lembar koreksi pengajar (`BANK-AC-016` bagian koreksi, `NFR-SEC-007`); bagian penyimpanannya ada pada Fase 01 sebagai `CHG-005`.
- `feature` — Analisis mutu butir per sesi (daya serap, tingkat kesukaran, daya beda, sebaran pengecoh) beserta layar laporannya (`NILAI-FR-007`, `NILAI-FR-008`, `NILAI-AC-006`, `NILAI-AC-007`, `NILAI-AC-008`, `NFR-PERF-005`). Dikerjakan sebagai `CHG-010` dan selesai pada 2026-11-05; E2E peramban dieksekusi 2026-11-05 dan lolos 14/14 setelah temuan cetak header/sidebar diperbaiki.
- `feature` — Penanda tuntas terhadap batas tuntas, pembatas nilai remedial, dan daftar kelompok remedial serta pengayaan dengan nomor butir yang salah (`NILAI-FR-009`, `NILAI-AC-009`, `NILAI-AC-010`, `NILAI-AC-011`). Dikerjakan sebagai `CHG-010` bersama butir di atas, dengan ketergantungan pada `CHG-007`.

## Kriteria keluar

- Nilai santri terhitung lengkap dan akurat.
- Laporan nilai dapat diekspor dan dicetak dengan rapi.
- Pengajar membaca mutu tiap butir pada sesi yang sudah dinilai, dengan penanda beralasan pada butir yang perlu ditinjau, dan tanpa angka analisis palsu ketika peserta yang dinilai belum cukup.
- Rekap membedakan nilai ujian reguler, remedial, dan susulan, serta menyebut butir mana yang perlu diajarkan ulang untuk tiap santri.
