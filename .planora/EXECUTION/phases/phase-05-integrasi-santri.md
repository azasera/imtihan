# Fase 05 — Integrasi Data Santri SiPAKSa

Implementasi sinkronisasi data santri nyata dari SiPAKSa iCentre Smart untuk jenjang SMPITA, SMAITA, dan MTA, serta penyempurnaan verifikasi identitas ujian santri.

## Dependensi

Fase 02 & Fase 03 (Sesi Ujian dan Ruang Ujian Santri telah beroperasi).

## Workflow eksekusi

- `feature` — Skema tabel `students` di Convex dan sinkronisasi API dari SiPAKSa.
- `feature` — Antarmuka manajemen data santri pengajar dan pencocokan identitas di ruang ujian santri.

## Kriteria keluar

- Master data 346 santri SMP, SMA, dan MTA tersimpan di database Convex dengan filter 0 data SD/TK.
- Santri dapat masuk ujian menggunakan NISN, NIS, atau ID Santri dengan auto-fill nama lengkap.
