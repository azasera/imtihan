# Manajemen Bank Soal

## Tujuan

Menyediakan sarana bagi pengajar (asatidzah) untuk menyusun, mengelola, dan mengelompokkan butir-butir soal ujian (pilihan ganda, pilihan ganda kompleks, benar/salah, dan essay) berdasarkan mata pelajaran dan tingkat kelas secara terstruktur dan aman, termasuk menulis banyak butir sekaligus, mencatat pembahasan serta penanda mutu butir, dan mengelola daftar mata pelajaran bersama.

## User stories

- Sebagai Pengajar, saya ingin membuat paket bank soal per mata pelajaran agar kumpulan soal tersusun rapi untuk ujian semester.
- Sebagai Pengajar, saya ingin menambahkan butir soal pilihan ganda dengan 4 atau 5 opsi jawaban dan menandai satu kunci jawaban yang benar agar sistem dapat mengoreksi otomatis.
- Sebagai Pengajar, saya ingin menuliskan soal essay beserta panduan rubrik penilaian agar saya memiliki pedoman penilaian yang adil.
- Sebagai Pengajar, saya ingin menempelkan banyak butir soal sekaligus dari dokumen yang sudah saya tulis di Word atau catatan, lalu melihat pratinjau per butir sebelum menyimpan, karena menulis soal satu per satu melalui formulir terlalu lambat untuk satu paket ujian.
- Sebagai Pengajar, saya ingin menyunting dan menggandakan butir soal yang sudah tersimpan, karena mengulang dari nol setiap kali ada satu salah ketik sangat melelahkan.
- Sebagai Pengajar, saya ingin menambah atau menonaktifkan mata pelajaran sendiri dan memilih jenjang yang sama dengan data santri, karena daftar mata pelajaran saat ini hanya enam dan tidak bisa disesuaikan dari aplikasi.
- Sebagai Pengajar, saya ingin menempelkan baris yang saya salin langsung dari lembar kerja (Excel atau Google Sheets) dan mengunduh template kolomnya, karena naskah soal saya sehari-hari sudah tersusun dalam tabel, bukan teks bernomor.
- Sebagai Pengajar, saya ingin mencatat pembahasan, tingkat berpikir, dan rujukan capaian materi pada tiap butir soal, karena hasil ujian harus menjelaskan butir mana yang perlu diajarkan ulang dan pembahasan tidak boleh bocor ke santri.

## Kebutuhan fungsional

- `BANK-FR-001` — Sistem harus menyediakan formulir pembuatan paket bank soal baru yang mencakup nama paket, mata pelajaran, tingkat kelas, dan alokasi bobot nilai.
- `BANK-FR-002` — Sistem harus mendukung input butir soal pilihan ganda dengan opsi jawaban A, B, C, D (dan opsional E), teks pembahasan, dan pemilihan kunci jawaban.
- `BANK-FR-003` — Sistem harus mendukung input butir soal essay dengan kolom teks soal, rubrik pedoman penilaian, dan batas nilai maksimal.
- `BANK-FR-004` — Sistem harus menyediakan pratinjau (preview) tampilan soal seperti yang akan dilihat oleh santri.
- `BANK-FR-005` — Sistem harus mendukung tipe soal Pilihan Ganda Kompleks (`pg_kompleks`) dengan multi-kunci jawaban benar dan tipe soal Benar/Salah (`true_false`) dengan kunci status benar atau salah.
- `BANK-FR-006` — Sistem harus mendukung konten stimulus pada butir soal berupa teks stimulus (wacana/bacaan) dan URL media/gambar stimulus opsional.
- `BANK-FR-007` — Sistem harus menyediakan panel Live Preview interaktif berdampingan (split-view) pada formulir input butir soal, menampilkan simulasi soal dan stimulus secara real-time seperti yang dilihat oleh santri.
- `BANK-FR-008` — Sistem harus menyediakan impor massal butir soal melalui tempel teks berformat: pengajar menempelkan satu paket soal dari dokumen, sistem menafsirkan tiap butir beserta tipe, opsi, kunci, stimulus, dan bobotnya, lalu menampilkan pratinjau hasil tafsiran per butir sebelum ada yang disimpan.
- `BANK-FR-009` — Sistem harus menyediakan aksi sunting dan gandakan pada tiap butir soal yang sudah tersimpan di dalam paket.
- `BANK-FR-010` — Sistem harus menyediakan pengelolaan daftar mata pelajaran bagi pengajar yang telah masuk: menambah, mengganti nama, dan menonaktifkan mata pelajaran, dengan mata pelajaran bawaan tetap tersedia sebagai milik bersama.
- `BANK-FR-011` — Sistem harus membatasi pilihan jenjang atau tingkat pada paket bank soal ke kosakata lembaga resmi yang sama dengan data santri (SMPITA kelas 7 sampai 9, SMAITA kelas 10 sampai 12, MTA tingkatan 1 sampai 6) beserta nama lembaga induknya.
- `BANK-FR-012` — Sistem harus menerima tempelan baris yang disalin langsung dari lembar kerja (satu butir per baris, kolom berpisahkan tab) pada impor massal, memetakannya ke kolom tetap untuk teks soal, tipe, opsi A sampai E, kunci, bobot, pembahasan, tingkat berpikir, dan rujukan capaian materi, lalu menampilkan pratinjau yang sama seperti tempelan teks bernomor.
- `BANK-FR-013` — Sistem harus menyediakan unduhan template impor berisi baris judul kolom beserta satu contoh butir, dengan kolom yang persis sama dengan yang diterima pemetaan tempelan lembar kerja, agar pengajar dapat mengisi di lembar kerja lalu menempelnya kembali.
- `BANK-FR-014` — Sistem harus menyediakan penanda tingkat berpikir per butir soal dengan pilihan yang baku dan seragam di seluruh aplikasi (mengingat, memahami, mengaplikasikan, menganalisis) serta pilihan belum ditandai sebagai bawaan.
- `BANK-FR-015` — Sistem harus menyediakan penanda rujukan capaian materi per butir soal berupa label pendek yang dikelola pengajar per mata pelajaran, tanpa memaksa satu daftar kurikulum baku, agar hasil ujian dapat dibaca per cakupan materi.
- `BANK-FR-016` — Sistem harus menyelaraskan opsi alur kerja pembuatan paket pada Creation Studio (`/bank-soal/baru`) dengan memberikan opsi "Impor Naskah Massal (Word & Excel)" yang mengarahkan pengajar langsung ke panel tempel naskah massal (`?mode=bulk`) untuk naskah dokumen Word maupun tabel lembar kerja.

