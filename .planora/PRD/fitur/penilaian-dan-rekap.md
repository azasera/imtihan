# Penilaian dan Rekap Nilai

## Tujuan

Mempercepat proses pengolahan hasil ujian santri melalui koreksi otomatis butir pilihan ganda, antarmuka periksa cepat untuk soal essay, lembar rekapitulasi nilai yang rapi dan mudah diunduh, serta analisis mutu butir soal dan capaian per santri yang menjelaskan apa yang perlu diajarkan ulang.

## User stories

- Sebagai Pengajar, saya ingin nilai soal pilihan ganda dihitung secara otomatis seketika santri mengumpulkan ujian agar saya tidak perlu mengoreksi manual satu per satu.
- Sebagai Pengajar, saya ingin membuka lembar periksa essay santri dan memberikan skor nilai per butir soal dengan cepat.
- Sebagai Panitia/Admin, saya ingin mengunduh rekapitulasi daftar nilai seluruh santri dalam satu kelas untuk dicetak atau dilaporkan kepada pimpinan pesantren.
- Sebagai Pengajar, saya ingin melihat mutu tiap butir soal setelah ujian selesai — berapa banyak santri yang menjawab benar, apakah butir itu memisahkan santri yang paham dari yang belum, dan apakah pengecohnya masih berfungsi — supaya saya tahu soal mana yang harus diperbaiki sebelum dipakai lagi.
- Sebagai Pengajar, saya ingin daftar santri mana yang perlu remedial dan mana yang perlu pengayaan beserta nomor butir yang mereka salahjawabkan, karena nilai tunggal tidak menjelaskan apa yang harus diajarkan ulang.

## Kebutuhan fungsional

- `NILAI-FR-001` — Sistem harus secara instan menghitung skor nilai pilihan ganda berdasarkan kunci jawaban dan bobot masing-masing butir soal.
- `NILAI-FR-002` — Sistem harus menyediakan antarmuka khusus koreksi essay bagi pengajar untuk memasukkan skor penilaian dan catatan evaluasi.
- `NILAI-FR-003` — Sistem harus menghitung akumulasi skor total akhir santri (Pilihan Ganda + Essay) secara otomatis.
- `NILAI-FR-004` — Sistem harus menyediakan tabel rekap nilai kelas lengkap dengan statistik nilai tertinggi, terendah, dan rata-rata kelas.
- `NILAI-FR-005` — Sistem harus menghitung skor otomatis untuk butir soal Pilihan Ganda Kompleks dan Benar/Salah secara instan di backend seketika santri mengumpulkan ujian.
- `NILAI-FR-006` — Sistem harus mencatat dan menampilkan metrik pelanggaran tab (tab violations) pada tabel rekapitulasi nilai kelas, serta menyertakannya dalam ekspor laporan rekapitulasi.
- `NILAI-FR-007` — Sistem harus menyusun analisis mutu butir soal untuk satu sesi ujian yang telah dinilai, terdiri atas daya serap butir (rata-rata perolehan skor butir terhadap bobotnya), tingkat kesukaran (mudah, sedang, atau sulit) yang diturunkan dari daya serap, daya beda (seberapa jauh butir memisahkan kelompok santri berperolehan tinggi dari kelompok berperolehan rendah), dan sebaran pilihan jawaban tiap opsi termasuk sumbangan pengecoh pada butir pilihan ganda. Rumus dan ambang bakunya dibakukan pada desain teknis dan dapat dibaca pengajar pada keterangan layar.
- `NILAI-FR-008` — Sistem harus menampilkan laporan analisis butir per sesi pada layar khusus, berisi ringkasan hasil kelas (rata-rata, nilai tertinggi dan terendah, jumlah peserta tuntas terhadap batas tuntas sesi), tabel mutu tiap butir dengan penanda butir yang perlu ditinjau beserta alasannya, sebaran capaian menurut tingkat berpikir dan rujukan capaian materi, serta jalur unduhan tabel dan pencetakan.
- `NILAI-FR-009` — Sistem harus menandai capaian tiap santri terhadap batas nilai tuntas sesi pada tabel rekap dan ekspor, menyediakan daftar kelompok remedial (belum tuntas) dan pengayaan (tuntas dengan perolehan terbaik) beserta nomor butir yang banyak salah untuk tiap santri, serta membatasi nilai akhir sesi berjenis remedial agar tidak melampaui batas tuntas kecuali pengajar mematikan pembatasan tersebut.

