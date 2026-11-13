# CHG-004 — Kelola mata pelajaran dan jenjang resmi pada pembuatan paket

## Deskripsi fitur

Pengajar yang sudah masuk dapat menambah, mengganti nama, dan menonaktifkan mata pelajaran dari layar `/mata-pelajaran`; daftar ini dipakai bersama seluruh pengajar madrasah. Pembuatan paket bank soal tidak lagi menerima tingkat karangan sendiri: pengajar memilih lembaga resmi lebih dulu, lalu pilihan tingkat menyesuaikan lembaga tersebut.

**Cerita pengguna**: sebagai pengajar, saya ingin daftar mata pelajaran dan jenjang mengikuti kosakata resmi pesantren supaya paket yang saya buat cocok dengan data santri hasil sinkronisasi dan tidak ada dua orang menulis nama kelas yang berbeda-beda.

## Requirements

- Sumber: `.planora/EXECUTION/TODO.md` `CHG-004`; PRD `BANK-FR-010`, `BANK-FR-011`; kriteria penerimaan `BANK-AC-012`, `BANK-AC-013`; keamanan `NFR-SEC-006`; kontrak UI `UI/screens/kelola-mata-pelajaran.md`, `UI/components/penulisan-soal-dan-mapel.md` butir 9-10.
- Kriteria penerimaan (verbatim dari TODO): pengajar yang masuk dapat menambah, mengganti nama, dan menonaktifkan mata pelajaran dari `/mata-pelajaran` dan perubahannya langsung tercermin pada daftar paket dan filter mata pelajaran; kode ganda ditolak; mata pelajaran yang masih dipakai paket tidak bisa dihapus permanen; mata pelajaran nonaktif hilang dari pilihan baru tetapi tetap tampil pada paket lama; pilihan tingkat pada form paket terbatas pada jenjang lembaga resmi dan mengganti lembaga mengosongkan tingkat; pengunjung tanpa login tidak dapat mengubah daftar.
- **Di luar cakupan**: pengisian otomatis daftar mata pelajaran bawaan pada basis data kosong (masih pertanyaan terbuka `asumsi-dan-pertanyaan.md` nomor 4); kolom pembahasan, tingkat berpikir, dan rujukan capaian (`CHG-005`); pemetaan tempelan lembar kerja (`CHG-006`); pemindahan paket ke mata pelajaran lain; perubahan nama mata pelajaran pada daftar sesi/rekap hari ini (daftar itu menampilkan kode, yang stabil terhadap ganti nama).

## Bukti / keadaan saat ini

- `subjects` (`apps/convex/schema.ts:6`) hanya punya `code`, `name`, `description`, `createdAt` — tidak ada status aktif dan tidak ada cara menambah/mengganti/menonaktifkan dari aplikasi.
- `listSubjects` (`apps/convex/bank/public/queries.ts:9`) mengumpulkan seluruh baris; `seedDefaultSubjects` (`apps/convex/bank/public/mutations.ts:391`) tidak pernah dipanggil dari aplikasi, jadi enam baris yang ada hari ini hasil isian manual.
- Form pembuatan paket (`apps/app/(main)/bank-soal/page.tsx:225`) memakai tujuh `SelectItem` karangan sendiri ("Kelas 7 / Ula 1" sampai "Tarbiyah / Takhassus") yang tidak cocok dengan label kelas santri; `createQuestionBank`/`updateQuestionBank` menerima `gradeLevel` sebagai teks bebas.
- Kosakata lembaga resmi sudah ada di sisi santri: `students` membatasi `jenjang` ke SMPITA/SMAITA/MTA (`apps/convex/schema.ts:129`) dan `enterExamSession` memvalidasi rentang kelas per lembaga (`apps/convex/examSession/public/mutations.ts:347-354`); label lembaga lengkap dipakai gerbang ujian (`apps/app/ujian/page.tsx:315-317`).
- Kartu paket dan header editor menampilkan `subjectCode` mentah (`apps/app/(main)/bank-soal/page.tsx:367`, `apps/app/(main)/bank-soal/[id]/page.tsx:300`), jadi ganti nama tidak tercermin.

