# E2E: Mode penegakan integritas dan pembukaan kunci

- **Work item**: `CHG-009`
- **Status**: `Blocked` (skenario 13 kini `Passed`; dua pengamatan tetap terblokir batas alat otomasi)
- **Rekomendasi**: `Required`
- **Sumber**: `.planora/EXECUTION/TODO.md` item CHG-009 dan `specs/chg-009-mode-penegakan-integritas.md`
- **Alasan**: penguncian setelah ambang, panel terkunci yang tetap menghitung waktu, dan pembukaan kunci oleh pengajar adalah perjalanan dua peran yang hanya dapat dibuktikan di browser.
- **Lingkungan**: aplikasi lokal (`npm run dev`) dengan deployment Convex dev yang dikonfigurasi; Chrome terbaru; dua konteks browser (jendela biasa untuk pengajar, jendela incognito untuk santri).

## Prasyarat

- Akun pengajar yang memiliki minimal satu paket bank soal berisi 2 butir soal dan seorang santri aktif di tabel `students`.
- Sesi uji dibuat baru oleh pengajar tersebut; jangan memakai sesi produksi.
- Santri mengetahui token sesi dan nomor induknya.
- Untuk skenario auto-submit, buat sesi dengan durasi 5 menit agar tidak menunggu lama.

## Skenario

1. **Pengaturan mode kunci**
   - Pengajar membuka `/sesi-ujian`, menekan "Jadwalkan Sesi Ujian".
   - Pilih "Kunci setelah ambang", isi ambang `3`, lalu simpan.
   - **Harapan**: sesi dibuat; kartu sesi menampilkan "Kunci setelah 3 kali pindah tab."

2. **Validasi ambang**
   - Ulangi pembuatan sesi, pilih mode kunci, kosongkan ambang, lalu simpan.
   - **Harapan**: formulir tidak tersimpan dan pesan meminta ambang bilangan bulat 1–20; isian lain tidak hilang.

3. **Santri masuk dan terpantau**
   - Aktifkan sesi, lalu santri masuk di `/ujian` memakai token dan nomor induk.
   - Pengajar membuka `/monitoring-sesi` dan memilih sesi tersebut.
   - **Harapan**: baris santri berlabel "Sedang Mengerjakan"; belum ada label "Terkunci".

4. **Pencatatan sebelum ambang**
   - Santri berpindah ke tab lain lalu kembali, satu kali.
   - **Harapan**: santri melihat dialog peringatan; hitungan pelanggaran di monitoring bertambah `1`; lembar tetap dapat dijawab.
   - Ulangi sampai pelanggaran ke-3.
   - **Harapan**: lembar masih terbuka (mode kunci baru berlaku setelah ambang terlampaui).

5. **Penguncian pada pelanggaran ke-4**
   - Santri berpindah tab sekali lagi dan kembali.
   - **Harapan**: lembar berganti ke panel "Lembar Anda dikunci" yang memuat judul sesi, sisa waktu yang terus berjalan, dan jumlah jawaban tersimpan; semua pilihan, uraian, dan tombol ragu-ragu nonaktif; tombol "Selesaikan Ujian" nonaktif.

6. **Jawaban tersimpan tetap utuh saat terkunci**
   - Sebelum terkunci, santri menjawab satu soal.
   - Setelah terkunci, coba ketuk opsi lain.
   - **Harapan**: jawaban tidak berubah; jumlah jawaban tersimpan tetap; opsi yang sudah dipilih masih terlihat.

7. **Monitoring menampilkan status terkunci**
   - Periksa tabel desktop dan kartu mobile pada `/monitoring-sesi`.
   - **Harapan**: label teks "Terkunci" tampil bersama ikon gembok; aksi berubah menjadi "Buka Kunci"; hitungan pelanggaran tetap terlihat.

8. **Pembukaan kunci oleh pengajar pemilik**
   - Pengajar menekan "Buka Kunci".
   - **Harapan**: dialog konfirmasi menyebut nama santri dan jumlah jawaban tersimpan.
   - Setelah dikonfirmasi, baris kembali ke "Sedang Mengerjakan" dan panel terkunci di sisi santri hilang tanpa memuat ulang.

9. **Melanjutkan setelah dibuka**
   - Santri menjawab soal lain dan menunggu indikator tersimpan.
   - **Harapan**: jawaban baru tersimpan; jawaban lama masih ada; hitungan pelanggaran tidak kembali ke nol.

