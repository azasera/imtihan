# Paket produk E-Imtihan At-Tauhid

Paket perencanaan produk E-Imtihan At-Tauhid yang dibuat dengan Planora Product Kit.

## Artefak

- [Kebutuhan produk](PRD/README.md)
- [UI panduan pengalaman](UI/README.md)
- [Rencana eksekusi](EXECUTION/README.md)

## Status

Versi 0.3 — penyempurnaan fitur CBT (tipe soal PG Kompleks & Benar/Salah, stimulus wacana, form Live Preview, tata letak 3-panel responsif, dan proteksi anti-curang dengan pencatatan pelanggaran tab). Validasi manusia dan technical design tetap diperlukan sebelum implementasi.

## Perintah agent

- `/planora-next` — implementasikan dan verifikasi tepat satu TODO yang dependensinya sudah siap.
- `/planora-change` — revisi perilaku produk dan sinkronkan paket perencanaan sebelum implementasi.
- `/feature` — implementasikan fitur dengan scope eksplisit di luar urutan Planora Next.
- `/bug` — analisis dan perbaiki defect.
- `/chore` — lakukan maintenance tanpa mengubah perilaku produk.
- `/e2e-tester <path-spec>` — jalankan spec pengujian E2E melalui browser.

## Konteks kritis

E-Imtihan At-Tauhid adalah sistem Computer-Based Assessment (CBA) modern yang dirancang khusus untuk lingkungan pesantren dan madrasah. Fokus utama adalah integritas evaluasi santri, kemudahan pembuatan bank soal oleh asatidzah, serta antarmuka pengerjaan ujian santri yang ringan dan bebas distraksi tanpa mewajibkan registrasi akun email pribadi bagi santri.