## Berkas terkait

- `apps/convex/model/institutions.ts` (baru): kosakata lembaga + tingkat dan helper validasi pasangan; murni (tanpa impor apa pun) agar bisa dipakai server, klien, dan `node --test`.
- `apps/convex/schema.ts`: `subjects.isActive`/`subjects.updatedAt` dan `questionBanks.institution` sebagai kolom **opsional** (absen berarti aktif / belum berlembaga) supaya tidak ada migrasi paksa pada baris yang sudah ada.
- `apps/convex/bank/public/queries.ts`: `listSubjectsWithUsage` (wajib login; nama, kode, deskripsi, status, jumlah paket) + `subjectName` pada `getQuestionBank`.
- `apps/convex/bank/public/mutations.ts`: `addSubject`, `renameSubject`, `setSubjectActive`, `deleteSubject`, plus gerbang jenjang pada `createQuestionBank`/`updateQuestionBank`.
- `apps/app/(main)/mata-pelajaran/page.tsx` (baru): layar kelola (header, kartu tambah, tabel → kartu pada layar kecil, aksi per baris).
- `apps/app/(main)/bank-soal/page.tsx`: tautan "Kelola Mata Pelajaran", pemilih lembaga→tingkat bertingkat, hanya mata pelajaran aktif pada form baru, badge nama mata pelajaran, filter memakai nama.
- `apps/app/(main)/bank-soal/[id]/page.tsx`: badge nama mata pelajaran alih-alih kode.
- `apps/tests/subject-management.test.ts` (baru): unit kosakata/validasi + penjaga sumber backend dan UI.

## Urutan implementasi

1. **Kosakata jenjang** — `INSTITUTION_LEVELS`: SMPITA `Kelas 7..9`, SMAITA `Kelas 10..12`, MTA `MTA 1..6`; label lembaga sama dengan gerbang ujian. Label ini sengaja dipilih agar lolos regex kelas yang sudah dipakai validasi santri (`^(kelas\s*)?[7-9]`, `^(kelas\s*)?(10|11|12)`, `^mta\s*[1-6]`), sehingga suatu sesi bisa ditautkan ke daftar kelas tanpa menerjemahkan dua kosakata. `institutionForLevel` memetakan label lama ke lembaga dan mengembalikan kosong untuk nilai warisan seperti "Tarbiyah / Takhassus".
2. **Skema** — kolom opsional saja; tanpa perubahan indeks yang sudah ada (`by_code` pada subjects sudah tersedia, `by_subject` pada questionBanks sudah tersedia untuk menghitung pemakaian).
3. **Backend mata pelajaran** — `addSubject` menormalisasi kode (hapus spasi, huruf besar) dan menolak kode yang sudah dipakai dengan kalimat yang menyebut kode itu sudah ada; `renameSubject` hanya mengubah nama/deskripsi (kode adalah pengenal paket, tidak berubah setelah dipakai); `setSubjectActive` menulis `isActive`; `deleteSubject` menghitung pemakaian lewat indeks `by_subject` dan menolak bila masih dipakai, dengan angka pemakaian yang sebenarnya. Semua mutasi memanggil `requireAuthenticatedUser(ctx)`; daftar bersifat bersama, jadi tidak ada kepemilikan per baris.
4. **Backend jenjang paket** — `createQuestionBank` mewajibkan pasangan `institution` + `gradeLevel` dan menolak teks bebas maupun pasangan yang tidak cocok; `updateQuestionBank` menolak bila hanya salah satu dikirim. Paket lama tetap terbaca dan tidak ditulis ulang sampai pengajar sendiri mengubahnya.
5. **Layar kelola** — tambah adalah satu-satunya ajakan utama; aksi per baris memakai label teks "Aktif"/"Nonaktif" (bukan warna saja), "Hapus" nonaktif disertai alasan yang menyebut jumlah paket pemakai, ganti nama memakai dialog dengan kolom terisi, dan kegagalan muncul sebagai toast singkat sementara isian tetap terbaca.
6. **Integrasi layar paket** — mengganti lembaga mengosongkan tingkat (perilaku yang sama dengan gerbang ujian), form hanya menawarkan mata pelajaran aktif, filter memakai daftar lengkap termasuk yang nonaktif agar paket lama tetap ketemu.
7. **Tes** — unit kosakata (isi tiap lembaga, `institutionForLevel` warisan, normalisasi kode, pasangan salah), penjaga sumber mutasi (gerbang login, unik kode, hapus ditolak saat dipakai, `gradeLevel` tidak lagi `v.string()` bebas pada jalur create), penjaga sumber UI (tautan kelola, efek pembersih lembaga, status berlabel teks, tabel/kartu responsif, kebocoran kode spesifikasi, emoji).

