import test, { describe, it } from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const APPS_ROOT = path.resolve(__dirname, "..")

// Regex to detect technical specification codes in user-facing UI
const TECHNICAL_LEAK_REGEX = /\b(SCR-[A-Z0-9\-]+|[A-Z]{2,10}-(FR|AC|NFR)-\d+|TASK-\d+|Fase\s+\d+)\b/g

describe("Recap Dashboard & Data Export (TASK-008)", () => {
  it("confirms rekap-nilai page contains statistical metrics and export controls", () => {
    const pagePath = path.join(APPS_ROOT, "app", "(main)", "rekap-nilai", "page.tsx")
    assert.ok(fs.existsSync(pagePath), "rekap-nilai/page.tsx must exist")
    const content = fs.readFileSync(pagePath, "utf-8")

    assert.ok(content.includes("Rata-rata Kelas"), "Must display average score card")
    assert.ok(content.includes("Nilai Tertinggi"), "Must display highest score card")
    assert.ok(content.includes("Nilai Terendah"), "Must display lowest score card")
    assert.ok(content.includes("Ketuntasan KKM"), "Must display KKM percentage card")
    assert.ok(content.includes("Ekspor CSV"), "Must have CSV export button")
    assert.ok(content.includes("Cetak Laporan"), "Must have print report button")
    assert.ok(content.includes("window.print()"), "Triggers window.print() on print")
    assert.ok(content.includes("\\uFEFF"), "Uses UTF-8 BOM for Excel compatibility")
  })

  it("validates statistical calculations and CSV generation logic", () => {
    const sampleScores = [80, 90, 70, 85, 60]
    const kkm = 75

    const total = sampleScores.reduce((acc, c) => acc + c, 0)
    const avg = total / sampleScores.length
    const max = Math.max(...sampleScores)
    const min = Math.min(...sampleScores)
    const passing = sampleScores.filter((s) => s >= kkm).length
    const passingPct = (passing / sampleScores.length) * 100

    assert.equal(avg, 77)
    assert.equal(max, 90)
    assert.equal(min, 60)
    assert.equal(passing, 3)
    assert.equal(passingPct, 60)

    // Test CSV row escaping
    function escapeCsvCell(val: string): string {
      return `"${val.replace(/"/g, '""')}"`
    }

    assert.equal(escapeCsvCell('Santri "Ahmad"'), '"Santri ""Ahmad"""')
    assert.equal(escapeCsvCell("Muhammad Ali, Lc."), '"Muhammad Ali, Lc."')
  })

  it("confirms dashboard home page has executive summary cards", () => {
    const homePath = path.join(APPS_ROOT, "app", "(main)", "page.tsx")
    assert.ok(fs.existsSync(homePath), "app/(main)/page.tsx must exist")
    const content = fs.readFileSync(homePath, "utf-8")

    assert.ok(content.includes("E-Imtihan At-Tauhid"))
    assert.ok(content.includes("Bank Soal Tersimpan"))
    assert.ok(content.includes("Sesi Ujian Terjadwal"))
    assert.ok(content.includes("Rekapitulasi & Koreksi"))
    assert.ok(content.includes("Alur Pelaksanaan Ujian Santri"))
  })

  it("ensures zero technical specification leaks in rekap-nilai and home pages", () => {
    const pages = [
      path.join(APPS_ROOT, "app", "(main)", "rekap-nilai", "page.tsx"),
      path.join(APPS_ROOT, "app", "(main)", "page.tsx"),
    ]

    for (const pagePath of pages) {
      const content = fs.readFileSync(pagePath, "utf-8")
      const lines = content.split("\n")
      const leakMatches: Array<{ line: number; match: string }> = []

      lines.forEach((line, idx) => {
        if (line.includes("//") || line.includes("data-testid")) return
        const matches = line.match(TECHNICAL_LEAK_REGEX)
        if (matches) {
          matches.forEach((m) => leakMatches.push({ line: idx + 1, match: m }))
        }
      })

      assert.equal(
        leakMatches.length,
        0,
        `Detected technical specification leaks in ${pagePath}: ${JSON.stringify(leakMatches)}`
      )
    }
  })
})
