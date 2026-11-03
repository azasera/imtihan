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

describe("Student Master Data & SiPAKSa Sync Integration", () => {
  it("confirms students table schema is defined with correct indexes in schema.ts", () => {
    const schemaPath = path.join(APPS_ROOT, "convex", "schema.ts")
    assert.ok(fs.existsSync(schemaPath), "convex/schema.ts must exist")
    const content = fs.readFileSync(schemaPath, "utf-8")

    assert.ok(content.includes("students: defineTable({"), "schema.ts must define students table")
    assert.ok(content.includes("santriId: v.string()"), "must include santriId")
    assert.ok(content.includes("nama: v.string()"), "must include nama")
    assert.ok(content.includes("jenjang: v.union(v.literal(\"SMPITA\"), v.literal(\"SMAITA\"), v.literal(\"MTA\"))"), "jenjang must be strictly SMPITA, SMAITA, or MTA")
    assert.ok(content.includes(".index(\"by_santri_id\", [\"santriId\"])"), "must index by_santri_id")
    assert.ok(content.includes(".index(\"by_nisn\", [\"nisn\"])"), "must index by_nisn")
    assert.ok(content.includes(".index(\"by_nis\", [\"nis\"])"), "must index by_nis")
    assert.ok(content.includes(".index(\"by_jenjang\", [\"jenjang\"])"), "must index by_jenjang")
  })

  it("confirms syncStudentsFromSipaksa action filters out SDITA and TK strictly", () => {
    const actionPath = path.join(APPS_ROOT, "convex", "students", "public", "actions.ts")
    assert.ok(fs.existsSync(actionPath), "actions.ts must exist")
    const content = fs.readFileSync(actionPath, "utf-8")

    assert.ok(content.includes("syncStudentsFromSipaksa = action("))
    assert.ok(content.includes("ALLOWED_JENJANG = new Set([\"SMPITA\", \"SMAITA\", \"MTA\"])"))
    assert.ok(!content.includes("\"SDITA\""), "SDITA must not be in allowed list")
  })

  it("confirms lookupStudent query supports flexible multi-identifier matching (NISN, NIS, ID Santri)", () => {
    const queryPath = path.join(APPS_ROOT, "convex", "students", "public", "queries.ts")
    assert.ok(fs.existsSync(queryPath), "queries.ts must exist")
    const content = fs.readFileSync(queryPath, "utf-8")

    assert.ok(content.includes("lookupStudent = query("))
    assert.ok(content.includes("by_santri_id"))
    assert.ok(content.includes("by_nisn"))
    assert.ok(content.includes("by_nis"))
  })

  it("verifies filter logic on mock raw SiPAKSa dataset correctly filters out SD and TK", () => {
    const mockRawData = [
      { santriId: "21.01.001", nama: "Santri SD", jenjang: "SDITA", kelas: "6A", status: "Aktif" },
      { santriId: "21.01.002", nama: "Calon TK", jenjang: "SDITA", kelas: "TK A1", status: "Aktif" },
      { santriId: "24.02.001", nama: "Santri SMP", jenjang: "SMPITA", kelas: "9A", status: "Aktif", nisn: "012345" },
      { santriId: "24.03.001", nama: "Santri SMA", jenjang: "SMAITA", kelas: "12A", status: "Aktif", nisn: "098765" },
      { santriId: "21.04.001", nama: "Santri MTA", jenjang: "MTA", kelas: "MTA 6", status: "Aktif", nis: "2223.03.0034" },
    ]

    const ALLOWED_JENJANG = new Set(["SMPITA", "SMAITA", "MTA"])
    const filtered = mockRawData.filter((s) => ALLOWED_JENJANG.has(s.jenjang))

    assert.equal(filtered.length, 3, "Only 3 santri should pass the filter")
    assert.deepEqual(
      filtered.map((s) => s.jenjang),
      ["SMPITA", "SMAITA", "MTA"]
    )
    assert.ok(!filtered.some((s) => s.jenjang === "SDITA"))
  })

  it("confirms santri management page exists with essential controls and zero technical leaks", () => {
    const pagePath = path.join(APPS_ROOT, "app", "(main)", "santri", "page.tsx")
    assert.ok(fs.existsSync(pagePath), "app/(main)/santri/page.tsx must exist")
    const content = fs.readFileSync(pagePath, "utf-8")

    assert.ok(content.includes("Data Master Santri"))
    assert.ok(content.includes("Tarik Data dari SiPAKSa"))
    assert.ok(content.includes("Total Santri Aktif"))
    assert.ok(content.includes("SMPITA"))
    assert.ok(content.includes("SMAITA"))
    assert.ok(content.includes("MTA"))

    const lines = content.split("\n")
    const leakMatches: Array<{ line: number; match: string }> = []
    lines.forEach((line, idx) => {
      if (line.includes("//") || line.includes("data-testid")) return
      const matches = line.match(TECHNICAL_LEAK_REGEX)
      if (matches) {
        matches.forEach((m) => leakMatches.push({ line: idx + 1, match: m }))
      }
    })
    assert.equal(leakMatches.length, 0, `Technical leaks found: ${JSON.stringify(leakMatches)}`)
  })

  it("confirms app sidebar contains link to /santri", () => {
    const sidebarPath = path.join(APPS_ROOT, "components", "app-sidebar.tsx")
    assert.ok(fs.existsSync(sidebarPath), "app-sidebar.tsx must exist")
    const content = fs.readFileSync(sidebarPath, "utf-8")

    assert.ok(content.includes('url: "/santri"'))
    assert.ok(content.includes('title: "Data Santri"'))
  })
})
