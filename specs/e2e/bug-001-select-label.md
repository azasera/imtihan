# Spesifikasi E2E: Label Pemilih Select (BUG-001)

- **Work item**: `BUG-001`
- **Target Kebutuhan**: `SESI-FR-001`, `SESI-FR-006`, `MON-FR-001`, `BANK-AC-003`, `UJIAN-FR-001` (label yang dibaca pengajar dan santri pada pemilih)
- **Rekomendasi E2E**: `Required`
- **Status**: `Passed` (dieksekusi 2026-11-05)
- **Lingkungan**: Local development (`http://localhost:3000`) dengan Convex dev deployment

## Alasan E2E

Cacat ini hanya tampak pada antarmuka peramban: nilai yang tersimpan benar, tetapi `SelectValue`
merender nilai mentah (`_id` dokumen Convex, kode enum, `all`) ketika `Select.Root` tidak diberi
pemetaan `items`. Pemeriksaan sumber dan tes statis membuktikan pemetaan terpasang, bukan bahwa
peramban menampilkan label yang benar. Skenario 13 `specs/e2e/mode-penegakan-integritas.md` bergantung
pada hasil skenario 1–8 di berkas ini.

## Prasyarat

1. Server lokal berjalan pada `http://localhost:3000`.
2. Login sebagai pengajar dengan akun `pengajar.uji@example.com` (password `UjiDev2026`).
3. Tersedia minimal 2 paket bank soal dengan mata pelajaran dan jenjang terisi, serta minimal 2 sesi
   ujian (satu draf, satu aktif/berakhir) milik akun tersebut.
4. Tersedia minimal 1 santri terdaftar pada lembaga/kelas yang sesuai untuk skenario gerbang `/ujian`.

## Skenario Pengujian Browser

1. **Pemilih Paket Bank Soal Rujukan Menampilkan Judul**:
   - Buka `/sesi-ujian`, klik "Jadwalkan Sesi Ujian".
   - Buka pemilih "Paket Bank Soal Rujukan", pilih paket pertama.
   - *Ekspektasi*: Pemicu menampilkan `<judul paket> (<kode mapel> - <jenjang>)`, bukan string `j...` sepanjang ±32 karakter.
   - Buka daftar pilihan.
   - *Ekspektasi*: Setiap baris menampilkan judul dan metadata yang sama; tidak ada ID dokumen di mana pun.
   - Pilih paket kedua.
   - *Ekspektasi*: Pemicu berganti ke judul paket kedua.

2. **Pemilih Interval Pergantian Token Menampilkan Menit**:
   - Masih di dialog jadwal, pilih "Berganti berkala" pada blok "Masa Berlaku Token".
   - Buka pemilih "Interval Pergantian".
   - *Ekspektasi*: Pemicu menampilkan "Tiap 15 menit" (bawaan), bukan `15`; pilihan berisi "Tiap 5 menit", "Tiap 15 menit", "Tiap 30 menit".
   - Pilih "Tiap 30 menit".
   - *Ekspektasi*: Pemicu menampilkan "Tiap 30 menit" dan teks perkiraan jumlah pergantian menyesuaikan.

3. **Pemilih Mode Penegakan pada Dialog Sesi Lanjutan**:
   - Dari `/sesi-ujian`, buka aksi sesi lanjutan pada sesi yang sudah berakhir.
   - *Ekspektasi*: Pemilih jenis menampilkan "Remedial"/"Susulan", pemilih bank menampilkan judul paket, dan pemilih penegakan menampilkan "Catat saja"/"Kunci setelah ambang" — tidak ada kode `record`, `lock`, `remedial`, `susulan`, atau ID dokumen.

4. **Filter Status Sesi Menampilkan Teks**:
   - Pada `/sesi-ujian`, buka filter status.
   - *Ekspektasi*: Pemicu menampilkan "Semua Status" (bawaan), bukan `all`; pilihan berisi "Semua Status", "Sedang Aktif", "Draf (Belum Aktif)", "Telah Berakhir".
   - Pilih "Sedang Aktif" lalu "Telah Berakhir".
   - *Ekspektasi*: Pemicu mengikuti pilihan dan daftar sesi tersaring tanpa muat ulang.

