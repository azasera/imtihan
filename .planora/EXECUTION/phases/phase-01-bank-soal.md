# Fase 01 — Manajemen Bank Soal

Implementasi modul manajemen mata pelajaran, paket bank soal, dan butir soal pilihan ganda serta essay, termasuk penulisan soal massal dari teks tempelan maupun tempelan baris lembar kerja, serta penanda mutu butir untuk pengajar. Cakupan kebutuhan: `BANK-FR-001` sampai `BANK-FR-015`.

## Dependensi

Fase 00 (Pondasi arsitektur dan skema database).

## Workflow eksekusi

- `feature` — Implementasi skema tabel Bank Soal dan Butir Soal di Convex (`BANK-FR-001`, `BANK-FR-002`).
- `feature` — Pembuatan antarmuka editor soal pengajar berbasis Shadcn UI (`BANK-FR-003`, `BANK-FR-004`).
- `feature` — Sunting dan gandakan butir soal serta pengatur jumlah opsi sampai lima (`BANK-FR-002`, `BANK-FR-009`, `BANK-AC-003`, `BANK-AC-010`, `BANK-AC-011`). Terpasang dan terverifikasi lewat probe CLI sebagai `CHG-002` (2026-11-04); perjalanan browser masih tercatat sebagai handoff E2E.
- `feature` — Impor massal butir soal dari tempelan teks dengan pratinjau penafsiran dan penyimpanan bertahap (`BANK-FR-008`, `BANK-AC-006`, `BANK-AC-007`, `BANK-AC-008`, `BANK-AC-009`, `NFR-PERF-004`). Terpasang dan terverifikasi lewat probe CLI sebagai `CHG-003` (2026-11-04); pratinjau, simpan sebagian, kegagalan bertahap, 200 butir, dan layout ponsel masih tercatat sebagai handoff E2E.
- `feature` — Halaman kelola mata pelajaran dan pilihan jenjang resmi pada pembuatan paket (`BANK-FR-010`, `BANK-FR-011`, `BANK-AC-012`, `BANK-AC-013`, `NFR-SEC-006`). Terpasang dan terverifikasi lewat probe CLI sebagai `CHG-004` (2026-11-04); gerbang tanpa login, penolakan kode ganda, penolakan hapus baris terpakai, dan pasangan lembaga-tingkat sudah terbukti di server, sementara ketercerminan lintas layar, keadaan tanpa login, dan layout ponsel masih tercatat sebagai handoff E2E.
- `feature` — Pembahasan butir khusus pengajar, penanda tingkat berpikir, dan rujukan capaian materi per mata pelajaran (`BANK-FR-014`, `BANK-FR-015`, `BANK-AC-016`, `BANK-AC-017`, `BANK-AC-018`, `NFR-SEC-007`). Terpasang dan terverifikasi lewat probe CLI sebagai `CHG-005` (2026-11-04); round-trip formulir, validasi panjang label, akses koreksi pemilik sesi, dan ketiadaan kolom pada payload santri sudah terbukti di server serta sumber, sementara tampilan formulir, kebocoran panel pratinjau, lembar koreksi, impor bertanda, dan layout ponsel masih tercatat sebagai handoff E2E.
- `feature` — Tempelan baris lembar kerja satu butir per baris dan unduhan template kolom pada impor massal (`BANK-FR-012`, `BANK-FR-013`, `BANK-AC-014`, `BANK-AC-015`, `NFR-PERF-005`). Terpasang sebagai `CHG-006` (2026-11-04) dan terverifikasi lewat 22 tes parser/komponen baru (247/247 tes lulus), typecheck bersih, build sukses, serta pemeriksaan kebocoran 0 kecocokan; tempel dari Excel/Sheets, unduhan serta tempel balik template, baris bermasalah, 200 baris, dan layout ponsel masih tercatat sebagai handoff E2E.
- `feature` — Penyelarasan alur kerja studio pembuatan bank soal dengan opsi impor naskah massal terpadu (Word & Excel) (`BANK-FR-008`, `BANK-FR-012`, `BANK-FR-016`). Terpasang sebagai `CHG-011` (2026-11-07).

## Kriteria keluar

- Pengajar dapat membuat dan mengedit paket bank soal.
- Butir soal pilihan ganda dan essay tersimpan dengan validasi kunci jawaban yang benar.
- Pengajar dapat menulis satu paket berisi puluhan butir dari naskah yang sudah ada tanpa mengetik ulang butir demi butir, dan dapat melihat serta memperbaiki hasil tafsiran sebelum butir masuk.
- Butir yang sudah tersimpan dapat disunting dan digandakan tanpa mengubah nomor urut dan tanpa mengulang penulisan.
- Daftar mata pelajaran dapat disesuaikan pengajar, dan tingkat paket memakai kosakata jenjang yang sama dengan data santri.
- Tidak ada butir yang tersimpan tanpa peninjauan, dan kegagalan di tengah impor tidak meninggalkan daftar setengah jadi tanpa laporan.
- Pengajar dapat menempel hasil salinan dari lembar kerja dan menempel balik unduhan template tanpa menyesuaikan kolom, dengan bentuk tempelan dikenali otomatis.
- Pembahasan, tingkat berpikir, dan rujukan capaian tersimpan per butir, tampil pada lembar koreksi pengajar, dan tidak pernah terkirim ke perangkat santri.
