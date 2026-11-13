# E2E: CBT Exam 3-Panel Layout & Integrity Anti-Cheat

- Source: TASK-012 (UJIAN-FR-008, UJIAN-FR-009, NILAI-FR-005, NILAI-FR-006)
- Recommendation: Required
- Status: Blocked (dijalankan 2026-11-05: skenario 2-5 Passed, skenario 1 terblokir pada verifikasi visual desktop)
- Environment: local Next.js development server with Convex dev deployment
- Base URL: http://localhost:3000
- Last updated: 2026-11-05

## Prerequisites

- Application running at `http://localhost:3000`.
- Sesi ujian aktif dengan paket bank soal yang memuat soal PG biasa, PG Kompleks berstimulus, Benar/Salah, dan Essay.
- Santri telah terdaftar dan memiliki token ujian 6 digit yang valid.

## Scenarios

1. Memasuki Ruang Ujian dan Memeriksa Tata Letak 3-Panel
   - Actions: Santri memasukkan nomor induk, memilih lembaga dan kelas, memasukkan token 6 digit, lalu menekan tombol masuk.
   - Expected: Santri berhasil masuk ke lembar ujian. Di layar desktop, tampil tata letak 3-panel: Panel Wacana/Stimulus di kiri, Lembar Soal di tengah, dan Peta Nomor Soal di kanan.

2. Pengerjaan Soal Pilihan Ganda Kompleks
   - Actions: Navigasi ke nomor soal bertipe PG Kompleks. Centang 2 opsi jawaban yang benar.
   - Expected: Kedua opsi tercentang secara interaktif, indikator auto-save menampilkan status tersimpan, dan nomor pada peta soal berubah menjadi warna hijau (sudah dijawab).

3. Pengerjaan Soal Benar / Salah
   - Actions: Navigasi ke soal Benar/Salah. Klik tombol "Pernyataan Benar".
   - Expected: Kartu opsi "Benar" terpilih dengan highlight jelas, status tersimpan otomatis ke server.

4. Uji Deteksi Anti-Curang (Tab Blur / Visibility Change)
   - Actions: Pengguna beralih ke tab peramban lain atau membuka jendela lain di komputer, lalu kembali lagi ke tab ruang ujian.
   - Expected: Dialog "Peringatan Integritas Ujian" muncul di layar, memberitahukan bahwa perpindahan jendela telah dicatat oleh sistem pengawas dengan counter pelanggaran bertambah.

5. Pengumpulan Ujian dan Pemeriksaan Rekapitulasi Nilai
   - Actions: Klik tombol "Selesaikan Ujian", konfirmasi dialog pengumpulan final. Masuk sebagai pengajar dan buka halaman `/rekap-nilai`.
   - Expected: Ujian santri berstatus Selesai, nilai pilihan ganda (termasuk PG Kompleks dan Benar/Salah) terhitung otomatis secara instan, dan kolom "Pelanggaran Tab" menampilkan badge jumlah pelanggaran yang dilakukan santri.

## Evidence

- Result: **Blocked** (skenario 1 sebagian terblokir; skenario 2-5 Passed)
- Tested at: 2026-11-05, `/e2e-tester`
- Environment: `http://localhost:3000`, Convex dev deployment `quirky-rat-737`
- Fixtures: bank `E2E 3Panel Integritas` (`j573w15svc93z0eje9tgfx84h18hmcyc`, 4 butir: PG 25, PG Kompleks berstimulus 25, Benar/Salah 25, Essay 25); sesi `E2E 3Panel Integritas` (`jh7a5m14yb9pjqrstnqrdmtay18hmr6e`, token `4UM7UZ`, mode penegakan "Catat saja") untuk santri `26.03.028` Nizam Fahrizi; sesi `E2E 3Panel Bukti Koreksi` (`jh72bzx5aetrbvjg4xc35xxkch8hn85p`, token `7SYFUW`, tanpa pengacakan) untuk santri `26.03.027` Muhammad Al Fathih.
- Batasan alat: tab browser `visibilityState=hidden`, viewport terkunci 474×569 px (tidak dapat diubah ke ukuran desktop), tanpa tangkapan layar, dan `list_console_messages` tidak tersedia.
- Catatan prasyarat: bank dan butir dibuat melalui mutasi publik aplikasi (`bank/public/mutations:createQuestionBank` + `createQuestion`) dari client Convex milik pengajar yang login, karena dialog pembuatan bank soal masih bermasalah saat disimpan lewat UI (terdokumentasi di `specs/e2e/batas-tuntas-sesi-lanjutan.md`). Sesi pertama dibuat + diaktifkan lewat layar `/sesi-ujian`; seluruh pengerjaan, deteksi integritas, pengumpulan, dan rekap dikerjakan lewat UI.

