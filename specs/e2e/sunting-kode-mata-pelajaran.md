# Spesifikasi E2E: Sunting Kode Mata Pelajaran dengan Pembaruan Beruntun (Cascading Update)

- **Target**: `specs/feat-edit-subject-code-cascading.md`
- **Rekomendasi**: `Recommended`
- **Status**: `Pending`
- **Lingkungan**: Local development (`http://localhost:3000`) dengan Convex dev deployment
- **Prasyarat**:
  1. Server Next.js lokal aktif di `http://localhost:3000`.
  2. Akun pengajar login aktif (`pengajar.uji@example.com` / `UjiDev2026`).
  3. Memiliki setidaknya 1 paket bank soal yang terhubung ke mata pelajaran aktif (misal `FIQIH`).

## Skenario Pengujian Browser

1. **Akses Dialog Sunting Mata Pelajaran**:
   - Buka `http://localhost:3000/mata-pelajaran`.
   - Periksa tombol aksi pada tabel desktop dan kartu mobile: bertuliskan "Sunting" dengan ikon pensil (`PencilIcon`).
   - Klik tombol "Sunting" pada mata pelajaran yang memiliki paket bank soal.
   - *Ekspektasi*: Modal "Sunting Mata Pelajaran" terbuka, menampilkan badge jumlah paket terhubung, input Nama, input Kode Singkat (`font-mono uppercase`), teks peringatan dampak cascading update, dan input Deskripsi.

2. **Validasi Penolakan Kode Duplikat**:
   - Ubah nilai input Kode Singkat menjadi kode yang sudah dipakai mata pelajaran lain (misal `HADITS`).
   - Klik "Simpan Perubahan".
   - *Ekspektasi*: Muncul toast error yang memberitahukan bahwa kode tersebut sudah digunakan oleh mata pelajaran lain, modal tidak tertutup otomatis, dan data tidak tersimpan.

3. **Penyuntingan Kode dan Cascading Update ke Bank Soal**:
   - Ubah nilai input Kode Singkat menjadi kode baru yang belum pernah digunakan (misal `FIQIH_MODERN`).
   - Klik "Simpan Perubahan".
   - *Ekspektasi*:
     - Muncul toast sukses: "Mata pelajaran diperbarui beserta X paket terkait."
     - Modal tertutup dan baris tabel mata pelajaran menampilkan kode baru `FIQIH_MODERN`.
   - Buka `http://localhost:3000/bank-soal`:
     - Verifikasi paket bank soal yang sebelumnya menggunakan kode lama kini otomatis terhubung dengan `FIQIH_MODERN`.
     - Filter mata pelajaran berfungsi normal dengan kode baru.

4. **Pengembalian Data (Cleanup)**:
   - Sunting kembali mata pelajaran tersebut ke kode asalnya agar data pengujian tetap bersih.

## Bukti Pengujian Browser
<!-- Bagian ini akan diisi oleh /e2e-tester setelah eksekusi browser selesai -->