5. **Pemilih Sesi di Monitoring dan Rekap Menampilkan Judul**:
   - Buka `/monitoring-sesi`, buka pemilih sesi, pilih sesi.
   - *Ekspektasi*: Pemicu menampilkan `<judul sesi> (<kode mapel> - <jenjang>)`, bukan `jh...`.
   - Ulangi pada `/rekap-nilai`.
   - *Ekspektasi*: Label yang sama tampil dan data rekap berganti ke sesi terpilih.

6. **Pemilih Lembaga, Kelas, Mata Pelajaran, dan Jenjang di Bank Soal**:
   - Buka `/bank-soal`, buka dialog "Buat Paket Bank Soal".
   - *Ekspektasi*: Pemilih mata pelajaran menampilkan nama mata pelajaran, pemilih lembaga menampilkan label resmi (mis. "SMPITA (SMP Islam Terpadu At-Tauhid)"), dan pemilih jenjang menampilkan jenjang lembaga terpilih.
   - Ganti lembaga.
   - *Ekspektasi*: Pilihan jenjang mengikuti lembaga baru dan tersimpan dengan label yang terbaca.
   - Pada daftar bank soal, buka filter mata pelajaran.
   - *Ekspektasi*: Bawaan "Semua Mata Pelajaran", bukan `all`; pilihan lain berupa nama mata pelajaran.

7. **Pemilih Tingkat Berpikir pada Formulir Butir**:
   - Buka salah satu paket di `/bank-soal/[id]`, tambah atau sunting butir.
   - Buka pemilih tingkat berpikir.
   - *Ekspektasi*: Pemicu menampilkan "Belum ditandai" (bawaan), bukan `untagged`; pilihan berupa label bernama, bukan kode.

8. **Pemilih Lembaga dan Kelas di Gerbang Santri**:
   - Buka `/ujian` tanpa login.
   - *Ekspektasi*: Pemilih lembaga menampilkan label resmi lembaga, bukan kode `SMPITA`/`SMAITA`/`MTA`; pemilih kelas menampilkan `<kelas> (<lembaga>)`.
   - Pilih lembaga lalu kelas, isi NISN terdaftar dan token, lalu masuk.
   - *Ekspektasi*: Identitas terisi otomatis dan santri masuk ke lembar ujian.

9. **Regresi Skenario 13 Integritas**:
   - Ulangi skenario 13 `specs/e2e/mode-penegakan-integritas.md` pada sesi dan bank yang sama.
   - *Ekspektasi*: Seluruh langkah skenario 13 lolos dengan label terbaca; perbarui status skenario tersebut di spek integritas setelah bukti tercatat.

## Catatan Implementasi

- Perbaikan: `Select.Root` pada 14 pemilih di 7 berkas menerima `items` (peta nilai → label atau larik `{value, label}`), sesuai mekanisme `resolveSelectedLabel` Base UI.
- Berkas: `app/ujian/page.tsx`, `app/(main)/sesi-ujian/page.tsx`, `app/(main)/monitoring-sesi/page.tsx`, `app/(main)/rekap-nilai/page.tsx`, `app/(main)/bank-soal/page.tsx`, `app/(main)/bank-soal/[id]/page.tsx`, `components/sesi-ujian/session-continuation-dialog.tsx`.
- Regression test statis: `tests/select-labels.test.ts` memastikan setiap `<Select` pada berkas aktif memiliki `items=` (gagal sebelum patch, lolos sesudahnya). Tes ini tidak membuktikan label benar-benar dirender.
- Komponen templat yang tidak dipakai (`components/data-table.tsx`, `components/chart-area-interactive.tsx`, `components/ai-elements/`) sengaja tidak diubah.

## Bukti

