# Spesifikasi: Filter Interaktif Melalui Kartu Ringkasan Santri (SMPITA, SMAITA, MTA)

## 1. Definisi Masalah & Perilaku yang Diharapkan
- **Masalah**:
  Pada halaman Manajemen Santri (`apps/app/(main)/santri/page.tsx`), terdapat 4 kartu metrik statistik di bagian atas layar:
  1. *Total Santri Aktif*
  2. *SMPITA*
  3. *SMAITA*
  4. *MTA (Tahfidz)*
  Saat ini, kartu-kartu ini bersifat statis (tidak memiliki interaktivitas, handler klik, status fokus, maupun indikator kartu aktif). Pengguna harus menggulir atau beralih ke kontrol Tab di bawahnya untuk memfilter data santri berdasarkan jenjang lembaga. Pengguna mengharapkan kartu-kartu metrik tersebut dapat langsung diklik sebagai filter interaktif: data santri di tabel langsung tersaring sesuai kartu yang dipilih.

- **Perilaku yang Diharapkan**:
  1. **Kartu Ringkasan Interaktif Sebagai Filter Cepat**:
     - Mengklik kartu **Total Santri Aktif** mengatur filter jenjang ke `"ALL"` (menampilkan semua santri).
     - Mengklik kartu **SMPITA** menyaring tabel untuk hanya menampilkan santri jenjang SMPITA. Mengklik kartu yang sama saat sedang aktif akan mengembalikan filter ke `"ALL"` (toggle filter).
     - Mengklik kartu **SMAITA** menyaring tabel untuk hanya menampilkan santri jenjang SMAITA (dengan toggle kembali ke `"ALL"` jika diklik ulang).
     - Mengklik kartu **MTA (Tahfidz)** menyaring tabel untuk hanya menampilkan santri jenjang MTA (dengan toggle kembali ke `"ALL"` jika diklik ulang).
  2. **Indikator Visual Status Aktif & Interaksi**:
     - Kartu memiliki kursor penunjuk (`cursor-pointer`), efek elevasi/transisi lembut saat disentuh (`hover:shadow-md hover:-translate-y-0.5`).
     - Kartu yang aktif memiliki aksen visual jelas: ring/border berwarna sesuai tema jenjang (emerald untuk SMPITA & Total, blue untuk SMAITA, purple untuk MTA), latar belakang dengan sentuhan aksen warna, serta badge aktif yang kontras.
     - Terdapat indikator status filter aktif yang intuitif pada kartu yang sedang dipilih.
  3. **Aksesibilitas & Navigasi Keyboard**:
     - Atribut aksesibilitas semantik (`role="button"`, `tabIndex={0}`, `aria-pressed`, `aria-label`).
     - Dukungan penuh navigasi keyboard (`Enter` atau `Space` untuk mengaktifkan filter kartu).
     - Fokus keyboard terlihat jelas (`focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring`).
  4. **Sinkronisasi Dua Arah (*Bi-directional Sync*)**:
     - Sinkronisasi instan antara kartu ringkasan dan bilah Tabs jenjang di bawahnya. Mengubah tab otomatis memperbarui kartu aktif, dan mengklik kartu otomatis memperbarui tab aktif.
  5. **Nihil Kebocoran Spesifikasi Teknis & Nihil Emoji**:
     - Sesuai panduan repositori, tidak ada kode internal (`SCR-*`, `*-FR-*`, dll.) dan tidak menggunakan emoji (menggunakan ikon Lucide).

## 2. In / Out of Scope
- **In-Scope**:
  - `apps/app/(main)/santri/page.tsx`: Penambahan interaktivitas pada 4 kartu ringkasan santri, penanganan event klik/keyboard, styling status aktif dan hover, sinkronisasi dua arah dengan `selectedJenjang`.
  - `apps/tests/student-interactive-filter.test.ts`: Pembuatan pengujian unit untuk memvalidasi fungsi filter kartu ringkasan, keyboard accessibility, penanda aktif, dan zero technical leaks.
  - `specs/e2e/santri-interactive-filter-cards.md`: Spesifikasi E2E handoff sesuai kebijakan repositori.
