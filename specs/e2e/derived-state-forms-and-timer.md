# Spesifikasi E2E: Perilaku Formulir & Hitung mundur Setelah refactor State Turunan

- **Sumber Permintaan**: permintaan chore "perbaiki 7 error lint" (mengganti penyalinan state lewat efek dengan penurunan nilai saat render)
- **Rekomendasi E2E**: `Recommended`
- **Status**: `Passed dengan deviasi` (dijalankan 2026-11-05: 7/7 skenario teramati; skenario 3 dan 7 memakai penyimpangan fixture/lingkungan yang didokumentasikan di bagian Bukti)
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

### 2026-11-05 — 7/7 skenario dijalankan (Passed dengan deviasi)

- **Alat**: otomasi browser in-app Qoder. Keterbatasan yang membatasi sebagian klaim: tab otomatis selalu `document.visibilityState = "hidden"` dan `window.innerWidth = 0`, tidak ada tangkapan layar, `list_console_messages` tidak tersedia. Sebagai gantinya `console.error`, `window.onerror` dan `unhandledrejection` dibungkus pengumpul di dalam halaman; hasil akhir selalu disetorkan silang dengan `npx convex data`.
- **Fixture**: paket "E2E State Turunan" (`j5742wfw3nrr5mh5efzvav2fgx8hmt1b`, mapel FIQIH, 3 butir: 2 PG @25 + 1 essay @50). Sesi A "E2E State Turunan 60" token `APADCL` (durasi 60, created + diaktifkan lewat UI, mode "Catat saja"). Sesi B "E2E Timer 1 Menit" token `4SW7V5` (durasi 1 menit). Santri: `26.02.082` Achmad Syafiq Al Baraja dan `26.02.072` Muhammad Dzaky Ibadurrahman (keduanya kelas 7A).

#### Catatan deviasi prasyarat

1. **Sesi 1 menit dibuat lewat mutasi publik aplikasi, bukan dialog UI.** Input `#session-duration` memakai `min=5 step=5`, jadi durasi 1 menit tidak mungkin dihasilkan dari formulir. Pemanggilan tetap memakai fungsi publik `examSession/public/mutations:createExamSession` + `setSessionStatus` dari klien Convex di browser (identitas pemilik sama dengan pengajar), sehingga tidak ada jalur backend lain yang diuji.
2. **Detik pengumpulan otomatis tidak dapat diamati secara langsung di tab tersembunyi.** Setelah berjalan normal beberapa saat, hitungan klien membeku (00:34 bertahan >100 detik; 00:32 → 00:32 selama 104 detik) karena `setInterval` di tab `hidden` di-throttle browser. Pengumpulan otomatis dibuktikan lewat jalur seed saat lembar dimuat ulang (`remainingMs` dari server sudah 0), yang memakai cabang kode `autoSubmitIfExpired` yang sama. Lihat Temuan T-3.

#### Skenario 1 — Gerbang ujian: auto-fill tanpa efek sinkronisasi → **Passed**

- Aksi: ketik `26.02.082` di `#nisn`; lalu `26.02.072`; lalu diperpendek menjadi `26`.
- Terverifikasi: nama terisi "Achmad Syafiq Al Baraja" / "Muhammad Dzaky Ibadurrahman", `readOnly` pada `#student-name` = `true`, `#institution`/`#class` `disabled` = `true`, 3 ikon gembok muncul, dan mengetik ke `#student-name` diabaikan (nilai tidak berubah). Setelah nomor dipangkas menjadi `26`: lembaga kembali ke placeholder "Pilih lembaga pendidikan…", pemilih kelas nonaktif, nama kosong, `readOnly` `false`, 0 ikon gembok — isian manual tidak menempel ke identitas santri lain.
- Aksi lanjutan: token `APADCL` → "Konfirmasi & Masuk Ruang Ujian" → "Mulai Mengerjakan Ujian".
- Terverifikasi: layar pratinjau ("Terhubung ke Sesi Ujian / 60 Menit / Nama Santri: Achmad Syafiq Al Baraja / Nomor Induk 26.02.082") lalu lembar soal `FIQIH 1/3` tampil. Pengumpul error mencatat **0** `console.error`, 0 `window.onerror`, 0 rejection — tidak ada `Rendered fewer hooks` dan tidak ada redscreen.

#### Skenario 2 — Jawaban tersimpan dan auto-save → **Passed**