Eksekusi 2026-11-05, aplikasi lokal `http://localhost:3000`, deployment Convex dev `quirky-rat-737`,
satu tab otomasi dengan viewport efektif ±474×536 px. Data uji: "E2E Label Bank Alpha" (Aqidah &
Tauhid / SMPITA / Kelas 7), "E2E Label Bank Beta" (Tahfidz & Tahsin Al-Qur'an / MTA / MTA 3), sesi
"E2E Sesi Alpha" (draf, token `9ZNCFB`), "E2E Sesi Beta" (aktif, token `FZETPR`), dan santri
`E2E-8001` (SMPITA kelas 7) yang ditanam lewat modul sementara `convex/tmpE2e/fixture.ts`. Semua data
dihapus setelah eksekusi (panggilan pembersihan menghapus 2 bank, 2 sesi, 1 peserta, dan 1 santri;
panggilan kedua mengembalikan 0 untuk semua), modul sementara dihapus, dan `npx convex dev --once`
kembali `Convex functions ready!`. Daftar sesi dan bank di antarmuka kembali kosong.

**Hasil keseluruhan: `Passed` — 9 skenario wajib, 9 Passed, 0 Failed, 0 Blocked.**

1. **Pemilih Paket Bank Soal Rujukan — Passed**
   - Aksi: `/sesi-ujian` → "Jadwalkan Sesi Ujian"; buka pemilih bank; pilih paket Alpha lalu Beta.
   - Hasil: pemicu awal "E2E Label Bank Alpha (AQIDAH - Kelas 7)"; daftar opsi berisi "E2E Label Bank
     Alpha (AQIDAH - Kelas 7)" dan "E2E Label Bank Beta (TAHFIDZ - MTA 3)"; setelah memilih Beta
     pemicu berganti ke label Beta. Tidak ada ID dokumen pada pemicu maupun opsi.
2. **Interval pergantian token — Passed**
   - Aksi: dialog jadwal → "Berganti berkala"; buka "Interval Pergantian"; pilih "Tiap 30 menit".
   - Hasil: bawaan "Tiap 15 menit" dengan perkiraan "8 kali"; opsi "Tiap 5 menit", "Tiap 15 menit",
     "Tiap 30 menit"; setelah memilih 30 menit pemicu "Tiap 30 menit" dan perkiraan "4 kali".
3. **Dialog sesi lanjutan — Passed**
   - Aksi: tekan "Tutup Sesi" pada "E2E Sesi Beta" (konfirmasi peramban diterima otomatis), lalu buka
     "Buat Remedial / Susulan".
   - Hasil: jenis "Remedial" dengan opsi "Remedial"/"Susulan"; memilih Susulan mengubah judul dialog
     menjadi "Buat Sesi Susulan" dan judul otomatis menjadi "E2E Sesi Beta — Susulan". Bank menampilkan
     "E2E Label Bank Alpha (AQIDAH - Kelas 7)" dengan opsi Alpha dan Beta. Penegakan "Catat saja" dengan
     opsi "Catat saja"/"Kunci setelah ambang"; memilih kunci mengubah pemicu dan memunculkan isian
     ambang bernilai 3. Tidak ada kode `remedial`, `susulan`, `record`, `lock`, atau ID dokumen.
4. **Filter status sesi — Passed**
   - Aksi: `/sesi-ujian` buka filter status; pilih "Draf (Belum Aktif)", "Telah Berakhir", lalu
     "Sedang Aktif".
   - Hasil: bawaan "Semua Status"; opsi "Semua Status", "Sedang Aktif", "Draf (Belum Aktif)", "Telah
     Berakhir". Daftar tersaring tanpa muat ulang: draf hanya menampilkan Alpha, berakhir menampilkan
     keadaan kosong, aktif hanya menampilkan Beta. Tidak ada nilai `all`.
5. **Pemilih sesi monitoring dan rekap — Passed**
   - Aksi: `/monitoring-sesi` buka pemilih sesi, pilih sesi lain; ulangi pada `/rekap-nilai`.
   - Hasil: monitoring menampilkan "E2E Sesi Beta (AQIDAH - Kelas 7)" dengan opsi "E2E Sesi Beta
     (AQIDAH - Kelas 7)" dan "E2E Sesi Alpha (TAHFIDZ - MTA 3)"; beralih ke Alpha mengubah pemicu dan
     token sesi menjadi `9ZNCFB`. `/rekap-nilai` menampilkan label yang sama dan beralih ke Alpha tanpa
     `jh...`. Catatan terpisah: pemicu di `/rekap-nilai` tidak memiliki nama aksesibel.
6. **Pemilih lembaga, kelas, mata pelajaran, dan jenjang di bank soal — Passed**
   - Aksi: `/bank-soal` → dialog "Buat Paket Bank Soal"; ganti lembaga; lalu buka filter mata pelajaran.
   - Hasil: mata pelajaran menampilkan "Aqidah & Tauhid"; lembaga menampilkan "SMPITA (SMP Islam
     Terpadu At-Tauhid)"; jenjang "Kelas 7". Mengganti lembaga mengosongkan jenjang ("Pilih tingkat...")
     dan mengganti opsi menjadi "Kelas 10/11/12", lalu kembali ke SMPITA/Kelas 7. Filter bawaan "Semua
     Mata Pelajaran"; opsi berupa nama mata pelajaran; memilih "Aqidah & Tauhid" menyisakan hanya bank
     Alpha. Tidak ada `all`.
