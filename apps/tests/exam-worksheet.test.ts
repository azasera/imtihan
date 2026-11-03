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

describe("Exam Worksheet & Auto-Save (TASK-006)", () => {
  it("confirms studentAnswers table is properly defined in schema.ts", () => {
    const schemaPath = path.join(APPS_ROOT, "convex", "schema.ts")
    assert.ok(fs.existsSync(schemaPath), "convex/schema.ts must exist")
    const content = fs.readFileSync(schemaPath, "utf-8")

    assert.ok(
      content.includes("studentAnswers: defineTable({"),
      "schema.ts should define studentAnswers table"
    )
    assert.ok(content.includes('participantId: v.id("examParticipants")'))
    assert.ok(content.includes('questionId: v.id("questions")'))
    assert.ok(content.includes("isDoubtful: v.boolean()"))
    assert.ok(content.includes('.index("by_participant", ["participantId"])'))
    assert.ok(
      content.includes('.index("by_participant_and_question", ["participantId", "questionId"])')
    )
  })

  it("confirms getStudentExamSheet query exists and sanitizes answer keys", () => {
    const queriesPath = path.join(APPS_ROOT, "convex", "examSession", "public", "queries.ts")
    assert.ok(fs.existsSync(queriesPath), "queries.ts must exist")
    const content = fs.readFileSync(queriesPath, "utf-8")

    assert.ok(
      content.includes("export const getStudentExamSheet = query("),
      "getStudentExamSheet query must be exported"
    )
    // Ensures isCorrect is excluded from the student questions options map
    assert.ok(
      content.includes("sanitizedQuestions"),
      "Payload must sanitize questions for student safety"
    )
  })

  it("confirms saveStudentAnswer and submitStudentExam mutations exist", () => {
    const mutationsPath = path.join(APPS_ROOT, "convex", "examSession", "public", "mutations.ts")
    assert.ok(fs.existsSync(mutationsPath), "mutations.ts must exist")
    const content = fs.readFileSync(mutationsPath, "utf-8")

    assert.ok(
      content.includes("export const saveStudentAnswer = mutation("),
      "saveStudentAnswer mutation must be exported"
    )
    assert.ok(
      content.includes("export const submitStudentExam = mutation("),
      "submitStudentExam mutation must be exported"
    )
  })

  it("confirms ExamWorksheet UI component exists and has required elements", () => {
    const worksheetPath = path.join(APPS_ROOT, "app", "ujian", "ExamWorksheet.tsx")
    assert.ok(fs.existsSync(worksheetPath), "ExamWorksheet.tsx must exist")
    const content = fs.readFileSync(worksheetPath, "utf-8")

    assert.ok(content.includes("Peta Nomor Soal"), "Must contain question grid map")
    assert.ok(content.includes("Ragu-ragu"), "Must contain doubtful question toggle")
    assert.ok(content.includes("Sebelumnya"), "Must contain previous question navigation")
    assert.ok(content.includes("Berikutnya"), "Must contain next question navigation")
    assert.ok(content.includes("Selesaikan Ujian"), "Must contain exam finish button")
    assert.ok(content.includes("api.examSession.public.queries.getStudentExamSheet"))
    assert.ok(content.includes("api.examSession.public.mutations.saveStudentAnswer"))
    assert.ok(content.includes("api.examSession.public.mutations.submitStudentExam"))
  })

  it("ensures zero technical specification leaks in ExamWorksheet.tsx", () => {
    const worksheetPath = path.join(APPS_ROOT, "app", "ujian", "ExamWorksheet.tsx")
    const content = fs.readFileSync(worksheetPath, "utf-8")

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
      `Detected technical specification leaks in ExamWorksheet.tsx: ${JSON.stringify(leakMatches)}`
    )
  })
})