- Aksi: pilih opsi pada butir 1 (PG), klik "Ragu-ragu", pindah ke butir 2 (essay), ketik "Kebangkitan dan hari pembalasan", klik "Ragu-ragu".
- Terverifikasi di server (`npx convex data studentAnswers`): 2 baris untuk peserta `jn7an6m3dky685kvtb84khkfyn8hn1va`, keduanya `isDoubtful: true`, satu berisi `essayAnswer`. Deviasi kecil: penanda ragu-ragu dipasang pada **dua** butir, bukan satu seperti teks spek; tidak mengubah yang diuji.
- Indikator status simpan membaca teks **"Tersimpan"** (elemen tetap ada di DOM; `display: none` pada viewport 0 px — keterbatasan alat, sudah dicatat pada spec lembar kerja sebelumnya).
- Aksi: `location.reload()`, masuk ulang dengan NISN + token yang sama.
- Terverifikasi: toast "Melanjutkan kembali sesi ujian Anda yang sedang berlangsung." muncul; opsi lama kembali terpilih (highlight), tombol penanda berubah menjadi **"Tandai Yakin"** dengan `bg-amber-600 text-white` (state ragu-ragu ikut pulih), peta nomor soal menunjukkan `1` dan `2` hijau/kuning terisi dan `3` `bg-muted` kosong, dan hitung mundur melanjutkan dari anggaran server (`56:36`, bukan 60:00).
- Aksi: klik opsi berbeda (A) lalu klik "Tandai Yakin".
- Terverifikasi: chip `1` pada peta soal berpindah `bg-amber-500` → `bg-emerald-600` dan penanda kembali "Ragu-ragu"; jawaban di panel navigasi ikut diperbarui tanpa reload.

#### Skenario 3 — Hitung mundur dan pengumpulan otomatis → **Passed dengan deviasi lingkungan**

- Aksi: masuk ke Sesi B (durasi 1 menit) sebagai `26.02.072` / token `4SW7V5`, biarkan terbuka tanpa interaksi.- Terverifikasi: hitungan turun tiap detik saat tab masih diberi jatah timer normal (`00:50` → `00:43` dalam 13,2 detik), lalu membeku karena throttle tab tersembunyi (lihat deviasi 2).
- Aksi: muat ulang lembar (waktu server sudah lewat anggaran).
- Terverifikasi: toast **"Waktu pengerjaan ujian telah habis! Sistem mengumpulkan jawaban Anda secara otomatis."** diikuti **"Lembar ujian berhasil dikumpulkan secara otomatis."**, layar **"Ujian Selesai & Terkumpul"** tampil, dan peserta tercatat di server: `status: "submitted"`, `multipleChoiceScore: 0`, `essayScore: 0`, `totalScore: 0`, `gradingStatus: "pending_essay"`, `finishedAt` terisi. 0 error konsol.
- Nilai awal hitung mundur memang dibaca dari server setiap lembar dimuat ulang (`apps/convex/examSession/public/queries.ts:277-279`, `apps/app/ujian/ExamWorksheet.tsx:404-420`), sehingga reload tidak menambah waktu — sesuai catatan spek.

#### Skenario 4 — Penghitung pelanggaran layar → **Passed**

- Aksi: memicu `window` `blur` pada lembar yang terbuka (pernyataan keadaan "keluar jendela"), lalu mensimulasikan kembali ke tab dengan `document.hidden` sementara = `false` + `visibilitychange` (tab automation tidak pernah benar-benar tampak, jadi kepindahan tab asli tidak bisa direkayasa — deviasi metode, bukan produk).
- Terverifikasi: server menaikkan `tabViolations` 0 → 1; header lembar menampilkan **"1x Pelanggaran Layar"**; setelah reload + masuk ulang teks itu tetap "1x" (dibaca dari server); modal **"Peringatan Integritas Ujian"** terbuka dengan baris **"Total Pelanggaran Tercatat: 1 kali"**; dialog konfirmasi pengumpulan juga menampilkan **"Catatan Pelanggaran Layar: 1 kali"**.

#### Skenario 5 — Rekap Nilai: sesi default → **Passed**

