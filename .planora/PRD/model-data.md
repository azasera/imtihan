# Model data konseptual

Dokumen ini mendefinisikan entitas data konseptual untuk E-Imtihan At-Tauhid tanpa mengikat ke implementasi database fisik tertentu.

## Entitas Utama

1. **PENGGUNA (User)**
   - Atribut: user_id, nama_lengkap, email, peran (admin/pengajar), status_aktif.
2. **MATA_PELAJARAN (Subject)**
   - Atribut: mapel_id, kode_mapel, nama_mapel, deskripsi.
3. **BANK_SOAL (QuestionBank)**
   - Atribut: bank_id, mapel_id, judul_paket, tingkat_kelas, pembuat_id, tanggal_dibuat.
4. **BUTIR_SOAL (QuestionItem)**
   - Atribut: soal_id, bank_id, nomor_urut, tipe_soal (multiple_choice/pg_kompleks/true_false/essay), teks_stimulus (opsional), url_media_stimulus (opsional), teks_soal, media_lampiran, bobot_nilai.
5. **OPSI_JAWABAN & KUNCI (AnswerOption)**
   - Atribut: opsi_id, soal_id, label_opsi (A/B/C/D), teks_opsi, is_kunci_jawaban (mendukung multi-kunci untuk pg_kompleks, atau boolean benar/salah untuk true_false).
6. **SESI_UJIAN (ExamSession)**
   - Atribut: sesi_id, bank_id, nama_sesi, token_akses, waktu_mulai, waktu_selesai, durasi_menit, acak_soal, status (draft/aktif/selesai), pemilik_sesi (penanda identitas pengajar pembuat sesi, dipakai untuk membatasi daftar sesi, monitoring, dan koreksi).
7. **PESERTA_SESI (ExamParticipant)**
   - Atribut: peserta_id, sesi_id, nisn, nama_santri, kelas, waktu_masuk, waktu_selesai, status_pengerjaan (sedang mengerjakan/selesai), jumlah_pelanggaran_tab (tab_violations), skor_pilihan_ganda, skor_essay, skor_akhir, status_koreksi (menunggu essay/selesai).
8. **LEMBAR_JAWABAN & NILAI (AnswerSheet)**
   - Atribut: lembar_id, peserta_id, question_id, selected_option_id, selected_option_ids (multi-opsi pg_kompleks), selected_boolean (true_false), jawaban_essay, is_ragu, skor_diperoleh.
9. **SANTRI_MASTER (StudentMaster)**
   - Atribut: santri_id, id_sistem, nama_lengkap, nisn, nis, jenjang (SMPITA/SMAITA/MTA), kelas, jenis_kelamin, asrama, guru_halaqah, status_aktif, waktu_sinkronisasi.
