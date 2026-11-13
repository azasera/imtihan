# Spesifikasi E2E: Adopsi Fitur Unggulan SoalPintar (Ekspor Naskah, Asisten AI, Peringatan Integritas)

- **Target Kebutuhan**: Adopsi fitur unggulan referensi SoalPintar ke dalam E-Imtihan At-Tauhid tanpa regresi.
- **Sumber Kebutuhan**: `specs/feat-adopsi-fitur-soalpintar.md`
- **Rekomendasi**: `Recommended`
- **Status**: `Pending`
- **Lingkungan**: Browser modern (Desktop Chrome/Firefox/Edge), Next.js local runtime (`http://localhost:3000`).

## Prasyarat
1. Server lokal aktif dan pengajar telah masuk (*authenticated*).
2. Terdapat setidaknya satu paket bank soal di menu `/bank-soal`.
3. Sesi ujian santri aktif untuk verifikasi ruang ujian santri (`/ujian`).

## Skenario Uji Peramban

### Skenario 1: Ekspor Naskah Cetak & Format Teks Google Form
1. Buka halaman detail bank soal (`/bank-soal/[id]`).
2. Verifikasi tombol "Ekspor & Cetak" tampil di bilah atas.
3. Klik tombol "Ekspor & Cetak".
4. Verifikasi modal dialog terbuka dengan dua tab: "Naskah Cetak (Fisik)" dan "Format Google Form".
5. Pada tab "Naskah Cetak", centang opsi "Sertakan lembar Kunci Jawaban" dan klik "Buka Tampilan Cetak".
6. Verifikasi jendela pratinjau cetak terbuka dengan tata letak resmi kop madrasah dan tabel kunci jawaban di bagian bawah.
7. Beralih ke tab "Format Google Form", verifikasi teks terstruktur naskah soal tampil rapi di area teks.
8. Klik "Salin Format Teks", verifikasi notifikasi toast berhasil menyalin ke papan klip.

### Skenario 2: Asisten Penyusun Soal AI
1. Pada halaman detail bank soal (`/bank-soal/[id]`), klik tombol "Asisten AI".
2. Verifikasi dialog Asisten Penyusun Soal AI terbuka.
3. Masukkan topik: "Thaharah Wudhu dan Tayamum".
4. Pilih bentuk soal "Pilihan Ganda" dan tingkat kognitif "Campuran (LOTS & HOTS)".
5. Klik "Susun Draf Otomatis".
6. Verifikasi draf naskah tersusun di kotak pratinjau draf tanpa galat penafsiran.
7. Klik tombol "Salin Prompt untuk Gemini / ChatGPT", verifikasi toast konfirmasi penyalinan prompt.
8. Klik "Terapkan ke Impor Soal", verifikasi tampilan beralih ke mode tempel naskah massal dan dapat diperiksa.

### Skenario 3: Peringatan Audio Integritas di Lembar Ujian Santri
1. Buka sesi ujian santri dengan NISN dan token sesi yang valid (`/ujian`).
2. Masuk ke ruang pengerjaan lembar soal (`ExamWorksheet`).
3. Buka tab baru di peramban atau minimalkan jendela untuk memicu perpindahan fokus layar (`document.hidden` / `blur`).
4. Kembali ke tab ujian santri.
5. Verifikasi modal dialog peringatan pelanggaran integritas layar terbuka dan sistem memicu Web Audio synthesizer nada peringatan (*chime/beep*) tanpa galat di konsol.

## Bukti Pengujian
*(Bagian ini akan diisi setelah eksekusi pengujian peramban oleh `/e2e-tester`)*