## Risiko

- Kolom baru pada skema Convex bisa merusak baris lama bila wajib; mitigasi: semuanya `v.optional` dan aturan "absen = aktif / belum berlembaga" dinyatakan di satu tempat.
- Nilai `gradeLevel` lama yang tidak ada dalam kosakata resmi (`Tarbiyah / Takhassus`) hilang dari pilihan baru; mitigasi: data lama tidak ditulis ulang, tetap tampil, dan hanya berubah bila pengajar memilih tingkat baru.
- Menghitung jumlah paket per mata pelajaran membaca indeks `by_subject` per baris; pada skala madrasah (puluhan mata pelajaran) biayanya kecil, dan angkanya memang dibutuhkan layar.
- Nama mata pelajaran yang dipakai sesi lama tetap tampil sebagai kode di halaman sesi/rekap; mitigasi: kode tidak berubah saat ganti nama, jadi tidak pernah salah baca — pencocokan nama di halaman itu bukan kriteria penerimaan `CHG-004`.

## Kriteria penerimaan terukur

- Menambah "Fiqih Ibadah" dengan kode `fiqih ibadah` → baris baru berkode `FIQIH_IBADAH` muncul di daftar tanpa muat ulang; kode ganda ditolak dengan pesan yang menyebut kode sudah dipakai.
- Ganti nama mata pelajaran → nama baru langsung terbaca pada kartu paket dan filter daftar paket.
- Menonaktifkan → mata pelajaran hilang dari dropdown form paket baru, tetapi paket lama tetap menampilkan namanya dan status baris berubah jadi "Nonaktif".
- Menghapus mata pelajaran dengan satu paket → ditolak dengan kalimat yang menyebut jumlah paket; menghapus yang nol paket → berhasil.
- Form paket: tanpa lembaga tidak ada tingkat; pilih MTA → hanya `MTA 1..6`; ganti lembaga → tingkat kosong; `createQuestionBank` dengan `gradeLevel: "Bebas"` → ditolak server.
- Anonim (probe CLI tanpa `--identity`) pada keempat mutasi mata pelajaran → "Akses ditolak: Anda harus login…".

## Perintah validasi

- `npx convex dev --once`: mutasi/query baru terdeploi dan kodegen cocok.
- `npm test`: unit kosakata + penjaga sumber + kebocoran UI lulus.
- `npm run typecheck && npm run build`: kompilasi bersih dan rute `/mata-pelajaran` terbentuk.
- `npm run lint`: tetap 0 error dari baseline.
- `npx convex run 'bank/public/mutations:addSubject|renameSubject|setSubjectActive|deleteSubject|createQuestionBank' …` tanpa dan dengan `--identity`: membuktikan gerbang login, penolakan kode ganda, penolakan hapus yang masih dipakai, dan penolakan teks bebas.

## Penilaian E2E

- Rekomendasi: `Required` — layar baru dengan gerbang login dan transisi tulis pada daftar bersama; kriteria "pengunjung tanpa login tidak dapat mengubah daftar" butuh bukti browser.
- Eksekusi: ditangguhkan ke `/e2e-tester` (otomatisasi browser tidak diminta pada sesi ini); spesifikasi dibuat di `specs/e2e/kelola-mata-pelajaran.md`.
