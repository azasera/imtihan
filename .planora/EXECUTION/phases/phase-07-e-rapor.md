# Fase 07 — Modul E-Rapor Kurikulum Merdeka & Diniyah Terintegrasi CBT

Pengembangan sistem E-Rapor lengkap untuk Pondok Pesantren At-Tauhid (SMPITA, SMAITA, MTA) yang terhubung langsung dengan sesi ujian CBT App Imtihan, dilengkapi otomatisasi narasi capaian kompetensi, manajemen leger nilai kelas, dan lembar cetak rapor standar A4 ber-KOP resmi SiPAKSa sesuai lembaga.

## Dependensi

- Fase 01 (Bank Soal & Mata Pelajaran)
- Fase 04 (Penilaian & Rekap Nilai CBT)
- Fase 05 (Sinkronisasi Data Santri SiPAKSa)

## Workflow eksekusi

- `feature` — Skema Convex modul E-Rapor: periode akademik, capaian pembelajaran (CP/TP), nilai rapor per mapel, asesmen karakter P5, ekstrakurikuler, absensi, hadits/tahfidz, dan catatan wali kelas.
- `feature` — Penarikan nilai otomatis dari sesi CBT (`examParticipants`) ke kolom nilai rapor guru mapel beserta penentuan narasi capaian kompetensi.
- `feature` — Antarmuka wali kelas (pengisian absensi, ekskul, hadits/tahfidz, catatan wali kelas, tinjauan kenaikan kelas).
- `feature` — Layar Leger Nilai Kelas terpadu dan ekspor data nilai ke file spreadsheet Excel (`.xlsx`).
- `feature` — Komponen KOP Rapor SiPAKSa dinamis sesuai lembaga santri (`SMPITA`, `SMAITA`, `MTA`) dan lembar cetak rapor A4 (4 format presisi rujukan PDF: Kurmer PTS 1 hal, Kurmer PAS 2 hal, Diniyah PTS 1 hal, Diniyah PAS 1 hal) bebas elemen web saat dicetak.

## Kriteria keluar

- Pengajar mata pelajaran dapat menetapkan Capaian Pembelajaran (CP/TP) semester dan menarik nilai PH, STS, SAS langsung dari sesi ujian CBT.
- Nilai Akhir Rapor (NAR), Predikat (A/B/C/D), dan deskripsi narasi kompetensi terhitung dan terisi otomatis.
- Wali kelas dapat melengkapi absensi, ekskul, hafalan hadits, catatan wali kelas, dan mengesahkan keputusan kenaikan kelas.
- Leger Nilai Kelas memuat seluruh mata pelajaran dan dapat diunduh dalam format `.xlsx`.
- Lembar cetak rapor santri (Rapor Umum dan Rapor Diniyah) menampilkan KOP SiPAKSa resmi sesuai lembaga masing-masing, rapi pada kertas A4 tanpa terpotong (*page-break* aman).
