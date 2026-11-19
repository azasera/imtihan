import { describe, it } from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const APPS_ROOT = path.resolve(__dirname, "..")

describe("Pengisian dan Tampilan Catatan Kokurikuler Rapor", () => {
  it("memverifikasi DEFAULT_KOKURIKULER_NOTE diekspor dan memiliki teks narasi baku resmi", () => {
    const printViewSource = fs.readFileSync(
      path.join(APPS_ROOT, "components/rapor/ReportCardPrintView.tsx"),
      "utf8"
    )

    assert.match(printViewSource, /export const DEFAULT_KOKURIKULER_NOTE =/)
    assert.match(
      printViewSource,
      /Ananda sudah baik dalam keimanan dan ketakwaan terhadap Tuhan Yang Maha Esa/
    )
    assert.match(
      printViewSource,
      /melaksanakan sholat berjamaah di masjid/
    )
    assert.match(
      printViewSource,
      /menjaga adab terhadap teman dan guru/
    )
  })

  it("memastikan ReportCardPrintView menggunakan homeroom.kokurikulerNotes dengan fallback ke DEFAULT_KOKURIKULER_NOTE", () => {
    const printViewSource = fs.readFileSync(
      path.join(APPS_ROOT, "components/rapor/ReportCardPrintView.tsx"),
      "utf8"
    )

    assert.match(printViewSource, /kokurikulerNotes\?: string/)
    assert.match(
      printViewSource,
      /\{homeroom\?\.kokurikulerNotes \|\| DEFAULT_KOKURIKULER_NOTE\}/
    )
  })

  it("memastikan skema Convex homeroomAssessments memuat field kokurikulerNotes", () => {
    const schemaSource = fs.readFileSync(
      path.join(APPS_ROOT, "convex/schema.ts"),
      "utf8"
    )

    assert.match(
      schemaSource,
      /kokurikulerNotes:\s*v\.optional\(v\.string\(\)\)/
    )
  })

  it("memastikan mutasi saveHomeroomAssessment menyimpan kokurikulerNotes", () => {
    const mutationsSource = fs.readFileSync(
      path.join(APPS_ROOT, "convex/rapor/public/mutations.ts"),
      "utf8"
    )

    assert.match(
      mutationsSource,
      /kokurikulerNotes:\s*v\.optional\(v\.string\(\)\)/
    )
    assert.match(
      mutationsSource,
      /kokurikulerNotes:\s*args\.kokurikulerNotes/
    )
  })

  it("memastikan kueri rapor menyediakan fallback kokurikulerNotes", () => {
    const queriesSource = fs.readFileSync(
      path.join(APPS_ROOT, "convex/rapor/public/queries.ts"),
      "utf8"
    )

    assert.match(queriesSource, /kokurikulerNotes:\s*undefined/)
  })

  it("memverifikasi antarmuka halaman rapor memuat input Catatan Kokurikuler, tombol reset, dan sinkronisasi", () => {
    const pageSource = fs.readFileSync(
      path.join(APPS_ROOT, "app/(main)/rapor/page.tsx"),
      "utf8"
    )

    // Import & State
    assert.match(pageSource, /DEFAULT_KOKURIKULER_NOTE/)
    assert.match(pageSource, /const \[kokurikulerNotes, setKokurikulerNotes\] = React\.useState/)

    // Sinkronisasi saat santri berganti
    assert.match(pageSource, /singleReport\.homeroom\.kokurikulerNotes !== undefined/)
    assert.match(pageSource, /setKokurikulerNotes\(singleReport\.homeroom\.kokurikulerNotes \|\| DEFAULT_KOKURIKULER_NOTE\)/)

    // Pengiriman ke mutasi saveHomeroomMutation
    assert.match(pageSource, /kokurikulerNotes,/)

    // UI Input di Tab Wali Kelas
    assert.match(pageSource, /Catatan Kokurikuler \(Penguatan Karakter &amp; P5\)/)
    assert.match(pageSource, /Reset Narasi Baku/)
    assert.match(pageSource, /value=\{kokurikulerNotes\}/)
    assert.match(pageSource, /onChange=\{\(e\) => setKokurikulerNotes\(e\.target\.value\)\}/)

    // Tidak ada emoji di kode teks UI
    const kokurikulerSectionMatch = pageSource.match(
      /Catatan Kokurikuler \(Penguatan Karakter[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/
    )
    if (kokurikulerSectionMatch) {
      const sectionText = kokurikulerSectionMatch[0]
      // Pastikan tidak ada emoji
      assert.doesNotMatch(sectionText, /[\u{1F300}-\u{1F9FF}]/u)
    }
  })
})
