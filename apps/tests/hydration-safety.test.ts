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

describe("Hydration Safety & Browser Extension Attribute Protection", () => {
  it("confirms Input component has suppressHydrationWarning enabled", () => {
    const inputPath = path.join(APPS_ROOT, "components", "ui", "input.tsx")
    assert.ok(fs.existsSync(inputPath), "components/ui/input.tsx must exist")
    const content = fs.readFileSync(inputPath, "utf-8")

    assert.ok(
      content.includes("suppressHydrationWarning"),
      "Input component must have suppressHydrationWarning to prevent browser extension mismatch"
    )
  })

  it("confirms SelectTrigger component has suppressHydrationWarning enabled", () => {
    const selectPath = path.join(APPS_ROOT, "components", "ui", "select.tsx")
    assert.ok(fs.existsSync(selectPath), "components/ui/select.tsx must exist")
    const content = fs.readFileSync(selectPath, "utf-8")

    assert.ok(
      content.includes("suppressHydrationWarning"),
      "SelectTrigger component must have suppressHydrationWarning"
    )
  })

  it("confirms Button component has suppressHydrationWarning enabled", () => {
    const buttonPath = path.join(APPS_ROOT, "components", "ui", "button.tsx")
    assert.ok(fs.existsSync(buttonPath), "components/ui/button.tsx must exist")
    const content = fs.readFileSync(buttonPath, "utf-8")

    assert.ok(
      content.includes("suppressHydrationWarning"),
      "Button component must have suppressHydrationWarning"
    )
  })

  it("confirms student exam entry page form and inputs have autofill and hydration guards", () => {
    const pagePath = path.join(APPS_ROOT, "app", "ujian", "page.tsx")
    assert.ok(fs.existsSync(pagePath), "app/ujian/page.tsx must exist")
    const content = fs.readFileSync(pagePath, "utf-8")

    assert.ok(
      content.includes("<form onSubmit={handleEnterExam} suppressHydrationWarning autoComplete=\"off\">"),
      "Exam entry form must have suppressHydrationWarning and autoComplete='off'"
    )
    assert.ok(
      content.includes('data-1p-ignore="true"'),
      "Form inputs must include password manager ignore hints"
    )
  })

  it("ensures zero technical specification leaks in modified components", () => {
    const filesToTest = [
      path.join(APPS_ROOT, "components", "ui", "input.tsx"),
      path.join(APPS_ROOT, "components", "ui", "select.tsx"),
      path.join(APPS_ROOT, "components", "ui", "button.tsx"),
      path.join(APPS_ROOT, "app", "ujian", "page.tsx"),
    ]

    for (const filePath of filesToTest) {
      const content = fs.readFileSync(filePath, "utf-8")
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
        `Detected technical specification leaks in ${filePath}: ${JSON.stringify(leakMatches)}`
      )
    }
  })
})