- Aksi: buka `/rekap-nilai` tanpa menyentuh pemilih sesi.
- Terverifikasi: `Select` sudah berisi "E2E Timer 1 Menit (FIQIH - Kelas 7)" (= elemen pertama `listExamSessions`), tabel peserta langsung terisi 1 baris, statistik kelas terhitung, dan teks placeholder **"Pilih sesi ujian…" tidak muncul** di layar. Bukti kode: default diturunkan saat render, bukan disalin lewat efek — `apps/app/(main)/rekap-nilai/page.tsx:63` (`pickedSessionId || sessions?.[0]?._id || ""`). Placeholder hanya mungkin terlihat selama kueri sesi belum selesai; keadaan "macet kosong" tidak terjadi.
- Aksi: pilih sesi "E2E State Turunan 60" (tabel berubah ke baris Achmad Syafiq), lalu `location.reload()`.
- Terverifikasi: setelah reload pilihan kembali ke sesi pertama ("E2E Timer 1 Menit", baris Muhammad Dzaky) — tidak ada state yang tertinggal.

#### Skenario 6 — Koreksi Essay: prefill lalu koreksi → **Passed dengan temuan**

- Aksi: `/rekap-nilai/koreksi/jn7an6m3dky685kvtb84khkfyn8hn1va`; isi "Beri Nilai" = 40 dan "Catatan Evaluasi" = "Jawaban sudah tepat, tambahkan dalil."; klik "Simpan Nilai".
- Terverifikasi di server: `scoreAwarded: 40`, `teacherFeedback` tersimpan. Toast "Nilai butir essay berhasil disimpan dan total nilai diperbarui!".
- Aksi: reload halaman koreksi.
- Terverifikasi: `#score-j971v4k99qt4dtm53h4ymr2qrh8hm8ts` = **"40"** dan `#feedback-…` = catatan dari database saat render pertama; header status berubah "Perlu Koreksi Essay" → **"Selesai Dinilai"**, ringkasan "Nilai Essay 40 Poin / Total Nilai Akhir 40 Poin".
- Aksi (tanpa reload): ubah nilai menjadi 35, simpan.
- Terverifikasi: input 35, ringkasan "Nilai Essay 35 Poin", catatan lama tetap terisi — tidak ada nilai yang hilang saat input lain tidak disentuh.
- Aksi: **kosongkan** kolom nilai lalu simpan.
- Terverifikasi: sistem diam-diam menulis **0** ("Nilai Essay 0 Poin", toast sukses) dan nilai 35 sebelumnya hilang. Input tidak pernah kehilangan isinya secara tak terduga, jadi klaim "tidak ada nilai yang hilang saat input dikosongkan" **tidak terpenuhi secara bermakna** → lihat Temuan T-1.

#### Skenario 7 — Dialog penjadwalan sesi → **Passed**

- Aksi: klik "Jadwalkan Sesi Ujian" sebagai `pengajar.uji@example.com`.
- Terverifikasi nilai awal: `#session-title` kosong, `#session-start` = `2026-11-05T20:54` (jam berjalan saat itu 20:55), `#session-end` = `2026-11-05T22:54` (+2 jam), `#session-duration` = `60`, kedua sakelar (`#switch-rand-q`, `#switch-rand-opt`) `checked = true`, `#session-passing-score` = `75` (bukan konstanta — diturunkan dari `passingScore` bank soal pertama yang terpilih, `apps/app/(main)/sesi-ujian/page.tsx:130-134`).
- Aksi: ketik "Ketikan Uji CHG", klik "Batal", buka kembali dialog.
- Terverifikasi: dialog baru kembali bersih — judul kosong, mulai `2026-11-05T20:55`, akhir `2026-11-05T22:55`, durasi 60.
- Aksi (regresi refactor): ketik "Judul Tahan Lama", diamkan 5 detik tanpa menutup dialog sementara daftar bank soal/ sesi termuat ulang.
- Terverifikasi: `#session-title` tetap **"Judul Tahan Lama"**, mulai/durasi tidak berubah — ketikan tidak direset oleh muat ulang data (perilaku lama yang diperbaiki).
- Aksi: keluar, masuk sebagai `pengajar.dua@example.com` (akun tanpa sesi) → klik CTA kartu kosong **"Jadwalkan Sesi Sekarang"**.
- Terverifikasi: dialog terbuka dengan nilai awal yang sama (judul kosong, mulai = sekarang `2026-11-05T20:56`, akhir +2 jam, durasi 60, kedua sakelar aktif); `#session-passing-score` kosong dan pemilih bank menampilkan "Belum ada…" karena akun ini tidak punya paket — konsisten dengan penurunan dari bank terpilih.

### Temuan (2026-11-05)

