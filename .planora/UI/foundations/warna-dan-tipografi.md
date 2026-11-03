# Fondasi warna, tipografi, dan tata letak

## Palet Warna

- **Primary**: `oklch(0.511 0.096 186.391)` (Deep Teal / Pine Green) — digunakan untuk tombol utama, indikator aktif, dan aksen brand.
- **Primary Foreground**: `oklch(0.984 0.014 180.72)` (Putih sejuk).
- **Secondary**: `oklch(0.967 0.001 286.375)` (Abu-abu lembut untuk latar kartu sekunder).
- **Destructive**: `oklch(0.577 0.245 27.325)` (Merah peringatan untuk tombol batalkan atau keluar ujian).
- **Border / Divider**: Garis pembatas tipis yang tegas dan tidak mengganggu fokus baca.

## Tipografi

- Font Heading: `var(--font-heading)` (JetBrains Mono)
- Font Utama (Body): `var(--font-sans)` (Inter)
- Font Monospace (Timer & Token): `var(--font-mono)` (Geist Mono)

## Tata Letak & Spasi

- Grid sistem 12 kolom untuk dashboard manajemen pengajar.
- Layout terfokus 1 kolom dengan sidebar nomor soal untuk ruang ujian santri.
- Halaman monitoring pengajar memakai tabel penuh pada desktop dan kartu per peserta pada tablet agar satu layar tetap terbaca tanpa horizontal scroll.