### Catatan kesenjangan yang ditutup revisi ini

Dua kebutuhan lama ternyata belum pernah terpasang di aplikasi, dan keduanya adalah sumber utama rasa lambat yang dilaporkan pengajar:

- Kebutuhan pada butir kedua menuntut opsi jawaban sampai lima, tetapi formulir hanya menyediakan empat opsi tetap tanpa tombol tambah atau kurang.
- Kriteria penerimaan pada butir ketiga menuntut pengajar dapat menyunting butir soal, tetapi tidak ada aksi sunting pada layar dan tidak ada jalur penyimpanan perubahan butir; koreksi satu huruf berarti menghapus lalu menulis ulang.
- Kebutuhan pada butir kedua juga menuntut teks pembahasan, tetapi kolomnya tidak pernah ada pada formulir maupun tempat tersimpannya, sehingga tidak satu pun butir memiliki pembahasan hingga revisi ini.

## Kriteria penerimaan

- `BANK-AC-001` — Saat butir soal pilihan ganda disimpan, sistem memvalidasi bahwa minimal ada 2 opsi terisi dan tepat satu opsi dipilih sebagai kunci jawaban.
- `BANK-AC-002` — Kunci jawaban pilihan ganda tersimpan di basis data terproteksi dan tidak diekspos ke antarmuka publik.
- `BANK-AC-003` — Pengajar dapat mengedit atau menghapus butir soal selama paket bank soal belum digunakan dalam sesi ujian yang sedang berjalan aktif.
- `BANK-AC-004` — Pada soal pilihan ganda kompleks, pengajar dapat menandai minimal 2 opsi sebagai kunci jawaban benar; pada soal benar/salah, pengajar dapat menentukan status pernyataan adalah benar atau salah.
- `BANK-AC-005` — Live preview memperbarui rendering teks pertanyaan, stimulus, dan opsi jawaban seketika pengajar mengetik di formulir.
- `BANK-AC-006` — Pada pratinjau impor, setiap butir hasil tafsiran ditampilkan dengan nomor, tipe soal, bobot, opsi jawaban beserta kunci, dan status kelayakan. Butir yang tidak terbaca diberi alasan yang jelas sehingga pengajar tahu bagian teks mana yang harus diperbaiki, dan tidak ada satu butir pun tersimpan sebelum pengajar menekan tombol simpan pada layar pratinjau.
- `BANK-AC-007` — Aturan penafsiran teks impor bersifat pasti dan didokumentasikan pada panduan layar: nomor awal baris menandai butir baru; baris opsi berhuruf menandai opsi jawaban; penanda kunci menandai jawaban benar; penanda tipe mengenali Pilihan Ganda, PG Kompleks, Benar/Salah, dan Essay dengan Pilihan Ganda sebagai tipe bawaan; blok wacana berlaku untuk butir-butir sesudahnya sampai blok wacana berikutnya; bobot memakai nilai bawaan layar impor bila tidak ditulis.
- `BANK-AC-008` — Nomor urut hasil impor melanjutkan nomor terakhir paket, jumlah butir yang akan disimpan dinyatakan sebelum konfirmasi, dan selama masih ada butir yang tidak valid pengajar harus memperbaiki teksnya atau menekan pilihan sadar untuk menyimpan hanya butir yang valid.
- `BANK-AC-009` — Impor massal hanya dapat menulis ke paket bank soal milik pengajar yang sedang masuk; permintaan ke paket milik pengajar lain ditolak oleh sistem.
- `BANK-AC-010` — Aksi sunting menyimpan perubahan butir soal tanpa mengubah nomor urut dan tanpa memindahkan butir ke paket lain, sementara aksi gandakan membuat salinan utuh di akhir daftar paket yang sama. Kedua aksi mengikuti pembatasan waktu sunting yang sudah ditetapkan pada kriteria penerimaan butir soal sebelumnya.
- `BANK-AC-011` — Pengajar dapat memilih jumlah opsi jawaban dua sampai lima (A sampai E) pada soal pilihan ganda, PG kompleks, dan pada formulir sunting butir soal.
- `BANK-AC-012` — Kode mata pelajaran bersifat unik; mata pelajaran yang masih dipakai oleh paket bank soal tidak dapat dihapus permanen dan hanya dapat dinonaktifkan. Mata pelajaran nonaktif tidak lagi ditawarkan pada pembuatan paket baru, tetapi nama dan label lamanya tetap terbaca pada paket yang sudah ada.
- `BANK-AC-013` — Pilihan jenjang pada paket bank soal terbatas pada kosakata lembaga resmi dan tidak menerima teks bebas, sehingga tingkat paket dapat dibandingkan dengan jenjang serta kelas santri hasil sinkronisasi.
- `BANK-AC-014` — Layar impor mengenali kedua bentuk tempelan tanpa pengajar harus memilih: bila baris pertama atau tiap baris memuat minimal dua kolom berpisahkan tab, pemetaan kolom lembar kerja dipakai; bila tidak, format teks bernomor dipakai. Tempelan campuran tidak ditolak seluruhnya; tiap baris yang tidak terbaca tetap muncul pada pratinjau beserta alasan yang menyebut baris ke berapa.
- `BANK-AC-015` — Template unduhan dapat ditempel kembali tanpa penyesuaian: nama kolomnya dikenali tanpa peduli besar-kecil huruf, baris judul boleh dikosongkan atau dihapus, baris kosong di antara data diabaikan, dan kolom tambahan di luar yang dikenal tidak menggagalkan impor melainkan dinyatakan diabaikan pada pratinjau.
- `BANK-AC-016` — Pembahasan butir hanya sampai ke perangkat pengajar atau admin: teks pembahasan tidak ikut terkirim ke browser santri sebelum santri mengumpulkan lembar ujian, dan tampil pada lembar koreksi pengajar untuk butir yang sama.
- `BANK-AC-017` — Penanda tingkat berpikir dan rujukan capaian bersifat opsional; butir yang belum pernah ditandai tetap terbaca dan ternilai normal, dan penanda dapat ditambahkan melalui sunting butir tanpa mengubah nomor urut, bobot, maupun skor yang sudah ada.
- `BANK-AC-018` — Pratinjau impor menampilkan pembahasan, tingkat berpikir, dan rujukan capaian untuk tiap butir yang kolomnya terisi; nilai yang tidak cocok dengan pilihan yang sah (misalnya tingkat berpikir di luar empat pilihan) muncul sebagai baris bermasalah beserta alasannya, bukan tersimpan sebagai label kosong.