## Kriteria penerimaan

- `NILAI-AC-001` — Skor pilihan ganda santri langsung tampil di dashboard pengajar dalam waktu maksimal 2 detik setelah santri melakukan submit ujian.
- `NILAI-AC-002` — Nilai akhir santri diperbarui secara otomatis setelah pengajar selesai mengisi skor nilai butir essay.
- `NILAI-AC-003` — Data rekap nilai dapat diekspor ke format tabel CSV/Excel yang rapi dan siap cetak.
- `NILAI-AC-004` — Skor butir soal PG Kompleks dan Benar/Salah langsung terakumulasi ke dalam total skor santri tanpa memerlukan intervensi koreksi manual.
- `NILAI-AC-005` — Kolom rekapitulasi ujian menampilkan jumlah pelanggaran tab dengan badge visual agar pengajar/pengawas dapat segera mengidentifikasi indikasi kecurangan.
- `NILAI-AC-006` — Daya serap, tingkat kesukaran, daya beda, dan sebaran pilihan dihitung di sisi server dari lembar jawaban dan kunci jawaban yang tersimpan, hanya dapat dibaca pengajar pemilik sesi dan admin, serta tidak pernah terkirim ke perangkat santri.
- `NILAI-AC-007` — Metrik butir hanya ditampilkan bila jumlah peserta yang telah dinilai pada sesi itu mencapai ambang minimal yang berlaku; di bawah ambang itu, layar menyatakan datanya belum cukup beserta jumlah peserta yang sudah dinilai, tanpa menampilkan angka yang menyesatkan dan tanpa menyebabkan pembagian dengan nol.
- `NILAI-AC-008` — Butir yang masuk kategori perlu ditinjau diberi label teks beserta alasan yang jelas (daya serap sangat rendah, daya beda negatif atau nol, atau pengecoh yang tidak pernah dipilih), dan informasi ini tidak boleh hanya disampaikan lewat warna.
- `NILAI-AC-009` — Penanda tuntas atau belum tuntas dihitung dari batas nilai tuntas sesi; sesi tanpa batas tuntas menampilkan nilai tanpa penanda apa pun, dan angka rekap tidak berubah karena adanya pengisian batas tuntas.
- `NILAI-AC-010` — Nilai akhir pada sesi berjenis remedial dipotong sampai batas tuntas ketika melampauinya, pembatasan itu dapat dimatikan pengajar, dan jenis sesi terlihat pada baris rekap maupun hasil ekspor sehingga nilai remedial tidak tertukar dengan nilai ujian reguler.
- `NILAI-AC-011` — Daftar kelompok remedial dan pengayaan menyebut nomor butir yang salah atau kurang lengkap per santri, dan tiap nomor butir dapat dibuka menuju lembar koreksi butir tersebut pada sesi yang sama.

## Edge cases

- Santri yang tidak menjawab satu pun soal pilihan ganda mendapatkan skor 0 untuk bagian pilihan ganda secara valid tanpa menyebabkan pembagian dengan nol.
- Sesi yang seluruh soalnya essay tidak memiliki sebaran pilihan maupun pengecoh; bagian analisis itu tidak ditampilkan alih-alih menampilkan tabel kosong.
- Butir yang dijawab benar semua santri atau salah semua santri tidak menghasilkan daya beda; butir itu ditandai perlu ditinjau dengan alasan yang menyebut daya pembedanya tidak terdefinisi.
- Butir PG kompleks dinilai sebagian per opsi, sehingga daya serapnya berada di antara 0 dan 1; perhitungan tetap memakai perolehan skor butir, bukan hanya benar-salah mutlak.
- Sesi remedial yang dibuat dari sesi yang nilainya masih menunggu koreksi essay belum dapat dimasukkan ke laporan analisis sampai penilaiannya selesai.