10. **Mengunci ulang setelah ambang terlampaui**
    - Santri berpindah tab sekali lagi.
    - **Harapan**: lembar langsung terkunci lagi karena jumlah pelanggaran masih melewati ambang.

11. **Mode mencatat tidak pernah mengunci**
    - Buat sesi kedua dengan mode "Catat saja", aktifkan, dan masuk sebagai santri lain.
    - Berpindah tab empat kali.
    - **Harapan**: setiap perpindahan tercatat di monitoring, tetapi lembar tidak pernah masuk panel terkunci.

12. **Auto-submit saat terkunci**
    - Pada sesi bermode kunci berdurasi 5 menit, biarkan lembar terkunci sampai hitung mundur habis.
    - **Harapan**: sisa waktu terus berjalan selama terkunci; saat habis, lembar terkumpul otomatis dan santri melihat layar selesai.

13. **Kebersihan teks antarmuka**
    - Pindai keempat permukaan: formulir sesi, kartu sesi, monitoring, dan lembar santri.
    - **Harapan**: tidak ada kode spesifikasi, nomor sesi, nama tabel, atau istilah internal.

## Bukti

Eksekusi 2026-11-05, aplikasi lokal `http://localhost:3000`, deployment Convex dev `quirky-rat-737`, satu tab otomasi dengan viewport efektif ±474 px. Data uji dibuat lewat modul sementara `convex/tmpE2e/seed.ts` + halaman `/e2e-seed` (bank "E2E Integritas Bank", santri `E2E-8001` dan `E2E-8002`), lalu dibersihkan setelah eksekusi (0 baris untuk sesi, peserta, santri, dan bank uji). Modul dan halaman sementara sudah dihapus.

**Hasil eksekusi pertama (2026-11-05): `Failed` — 13 skenario wajib: 10 Passed, 1 Failed, 2 Blocked (batas alat otomasi).**

1. **Pengaturan mode kunci — Passed**
   - Aksi: `/sesi-ujian` → "Jadwalkan Sesi Ujian" → pilih bank E2E, mode "Kunci setelah ambang", ambang `3`, durasi 60 menit → simpan.
   - Hasil: sesi "E2E Integritas — Kunci" tersimpan (token `9L644P`, 2 butir / 100 poin, mode kunci, ambang 3) dan kartu sesi menampilkan "Kunci setelah 3 kali pindah tab."
2. **Validasi ambang — Passed (catatan redaksi pesan)**
   - Aksi: isi judul baru, kosongkan ambang, simpan; lalu ulangi dengan ambang `0`.
   - Hasil: formulir tidak tersimpan; judul dan isian lain tetap. Ambang kosong → "Ambang pelanggaran wajib diisi saat mode kunci dipilih."; ambang `0` → "Ambang pelanggaran harus bilangan bulat antara 1 dan 20." dengan `aria-invalid="true"` pada isian. Pesan untuk isian kosong menyebut "wajib diisi" alih-alih menyebut rentang 1–20 seperti tertulis di skenario; pesan rentang muncul pada nilai di luar rentang. Tidak dinilai sebagai kegagalan.
3. **Santri masuk dan terpantau — Passed**
   - Aksi: aktifkan sesi (konfirmasi bawaan peramban diterima otomatis oleh lapisan uji), santri masuk di `/ujian` dengan token `9L644P` + NISN `E2E-8001`; pengajar membuka `/monitoring-sesi`.
   - Hasil: santri tersimpan sebagai peserta aktif dan baris monitoring berlabel "Sedang Mengerjakan"; belum ada label "Terkunci". Hitungan pelanggaran `0`.
4. **Pencatatan sebelum ambang — Passed**
   - Aksi: tiga siklus pindah-tab/selesai (blur–focus dan `visibilitychange`) dari lembar santri.
   - Hasil: setiap kembalinya lembar menampilkan dialog peringatan; data peserta menunjukkan `tabViolations: 3` tanpa `lockedAt`; opsi jawaban tetap dapat dipilih dan tersimpan. Lembar masih terbuka pada pelanggaran ke-3.
