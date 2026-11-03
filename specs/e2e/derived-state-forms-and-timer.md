# Spesifikasi E2E: Perilaku Formulir & Hitung mundur Setelah refactor State Turunan

- **Sumber Permintaan**: permintaan chore "perbaiki 7 error lint" (mengganti penyalinan state lewat efek dengan penurunan nilai saat render)
- **Rekomendasi E2E**: `Recommended`
- **Status**: `Pending` (Handoff untuk `/e2e-tester`)
- **Lingkungan**: Local development (`http://localhost:3000`) dengan Convex dev deployment
- **Alasan**: perubahan menyentuh state klien pada 5 layar, termasuk timer ujian dan pengumpulan otomatis yang tidak bisa dibuktikan dari tes sumber.

## Prasyarat

1. Server lokal berjalan (`npm run dev`). **Wajib** dibuka lewat `http://localhost:3000`: lewat `http://127.0.0.1:3000` halaman ter-render tetapi login pengajar ditolak better-auth dengan `INVALID_ORIGIN` (terbukti 2026-11-03).
2. Login pengajar uji `pengajar.uji@example.com` / `UjiDev2026`. Alur login ini sudah terbukti lulus di browser (lihat Bukti).
3. **Buat satu sesi ujian aktif lewat dialog "Jadwalkan Sesi Ujian"** (bank "Uji Integrasi CBT" berisi 2 butir). Sesi lama token `HH4XC2` dimiliki identitas seed CLI (`https://convex.test|-59396202`) sehingga **tidak tampil** untuk akun `pengajar.uji@example.com` — jangan mengandalkan token itu.
4. Gunakan santri yang **belum** pernah masuk sesi itu. Santri uji `0119755229` sudah berstatus `submitted` di sesi `HH4XC2`, jadi pakai nomor lain dari master data dev, misalnya `26.02.001` (SMPITA kelas 7A). Untuk pengujian resume, santri yang sama harus dipakai dua kali.
5. Konsol browser harus terbuka selama seluruh skenario; tidak boleh muncul error React.

## Skenario Pengujian Browser

1. **Gerbang ujian: auto-fill tanpa efek sinkronisasi** (`/ujian`)
   - Ketik nomor induk `26.02.001` pada langkah 1.
   - *Ekspektasi*: Lembaga terisi `SMPITA`, Kelas `7A`, Nama terisi sesuai master data, ketiga field dalam keadaan terkunci (ikon gembok) dan tidak dapat diedit.
   - Hapus karakter nomor induk sampai di bawah 3 huruf.
   - *Ekspektasi*: Lembaga/Kelas/Nama kembali ke keadaan kosong dan dapat diisi manual (perilaku baru: isian manual tidak lagi "menempel" pada identitas santri lain).
   - Masukkan token valid, klik "Konfirmasi & Masuk Ruang Ujian", lalu "Mulai Mengerjakan Ujian".
   - *Ekspektasi*: lembar soal tampil tanpa error konsol `Rendered fewer hooks`.

2. **Lembar pengerjaan: jawaban tersimpan dan auto-save** (`/ujian` setelah masuk)
   - Jawab 2 butir, tandai "ragu-ragu" pada salah satunya, lalu refresh halaman (F5) dan masuk ulang dengan NISN + token yang sama (mode lanjutkan).
   - *Ekspektasi*: jawaban dan penanda ragu-ragu muncul kembali tanpa harus mengetik ulang; status simpan "tersimpan".
   - Klik opsi yang sama berbeda pilihan; panel navigasi soal ikut memperbarui status terisi.

