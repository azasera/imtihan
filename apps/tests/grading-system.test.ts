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

describe("Grading System & Essay Correction (TASK-007)", () => {
  it("confirms schema.ts has scoring attributes on examParticipants and studentAnswers", () => {
    const schemaPath = path.join(APPS_ROOT, "convex", "schema.ts")
    assert.ok(fs.existsSync(schemaPath), "convex/schema.ts must exist")
    const content = fs.readFileSync(schemaPath, "utf-8")

    assert.ok(content.includes("multipleChoiceScore: v.optional(v.number())"))
    assert.ok(content.includes("essayScore: v.optional(v.number())"))
    assert.ok(content.includes("totalScore: v.optional(v.number())"))
    assert.ok(content.includes("gradingStatus: v.optional("))
    assert.ok(content.includes("scoreAwarded: v.optional(v.number())"))
    assert.ok(content.includes("teacherFeedback: v.optional(v.string())"))
  })

  it("confirms submitStudentExam calculates automated multiple choice score", () => {
    const mutationsPath = path.join(APPS_ROOT, "convex", "examSession", "public", "mutations.ts")
    assert.ok(fs.existsSync(mutationsPath), "mutations.ts must exist")
    const content = fs.readFileSync(mutationsPath, "utf-8")

    assert.ok(content.includes("calculatedPgScore"))
    assert.ok(content.includes("opt.isCorrect"))
    assert.ok(content.includes("gradeEssayAnswer = mutation("))
  })

  it("confirms grading queries exist in convex/examSession", () => {
    const queriesPath = path.join(APPS_ROOT, "convex", "examSession", "public", "queries.ts")
    assert.ok(fs.existsSync(queriesPath), "queries.ts must exist")
    const content = fs.readFileSync(queriesPath, "utf-8")

    assert.ok(content.includes("export const getParticipantAnswersForGrading = query("))
    assert.ok(content.includes("export const listSessionParticipants = query("))
  })

  it("confirms rekap-nilai and koreksi pages exist with essential elements", () => {
    const rekapPage = path.join(APPS_ROOT, "app", "(main)", "rekap-nilai", "page.tsx")
    const koreksiPage = path.join(APPS_ROOT, "app", "(main)", "rekap-nilai", "koreksi", "[id]", "page.tsx")

    assert.ok(fs.existsSync(rekapPage), "rekap-nilai/page.tsx must exist")
    assert.ok(fs.existsSync(koreksiPage), "koreksi/[id]/page.tsx must exist")

    const rekapContent = fs.readFileSync(rekapPage, "utf-8")
    assert.ok(rekapContent.includes("Rekap Nilai & Koreksi Ujian"))
    assert.ok(rekapContent.includes("Daftar Nilai & Evaluasi Santri"))
    assert.ok(rekapContent.includes("Koreksi Essay"))

    const koreksiContent = fs.readFileSync(koreksiPage, "utf-8")
    assert.ok(koreksiContent.includes("Lembar Koreksi"))
    assert.ok(koreksiContent.includes("Rubrik Penilaian"))
    assert.ok(koreksiContent.includes("Simpan Nilai"))
  })

  it("ensures zero technical specification leaks in rekap-nilai and koreksi pages", () => {
    const pages = [
      path.join(APPS_ROOT, "app", "(main)", "rekap-nilai", "page.tsx"),
      path.join(APPS_ROOT, "app", "(main)", "rekap-nilai", "koreksi", "[id]", "page.tsx"),
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