5. **Penguncian pada pelanggaran ke-4 — Passed**
   - Aksi: siklus pindah-tab ke-4.
   - Hasil: lembar berganti ke panel "Lembar Anda dikunci" yang memuat judul sesi, hitung mundur sisa waktu yang terus berjalan, dan jumlah jawaban tersimpan; pilihan jawaban, tombol ragu-ragu, dan "Selesaikan Ujian" nonaktif. Data: `lockedAt` terisi, `tabViolations: 4`.
6. **Jawaban tersimpan tetap utuh saat terkunci — Passed**
   - Aksi: satu soal dijawab sebelum kunci; setelah terkunci, opsi lain diketuk.
   - Hasil: ketukan diabaikan (tanpa perubahan nilai), jumlah jawaban tersimpan tetap, dan opsi yang sudah dipilih tetap terlihat pada panel terkunci.
7. **Monitoring menampilkan status terkunci — Passed (catatan viewport)**
   - Aksi: buka `/monitoring-sesi` untuk sesi kunci.
   - Hasil: kartu peserta mobile menampilkan label teks "Terkunci" dengan ikon gembok, aksi berubah menjadi "Buka Kunci", dan hitungan pelanggaran tetap terlihat. Tabel desktop tidak dapat dilihat langsung pada viewport otomasi ±474 px; markup tabel memakai komponen badge status yang sama.
8. **Pembukaan kunci oleh pengajar pemilik — Blocked (sebagian)**
   - Aksi: tekan "Buka Kunci" dari monitoring; dialog konfirmasi ditangkap isinya lalu diterima.
   - Hasil: dialog menyebut nama santri dan jumlah jawaban tersimpan; setelah dikonfirmasi baris kembali ke "Sedang Mengerjakan" dan `lockedAt` terhapus (tercatat 2 `unlockEvents` oleh "Pengajar Uji"). Bagian "panel terkunci hilang tanpa memuat ulang" tidak dapat diamati karena otomasi hanya memiliki satu tab; bukti interaktivitas pasca-unlock diperoleh pada skenario 9 setelah lembar dimuat kembali.
9. **Melanjutkan setelah dibuka — Passed**
   - Aksi: setelah unlock, jawab soal lain dan tunggu indikator tersimpan.
   - Hasil: jawaban baru tersimpan di `studentAnswers`, jawaban lama tetap ada, dan `tabViolations` tidak kembali ke nol.
10. **Mengunci ulang setelah ambang terlampaui — Passed**
    - Aksi: satu siklus pindah-tab lagi setelah unlock.
    - Hasil: lembar langsung kembali terkunci karena jumlah pelanggaran (4) masih melewati ambang `3`; `lockedAt` terisi lagi.
11. **Mode mencatat tidak pernah mengunci — Passed**
    - Aksi: sesi kedua "E2E Integritas — Catat" (token `3NRWJE`, mode "Catat saja") dibuat, diaktifkan, dan santri `E2E-8002` masuk; empat siklus pindah-tab.
    - Hasil: monitoring menampilkan 5 pelanggaran tercatat (satu tambahan dari otomasi masuk ulang), status "Sedang Mengerjakan", tanpa label "Terkunci"; lembar tetap interaktif dan dapat menjawab.
12. **Auto-submit saat terkunci — Passed (penggeseran jam uji)**
    - Aksi: pada lembar yang terkunci, jam mulai peserta digeser lewat helper uji hingga hitung mundur habis (bukan menunggu 5 menit sesi asli 60 menit).
    - Hasil: sisa waktu tetap berjalan selama terkunci (hitung mundur teramati berkurang), lalu lembar terkumpul otomatis meski `lockedAt` masih terisi: status peserta `submitted`, nilai 50, `tabViolations: 6`.
13. **Kebersihan teks antarmuka — Failed**
    - Aksi: pindai teks keempat permukaan (formulir sesi, kartu sesi, monitoring, lembar santri) dengan pola kode spesifikasi, ID tugas, nomor fase, path `.md`, nama tabel/istilah internal, dan ID dokumen.
    - Hasil: tidak ada kode spesifikasi, nomor fase, path dokumen, atau nama tabel. Namun dua pemilih menampilkan ID dokumen internal: pemilih "Paket Bank Soal Rujukan" pada formulir sesi menampilkan `j5796gvnfmg1krsmts7rfrp2bh8hj3e5`, dan pemilih sesi pada `/monitoring-sesi` menampilkan `jh7148b8j8ffmgq6501tfeg7r98hm3we`; filter status pada `/sesi-ujian` menampilkan nilai mentah `all`. Ini melanggar kriteria "tidak ada nomor sesi atau istilah internal".

