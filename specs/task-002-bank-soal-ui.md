# Specification: TASK-002 Bank Soal UI & Editor

## Problem & Desired Behavior
- **Problem**: Pengajar telah memiliki skema backend Convex untuk bank soal, tetapi belum memiliki antarmuka pengguna (UI) untuk membuat paket bank soal dan menginput butir soal pilihan ganda maupun essay.
- **Desired Behavior**:
  1. Halaman `/bank-soal` menampilkan daftar paket bank soal, tombol "+ Buat Paket Bank Soal", dan dialog pembuatan paket bank soal baru.
  2. Halaman `/bank-soal/[id]` menampilkan informasi paket bank soal, formulir input butir soal (pilihan ganda dengan kunci jawaban A/B/C/D atau essay dengan rubrik), serta daftar butir soal yang telah tersimpan.
  3. Navigasi sidebar diperbarui agar memiliki tautan langsung ke Bank Soal.

## Scope
- **In Scope**:
  - `apps/components/app-sidebar.tsx`: Perbarui daftar navigasi sidebar agar mencakup Bank Soal (`/bank-soal`).
  - `apps/app/(main)/bank-soal/page.tsx`: Halaman daftar bank soal & dialog pembuatan paket baru.
  - `apps/app/(main)/bank-soal/[id]/page.tsx`: Halaman detail paket & editor butir soal pilihan ganda dan essay.
  - `apps/tests/bank-soal-ui.test.ts`: Pengujian unit fungsional dan validasi bebas kebocoran kode spesifikasi teknis.
- **Out of Scope**:
  - Sesi pengerjaan santri (dikerjakan di TASK-005 dan TASK-006).
  - Penilaian hasil ujian (dikerjakan di TASK-007).

## Evidence & Relevant Files
- `apps/convex/schema.ts` & `apps/convex/bank/public/`: Backend queries dan mutasi yang telah live di cloud.
- `apps/components/ui/`: Komponen Shadcn UI (`button.tsx`, `card.tsx`, `dialog.tsx`, `input.tsx`, `badge.tsx`, `select.tsx`, dll.).

## Implementation Tasks (Dependency-Ordered)
1. Perbarui menu navigasi di `apps/components/app-sidebar.tsx` menuju `/bank-soal`.
2. Buat halaman daftar bank soal di `apps/app/(main)/bank-soal/page.tsx`.
3. Buat halaman editor butir soal di `apps/app/(main)/bank-soal/[id]/page.tsx`.
4. Buat unit test di `apps/tests/bank-soal-ui.test.ts`.
5. Jalankan validasi `npm --prefix apps run test`, `npx tsc --noEmit`, dan pemindaian kebocoran kode spesifikasi teknis.

## Measurable Acceptance Criteria
- Pengajar dapat melihat daftar paket bank soal secara realtime via query Convex.
- Pengajar dapat membuat paket bank soal baru dengan memilih mata pelajaran dan mengisi judul.
- Pengajar dapat menambahkan butir soal pilihan ganda dengan 4 opsi (A-D) dan memilih 1 kunci jawaban yang benar.
- Pengajar dapat menambahkan butir soal essay beserta pedoman rubrik penilaian.
- Bebas dari emoji, bebas dari kode spesifikasi teknis (`SCR-*`, `TASK-*`, `*-FR-*`).

## E2E Assessment
- **Recommendation**: Recommended.
- **Reason**: Fitur melibatkan antarmuka browser interaktif untuk pembuatan paket dan butir soal.
- **Handoff**: Disediakan spec di `specs/e2e/bank-soal-management.md`.

## Validation Commands
- `npm --prefix apps run test`
- `npx tsc --noEmit`
