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

// Regex to detect emojis
const EMOJI_REGEX = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u

describe("In-App Proctor Guide (Panduan Pengawas)", () => {
  it("confirms app/(main)/panduan-pengawas/page.tsx exists and contains comprehensive SOP sections", () => {
    const pagePath = path.join(APPS_ROOT, "app", "(main)", "panduan-pengawas", "page.tsx")
    assert.ok(fs.existsSync(pagePath), "panduan-pengawas/page.tsx must exist")
    const content = fs.readFileSync(pagePath, "utf-8")

    // Hero title
    assert.ok(content.includes("Panduan Pengawas Ruang Ujian"), "Hero title must be present")
    assert.ok(content.includes("SOP Persiapan Sebelum Ujian"), "Section 1: Pra-Ujian must be present")
    assert.ok(content.includes("Format Masuk Santri & Rumus Token 8 Karakter"), "Section 2: Format Token must be present")
    assert.ok(content.includes("Solusi Cepat Kendala Ruang Ujian"), "Section 3: Troubleshooting must be present")
    assert.ok(content.includes("Prosedur Setelah Ujian Selesai"), "Section 4: Pasca Ujian must be present")

    // Troubleshooting cases
    assert.ok(content.includes("Nomor Induk Santri Tidak Ditemukan"), "Must cover student not found")
    assert.ok(content.includes("2 Angka Terakhir Token Tidak Cocok"), "Must cover token 2 digits mismatch")
    assert.ok(content.includes("Santri Tidak Sengaja Tertekan Kumpul"), "Must cover submitted exam re-entry")
    assert.ok(content.includes("Layar Santri Terkunci Karena Pelanggaran Tab"), "Must cover locked participant")
    assert.ok(content.includes("Gawai Mati, Baterai Habis, atau Peramban Tertutup"), "Must cover resume workflow")
    assert.ok(content.includes("Token Sesi Berubah"), "Must cover token rotation")
  })

  it("confirms app-sidebar.tsx contains navigation link to Panduan Pengawas", () => {
    const sidebarPath = path.join(APPS_ROOT, "components", "app-sidebar.tsx")
    assert.ok(fs.existsSync(sidebarPath), "app-sidebar.tsx must exist")
    const content = fs.readFileSync(sidebarPath, "utf-8")

    assert.ok(content.includes("Panduan Pengawas"), "Sidebar must have Panduan Pengawas label")
    assert.ok(content.includes("/panduan-pengawas"), "Sidebar must link to /panduan-pengawas")
  })

  it("confirms monitoring-sesi page contains quick link button to Panduan Pengawas", () => {
    const monitoringPath = path.join(APPS_ROOT, "app", "(main)", "monitoring-sesi", "page.tsx")
    assert.ok(fs.existsSync(monitoringPath), "monitoring-sesi/page.tsx must exist")
    const content = fs.readFileSync(monitoringPath, "utf-8")

    assert.ok(content.includes("href=\"/panduan-pengawas\""), "Monitoring page must link to /panduan-pengawas")
    assert.ok(content.includes("Panduan Pengawas"), "Monitoring page must have Panduan Pengawas button")
  })

  it("ensures zero technical specification leaks in panduan-pengawas/page.tsx", () => {
    const pagePath = path.join(APPS_ROOT, "app", "(main)", "panduan-pengawas", "page.tsx")
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
      `Detected technical specification leaks in panduan-pengawas/page.tsx: ${JSON.stringify(leakMatches)}`
    )
  })

  it("ensures zero emojis in panduan-pengawas/page.tsx", () => {
    const pagePath = path.join(APPS_ROOT, "app", "(main)", "panduan-pengawas", "page.tsx")
    const content = fs.readFileSync(pagePath, "utf-8")

    const lines = content.split("\n")
    const emojiMatches: Array<{ line: number; match: string }> = []

    lines.forEach((line, idx) => {
      const match = line.match(EMOJI_REGEX)
      if (match) {
        emojiMatches.push({ line: idx + 1, match: match[0] })
      }
    })

    assert.equal(
      emojiMatches.length,
      0,
      `Detected emojis in panduan-pengawas/page.tsx: ${JSON.stringify(emojiMatches)}`
    )
  })
})