- **T-1 (Medium)** di koreksi essay: mengosongkan kolom "Beri Nilai" lalu "Simpan Nilai" menulis 0 dan diam-diam menimpa nilai sebelumnya, dengan toast sukses tanpa konfirmasi. Sumber: formulir `/rekap-nilai/koreksi/[id]`. Sarankan validasi (tolak nilai kosong / minta konfirmasi) agar pengajar tidak kehilangan nilai hasil koreksi.
- **T-2 (Low)** layar "Ujian Selesai & Terkumpul" menampilkan baris "Nama Santri:", "NISN:", "Mata Pelajaran:" tanpa nilai (ditemukan lagi pada dua jalur pengumpulan: manual dan otomatis). Sudah tercatat pada spec lembar kerja; masih ada.
- **T-3 (Low, ketahanan)** hitung mundur bergantung pada `setInterval` di klien (`apps/app/ujian/ExamWorksheet.tsx:404-420`). Di tab latar belakang browser men-jatah timer sehingga jam di layar bisa tertinggal jauh dari anggaran server (teramati beku >100 detik) dan pengumpulan otomatis baru terjadi ketika halaman dimuat ulang/di-aktifkan. Tidak melanggar kontrak (waktu tetap dibaca dari server saat muat), tetapi santri yang benar-benar pindah tab — tindakan yang justru ditandai sistem — bisa melihat jam tidak jalan.
- **T-4 (Low)** mode "lanjutkan" tidak diberi label di layar pratinjau: teks tombol tetap "Mulai Mengerjakan Ujian" meskipun toast dan status peserta menunjukkan mode lanjut. Perilaku benar, penamaan saja.

### Media Evidence

- Tidak ada tangkapan layar: kemampuan browser in-app tidak menyediakan tangkapan layar/rekaman pada sesi ini, dan tab target selalu dalam keadaan `hidden` dengan lebar viewport 0. Bukti terkuat yang dipakai: teks DOM yang dibaca langsung, toast yang direkam `MutationObserver`, pembungkus `console.error`/`onerror` (0 entri), dan kueri `npx convex data` (`examParticipants`, `studentAnswers`).


### 2026-11-03 — prasyarat terverifikasi, skenario 1-7 belum

- Login pengajar di browser nyata (`http://localhost:3000/login`): isi email + password, klik "Sign in with email", halaman berpindah sendiri ke `/account` dan terdapat teks "PROTECTED ACCOUNT" / "Your session was validated by the Convex Better Auth server before this page rendered."
- Sesi bertahan saat pindah halaman: navigasi ke `/sesi-ujian` tetap dalam keadaan login (sidebar pengajar ter-render).
- Penolakan kredensial salah (level API, origin `http://localhost:3000`): password salah dan email tak dikenal sama-sama `401 INVALID_EMAIL_OR_PASSWORD`.
- Origin `http://127.0.0.1:3000`: `403 INVALID_ORIGIN` — karena itu prasyarat memakai `localhost`.
- `/sesi-ujian` untuk akun ini kosong; sesi `HH4XC2` tercatat atas `creatorTokenIdentifier = https://convex.test|-59396202` (identitas seed CLI), sehingga tester harus membuat sesi baru.
- Belum dibuktikan: skenario 1-7 (auto-fill gerbang santri, resume jawaban, hitung mundur sampai `00:00` dan pengumpulan otomatis, pelanggaran tab, default rekap nilai, prefill koreksi essay, perilaku dialog sesi).
  - *Koreksi 2026-11-05*: ketujuh skenario kini sudah dijalankan; lihat blok "2026-11-05" di atas. Blok 2026-11-03 dipertahankan sebagai catatan prasyarat (origin `localhost` vs `127.0.0.1`, kepemilikan sesi seed CLI) yang masih berlaku.

## Status Pembersihan (2026-11-05)

- Dihapus lewat modul internal sementara `convex/tmpE2e/cleanup.ts` (modul ini milik sesi tes dan sudah dihapus kembali): `{ sessions: 2, participants: 2, answers: 2, questions: 3, bankDeleted: true }` — sesi `APADCL` + `4SW7V5`, paket "E2E State Turunan", lembar kedua santri uji.
- Verifikasi pasca-pembersihan dengan `npx convex data`: `examParticipants` hanya menyisakan data lama (`24.03.001 / 9TZRXX`, `0119755229 / HH4XC2`), `studentAnswers` 1 baris milik sesi lama, `examSessions` = { `adab akhlaq 2C6PKJ`, `Ujian FiQih Uji Integrasi HH4XC2` }, `questionBanks` hanya paket milik pengguna.
- `rm -rf apps/convex/tmpE2e` lalu `npx convex dev --once` → **`Convex functions ready! (14.17s)`**; tidak ada modul tes yang tertinggal di deployment dev.

