# Fase 02 — Sesi Ujian dan Token

Implementasi modul penjadwalan ujian, alokasi durasi waktu, generator token akses, dan pemantauan langsung sesi yang sedang berjalan. Cakupan kebutuhan: `SESI-FR-001` sampai `SESI-FR-005`.

## Dependensi

Fase 01 (Paket bank soal telah tersedia).

## Workflow eksekusi

- `feature` — Backend generator token 6 digit alfanumerik (`SESI-FR-001`, `SESI-FR-002`).
- `feature` — Antarmuka penjadwalan, kontrol sesi ujian aktif, dan toggle pengacakan soal/opsi bagi pengawas (`SESI-FR-002`, `SESI-FR-003`).
- `feature` — Layar Monitoring Sesi Ujian pada menu utama pengajar beserta entri sidebar (`SESI-FR-004`, `SESI-FR-005`, `SESI-AC-004`, `SESI-AC-005`).

## Kriteria keluar

- Sesi ujian dapat dijadwalkan dengan durasi menit yang akurat.
- Token ujian aktif dapat diverifikasi oleh sistem.
- Pengajar dapat membuka layar monitoring dari menu utama, memilih sesinya sendiri, dan melihat status tiap peserta yang sudah masuk beserta badge pelanggaran tab dan tautan koreksi.
- Sesi dan peserta milik pengajar lain tidak muncul, dan permintaan tanpa login menghasilkan daftar kosong.
