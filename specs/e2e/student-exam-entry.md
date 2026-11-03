# Spesifikasi E2E: Pintu Gerbang Ujian Santri & Verifikasi Token (TASK-005 & TASK-010)

- **Target Kebutuhan**: `UJIAN-FR-001`, `UJIAN-FR-006`, `UJIAN-FR-007`
- **Cacat Terkait**: Halaman gerbang pernah memanggil `React.useMemo` setelah `return` lebih awal di `apps/app/ujian/page.tsx`, sehingga transisi ke lembar pengerjaan memicu error React "Rendered fewer hooks than expected". Perbaikan sudah diterapkan; spek ini membuktikannya di browser.
- **Rekomendasi E2E**: `Required` (cacat hanya muncul di batas browser, saat perubahan state client-side)
- **Status**: `Pending` (Handoff untuk `/e2e-tester`)
- **Lingkungan**: Local development (`http://localhost:3000`) dengan Convex dev deployment

## Prasyarat
1. Server lokal berjalan pada `http://127.0.0.1:3000` (pakai alamat IPv4 eksplisit; `localhost` resolve ke IPv6 sehingga koneksi ditolak automation).
2. Minimal terdapat 1 sesi ujian dengan status `Sedang Aktif` dan memiliki token 6 digit yang valid (misal dari sesi yang dibuat di `TASK-004`).
3. Sesi ujian tersebut sudah dipasangi bank soal berisi minimal 2 butir soal, agar lembar pengerjaan memiliki konten untuk ditampilkan.
4. BukaDev browser pada mode jendela biasa (bukan device emulation) agar tata letak 3-panel teruji.
5. Isian form dikendalikan React: pengisian otomatis wajib memakai native value setter lalu event `input`, dan pilihan lembaga/kelas memakai Radix Select yang dirender lewat portal (bukan dropdown biasa).

## Skenario Pengujian Browser
1. **Membuka Halaman Gerbang Ujian Santri**:
   - Buka URL `/ujian` di browser (tanpa perlu login pengajar / mode penyamaran).
   - *Ekspektasi*: Tampil halaman gerbang ujian bertajuk "Ruang Ujian Santri" dengan logo resmi E-Imtihan At-Tauhid dan formulir terstruktur 6 tahap.

2. **Perilaku Pilihan Lembaga dan Kelas Dinamis**:
   - Periksa field kelas saat lembaga belum dipilih: dropdown kelas dalam keadaan dinonaktifkan (`disabled`).
   - Pilih Lembaga `SMPITA`: dropdown kelas menjadi aktif dan memuat pilihan kelas 7 sampai 9. Pilih salah satu kelas (misal `Kelas 7`).
   - Ubah Lembaga menjadi `MTA`: pilihan kelas sebelumnya otomatis dikosongkan (`reset`) dan kini memuat daftar kelas MTA 1 sampai 6.

3. **Validasi Token Tidak Valid**:
   - Masukkan token acak yang salah, misal: `999XYZ`.
   - *Ekspektasi*: Sistem menampilkan pesan kesalahan ramah bahwa token tidak dapat digunakan atau sesi belum aktif.

4. **Verifikasi Token Valid & Pratinjau Ujian**:
   - Masukkan token 6 digit dari sesi ujian yang aktif.
   - *Ekspektasi*: Kotak pratinjau ujian muncul menampilkan Judul Ujian, Mata Pelajaran, Tingkat Kelas, dan Durasi Ujian.

5. **Pengisian Data Santri & Masuk Sesi Ujian**:
   - Masukkan Nomor Induk Santri (NISN / NIS / ID Santri): `24.02.001`.
   - *Ekspektasi*: Nama santri, lembaga, dan kelas terisi otomatis dari basis data dan terkunci resmi.
   - Klik tombol "Konfirmasi & Masuk Ruang Ujian".
   - *Ekspektasi*: Sistem mencatat peserta ke database, menampilkan toast sukses, dan menyajikan ringkasan instruksi tata tertib pengerjaan ujian santri.

6. **Transisi ke Lembar Pengerjaan (skenario reproduksi cacat)**:
   - Pada ringkasan instruksi, klik tombol "Mulai Mengerjakan Ujian".
   - *Ekspektasi*: Lembar pengerjaan 3-panel tampil berisi daftar soal, timer hitung mundur berjalan, dan **tidak ada error React di console**. Sebelum perbaikan, langkah ini memicu crash "Rendered fewer hooks than expected".
   - Periksa console browser: harus bersih dari pesan berawalan `Warning:` atau `Error:` dari React.

7. **Regresi Sekitar: Keluar dan Masuk Ulang (mode lanjut ujian)**:
   - Di dalam lembar pengerjaan, jawab 1 soal lalu gunakan tindakan keluar untuk kembali ke ringkasan, kemudian klik "Mulai Mengerjakan Ujian" sekali lagi.
   - *Ekspektasi*: Transisi bolak-balik tetap mulus dan jawaban yang tersimpan masih tampil.
   - Muat ulang halaman `/ujian` dan masukkan token yang sama untuk santri yang sama.
   - *Ekspektasi*: Sistem menampilkan toast melanjutkan sesi yang sedang berlangsung, dan transisi ke lembar pengerjaan tetap berhasil.

## Bukti Eksekusi (Evidence)
*(Akan dilengkapi saat /e2e-tester dijalankan)*