3. **Hitung mundur dan pengumpulan otomatis**
   - Buat sesi uji dengan durasi 1 menit (atau ubah sesi uji yang ada), masuk sebagai santri, biarkan halaman terbuka tanpa interaksi.
   - *Ekspektasi*: penghitung waktu turun tiap detik; tepat saat mencapai `00:00` muncul warning "Waktu pengerjaan ujian telah habis" dan lembar terkumpul otomatis (layar "Ujian Selesai & Terkumpul"), peserta tercatat `submitted` dengan skor otomatis.
   - Catatan: nilai awal hitung mundur diambil dari server setiap lembar soal dimuat ulang, jadi refresh tidak menambah waktu secara signifikan.

4. **Penghitung pelanggaran layar**
   - Pindah tab selama ujian berlangsung lalu kembali.
   - *Ekspektasi*: modal peringatan muncul, jumlah "Pelanggaran Layar" bertambah 1 dan bertahan setelah refresh (dibaca dari server).

5. **Rekap Nilai: sesi default** (`/rekap-nilai`)
   - Buka halaman tanpa menyentuh pemilih sesi.
   - *Ekspektasi*: sesi pertama sudah terpilih dan tabel peserta langsung terisi (tanpa kedip "Pilih sesi ujian...").
   - Pilih sesi lain, lalu refresh.
   - *Ekspektasi*: setelah reload, default kembali ke sesi pertama (tidak ada state yang macet).

6. **Koreksi Essay: nilai tersimpan terisi lalu bisa dikoreksi** (`/rekap-nilai/koreksi/[id]`)
   - Buka peserta yang sudah punya nilai essay tersimpan.
   - *Ekspektasi*: kolom "Beri Nilai" dan "Catatan Evaluasi" terisi nilai dari database; ubah nilai, simpan, refresh — nilai baru tetap tampil.
   - Simpan lalu ubah lagi tanpa refresh; pastikan tidak ada nilai yang hilang saat input dikosongkan.

7. **Sesi Ujian: dialog penjadwalan** (`/sesi-ujian`)
   - Klik "Jadwalkan Sesi Ujian", ketik judul, lalu tutup dan buka kembali dialog.
   - *Ekspektasi*: saat dibuka, waktu mulai = sekarang dan batas akhir = 2 jam kemudian, durasi 60, acak soal & opsi aktif, judul kosong.
   - Ketik judul, tunggu 2-3 detik tanpa menutup dialog.
   - *Ekspektasi*: ketikan **tidak** tereset (perbaikan dari efek lama yang jalan ulang saat daftar bank soal termuat).
   - Klik "Jadwalkan Sesi Sekarang" pada kartu kosong saat belum ada sesi.
   - *Ekspektasi*: dialog terbuka dengan nilai awal yang sama.

## Bukti Eksekusi (Evidence)

*(Akan dilengkapi saat /e2e-tester dijalankan)*

### 2026-11-03 — prasyarat terverifikasi, skenario 1-7 belum

- Login pengajar di browser nyata (`http://localhost:3000/login`): isi email + password, klik "Sign in with email", halaman berpindah sendiri ke `/account` dan terdapat teks "PROTECTED ACCOUNT" / "Your session was validated by the Convex Better Auth server before this page rendered."
- Sesi bertahan saat pindah halaman: navigasi ke `/sesi-ujian` tetap dalam keadaan login (sidebar pengajar ter-render).
- Penolakan kredensial salah (level API, origin `http://localhost:3000`): password salah dan email tak dikenal sama-sama `401 INVALID_EMAIL_OR_PASSWORD`.
- Origin `http://127.0.0.1:3000`: `403 INVALID_ORIGIN` — karena itu prasyarat memakai `localhost`.
- `/sesi-ujian` untuk akun ini kosong; sesi `HH4XC2` tercatat atas `creatorTokenIdentifier = https://convex.test|-59396202` (identitas seed CLI), sehingga tester harus membuat sesi baru.
- Belum dibuktikan: skenario 1-7 (auto-fill gerbang santri, resume jawaban, hitung mundur sampai `00:00` dan pengumpulan otomatis, pelanggaran tab, default rekap nilai, prefill koreksi essay, perilaku dialog sesi).
