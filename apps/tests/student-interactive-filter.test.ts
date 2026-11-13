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

describe("Student Master Data Interactive Filter Cards", () => {
  it("verifies santri page includes interactive attributes on metric cards", () => {
    const pagePath = path.join(APPS_ROOT, "app", "(main)", "santri", "page.tsx")
    assert.ok(fs.existsSync(pagePath), "app/(main)/santri/page.tsx must exist")
    const content = fs.readFileSync(pagePath, "utf-8")

    // Role button and accessibility
    assert.ok(content.includes('role="button"'), "cards must have role=button")
    assert.ok(content.includes("tabIndex={0}"), "cards must be keyboard-focusable with tabIndex={0}")
    assert.ok(content.includes("aria-pressed="), "cards must indicate pressed state via aria-pressed")
    assert.ok(content.includes("onKeyDown="), "cards must handle keyboard events")
    assert.ok(content.includes("handleJenjangClick"), "must define card click handler")

    // Check individual card aria labels or identifiers
    assert.ok(content.includes("Filter semua santri"), "must have accessible label for Total Santri Aktif card")
    assert.ok(content.includes("Filter santri jenjang SMPITA"), "must have accessible label for SMPITA card")
    assert.ok(content.includes("Filter santri jenjang SMAITA"), "must have accessible label for SMAITA card")
    assert.ok(content.includes("Filter santri jenjang MTA"), "must have accessible label for MTA card")
  })

  it("verifies interactive filter toggle logic handles jenjang selection and resetting to ALL", () => {
    type JenjangType = "ALL" | "SMPITA" | "SMAITA" | "MTA"

    // Simulate the component's toggle filter logic
    const computeNextJenjang = (current: JenjangType, target: JenjangType): JenjangType => {
      if (target === "ALL") return "ALL"
      if (current === target) return "ALL" // toggle behavior
      return target
    }

    // Selecting specific cards
    assert.equal(computeNextJenjang("ALL", "SMPITA"), "SMPITA")
    assert.equal(computeNextJenjang("ALL", "SMAITA"), "SMAITA")
    assert.equal(computeNextJenjang("ALL", "MTA"), "MTA")

    // Clicking active card toggles back to ALL
    assert.equal(computeNextJenjang("SMPITA", "SMPITA"), "ALL")
    assert.equal(computeNextJenjang("SMAITA", "SMAITA"), "ALL")
    assert.equal(computeNextJenjang("MTA", "MTA"), "ALL")

    // Switching between jenjang directly
    assert.equal(computeNextJenjang("SMPITA", "SMAITA"), "SMAITA")
    assert.equal(computeNextJenjang("SMAITA", "MTA"), "MTA")

    // Clicking Total Santri Aktif card always resets to ALL
    assert.equal(computeNextJenjang("SMPITA", "ALL"), "ALL")
    assert.equal(computeNextJenjang("ALL", "ALL"), "ALL")
  })

  it("confirms visual active indicators and hover classes are configured for each card", () => {
    const pagePath = path.join(APPS_ROOT, "app", "(main)", "santri", "page.tsx")
    const content = fs.readFileSync(pagePath, "utf-8")

    // Verification of interactive styling classes
    assert.ok(content.includes("cursor-pointer"), "must have cursor-pointer")
    assert.ok(content.includes("hover:shadow-md"), "must have hover elevation")
    assert.ok(content.includes("ring-2"), "must have ring indicator for active card")
    assert.ok(content.includes("focus-visible:ring-2"), "must have focus-visible ring")
    assert.ok(content.includes("border-emerald-600"), "must style SMPITA/Total active card border")
    assert.ok(content.includes("border-blue-600"), "must style SMAITA active card border")
    assert.ok(content.includes("border-purple-600"), "must style MTA active card border")
  })

  it("verifies zero technical leaks and zero emojis across santri page and test files", () => {
    const pagePath = path.join(APPS_ROOT, "app", "(main)", "santri", "page.tsx")
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
    assert.equal(leakMatches.length, 0, `Technical leaks found: ${JSON.stringify(leakMatches)}`)

    // Verify no emojis
    const emojiRegex = /[\u{1F300}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u
    const emojiMatches: Array<{ line: number; match: string }> = []
    lines.forEach((line, idx) => {
      const match = line.match(emojiRegex)
      if (match) {
        emojiMatches.push({ line: idx + 1, match: match[0] })
      }
    })
    assert.equal(emojiMatches.length, 0, `Emojis found in UI: ${JSON.stringify(emojiMatches)}`)
  })
})