### 1. Memasuki Ruang Ujian dan Memeriksa Tata Letak 3-Panel

- Actions: santri `26.03.028` + token `4UM7UZ` masuk, klik "Mulai Mengerjakan Ujian".
- Expected: santri masuk lembar ujian; di desktop tampil 3 panel — Wacana/Stimulus kiri, Lembar Soal tengah, Peta Nomor Soal kanan.
- Actual: masuk berhasil (header `FIQIH`, `1/4`, timer `59:40` berjalan mundur, soal, opsi, dan grid navigasi `1-4`). Struktur 3 panel ada di DOM: `main` berkelas `grid-cols-1 lg:grid-cols-12` dengan Panel 1 `hidden lg:block lg:col-span-4` ("Wacana / Stimulus"), Panel 2 `col-span-1 lg:col-span-5` (lembar soal), Panel 3 `hidden lg:block lg:col-span-3` ("Peta Nomor Soal") — lihat [apps/app/ujian/ExamWorksheet.tsx:703](file:///D:/DATA/PROJEK/IMTIHAN/apps/app/ujian/ExamWorksheet.tsx), [:705](file:///D:/DATA/PROJEK/IMTIHAN/apps/app/ujian/ExamWorksheet.tsx#L705), [:754](file:///D:/DATA/PROJEK/IMTIHAN/apps/app/ujian/ExamWorksheet.tsx#L754), [:973](file:///D:/DATA/PROJEK/IMTIHAN/apps/app/ujian/ExamWorksheet.tsx#L973). Pada lebar uji 474 px (di bawah breakpoint `lg` 1024 px) Panel 1 dan 3 ber-sedia sebagai drawer lewat tombol "Wacana" dan tombol "1/4"; drawer wacana terverifikasi berisi stimulus ("Wacana / Stimulus Soal #2 — E2E 3P-2 WACANA: Akhlak terpuji…"). Penataan tiga kolom berdampingan di layar desktop **tidak dapat diamati secara visual** karena viewport tidak dapat diubah.
- Status: **Blocked** (bagian tampilan desktop), seluruh bagian lain terverifikasi.

### 2. Pengerjaan Soal Pilihan Ganda Kompleks

- Actions: navigasi ke nomor 2 (tipe "PG Kompleks"), centang opsi "Jujur" dan "Amanah".
- Expected: kedua opsi tercentang, auto-save tersimpan, nomor pada peta berubah hijau.
- Actual: `input[type=checkbox]` A dan B `checked=true`, C dan D tetap `false`; indikator auto-save pada keadaan `saved`; kotak peta `2` berubah menjadi `bg-emerald-600`. Bukti server: `studentAnswers.selectedOptionIds = ["k1","k2"]`.
- Status: **Passed**

### 3. Pengerjaan Soal Benar / Salah

- Actions: pada nomor 1 (tipe "Benar / Salah"), klik tombol "Pernyataan Benar".
- Expected: kartu "Benar" terpilih dengan highlight jelas, tersimpan otomatis.
- Actual: kelas tombol berubah menjadi `border-emerald-600 bg-emerald-50 text-emerald-700 ring-2 ring-emerald-500/40` (tombang "Pernyataan Salah" tetap `bg-card`), peta nomor 1 menjadi `bg-emerald-600`, dan baris jawaban tersimpan (`selectedOptionId: "true"`).
- Status: **Passed**

### 4. Uji Deteksi Anti-Curang (Tab Blur / Visibility Change)

- Actions: memicu perpindahan menjauh dengan `window.dispatchEvent(new Event('blur'))` (jalur listener nyata di [apps/app/ujian/ExamWorksheet.tsx:160](file:///D:/DATA/PROJEK/IMTIHAN/apps/app/ujian/ExamWorksheet.tsx)), lalu mensimulasikan kembali ke tab (getter `document.hidden` dibuat sementara `false` + `visibilitychange`), karena tab uji tidak bisa difokuskan/ditampilkan ulang oleh kapabilitas browser.
- Expected: dialog "Peringatan Integritas Ujian" muncul dan counter pelanggaran bertambah.
- Actual: dialog muncul setinggi 374 px berisi "Terdeteksi bahwa Anda meninggalkan jendela atau tab ujian aktif.", "Seluruh aktivitas keluar dari layar ujian telah dicatat secara otomatis oleh sistem pengawas.", **"Total Pelanggaran Tercatat: 1 kali"**, dengan tombol "Saya Mengerti & Kembali Mengerjakan". Server: `examParticipants.tabViolations = 1` dan dialog rekap menampilkan "Catatan Pelanggaran Layar: 1 kali". Mode sesi "Catat saja" terbukti tidak mengunci lembar (pengerjaan lanjut normal).
- Caveat: pemicunya adalah dispatch event pada listener aplikasi, bukan perpindahan tab sungguhan (tidak ada tab kedua yang bisa dibuat/difokuskan). Logika pencatatan dan counter terbukti, interaksi OS-nya belum.
- Status: **Passed** (dengan catatan metode pemicuan)

### 5. Pengumpulan Ujian dan Pemeriksaan Rekapitulasi Nilai

- Actions: "Selesaikan Ujian" → "Ya, Kumpulkan Jawaban" (santri Nizam, 4 butir terjawab), lalu login pengajar dan buka `/rekap-nilai`.
- Expected: peserta berstatus Selesai, nilai PG (termasuk PG Kompleks dan Benar/Salah) terhitung otomatis instan, kolom "Pelanggaran Tab" menampilkan badge jumlah pelanggaran.
- Actual: rekap pengumpulan "4 Terjawab / 0 Ragu-ragu / 0 Kosong" + catatan pelanggaran; layar "Ujian Selesai & Terkumpul" tampil. Di `/rekap-nilai` baris Nizam: Status Ujian **Selesai**, Jenis Sesi Reguler, Pelanggaran Tab **"1x Waspada"**, Nilai PG 50, Nilai Essay 0, Total 50, Belum tuntas, Status Koreksi "Perlu Koreksi Essay" — tanpa perlu menekan tombol koreksi apa pun (koreksi otomatis instan untuk tipe objektif).
- Verifikasi terpisah untuk Benar/Salah: pada pengumpulan pertama nilai PG hanya 50 karena butir benar/salah fixture saya diberi `option.id` `"t"/"f"`, sedangkan lembar santri selalu menyimpan nilai `"true"/"false"` ([apps/app/ujian/ExamWorksheet.tsx:273-296](file:///D:/DATA/PROJEK/IMTIHAN/apps/app/ujian/ExamWorksheet.tsx)) dan koreksi membandingkan dengan `option.id` ([apps/convex/examSession/public/mutations.ts:840](file:///D:/DATA/PROJEK/IMTIHAN/apps/convex/examSession/public/mutations.ts)). Setelah id disamakan dengan konvensi aplikasi (`"true"`/`"false"`, via `bank/public/mutations:updateQuestion` pada sesi `7SYFUW`), santri kedua dengan 3 jawaban objektif benar mendapat **Nilai PG 75 / Total 75 / Tuntas** dan badge **"0 (Tertib)"**. Jadi kegagalan pertama disebabkan fixture, bukan aplikasi — tetapi lihat Temuan 2.
- Status: **Passed**

## Findings

1. **High (validasi tertunda, bukan kegagalan fungsi)** — Koreksi otomatis Benar/Salah bergantung pada `option.id` yang harus persis `"true"`/`"false"`. Jawaban santri dikirim sebagai `"true"`/`"false"`, sementara pembandingnya `correctOption.id`. Konvensi ini dijaga oleh generator opsi di `apps/lib/question-import.ts:846` (`trueFalseOptions`) dan `apps/lib/question-options.ts:85` (`resolveTrueFalseAnswer`), tetapi tidak ditegakkan di server: `createQuestion`/`updateQuestion` menerima `id` apa pun untuk tipe `true_false`. Butir yang id-nya di luar konvensi (misalnya dari pemanggilan API langsung atau impor masa depan) akan selalu bernilai 0 tanpa pesan apa pun. Perlu penegakan di `questionBodyFields` atau pencocokan berbasis `isCorrect`/label, bukan id.
2. **Medium** — Layar kecil kehilangan panel Pendukung. Di bawah `lg` (1024 px) Panel Wacana dan Peta Nomor disembunyikan total dan hanya bisa dibuka sebagai drawer; di bawah `sm`/`md` ayrıca indikator auto-save tersembunyi. Santri yang ujian lewat ponsel tidak pernah melihat tiga area informasi sekaligus.
3. **Low** — Kartu Benar/Salah dan opsi PG tidak mengekspos keadaan terpilih ke teknologi asistif: tidak ada `aria-pressed`, `aria-checked`, atau `role` pada tombol pilihan ([apps/app/ujian/ExamWorksheet.tsx:877-902](file:///D:/DATA/PROJEK/IMTIHAN/apps/app/ujian/ExamWorksheet.tsx)); keadaan hanya dibedakan lewat warna `bg-emerald-50`/`bg-rose-50`.
4. **Low** — Dialog yang ditutup kadang tertinggal di DOM selama tab uji berada pada keadaan tersembunyi (sisa `[role=dialog]` tinggi 32 px; juga teramati di `specs/e2e/exam-worksheet.md`). Diduga artefak animasi keluar pada tab `hidden`, bukan cacat produk, tetapi belum dapat dipastikan.

## Failures or blockers

- Blocker alat: viewport tidak dapat diubah ke ukuran desktop (≥1024 px) dan screenshot tidak tersedia, sehingga tata letak 3-panel berdampingan (skenario 1) hanya bisa dibuktikan dari kelas responsif + DOM, bukan secara visual. Perlu diulang dengan kapabilitas browser yang bisa mengatur viewport.
- Tidak ada kegagalan fungsional yang teridentifikasi pada skenario 2-5.

## Cleanup

- 2026-11-05: kedua sesi fixture, 2 peserta, 7 jawaban, 4 butir, dan bank `E2E 3Panel Integritas` dihapus melalui modul internal sementara `convex/tmpE2e/cleanup.ts` (`npx convex run tmpE2e/cleanup:cleanup` → `{sessions: 2, participants: 2, answers: 7, questions: 4, bankDeleted: true}`). Verifikasi `npx convex data examSessions`: hanya data milik pengguna yang tersisa (`adab akhlaq`, `Ujian FiQih Uji Integrasi`).

## Recommended Next Step

- Jalankan ulang hanya bagian tampilan skenario 1 pada viewport desktop (butuh kapabilitas resize/screenshot) untuk menutup status `Blocked`; laporkan Temuan 1 ke `/bug` karena menyangkut keadilan nilai santri, dan Temuan 3 ke `/chore` aksesibilitas.
