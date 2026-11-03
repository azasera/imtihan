# Spesifikasi E2E: Dashboard Rekapitulasi Nilai & Ekspor Laporan (TASK-008)

- **Target Kebutuhan**: `NILAI-FR-003`, `NILAI-FR-004`
- **Rekomendasi E2E**: `Recommended`
- **Status**: `Pending` (Handoff untuk `/e2e-tester`)
- **Lingkungan**: Local development (`http://localhost:3000`) dengan Convex dev deployment

## Prasyarat
1. Server lokal aktif pada `http://localhost:3000`.
2. Pengguna login sebagai pengajar/admin.
3. Terdapat minimal 1 sesi ujian dengan santri yang telah menyelesaikan ujian.

## Skenario Pengujian Browser
1. **Membuka Halaman Rekap Nilai & Memilih Sesi**:
   - Buka menu "Rekap Nilai" di sidebar.
   - Pilih sesi ujian pada dropdown sesi.
   - *Ekspektasi*: Kartu statistik kelas muncul menampilkan Rata-rata Nilai, Nilai Tertinggi, Nilai Terendah, dan Persentase Tuntas KKM.

2. **Ekspor Data Nilai ke Format CSV**:
   - Klik tombol "Ekspor CSV".
   - *Ekspektasi*: Browser mengunduh file `.csv` dengan nama `Rekap-Nilai-...csv`, berisi data santri, skor PG, skor essay, total nilai, dan status KKM.

3. **Pratinjau Cetak Laporan Resmi**:
   - Klik tombol "Cetak Laporan".
   - *Ekspektasi*: Halaman memicu dialog cetak browser dengan kop resmi Pondok Pesantren At-Tauhid tanpa elemen sidebar dan tombol website.

## Bukti Eksekusi (Evidence)
*(Akan dilengkapi saat /e2e-tester dijalankan)*
