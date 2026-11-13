# Model data konseptual

Dokumen ini mendefinisikan entitas data konseptual untuk E-Imtihan At-Tauhid tanpa mengikat ke implementasi database fisik tertentu.

## Entitas Utama

1. **PENGGUNA (User)**
   - Atribut: user_id, nama_lengkap, email, peran (admin/pengajar), status_aktif.
2. **MATA_PELAJARAN (Subject)**
   - Atribut: mapel_id, kode_mapel (unik), nama_mapel, deskripsi, status_aktif (aktif/nonaktif), waktu_dibuat.
   - Catatan: daftar ini dipakai bersama seluruh madrasah; mata pelajaran bawaan hasil rujukan awal tetap ada, dan mata pelajaran nonaktif tidak ditawarkan lagi pada pembuatan paket baru tetapi tetap dibaca untuk paket lama.
3. **BANK_SOAL (QuestionBank)**
   - Atribut: bank_id, mapel_id, judul_paket, jenjang_lembaga (SMPITA/SMAITA/MTA), tingkat_kelas (dari kosakata jenjang lembaga, bukan teks bebas), pembuat_id, tanggal_dibuat.
4. **BUTIR_SOAL (QuestionItem)**
   - Atribut: soal_id, bank_id, nomor_urut, tipe_soal (multiple_choice/pg_kompleks/true_false/essay), teks_stimulus (opsional), url_media_stimulus (opsional), teks_soal, media_lampiran, bobot_nilai, pembahasan (opsional, hanya untuk pengajar/admin), tingkat_berpikir (mengingat/memahami/mengaplikasikan/menganalisis/belum ditandai), rujukan_capaian (label pendek per mata pelajaran, opsional).
5. **OPSI_JAWABAN & KUNCI (AnswerOption)**
   - Atribut: opsi_id, soal_id, label_opsi (A sampai E), teks_opsi, is_kunci_jawaban (mendukung multi-kunci untuk pg_kompleks, atau boolean benar/salah untuk true_false).
6. **SESI_UJIAN (ExamSession)**
   - Atribut: sesi_id, bank_id, nama_sesi, token_akses, waktu_mulai, waktu_selesai, durasi_menit, acak_soal, status (draft/aktif/selesai), pemilik_sesi (penanda identitas pengajar pembuat sesi, dipakai untuk membatasi daftar sesi, monitoring, dan koreksi), batas_tuntas (opsional), mode_penegakan (mencatat saja / kunci setelah ambang; mencatat saja sebagai bawaan), ambang_pelanggaran (jumlah perpindahan tab sebelum lembar terkunci, hanya dipakai pada mode kunci), interval_rotasi_token (nol berarti token tetap sampai diganti manual), waktu_token_terakhir_ganti, jenis_sesi (reguler/remedial/susulan), sesi_sumber (rujukan sesi asal untuk sesi lanjutan).
7. **PESERTA_SESI (ExamParticipant)**
   - Atribut: peserta_id, sesi_id, nisn, nama_santri, kelas, waktu_masuk, waktu_selesai, status_pengerjaan (sedang mengerjakan/selesai), jumlah_pelanggaran_tab (tab_violations), status_penegakan (bebas/terkunci), waktu_dibuka_pengajar, skor_pilihan_ganda, skor_essay, skor_akhir, status_koreksi (menunggu essay/selesai).
8. **LEMBAR_JAWABAN & NILAI (AnswerSheet)**
   - Atribut: lembar_id, peserta_id, question_id, selected_option_id, selected_option_ids (multi-opsi pg_kompleks), selected_boolean (true_false), jawaban_essay, is_ragu, skor_diperoleh.
9. **SANTRI_MASTER (StudentMaster)**
   - Atribut: santri_id, id_sistem, nama_lengkap, nisn, nis, jenjang (SMPITA/SMAITA/MTA), kelas, jenis_kelamin, asrama, guru_halaqah, status_aktif, waktu_sinkronisasi.
10. **RUJUKAN_CAPAIAN (AchievementLabel)**
   - Atribut: label_id, mapel_id, nama_label, dipakai_oleh_butir (jumlah).
   - Catatan: label pendek yang dikelola pengajar per mata pelajaran, bukan daftar kurikulum baku dari sistem; dipakai untuk mengelompokkan butir dan membaca capaian per cakupan materi.
11. **ANALISIS_BUTIR (ItemAnalysis)**
   - Atribut: sesi_id, soal_id, jumlah_peserta_dinilai, daya_serap, tingkat_kesukaran, daya_beda, sebaran_pilihan_per_opsi, status_tinjauan (perlu ditinjau/baik) beserta alasannya.
   - Catatan: sudut pandang baca dari data lembar jawaban dan kunci yang sudah ada, bukan tabel yang harus diisi pengajar; nilainya dihitung ulang setelah penilaian sesi berubah.
12. **PERIODE_AKADEMIK (AcademicPeriod)**
   - Atribut: periode_id, tahun_ajaran (misal "2026/2027"), semester (1/ganjil atau 2/genap), tanggal_rapor, kota_rapor (Pangkalpinang), status_aktif (boolean).
13. **CAPAIAN_PEMBELAJARAN (LearningObjective)**
   - Atribut: cp_id, periode_id, mapel_id, tingkat_kelas (misal "Kelas 7"), semester, kode_cp, deskripsi_cp, jenis_kurikulum (umum / diniyah).
14. **NILAI_RAPOR (ReportGrade)**
   - Atribut: nilai_id, periode_id, mapel_id, santri_id, kelas, nilai_ph (rata-rata tugas/harian), nilai_pts (STS), nilai_pas (SAS), nilai_akhir (NAR), predikat (A/B/C/D), cp_tertinggi_id, narasi_capaian, sumber_sesi_pts_id (opsional), sumber_sesi_pas_id (opsional), waktu_pembaruan.
15. **ASESMEN_WALI_KELAS (HomeroomAssessment)**
   - Atribut: asesmen_id, periode_id, santri_id, kelas, wali_kelas_id, sakit, izin, alpa, data_ekskul (daftar: nama_ekskul, predikat, keterangan), target_hadits, capaian_hadits, keterangan_tahfidz, catatan_walas, keputusan_kenaikan (naik/tinggal/lulus), status_kunci (draft/final).
16. **KOP_LEMBAGA (InstitutionLetterhead)**
   - Atribut: jenjang (SMPITA / SMAITA / MTA), nama_yayasan ("YAYASAN AT-TAUHID AL ISLAMY BANGKA BELITUNG"), nama_lembaga_resmi, npsn, alamat, kelurahan, kecamatan, kota, provinsi, url_logo. Diambil langsung mengikuti format baku KOP Rapor SiPAKSa.
