import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import { describe, it } from "node:test"
import { fileURLToPath } from "node:url"

const APPS_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const TECHNICAL_LEAK_REGEX = /\b(SCR-[A-Z0-9\-]+|[A-Z]{2,10}-(FR|AC|NFR)-\d+|TASK-\d+|Fase\s+\d+)\b/g

function read(relative: string): string {
  return fs.readFileSync(path.join(APPS_ROOT, relative), "utf-8")
}

describe("Pemisahan Fungsional Studio Pembuatan Bank Soal dan Direktori Asesmen", () => {
  it("halaman studio pembuatan bank soal baru (/bank-soal/baru) tersedia dan memuat elemen lengkap", () => {
    const filePath = path.join(APPS_ROOT, "app", "(main)", "bank-soal", "baru", "page.tsx")
    assert.ok(fs.existsSync(filePath), "app/(main)/bank-soal/baru/page.tsx harus ada")

    const content = fs.readFileSync(filePath, "utf-8")

    // Memuat judul dan identitas studio
    assert.ok(content.includes("Buat Paket Bank Soal Baru"), "Harus memuat judul pembuatan baru")
    assert.ok(content.includes("Creation Studio"), "Harus menampilkan badge studio")

    // Memuat template evaluasi madrasah (PH, PTS, PAS)
    assert.ok(content.includes("Penilaian Harian (PH)"), "Harus ada template Penilaian Harian")
    assert.ok(content.includes("Penilaian Tengah Semester (PTS)"), "Harus ada template PTS")
    assert.ok(content.includes("Penilaian Akhir Semester (PAS)"), "Harus ada template PAS")

    // Memuat alur kerja lanjutan (Studio Manual, Bantuan AI, Impor Massal)
    assert.ok(content.includes("Studio Penulisan Manual"), "Harus ada alur manual")
    assert.ok(content.includes("Bantuan AI Asisten"), "Harus ada alur asisten AI")
    assert.ok(content.includes("Impor Lembar Kerja Massal"), "Harus ada alur impor massal")

    // Memuat integrasi Convex dan model lembaga
    assert.ok(content.includes("api.bank.public.mutations.createQuestionBank"), "Harus memanggil mutasi createQuestionBank")
    assert.ok(content.includes("api.bank.public.queries.listSubjects"), "Harus mengambil daftar mata pelajaran")
    assert.ok(content.includes("INSTITUTION_LEVELS"), "Harus memuat pilihan tingkat lembaga")

    // Bebas kebocoran kode spesifikasi teknis
    const leaks = Array.from(content.matchAll(TECHNICAL_LEAK_REGEX)).map((m) => m[0])
    assert.deepStrictEqual(leaks, [], "Studio baru tidak boleh membocorkan kode teknis")
  })

  it("tombol CTA Buat Bank Soal di navigasi samping mengarah langsung ke studio /bank-soal/baru", () => {
    const navMainContent = read("components/nav-main.tsx")

    assert.ok(
      navMainContent.includes('href="/bank-soal/baru"'),
      "Tombol aksi Buat Bank Soal harus menautkan ke /bank-soal/baru"
    )
    assert.ok(
      navMainContent.includes('isCreationStudioActive'),
      "NavMain harus mengenali status aktif khusus studio pembuatan"
    )
  })

  it("halaman direktori bank soal (/bank-soal) menampilkan portofolio metrik dan tautan studio", () => {
    const listContent = read("app/(main)/bank-soal/page.tsx")

    // Tetap memenuhi kontrak pengujian sebelumnya
    assert.ok(listContent.includes("Bank Soal & Materi Ujian"))
    assert.ok(listContent.includes("Buat Paket Bank Soal"))
    assert.ok(listContent.includes("api.bank.public.queries.listQuestionBanks"))
    assert.ok(listContent.includes("api.bank.public.mutations.createQuestionBank"))

    // Memuat metrik portofolio asesmen
    assert.ok(listContent.includes("Total Paket"), "Harus ada metrik Total Paket")
    assert.ok(listContent.includes("Aktif di Sesi"), "Harus ada metrik Aktif di Sesi")
    assert.ok(listContent.includes("Draf / Mandiri"), "Harus ada metrik Draf / Mandiri")

    // Menautkan tombol aksi ke /bank-soal/baru
    assert.ok(
      listContent.includes('href="/bank-soal/baru"'),
      "Tombol pembuatan di direktori harus menautkan ke /bank-soal/baru"
    )

    // Bebas kebocoran kode spesifikasi teknis
    const leaks = Array.from(listContent.matchAll(TECHNICAL_LEAK_REGEX)).map((m) => m[0])
    assert.deepStrictEqual(leaks, [], "Halaman direktori tidak boleh membocorkan kode teknis")
  })
})