- **Out-of-Scope**:
  - Mengubah query backend Convex `api.students.public.queries.getStudents` atau `getStudentStats` karena backend sudah mendukung parameter `jenjang: "ALL" | "SMPITA" | "SMAITA" | "MTA"`.
  - Mengubah skema database santri.

## 3. Bukti & Berkas Terkait
- Screenshot dari pengguna yang menampilkan 4 kartu ringkasan santri (*Total Santri Aktif*, *SMPITA*, *SMAITA*, *MTA (Tahfidz)*).
- Berkas terkait:
  - `apps/app/(main)/santri/page.tsx`
  - `apps/tests/student-sync.test.ts`
  - `apps/tests/student-interactive-filter.test.ts` (baru)
  - `specs/e2e/santri-interactive-filter-cards.md` (baru)

## 4. Kebutuhan Implementasi Terurut Dependensi
1. **Langkah 1**: Perbarui `apps/app/(main)/santri/page.tsx`:
   - Buat fungsi penangan klik kartu `handleJenjangFilter(target: "ALL" | "SMPITA" | "SMAITA" | "MTA")` dengan perilaku toggle cerdas (jika target jenjang sama dengan yang aktif dan bukan "ALL", toggle ke "ALL").
   - Tambahkan props interaktivitas pada kartu: `role="button"`, `tabIndex={0}`, `aria-pressed`, `aria-label`, `onKeyDown`, dan `onClick`.
   - Perbarui kelas Tailwind kartu agar menampilkan style hover, focus-visible, dan kelas aktif (`ring-2 ring-... border-... bg-...`).
   - Berikan badge status aktif atau highlight pada badge jenjang ketika kartu bersangkutan sedang terpilih.
2. **Langkah 2**: Buat pengujian unit di `apps/tests/student-interactive-filter.test.ts` untuk memverifikasi struktur kartu, properti interaktif, sinkronisasi jenjang, dan nihil kebocoran teknis.
3. **Langkah 3**: Buat spesifikasi E2E di `specs/e2e/santri-interactive-filter-cards.md`.
4. **Langkah 4**: Jalankan validasi:
   - `node --test apps/tests/student-interactive-filter.test.ts`
   - `npm test --prefix apps`
   - `npm run typecheck --prefix apps`
   - `npm --prefix apps run test:ui-leak`

## 5. Kriteria Penerimaan yang Terukur
1. Kartu Total Santri Aktif dapat diklik dan menyaring tabel untuk menampilkan semua santri (`jenjang: "ALL"`).
2. Kartu SMPITA dapat diklik dan menyaring tabel untuk menampilkan santri SMPITA (`jenjang: "SMPITA"`).
3. Kartu SMAITA dapat diklik dan menyaring tabel untuk menampilkan santri SMAITA (`jenjang: "SMAITA"`).
4. Kartu MTA (Tahfidz) dapat diklik dan menyaring tabel untuk menampilkan santri MTA (`jenjang: "MTA"`).
5. Kartu yang sedang aktif menampilkan ring dan aksen visual yang tegas dan sesuai jenjang.
6. Tabs filter di bawah kartu tetap tersinkronisasi dua arah secara mulus.
7. Kartu dapat dioperasikan menggunakan keyboard (`Enter` dan `Space`) dengan fokus visual yang jelas.
8. TypeScript check (`tsc --noEmit`) lolos tanpa error.
9. Rangkaian tes unit lolos 100%.
10. Nihil emoji dan nihil kebocoran kode spesifikasi teknis (`SCR-*`, dll.).

## 6. Pertimbangan Risiko & Kompatibilitas
- Kompatibilitas mundur terjaga penuh karena `selectedJenjang` state yang ada tetap digunakan sebagai *single source of truth*.
- Tidak ada breaking changes pada query atau API Convex.
- Aksesibilitas screen reader ditingkatkan dengan `role="button"`, `aria-pressed`, dan label yang jelas.

## 7. Perintah Validasi Repositori
- `node --test apps/tests/student-interactive-filter.test.ts`
- `node --test apps/tests/student-sync.test.ts`
- `cd apps && npm run typecheck`
- `npm --prefix apps run test:ui-leak`
