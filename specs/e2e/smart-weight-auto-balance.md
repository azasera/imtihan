# E2E Specification: Penentuan Bobot Cerdas pada Sesi Ujian

## Klasifikasi Kebutuhan E2E: Recommended

## Perjalanan Pengguna (User Journey):
1. **Navigasi ke Jadwal Sesi**:
   - Pengajar membuka `/sesi-ujian` dan mengklik tombol "Jadwalkan Sesi Ujian Baru".
2. **Aktifkan Komposisi & Pembobotan Soal**:
   - Pengajar menyalakan switch "Gunakan Komposisi & Pembobotan Soal".
3. **Uji Skenario Auto-Zero**:
   - Pengajar mengubah Jumlah Butir Esai menjadi `0`.
   - Pastikan Bobot Esai seketika menjadi `0%` dan Bobot Objektif seketika menjadi `100%`.
   - Pastikan badge status menampilkan `100% Pas` berwarna hijau.
4. **Uji Skenario Preset Cepat**:
   - Pengajar mengklik preset "Standar (70% : 30%)".
   - Pastikan Bobot Objektif menjadi `70%` dan Esai menjadi `30%`.
   - Pengajar mengklik preset "Hanya Objektif (100% : 0%)".
   - Pastikan Bobot Objektif menjadi `100%` dan Esai menjadi `0%`.
5. **Uji Skenario Auto-Complement**:
   - Pada kondisi kedua tipe soal memiliki butir > 0, pengajar mengubah Bobot Objektif menjadi `80%`.
   - Pastikan Bobot Esai otomatis menyesuaikan menjadi `20%` tanpa perlu pengetikan manual kedua.
6. **Simpan Sesi**:
   - Pengajar mengisi judul sesi dan menyimpan formulir.
   - Sesi tersimpan dengan komposisi valid dan token sesi ditampilkan.
