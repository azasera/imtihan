# Paket produk E-Imtihan At-Tauhid

Paket perencanaan produk E-Imtihan At-Tauhid yang dibuat dengan Planora Product Kit.

## Artefak

- [Kebutuhan produk](PRD/README.md)
- [UI panduan pengalaman](UI/README.md)
- [Rencana eksekusi](EXECUTION/README.md)

## Status

Versi 0.4 — menambahkan layar Monitoring Sesi Ujian pada menu utama pengajar (`SESI-FR-005`, `SESI-AC-004`, `SESI-AC-005`) beserta aturan isolasi data per pengajar dan pengecualian gerbang santri anonymous pada NFR keamanan. Item eksekusi `CHG-001` menunggu implementasi; keputusan penautan sesi ke daftar kelas santri masih terbuka. Validasi manusia dan technical design tetap diperlukan sebelum implementasi.

## Perintah agent

- `/planora-next` — implementasikan dan verifikasi tepat satu TODO yang dependensinya sudah siap.
- `/planora-change` — revisi perilaku produk dan sinkronkan paket perencanaan sebelum implementasi.
- `/feature` — implementasikan fitur dengan scope eksplisit di luar urutan Planora Next.
- `/bug` — analisis dan perbaiki defect.
- `/chore` — lakukan maintenance tanpa mengubah perilaku produk.
- `/e2e-tester <path-spec>` — jalankan spec pengujian E2E melalui browser.

## Konteks kritis

E-Imtihan At-Tauhid adalah sistem Computer-Based Assessment (CBA) modern yang dirancang khusus untuk lingkungan pesantren dan madrasah. Fokus utama adalah integritas evaluasi santri, kemudahan pembuatan bank soal oleh asatidzah, serta antarmuka pengerjaan ujian santri yang ringan dan bebas distraksi tanpa mewajibkan registrasi akun email pribadi bagi santri.