### Pengulangan skenario 13 (2026-11-05, pasca-perbaikan BUG-001)

- Lingkungan sama (`http://localhost:3000`, Convex dev `quirky-rat-737`, satu tab ±474×536 px). Data
  uji baru: bank "E2E Label Bank Alpha"/"E2E Label Bank Beta", sesi "E2E Sesi Beta" (token `FZETPR`) dan
  "E2E Sesi Alpha", serta santri `E2E-8001`; seluruhnya dihapus setelah pengujian (panggilan pembersihan
  kedua mengembalikan 0) dan modul sementara dihapus.
- Aksi: pindai teks formulir sesi (dialog "Jadwalkan Sesi Ujian"), kartu sesi, `/monitoring-sesi`, dan
  lembar santri setelah masuk dengan token, memakai pola kode spesifikasi, ID tugas, fase, path `.md`,
  nama tabel/istilah internal, nilai enum mentah, dan ID dokumen.
- Hasil: **`Passed`**. 0 kecocokan pada keempat permukaan. Pemilih menampilkan "E2E Label Bank Alpha
  (AQIDAH - Kelas 7)", "Semua Status", dan "E2E Sesi Beta (AQIDAH - Kelas 7)"; filter status tidak lagi
  menampilkan `all`. Rincian per skenario label ada di `specs/e2e/bug-001-select-label.md`.
- Status keseluruhan spek ini tetap `Blocked`: skenario 7 (tabel desktop) dan skenario 8 (pembaruan panel
  terkunci tanpa muat ulang) belum dapat diamati dengan otomasi satu tab/viewport sempit.

## Temuan

- **Blocker (skenario 13) — selesai 2026-11-05**: komponen `Select` berbasis Base UI di [apps/components/ui/select.tsx:21](file:///D:/DATA/PROJEK/IMTIHAN/apps/components/ui/select.tsx#L21) menampilkan nilai mentah karena root `Select` tidak diberi pemetaan label (`items`) dan `SelectValue` dirender tanpa fungsi anak. Akibatnya ID dokumen Convex tampil di [formulir sesi](file:///D:/DATA/PROJEK/IMTIHAN/apps/app/(main)/sesi-ujian/page.tsx#L379) dan [monitoring](file:///D:/DATA/PROJEK/IMTIHAN/apps/app/(main)/monitoring-sesi/page.tsx#L359), serta nilai `all` pada filter [sesi-ujian](file:///D:/DATA/PROJEK/IMTIHAN/apps/app/(main)/sesi-ujian/page.tsx#L642). Pola ini berlaku untuk semua pemakai `Select` di aplikasi. Perbaikan BUG-001 memasang `items` pada 14 pemilih dan pengulangan skenario 13 di atas lolos.
- **Batasan alat**: otomasi hanya dapat membuka satu tab, sehingga pembaruan live dua peran (skenario 8) dan tabel desktop pada viewport lebar (skenario 7) tidak dapat diamati.
- **Perilaku pengamat**: saat tab lembar disembunyikan, peramban memperlambat timer (hitung mundur 05:27 → 05:04 dalam ±300 detik). Auto-submit tetap berjalan, tetapi dapat terlambat beberapa detik pada tab tersembunyi.
- Dialog konfirmasi "Aktifkan Sesi" dan "Buka Kunci" masih memakai `window.confirm` bawaan peramban; dialog memblokir otomasi dan tidak dapat ditangkap sebagai elemen halaman.

## Media

Tidak ada tangkapan layar atau rekaman: kanal otomasi tidak menyediakan tangkapan viewport native (`NATIVE_BROWSER_VIEWPORT_UNAVAILABLE`). Bukti yang tersedia berupa snapshot aksesibilitas, teks halaman, hasil skrip evaluasi, dan data Convex.

## Langkah berikutnya

- Skenario 13 sudah diulang pada 2026-11-05 dan **`Passed`**; rincian ada di bagian pengulangan di atas dan di `specs/e2e/bug-001-select-label.md`.
- Masih terblokir: skenario 7 (tabel desktop monitoring) dan skenario 8 (panel terkunci hilang tanpa muat ulang). Perlu lingkungan dua tab dan viewport lebar untuk menutupnya.

