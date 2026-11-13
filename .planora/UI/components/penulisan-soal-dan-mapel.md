# Spesifikasi komponen penulisan soal dan mata pelajaran

Komponen pada layar editor butir soal, pratinjau impor, dan kelola mata pelajaran. Semua memakai primitif yang sudah ada di pustaka komponen proyek; tidak ada komponen baru yang meniru perilaku primitif yang tersedia.

1. **Pemilih Mode Tulis (Segmented Tabs)**:
   - Dua pilihan: "Tulis satu per satu" dan "Tempel banyak sekaligus". Mode terakhir hanya mengubah kartu isian, tidak memindahkan rute.
2. **Kolom Tempel Teks**:
   - Textarea besar dengan tinggi minimal sepuluh baris, angka monospace pada penanda baris saat dibutuhkan, dan pendukung teks Arab tanpa menyaring tanda baca.
   - Pendampingnya: panel petunjuk format yang dapat dibuka tutup dan tombol "Salin contoh format".
3. **Pengatur Bobot Bawaan**:
   - Isian angka kecil di atas kolom tempel yang dipakai bila satu butir tidak menuliskan bobot sendiri.
4. **Tabel Pratinjau Impor**:
   - Baris per butir: nomor urut hasil tafsiran, tipe, bobot, cuplikan teks soal, cuplikan opsi beserta kunci, dan status.
   - Di layar kecil berubah menjadi kartu per butir dengan status paling atas.
5. **Penanda Status Butir**:
   - Label teks "Siap" untuk butir yang lolos pemeriksaan; "Perlu perbaikan" untuk yang bermasalah, disertai alasan satu kalimat yang menunjuk baris sumbernya.
   - Warna saja tidak cukup: label teks selalu ada, mengikuti pola badge pada layar monitoring.
6. **Ringkasan Hasil Periksa**:
   - Dua angka di atas tabel: berapa butir siap disimpan dan berapa yang bermasalah, dipakai sebagai dasar label tombol utama.
7. **Aksi Baris Butir Soal**:
   - "Sunting" mengisi ulang formulir satu-per-satu dengan isi butir dan memindahkan fokus ke judul kartu.
   - "Gandakan" membuat salinan di akhir daftar tanpa membuka formulir.
8. **Pemilih Jumlah Opsi**:
   - Tombol kecil tambah dan kurang opsi pada formulir soal, batas bawah dua dan batas atas lima (A sampai E).
9. **Pemilih Lembaga dan Jenjang Bertingkat**:
   - Dropdown lembaga resmi lebih dulu, lalu dropdown tingkat yang isinya bergantung lembaga; mengganti lembaga mengosongkan tingkat.
10. **Penanda Status Mata Pelajaran**:
    - Label teks "Aktif" atau "Nonaktif" pada daftar kelola mata pelajaran, disertai jumlah paket yang memakainya sebagai alasan bila hapus permanen tidak tersedia.
11. **Penanda Bentuk Tempelan**:
    - Keterangan satu baris di bawah kolom tempel yang menyatakan bentuk yang dikenali otomatis: "Teks bernomor" atau "Baris lembar kerja (12 kolom)". Ikut berubah saat pengajar menempel ulang, dan tidak pernah menjadi tombol yang harus dipilih.
12. **Tombol Unduh Template Kolom**:
    - Tombol ghost berikon unduh di samping "Salin contoh format". Menghasilkan berkas tabel berisi baris judul dan satu contoh butir; tidak membuka dialog tambahan.
13. **Kolom Pembahasan Pengajar**:
    - Textarea kecil pada formulir butir dengan keterangan "tidak dilihat santri". Isinya ikut pada pratinjau impor dan lembar koreksi, dan tidak pernah dirender pada simulasi tampilan santri di panel Live Preview.
14. **Pemilih Tingkat Berpikir**:
    - Dropdown empat pilihan bernama (mengingat, memahami, mengaplikasikan, menganalisis) dengan bawaan "Belum ditandai"; bukan kode angka dan bukan chip berhuruf besar.
15. **Isian Rujukan Capaian dengan Saran**:
    - Isian teks pendek yang menyarankan label milik mata pelajaran paket ini dari butir yang sudah ada; label baru tersimpan bersama butirnya dan tetap dapat digunakan pengajar lain pada mata pelajaran yang sama.
16. **Baris Metrik Analisis Butir**:
    - Baris tabel dengan angka berformat konsisten (persentase dua angka penting, daya beda tiga desimal), chip sebaran opsi berlabel huruf plus angka, dan kolom status berupa label teks. Pada layar kecil menjadi kartu dengan nomor butir sebagai judul.
17. **Penanda Perlu Ditinjau**:
    - Label teks disertai alasan singkat; warna amber atau destruktif hanya menambah bobot. Polanya sama dengan penanda status butir pada pratinjau impor.
18. **Panel Pratinjau Simulasi Siswa**:
    - Merender yang dilihat santri: wacana stimulus, teks soal, nomor, bobot, dan opsi dalam bentuk netral. Tidak ada penanda jawaban benar, label "(Kunci)", maupun pedoman rubrik di dalamnya; pemeriksaan kunci tetap pada formulir pengajar di kolom kiri.
