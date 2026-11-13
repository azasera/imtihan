# Paket produk E-Imtihan At-Tauhid

Paket perencanaan produk E-Imtihan At-Tauhid yang dibuat dengan Planora Product Kit.

## Artefak

- [Kebutuhan produk](PRD/README.md)
- [UI panduan pengalaman](UI/README.md)
- [Rencana eksekusi](EXECUTION/README.md)

## Status

Versi 0.9 — Penyelarasan format cetak rapor presisi mengadopsi 4 berkas rujukan PDF resmi At-Tauhid (`CHG-014`): Kurmer PTS (1 hal), Kurmer PAS (2 hal proporsional dengan Kokurikuler di hal 1 dan Ekskul/Absensi/Catatan Walas di hal 2), Diniyah PTS (1 hal dengan Target Hafalan Tengah Semester 1), dan Diniyah PAS (1 hal dengan Target Hafalan Semester 1/2), disertai perbaikan rendering PDF via `html2canvas-pro` berbasis palet warna hex standar dan kemampuan unduh batch/single PDF & ZIP. Versi 0.6 mengadopsi pola CBT pembanding (`CHG-005` s.d `CHG-010`). Modul E-Rapor CBT dan KOP SiPAKSa (`CHG-012`, `CHG-013`) telah beroperasi penuh.

## Perintah agent

- `/planora-next` — implementasikan dan verifikasi tepat satu TODO yang dependensinya sudah siap.
- `/planora-change` — revisi perilaku produk dan sinkronkan paket perencanaan sebelum implementasi.
- `/feature` — implementasikan fitur dengan scope eksplisit di luar urutan Planora Next.
- `/bug` — analisis dan perbaiki defect.
- `/chore` — lakukan maintenance tanpa mengubah perilaku produk.
- `/e2e-tester <path-spec>` — jalankan spec pengujian E2E melalui browser.

## Konteks kritis

E-Imtihan At-Tauhid adalah sistem Computer-Based Assessment (CBA) modern yang dirancang khusus untuk lingkungan pesantren dan madrasah. Fokus utama adalah integritas evaluasi santri, kemudahan pembuatan bank soal oleh asatidzah, serta antarmuka pengerjaan ujian santri yang ringan dan bebas distraksi tanpa mewajibkan registrasi akun email pribadi bagi santri.
