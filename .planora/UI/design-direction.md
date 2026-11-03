# Arah desain

## Filosofi Desain

Desain E-Imtihan At-Tauhid mengusung prinsip **Tenang, Bersih, Berwibawa, dan Bebas Distraksi**. Karena platform ini digunakan untuk asesmen santri, antarmuka tidak boleh membingungkan atau membebani visual santri yang sedang berkonsentrasi.

## Karakter Visual

1. **Warna Dominan (Islamic Pine / Emerald Teal)**:
   - Warna aksen utama menggunakan hijau zamrud dalam yang memberikan kesan sejuk, bernuansa edukasi Islam terstandar, dan berwibawa.
   - Dipadukan dengan latar netral bersih (putih bersih pada tema terang, dan dark slate pada tema gelap).
2. **Tipografi Berjenjang**:
   - Judul & Heading: Menggunakan font dengan ketegasan struktural (JetBrains Mono / Heading Sans).
   - Teks Bacaan Soal: Menggunakan font sans-serif berdaya baca tinggi (Inter) dengan ukuran font nyaman dibaca santri.
   - Angka & Timer: Menggunakan font mono (Geist Mono) agar digit timer detik tidak bergeser saat berjalan.
3. **Komponen Antarmuka**:
   - Seluruh komponen dibangun berbasis Shadcn UI dengan radius terstandar (0.625rem).
   - Menggunakan ikon Lucide yang intuitif dan profesional tanpa menggunakan emoji.
4. **Tata Letak 3-Panel Asesmen (AKM/ANBK Style)**:
   - Panel Stimulus (kiri): background netral halus (`bg-muted/30`), border pemisah jelas, scrollbar independen, nyaman untuk membaca teks wacana panjang atau grafik.
   - Panel Lembar Soal (tengah): fokus utama dengan kontras tinggi, opsi kartu pilihan ganda interaktif dengan efek hover dan selected ring aksen hijau zamrud/biru, tombol navigasi konsisten.
   - Panel Penjelajah Nomor (kanan): grid nomor soal padat dengan indikator status warna: abu-abu (belum dijawab), hijau/biru (terjawab), kuning (ragu-ragu), ring aksen (soal aktif).
5. **Indikator & Dialog Integritas Ujian**:
   - Dialog peringatan pelanggaran tab menggunakan modal kontras tinggi bernuansa amber/rose peringatan tanpa mengacaukan sesi pengerjaan.
   - Badge pelanggaran tab di tabel rekap pengajar diberi kode warna berjenjang (0: abu-abu/hijau aman, 1-2: amber waspada, 3+: rose/merah peringatan tinggi).
