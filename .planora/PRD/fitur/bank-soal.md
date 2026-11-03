# Manajemen Bank Soal

## Tujuan

Menyediakan sarana bagi pengajar (asatidzah) untuk menyusun, mengelola, dan mengelompokkan butir-butir soal ujian (pilihan ganda dan essay) berdasarkan mata pelajaran dan tingkat kelas secara terstruktur dan aman.

## User stories

- Sebagai Pengajar, saya ingin membuat paket bank soal per mata pelajaran agar kumpulan soal tersusun rapi untuk ujian semester.
- Sebagai Pengajar, saya ingin menambahkan butir soal pilihan ganda dengan 4 atau 5 opsi jawaban dan menandai satu kunci jawaban yang benar agar sistem dapat mengoreksi otomatis.
- Sebagai Pengajar, saya ingin menuliskan soal essay beserta panduan rubrik penilaian agar saya memiliki pedoman penilaian yang adil.

## Kebutuhan fungsional

- `BANK-FR-001` — Sistem harus menyediakan formulir pembuatan paket bank soal baru yang mencakup nama paket, mata pelajaran, tingkat kelas, dan alokasi bobot nilai.
- `BANK-FR-002` — Sistem harus mendukung input butir soal pilihan ganda dengan opsi jawaban A, B, C, D (dan opsional E), teks pembahasan, dan pemilihan kunci jawaban.
- `BANK-FR-003` — Sistem harus mendukung input butir soal essay dengan kolom teks soal, rubrik pedoman penilaian, dan batas nilai maksimal.
- `BANK-FR-004` — Sistem harus menyediakan pratinjau (preview) tampilan soal seperti yang akan dilihat oleh santri.
- `BANK-FR-005` — Sistem harus mendukung tipe soal Pilihan Ganda Kompleks (`pg_kompleks`) dengan multi-kunci jawaban benar dan tipe soal Benar/Salah (`true_false`) dengan kunci status benar atau salah.
- `BANK-FR-006` — Sistem harus mendukung konten stimulus pada butir soal berupa teks stimulus (wacana/bacaan) dan URL media/gambar stimulus opsional.
- `BANK-FR-007` — Sistem harus menyediakan panel Live Preview interaktif berdampingan (split-view) pada formulir input butir soal, menampilkan simulasi soal dan stimulus secara real-time seperti yang dilihat oleh santri.

## Kriteria penerimaan

- `BANK-AC-001` — Saat butir soal pilihan ganda disimpan, sistem memvalidasi bahwa minimal ada 2 opsi terisi dan tepat satu opsi dipilih sebagai kunci jawaban.
- `BANK-AC-002` — Kunci jawaban pilihan ganda tersimpan di basis data terproteksi dan tidak diekspos ke antarmuka publik.
- `BANK-AC-003` — Pengajar dapat mengedit atau menghapus butir soal selama paket bank soal belum digunakan dalam sesi ujian yang sedang berjalan aktif.
- `BANK-AC-004` — Pada soal pilihan ganda kompleks, pengajar dapat menandai minimal 2 opsi sebagai kunci jawaban benar; pada soal benar/salah, pengajar dapat menentukan status pernyataan adalah benar atau salah.
- `BANK-AC-005` — Live preview memperbarui rendering teks pertanyaan, stimulus, dan opsi jawaban seketika pengajar mengetik di formulir.

## Edge cases

- Soal yang memuat teks Arab berharakat panjang atau tanda kutip kutipan ayat Al-Qur'an harus dirender secara akurat tanpa terpotong atau rusak enkodingnya.
- Upaya menghapus bank soal yang sedang terikat pada sesi ujian aktif harus ditolak oleh sistem dengan pemberitahuan yang jelas.