7. **Tingkat berpikir — Passed**
   - Aksi: buka formulir butir pada paket, buka pemilih tingkat berpikir.
   - Hasil: bawaan "Belum ditandai"; opsi "Belum ditandai", "Mengingat", "Memahami", "Mengaplikasikan",
     "Menganalisis". Tidak ada kode `untagged`.
8. **Pemilih lembaga dan kelas di gerbang santri — Passed**
   - Aksi: `/ujian` tanpa login, buka pemilih lembaga; pilih SMPITA; buka pemilih kelas; isi NISN
     `E2E-8001` dan token `FZETPR`; masuk; tekan "Mulai Mengerjakan Ujian".
   - Hasil: opsi lembaga "SMPITA (SMP Islam Terpadu At-Tauhid)", "SMAITA (SMA Islam Terpadu At-Tauhid)",
     "MTA (Madrasah Tarbiyatul Aimmah)"; pemicu menjadi "SMPITA (SMP Islam Terpadu At-Tauhid)". Kelas
     menampilkan "7 (SMPITA)" (opsi lain 7A–9C). Setelah NISN diisi, lembaga, kelas, dan nama terisi
     otomatis dari data master serta pemilih terkunci; layar konfirmasi menampilkan "E2E Sesi Beta",
     "Santri Uji Label", dan "E2E-8001"; lembar ujian terbuka dan `/monitoring-sesi` menampilkan santri
     "Sedang Mengerjakan".
9. **Regresi skenario 13 integritas — Passed**
   - Aksi: pindai teks formulir sesi, kartu sesi, monitoring, dan lembar santri dengan pola kode
     spesifikasi, ID tugas, fase, path `.md`, nama tabel/istilah internal, nilai enum mentah
     (`all`/`record`/`lock`/`untagged`/`remedial`/`susulan`), dan ID dokumen.
   - Hasil: 0 kecocokan pada keempat permukaan. Kartu sesi menampilkan "E2E Sesi Beta" dan "Bank Soal:
     E2E Label Bank Alpha (AQIDAH)"; monitoring menampilkan "E2E Sesi Beta (AQIDAH - Kelas 7)" dan
     peserta "Sedang Mengerjakan"; lembar santri menampilkan mapel "AQIDAH" dan hitung mundur tanpa ID.
   - Status skenario 13 di `specs/e2e/mode-penegakan-integritas.md` diperbarui menjadi `Passed`.

## Temuan

- **Rendah (aksesibilitas, sudah ada sebelum perbaikan)**: pemicu pemilih sesi pada
  [apps/app/(main)/rekap-nilai/page.tsx:304](file:///D:/DATA/PROJEK/IMTIHAN/apps/app/(main)/rekap-nilai/page.tsx#L304)
  tidak memiliki `id`, `aria-label`, atau Label terhubung, sehingga combobox tidak bernama bagi pembaca
  layar. Label yang tampil sudah benar; ini bukan sisa cacat BUG-001.
- **Batasan alat**: otomasi hanya satu tab dengan viewport efektif ±474×536 px dan tidak menyediakan
  tangkapan layar native (`NATIVE_BROWSER_VIEWPORT_UNAVAILABLE`). Bukti yang tersedia berupa snapshot
  aksesibilitas, teks halaman, hasil skrip evaluasi, dan data Convex.

## Media

Tidak ada tangkapan layar atau rekaman video karena kanal otomasi menolak tangkapan viewport native.
Bukti pengganti: snapshot aksesibilitas per permukaan, hasil `evaluate_script` berisi label pemicu/opsi,
dan panggilan pembersihan Convex yang mengembalikan 0 baris tersisa.
