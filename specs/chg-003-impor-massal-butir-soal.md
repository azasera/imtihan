# CHG-003 — Impor massal butir soal dari tempelan teks dengan pratinjau

## Deskripsi fitur

Pengajar menempelkan naskah soal berformat teks bernomor pada editor paket (`/bank-soal/[id]`), sistem menafsirkan seluruh naskah di perangkat pengajar, menampilkan pratinjau per butir beserta status dan alasan, lalu menyimpan hanya setelah pengajar menekan tombol simpan yang menyebut jumlah butir.

**Cerita pengguna**: sebagai pengajar yang sudah punya naskah puluhan butir, saya ingin menempelkannya sekaligus dan meninjau hasil tafsiran sebelum masuk ke paket, supaya saya tidak perlu mengetik ulang butir demi butir dan tidak menyimpan kunci jawaban yang salah tafsir.

## Requirements

- Sumber: `.planora/EXECUTION/TODO.md` `CHG-003`; PRD `BANK-FR-008`; kriteria penerimaan `BANK-AC-006`, `BANK-AC-007`, `BANK-AC-008`, `BANK-AC-009`; kinerja `NFR-PERF-004`; kontrak UI `UI/screens/penulisan-soal-cepat.md`, `UI/patterns/penulisan-soal-massal.md`, `UI/components/penulisan-soal-dan-mapel.md` butir 1-6.
- Kriteria penerimaan (verbatim dari TODO): penafsir mengubah naskah berpuluh butir menjadi daftar hasil tafsiran dengan tipe, bobot, opsi, kunci, dan status per butir; teks tidak terbaca memuat alasan yang menunjuk baris sumber; tidak ada butir tersimpan sebelum konfirmasi; nomor urut melanjutkan butir terakhir; impor hanya berjalan pada paket milik pengajar yang masuk; penyimpanan bertahap melaporkan berapa butir yang sudah masuk saat sebagian gagal; 200 butir sekaligus tetap responsif; teks Arab berharakat lolos tanpa rusak.
- **Di luar cakupan**: bentuk tempelan baris lembar kerja dan unduhan template kolom (`CHG-006`); kolom pembahasan, tingkat berpikir, dan rujukan capaian (`CHG-005`); analisis mutu butir (`CHG-010`); unggah berkas (ditegaskan tidak ada oleh pola `Pola lembar kerja tetap jadi ruang kerja`); sunting per baris pada pratinjau — spesifikasi menyatakan perbaikan dilakukan dengan menyunting teks tempelan.

## Bukti / keadaan saat ini

- `createQuestion` sudah menvalidasi satu body butir (`apps/convex/bank/public/mutations.ts:53`); tidak ada jalur tulis massal.
- `nextOrderNumber` (`apps/convex/bank/private/helpers.ts:84`) mengumpulkan seluruh butir paket untuk mencari nomor terbesar — tidak memadai untuk tempelan 200 butir.
- Tidak ada penafsir teks sama sekali; editor hanya punya formulir satu-per-satu (`apps/app/(main)/bank-soal/[id]/page.tsx:312`).
- Gerbang otorisasi dan kepemilikan paket sudah teruji (`requireOwnedBank`, probe CLI 2026-11-04).

## Berkas terkait

- `apps/lib/question-import.ts` (baru): penafsir murni + validasi + contoh format; tanpa JSX, dapat diuji dengan `node --test`.
- `apps/convex/bank/private/helpers.ts`: `nextOrderNumber` memakai indeks `by_bank_and_order` urutan turun (baca satu dokumen, bukan seluruh paket).
- `apps/convex/bank/public/mutations.ts`: mutasi publik `importQuestions` (pemilik saja, validasi seluruh tahap sebelum tulis, nomor urut dihitung sekali per tahap).
- `apps/components/bank-soal/question-import-panel.tsx` (baru): kolom tempelan, pengatur bobot bawaan, panel petunjuk format, tombol "Salin contoh format", tombol "Periksa tulisan", penyimpanan bertahap, laporan sisa.
- `apps/components/bank-soal/question-import-preview.tsx` (baru): ringkasan hasil periksa, tabel pratinjau per butir (kartu pada layar kecil), penanda status teks, tombol simpan berhitung + tombol simpan-sebagian yang sadar.
- `apps/app/(main)/bank-soal/[id]/page.tsx`: tab pemilih mode tulis pada kartu, menyematkan panel, ajakan mode tempel pada daftar kosong.
- `apps/tests/question-import.test.ts` (baru): unit penafsir, penjaga sumber backend/UI, pemeriksaan kebocoran kode spesifikasi.

## Urutan implementasi