## Edge cases

- Soal yang memuat teks Arab berharakat panjang atau tanda kutip kutipan ayat Al-Qur'an harus dirender secara akurat tanpa terpotong atau rusak enkodingnya, termasuk ketika teks tersebut tiba lewat tempelan dari dokumen.
- Upaya menghapus bank soal yang sedang terikat pada sesi ujian aktif harus ditolak oleh sistem dengan pemberitahuan yang jelas.
- Tempelan yang tidak memakai nomor sama sekali, memakai nomor yang melompat atau berulang, menulis kunci pada soal essay, atau memberi kunci lebih dari satu pada soal pilihan ganda biasa tidak boleh disimpan diam-diam; masing-masing muncul pada pratinjau beserta alasannya.
- Tempelan besar sampai dua ratus butir sekaligus tidak boleh membuat layar membeku atau menyimpan separuh daftar tanpa laporan; bila proses terhenti, pengajar mendapat tahu berapa butir yang sudah masuk sehingga tidak menulis ulang yang sudah tersimpan.
- Mata pelajaran yang dinonaktifkan masih dipakai oleh paket lama; memaksanya hilang dari daftar akan membuat paket dan sesi lama kehilangan labelnya.
- Dua pengajar menambah mata pelajaran dengan nama sama tetapi kode berbeda; sistem menerima selama kodenya unik dan tidak menggabungkan keduanya secara otomatis.
- Teks soal dari lembar kerja mengandung tab di tengah kalimat (biasanya hasil gabungan dua sel); baris tersebut tidak boleh pecah menjadi dua butir diam-diam, muncul pada pratinjau dengan alasan yang menyebut jumlah kolom yang ditemukan.
- Pembahasan berisi teks Arab berharakat atau potongan ayat tetap utuh saat lewat tempelan lembar kerja, dan tetap tidak terbaca oleh santri meski santri membuka kembali lembar yang sudah dikumpulkan.
- Rujukan capaian yang sudah dipakai banyak butir diganti namanya oleh pengajar lain; butir-butir lama ikut terbaca dengan nama baru karena label dikelola bersama per mata pelajaran, dan pengajar dapat melihat berapa butir yang memakai label itu sebelum menggantinya.
