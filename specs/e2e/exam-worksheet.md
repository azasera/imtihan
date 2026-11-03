# Spesifikasi E2E: Lembar Pengerjaan Ujian Santri & Auto-Save (TASK-006)

- **Target Kebutuhan**: `UJIAN-FR-002`, `UJIAN-FR-003`, `UJIAN-FR-004`, `UJIAN-FR-005`
- **Rekomendasi E2E**: `Recommended`
- **Status**: `Pending` (Handoff untuk `/e2e-tester`)
- **Lingkungan**: Local development (`http://localhost:3000`) dengan Convex dev deployment

## Prasyarat
1. Server lokal berjalan pada `http://localhost:3000`.
2. Sesi ujian aktif dengan minimal 2 butir soal (1 pilihan ganda dan 1 essay).
3. Santri telah berhasil masuk via NISN dan token di `/ujian`.

## Skenario Pengujian Browser
1. **Membuka Lembar Ujian & Verifikasi Elemen**:
   - Setelah masuk, klik tombol "Mulai Mengerjakan Ujian".
   - *Ekspektasi*: Lembar ujian terbuka dengan menampilkan timer hitung mundur, teks soal nomor 1, opsi pilihan jawaban, dan grid navigasi nomor soal.

2. **Memilih Jawaban Pilihan Ganda & Auto-Save**:
   - Klik salah satu opsi jawaban (misal Opsi B).
   - *Ekspektasi*: Opsi terpilih, indikator status auto-save menampilkan "Tersimpan", dan kotak nomor soal pada grid berubah menjadi status "Sudah Dijawab".

3. **Menandai Soal Ragu-ragu**:
   - Klik tombol "Ragu-ragu".
   - *Ekspektasi*: Kotak nomor soal pada grid berubah warna menjadi kuning (ragu-ragu).

4. **Navigasi ke Soal Berikutnya**:
   - Klik tombol "Soal Berikutnya" atau klik nomor 2 pada grid soal.
   - *Ekspektasi*: Tampilan berpindah ke soal nomor 2.

5. **Pengisian Jawaban Essay**:
   - Ketik jawaban pada textarea essay.
   - *Ekspektasi*: Jawaban tersimpan otomatis ke database.

6. **Konfirmasi Pengumpulan Lembar Ujian**:
   - Klik tombol "Selesaikan Ujian".
   - *Ekspektasi*: Dialog konfirmasi pengumpulan muncul menampilkan rekap jumlah soal yang sudah dijawab, belum dijawab, dan ragu-ragu.
   - Klik "Ya, Kumpulkan Jawaban".
   - *Ekspektasi*: Lembar ujian ditutup, status peserta menjadi selesai, dan tampil layar penutup bahwa ujian telah berhasil dikumpulkan.

## Bukti Eksekusi (Evidence)
*(Akan dilengkapi saat /e2e-tester dijalankan)*