1. **Penafsir** — aturan persis seperti spesifikasi layar: baris kosong memisahkan butir; baris diawali angka + titik membuka butir baru (angkanya hanya penanda); tanpa penanda tipe berarti Pilihan Ganda; opsi `A.` sampai `E.`; kunci tanda `*` di akhir teks opsi; penanda tipe `(pg kompleks)`, `(benar/salah)`, `(essay)`; baris `B`/`S` sendiri sebagai kunci benar/salah; `rubrik:` untuk essay; `poin:` untuk bobot, selain itu bobot bawaan layar; blok `WACANA:` berlaku untuk butir sesudahnya sampai blok berikutnya atau akhir tempelan. Setiap butir menyimpan nomor baris sumbernya; normalisasi hanya menyamakan akhir baris Windows dan memangkas spasi tepi, tanpa menyaring karakter non-ASCII agar harakat utuh.
2. **Backend** — `importQuestions({ bankId, items })`: autentikasi, `requireOwnedBank`, batas 200 butir per panggilan, validasi seluruh item dengan pesan berposisi ("Butir ke-N pada tahap ini: …"), lalu tulis berurutan mulai `nextOrderNumber` dan mengembalikan jumlah plus rentang nomor urut. Ubah `nextOrderNumber` menjadi `.order("desc").first()`.
3. **Komponen pratinjau** — row per butir: nomor tafsiran, tipe, bobot, ringkasan teks, ringkasan opsi + kunci, wacana, status "Siap"/"Perlu perbaikan" + alasan; ringkasan di atasnya; tabel berubah jadi kartu di bawah `md` (pola layar kecil yang sama dipakai halaman monitoring).
4. **Komponen panel** — status `phase` input/preview; `Periksa tulisan` menafsirkan di klik handler (tanpa `setState` dalam efek); simpan berjalan per tahap 25 butir dan berhenti pada kegagalan tahap dengan laporan "N butir sudah masuk" + daftar sisa; tombol utama nonaktif bila kolom kosong atau semua baris bermasalah.
5. **Integrasi layar** — dua tab mode pada kartu tambah; saat butir dibuka untuk disunting, layar tetap memakai formulir satu-per-satu; setelah simpan, kolom tempelan dikosongkan, layar berpindah ke daftar, dan daftar terisi tanpa muat ulang (query Convex reaktif).
6. **Tes** — unit happy path 4 tipe, wacana bertahan lintas butir, `poin:`/`rubrik:`, kunci `*` multi, huruf melebihi E, opsi tanpa teks, butir tanpa kunci, baris yatim, tempelan kosong, tempelan 200 butir (jumlah + batas waktu), teks Arab berharakat; penjaga sumber (penafsir dijalankan sebelum panggilan server, tombol menyebut jumlah, alasan menyebut nomor baris, status memakai label teks); probe runtime CLI untuk gerbang pemilik/asing/anonim.

## Risiko

- Teks lanjutan multi-baris bisa salah tafsir; mitigasi: aturan lanjutan didokumentasikan apa adanya di panel petunjuk dan tiap baris punya alasan yang menunjuk sumbernya, jadi tidak ada penyimpanan diam-diam.
- Tempelan berpisahkan tab (bekal Excel) tidak dipetakan pada tahap ini; mitigasi: keterangan satu baris menyarankan bentuk teks bernomor, dan tiap baris tetap muncul dengan alasan, bukan penolakan seluruh isi.
- mutation 200 butir sekali jalan bisa menyentuh batas transaksi; mitigasi: penyimpanan bertahap 25 butir per panggilan sejak sisi klien.

## Kriteria penerimaan terukur

- Menempel naskah 12 butir bercampur 4 tipe → pratinjau 12 baris, tiap baris menampilkan tipe, bobot, opsi + kunci, dan status; nol panggilan server sebelum tombol simpan ditekan.
- Baris bermasalah → label teks "Perlu perbaikan" + alasan yang menyebut "baris ke-N"; tombol utama menolak jalan otomatis; tombol sekunder menyebut jumlah yang siap.
- Setelah simpan → nomor urut butir baru melanjutkan nomor terakhir paket (dibuktikan lewat probe CLI) dan halaman tidak memuat ulang.
- `importQuestions` anonim → ditolak; pengajar lain → ditolak; pemilik → berhasil.
- Tempelan 200 butir → penafsiran selesai dan layar tetap merespons (tes unit membatasi waktu).
- Harakat (`-ِ-ْ ۚ`) keluar identik dengan masukan.

## Perintah validasi

- `npx convex dev --once`: `importQuestions` terdeploi dan kodegen cocok.
- `npm test`: unit penafsir + penjaga sumber + kebocoran UI lulus.
- `npm run typecheck && npm run build`: kompilasi bersih, rute `/bank-soal/[id]` tetap terbentuk.
- `npm run lint`: tidak menambah error dari baseline 0 error.
- `npx convex run 'bank/public/mutations:importQuestions' …` tanpa dan dengan `--identity`: membuktikan gerbang dua arah dan penomoran melanjutkan nomor terakhir.

## Penilaian E2E

- Rekomendasi: `Required` — ini journeys utama baru (menempel → pratinjau → simpan sebagian/seluruh) dengan transisi state tulis pada data ujian; butuh bukti browser.
- Eksekusi: ditangguhkan ke `/e2e-tester` (otomatisasi browser pada sesi ini ditolak classifier); spesifikasi dibuat di `specs/e2e/question-import-massal.md`.
