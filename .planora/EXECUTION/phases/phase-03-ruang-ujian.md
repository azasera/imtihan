# Fase 03 — Ruang Ujian Santri

Implementasi antarmuka pengerjaan ujian santri dengan navigasi nomor dan penyimpanan jawaban otomatis.

## Dependensi

Fase 02 (Sesi ujian dan token telah siap).

## Workflow eksekusi

- `feature` — Pintu masuk login santri berbasis NISN + Token (`UJIAN-FR-001`).
- `feature` — Lembar ujian santri dengan timer hitung mundur dan auto-save real-time (`UJIAN-FR-002`, `UJIAN-FR-003`, `UJIAN-FR-004`, `UJIAN-FR-005`).
- `feature` — Mode penegakan integritas pada ruang ujian: mode mencatat tanpa mengganggu, mode kunci setelah ambang dengan panel terkunci yang tetap memperlihatkan sisa waktu dan jumlah jawaban tersimpan, serta penolakan token yang sudah berganti tanpa mengosongkan isian gerbang (`UJIAN-FR-010`, `UJIAN-FR-011`, `UJIAN-FR-012`, `UJIAN-AC-008`, `UJIAN-AC-009`, `UJIAN-AC-010`). Selesai lewat `CHG-009` pada 2026-11-04; E2E `Required` dieksekusi 2026-11-05 dengan hasil 10 `Passed`, 1 `Failed` (kebersihan teks, dicatat sebagai `BUG-001`), dan 2 `Blocked` oleh batas alat otomasi; setelah `BUG-001` diperbaiki, pengulangan skenario kebersihan teks lolos (`specs/e2e/bug-001-select-label.md`, 9/9 `Passed`), sementara dua pengamatan satu-tab tetap terblokir.
- `bug` — E2E gerbang santri (`specs/e2e/student-exam-entry.md`) dieksekusi dua kali 2026-11-05. Eksekusi pertama 5 `Passed`, 2 `Failed` karena toast sukses/lanjutkan tidak tampil (`<Toaster />` tidak dipasang). `BUG-002` diperbaiki dengan memasang `<Toaster />` di root layout (regression test `tests/toaster-mount.test.ts`); pengulangan mencatat 6 `Passed`, 1 `Failed` — toast sukses, toast persiapan lembar soal, dan toast lanjutkan sesi terlihat di DOM, jawaban tetap tersimpan setelah muat ulang, dan sisa kegagalan adalah tidak adanya aksi keluar dari lembar pengerjaan yang menunggu keputusan produk.

## Kriteria keluar

- Santri dapat menyelesaikan ujian dari nomor pertama hingga akhir tanpa kendala data hilang.
- Lembar jawaban terkumpul otomatis saat durasi waktu berakhir.
- Pada sesi bermode mencatat, tidak ada lembar yang terkunci walau pelanggaran tetap tercatat; pada mode kunci, penguncian hanya terjadi setelah ambang dan jawaban tersimpan tetap utuh sesudah dibuka kembali.
