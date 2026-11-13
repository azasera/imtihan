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

describe("Sesi Ujian UI Page & Token Controls", () => {
  it("confirms Sesi Ujian page exists and has all essential controls", () => {
    const pagePath = path.join(APPS_ROOT, "app", "(main)", "sesi-ujian", "page.tsx")
    assert.ok(fs.existsSync(pagePath), "sesi-ujian/page.tsx must exist")
    const content = fs.readFileSync(pagePath, "utf-8")

    assert.ok(content.includes("Jadwal & Sesi Ujian"), "Page should have title 'Jadwal & Sesi Ujian'")
    assert.ok(content.includes("Jadwalkan Sesi Ujian"), "Page should have create session button")
    assert.ok(content.includes("Token Akses Santri"), "Page should display token box for santri")
    assert.ok(content.includes("api.examSession.public.queries.listExamSessions"), "Connects to listExamSessions query")
    assert.ok(content.includes("api.examSession.public.mutations.createExamSession"), "Connects to createExamSession mutation")
    assert.ok(content.includes("api.examSession.public.mutations.regenerateSessionToken"), "Connects to regenerateSessionToken mutation")
    assert.ok(content.includes("api.examSession.public.mutations.setSessionStatus"), "Connects to setSessionStatus mutation")
    assert.ok(content.includes("api.examSession.public.mutations.deleteExamSession"), "Connects to deleteExamSession mutation")
    assert.ok(content.includes("handleDeleteSession"), "Has delete session handler")
    assert.ok(content.includes('className="flex-1 text-xs gap-1.5'), "Status action button shares space with delete button")
  })

  it("ensures create session dialog has responsive and scrollable layout", () => {
    const pagePath = path.join(APPS_ROOT, "app", "(main)", "sesi-ujian", "page.tsx")
    const content = fs.readFileSync(pagePath, "utf-8")

    assert.ok(
      content.includes("max-h-[90vh] overflow-y-auto"),
      "Dialog content must be bounded by max-h-[90vh] and scrollable"
    )
    assert.ok(
      content.includes("sm:max-w-2xl"),
      "Dialog content must have adequate width on sm+ displays"
    )
    assert.ok(
      content.includes("grid grid-cols-1 sm:grid-cols-2 gap-3"),
      "Date time inputs must stack on mobile and span two columns on sm+"
    )
  })

  it("confirms sidebar navigation links to /sesi-ujian", () => {
    const sidebarPath = path.join(APPS_ROOT, "components", "app-sidebar.tsx")
    assert.ok(fs.existsSync(sidebarPath), "app-sidebar.tsx must exist")
    const content = fs.readFileSync(sidebarPath, "utf-8")

    assert.ok(
      content.includes('url: "/sesi-ujian"'),
      "Sidebar must have link url: /sesi-ujian"
    )
    assert.ok(
      content.includes('title: "Sesi Ujian"'),
      "Sidebar must label the link 'Sesi Ujian'"
    )
  })

  it("ensures zero technical specification leaks in sesi-ujian page", () => {
    const pagePath = path.join(APPS_ROOT, "app", "(main)", "sesi-ujian", "page.tsx")
    const content = fs.readFileSync(pagePath, "utf-8")

    const lines = content.split("\n")
    const leakMatches: Array<{ line: number; match: string }> = []

    lines.forEach((line, idx) => {
      // Ignore test ids or comments if any
      if (line.includes("//") || line.includes("data-testid")) return
      const matches = line.match(TECHNICAL_LEAK_REGEX)
      if (matches) {
        matches.forEach((m) => leakMatches.push({ line: idx + 1, match: m }))
      }
    })

    assert.equal(
      leakMatches.length,
      0,
      `Detected technical specification leaks in sesi-ujian/page.tsx: ${JSON.stringify(leakMatches)}`
    )
  })
})
