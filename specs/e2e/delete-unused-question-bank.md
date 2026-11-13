# E2E Specification: Penghapusan Aman Paket Bank Soal yang Tidak Terpakai

## Target
Memvalidasi alur antarmuka dan proteksi data saat pengajar menghapus paket bank soal:
1. Paket bank soal yang belum pernah digunakan sesi ujian dapat dihapus tuntas.
2. Paket bank soal yang sudah dipakai sesi ujian dilindungi (tombol hapus nonaktif dan mutasi ditolak jika dipaksa).

## Sumber
- Permintaan pengguna: "Untuk Bank Soal. apa rencana anda agar bank soal yg tdk terpakai bisa dihapus" & "lanjut sesuai rencana".
- Spesifikasi fitur: `specs/feat-delete-unused-question-bank.md`.
- Rekomendasi E2E: `Recommended` (Status: `Pending`).

## Lingkungan & Prasyarat
- Server Next.js lokal berjalan pada `http://localhost:3000`.
- Akun pengajar aktif telah masuk (*logged in*).

## Skenario Pengujian

### Skenario 1: Tampilan Status Pemakaian pada Kartu Bank Soal
1. Buka halaman bank soal `http://localhost:3000/bank-soal`.
2. Amati kartu paket bank soal yang tersedia.
3. **Hasil yang Diharapkan**:
   - Setiap kartu menampilkan baris "Status Pemakaian:".
   - Paket tanpa sesi menampilkan badge "Belum dipakai".
   - Paket yang memiliki sesi menampilkan badge "Dipakai (X sesi)".

### Skenario 2: Penghapusan Berhasil pada Paket yang Belum Dipakai
1. Buat paket bank soal baru sementara (contoh: "Paket Uji Coba Hapus").
2. Pastikan paket tersebut belum ditautkan ke sesi ujian mana pun.
3. Pada kartu paket tersebut, amati tombol Hapus (ikon tempat sampah).
4. Klik tombol Hapus.
5. Konfirmasi dialog penghapusan.
6. **Hasil yang Diharapkan**:
   - Muncul notifikasi toast sukses: "Paket bank soal \"Paket Uji Coba Hapus\" berhasil dihapus."
   - Kartu paket tersebut hilang dari daftar.

### Skenario 3: Perlindungan Paket yang Sudah Digunakan Sesi Ujian
1. Amati paket bank soal yang sedang atau pernah digunakan pada sesi ujian (misal paket "Adab dan Akhlaq 1" yang ditautkan ke sesi ujian).
2. Periksa tombol Hapus pada kartu paket tersebut.
3. **Hasil yang Diharapkan**:
   - Tombol Hapus dalam keadaan nonaktif (*disabled*).
   - Tooltip / judul tombol menyatakan bahwa paket terkunci karena sudah dipakai pada sesi ujian.
   - Mengklik tombol tidak memicu dialog konfirmasi atau aksi penghapusan.

## Bukti Eksekusi
*(Akan dilengkapi pada eksekusi terpisah lewat `/e2e-tester`)*
- Status: `Pending`
