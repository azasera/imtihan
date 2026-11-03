# Spesifikasi E2E: Penilaian Instan Pilihan Ganda & Koreksi Essay (TASK-007)

- **Target Kebutuhan**: `NILAI-FR-001`, `NILAI-FR-002`, `NILAI-FR-003`
- **Rekomendasi E2E**: `Recommended`
- **Status**: `Pending` (Handoff untuk `/e2e-tester`)
- **Lingkungan**: Local development (`http://localhost:3000`) dengan Convex dev deployment

## Prasyarat
1. Server lokal aktif pada `http://localhost:3000`.
2. Pengguna login sebagai pengajar/admin.
3. Terdapat minimal 1 peserta ujian yang telah mengumpulkan lembar jawaban ujian (`submitted`).

## Skenario Pengujian Browser
1. **Perhitungan Otomatis Skor Pilihan Ganda**:
   - Santri mengumpulkan ujian yang memuat soal pilihan ganda.
   - Pengajar membuka menu rekap / hasil sesi ujian.
   - *Ekspektasi*: Kolom skor pilihan ganda santri langsung menampilkan angka perolehan nilai secara otomatis sesuai kunci jawaban tanpa perlu dihitung manual.

2. **Membuka Lembar Periksa Koreksi Essay**:
   - Pengajar mengklik tombol "Koreksi Essay" pada baris santri yang bersangkutan.
   - *Ekspektasi*: Halaman koreksi terbuka, menampilkan teks pertanyaan, rubrik pedoman penilaian, dan jawaban essay yang diketik santri.

3. **Pengisian Nilai Skor Essay & Catatan Evaluasi**:
   - Pengajar memasukkan skor nilai (misal: 25 dari total bobot 30) dan menulis catatan evaluasi: "Penjelasan cukup lengkap dan tepat".
   - Mengklik tombol "Simpan Nilai Koreksi".
   - *Ekspektasi*: Toast sukses muncul, nilai essay tersimpan, dan total nilai akhir santri langsung terakumulasi (Skor PG + Skor Essay).

## Bukti Eksekusi (Evidence)
*(Akan dilengkapi saat /e2e-tester dijalankan)*
