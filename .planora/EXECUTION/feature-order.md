# Urutan fitur

Rencana tahapan implementasi fitur berdasarkan dependensi teknis:

1. **Pondasi Manajemen Bank Soal**:
   - Menjadi dependensi mutlak karena sesi ujian memerlukan paket butir soal yang telah tersedia.
   - Tiga pekerjaan lanjutan mempercepat penyusunan soal dan tercatat sebagai `CHG-002` (sunting dan gandakan butir, opsi sampai lima), `CHG-003` (impor massal dari tempelan teks dengan pratinjau), dan `CHG-004` (kelola mata pelajaran dan jenjang resmi). `CHG-002` dikerjakan lebih dulu karena `CHG-003` memakai formulir sunting untuk memperbaiki butir yang perlu diubah setelah pratinjau.
   - Revisi pembanding pasar menambahkan `CHG-005` (pembahasan butir, penanda tingkat berpikir, dan rujukan capaian materi) lebih dulu, karena `CHG-006` memetakan kolom tempelan lembar kerja ke tempat penyimpanan yang diciptakan `CHG-005`. `CHG-006` menyusul `CHG-003` karena memakai layar pratinjau yang sama.
2. **Sesi Ujian dan Token Akses**:
   - Mengatur parameter jadwal, durasi pengerjaan, dan generator token dari paket bank soal yang telah dibuat.
   - Termasuk layar Monitoring Sesi Ujian pada menu utama pengajar (`CHG-001`) yang menampilkan status peserta per sesi; query backend daftar peserta sudah tersedia, jadi pekerjaan utamanya ada di antarmuka.
   - `CHG-008` (masa berlaku token dan penayangannya) dan `CHG-007` (batas tuntas serta sesi remedial/susulan) sudah selesai. Keduanya bergantung pada modul sesi yang sama; rotasi token menjadi langkah murah yang mengurangi kebutuhan token kapabilitas per partisipan yang masih terbuka sebagai keputusan.
3. **Ruang Ujian Santri (CBA Interface)**:
   - Menggunakan token ujian untuk memberikan akses pengerjaan soal dan perekaman jawaban santri.
4. **Penilaian dan Rekapitulasi Nilai**:
   - Menghitung lembar jawaban santri yang telah terkumpul dan menyajikan laporan nilai bagi pengajar.
   - `CHG-010` (analisis mutu butir per sesi, penanda tuntas terhadap batas tuntas, dan kelompok remedial/pengayaan) sudah selesai pada 2026-11-05 dengan memakai batas tuntas dari `CHG-007` serta penanda tingkat berpikir dan capaian materi dari `CHG-005`; bukti peramban sudah dieksekusi 2026-11-05 dan lolos 14/14 setelah temuan cetak header/sidebar diperbaiki lewat `/bug`).
5. **Integrasi Data Santri SiPAKSa (SMP, SMA, MTA)**:
   - Menghubungkan platform dengan API SiPAKSa untuk menyinkronkan 346 santri nyata dan menyediakan auto-complete identitas ujian.
6. **Penyempurnaan Fitur CBT & Integritas Ujian**:
   - Menambahkan tipe soal PG Kompleks dan Benar/Salah, stimulus wacana/media, formulir pembuatan soal dengan Live Preview, ruang ujian 3-panel responsif, proteksi anti-curang (tab blur detection, clipboard blocker), serta metrik pelanggaran tab di rekap nilai.
   - `CHG-009` (mode penegakan yang dapat dipilih pengajar: mencatat saja sebagai bawaan, atau mengunci lembar setelah ambang dengan pembukaan kembali dari layar monitoring) sudah selesai pada 2026-11-04. Pekerjaannya menempel pada tahap ini tetapi dieksekusi di Fase 03 karena mengubah perilaku ruang ujian santri. Bukti peramban dieksekusi 2026-11-05: 10 dari 13 skenario lolos, skenario kebersihan teks gagal karena pemilih menampilkan ID dokumen internal (`BUG-001`), dan dua skenario terbatas alat otomasi; `BUG-001` diperbaiki dan skenario kebersihan teks lolos pada pengulangan (9/9 `Passed`), sedangkan dua skenario tetap terblokir; rincian pada `specs/e2e/mode-penegakan-integritas.md`.
7. **Modul E-Rapor Kurikulum Merdeka & Diniyah Terintegrasi CBT (`CHG-012`)**:
   - Menghubungkan hasil penilaian CBT yang sudah terkumpul pada Fase 04 (nilai PH, STS, dan SAS) langsung ke modul E-Rapor tanpa input manual berulang.
   - Mengotomatisasi perumusan deskripsi narasi Capaian Pembelajaran (CP/TP), penghitungan Nilai Akhir Rapor (NAR), predikat, dan peringkat kelas.
   - Menyediakan antarmuka asesmen wali kelas untuk mengelola absensi semester, nilai kegiatan ekstrakurikuler, dimensi Profil Pelajar Pancasila (P5), serta capaian hafalan Hadits Arba'in dan Tahfidz Al-Qur'an.
   - Menerapkan KOP resmi SiPAKSa dinamis sesuai lembaga santri (`SMPITA`, `SMAITA`, `MTA`) di bawah naungan Yayasan At-Tauhid Al Islamy Bangka Belitung pada lembar cetak rapor standar A4 dan buku leger nilai kelas (`.xlsx`).
8. **Penyelarasan Format Rapor Presisi 4 Varian PDF Resmi (`CHG-014`)**:
   - Menyelaraskan lembar cetak rapor A4 persis dengan 4 dokumen acuan PDF resmi: Kurmer PTS (1 hal), Kurmer PAS (2 hal terpisah proporsional dengan Kokurikuler di hal 1 dan Ekskul/Absensi/Catatan di hal 2), Diniyah PTS (1 hal dengan Target Hafalan Tengah Semester), dan Diniyah PAS (1 hal dengan Target Hafalan Semester).
   - Menjamin palet warna hex standar bebas fungsi CSS modern `oklch`/`lab` untuk rendering PDF mulus via `html2canvas-pro` tanpa galat peramban.
