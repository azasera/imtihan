# Spesifikasi E2E: Editor Narasi Capaian Kompetensi Hybrid

## Klasifikasi E2E: Recommended

## Skenario Utama: Penyuntingan Narasi di Tabel dan via Modal Lega
1. **Navigasi ke Lembar Nilai**:
   - Pengguna membuka menu `/rapor` $\rightarrow$ memilih kelas dan mata pelajaran.
   - Buka tab "Nilai Pelajaran".
2. **Penyuntingan Langsung di Tabel (Multi-baris)**:
   - Kolom "Narasi Capaian Kompetensi" menampilkan textarea multi-baris.
   - Kalimat narasi terlihat lengkap tanpa terpotong.
   - Guru dapat mengetik atau mengedit langsung pada textarea tersebut.
3. **Membuka Dialog Editor Lega**:
   - Klik tombol ikon "Perbesar" (`Maximize2Icon`) pada baris santri.
   - Modal "Sunting Narasi Capaian Kompetensi" terbuka dengan judul Nama Santri dan Predikat.
   - Textarea besar menampilkan teks narasi santri saat ini.
4. **Navigasi Santri di Dalam Modal**:
   - Klik tombol "Santri Selanjutnya" $\rightarrow$ modal berganti menampilkan narasi santri berikutnya.
   - Klik tombol "Santri Sebelumnya" $\rightarrow$ modal kembali ke santri sebelumnya.
5. **Template & Salin ke Predikat Sama**:
   - Memilih template cepat (misal "Sangat baik dalam...") $\rightarrow$ teks otomatis terisi.
   - Mengklik tombol "Terapkan ke Santri Berpredikat Sama" $\rightarrow$ narasi tersalin ke santri lain dengan predikat setara di kelas tersebut.
6. **Simpan Perubahan**:
   - Klik tombol "Simpan Narasi" pada modal $\rightarrow$ modal tertutup dan nilai narasi di tabel terbarui.
   - Klik tombol utama "Simpan Perubahan" $\rightarrow$ seluruh perubahan tersimpan permanen ke basis data.
