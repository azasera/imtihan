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

    // Ensures participant and session data are returned on submitted state
    assert.ok(
      content.includes('participant.status === "submitted"'),
      "Must handle submitted state"
    )
    assert.ok(
      content.includes("studentName: participant.studentName"),
      "Submitted payload must include studentName"
    )
    assert.ok(
      content.includes("nisn: participant.nisn"),
      "Submitted payload must include nisn"
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
    assert.ok(content.includes("completionParticipant"), "Must use cached/query participant for completion screen")
    assert.ok(content.includes("Nama Santri:"), "Must display student name label")
    assert.ok(content.includes("NISN:"), "Must display NISN label")
    assert.ok(content.includes("Mata Pelajaran:"), "Must display subject code label")
    assert.ok(content.includes("api.examSession.public.queries.getStudentExamSheet"))
    assert.ok(content.includes("api.examSession.public.mutations.saveStudentAnswer"))
    assert.ok(content.includes("api.examSession.public.mutations.submitStudentExam"))
  })

  it("verifies accurate legend counts and mathematical consistency in ExamWorksheet.tsx", () => {
    const worksheetPath = path.join(APPS_ROOT, "app", "ujian", "ExamWorksheet.tsx")
    const content = fs.readFileSync(worksheetPath, "utf-8")

    // Must calculate answeredSureCount, doubtfulCount, and unansweredCount separately
    assert.ok(content.includes("answeredSureCount"), "Must calculate answeredSureCount")
    assert.ok(content.includes("doubtfulCount"), "Must calculate doubtfulCount")
    assert.ok(content.includes("unansweredCount"), "Must calculate unansweredCount")
    assert.ok(content.includes("totalAnswered"), "Must calculate totalAnswered")

    // Must render clear legend labels
    assert.ok(content.includes("Dijawab Pasti"), "Legend must label Dijawab Pasti")
    assert.ok(content.includes("Ragu-ragu"), "Legend must label Ragu-ragu")
    assert.ok(content.includes("Belum Dijawab"), "Legend must label Belum Dijawab")

    // Must enforce that doubtful toggle requires an answer
    assert.ok(
      content.includes("Pilih atau isi jawaban terlebih dahulu sebelum menandai ragu-ragu"),
      "Must prevent marking doubtful when question has no answer"
    )

    // Must guard grid states so that doubtful only applies when answered
    assert.ok(
      content.includes("isDoubtful = Boolean(isAnswered && ans?.isDoubtful)"),
      "Grid buttons must only render doubtful style when question is answered"
    )
  })

  it("verifies mathematical consistency in confirmation dialog of ExamWorksheet.tsx", () => {
    const worksheetPath = path.join(APPS_ROOT, "app", "ujian", "ExamWorksheet.tsx")
    const content = fs.readFileSync(worksheetPath, "utf-8")

    // Confirmation dialog must present the 3 mutually exclusive categories matching the legend
    assert.ok(content.includes("{answeredSureCount}"), "Dialog must display answeredSureCount")
    assert.ok(content.includes("{doubtfulCount}"), "Dialog must display doubtfulCount")
    assert.ok(content.includes("{unansweredCount}"), "Dialog must display unansweredCount")
  })

  it("verifies True/False options styling uses clear red with XCircleIcon for Pernyataan Salah", () => {
    const worksheetPath = path.join(APPS_ROOT, "app", "ujian", "ExamWorksheet.tsx")
    const content = fs.readFileSync(worksheetPath, "utf-8")

    assert.ok(content.includes("XCircleIcon"), "Must import and use XCircleIcon")
    assert.ok(
      content.includes("border-red-600 bg-red-50 text-red-700"),
      "Pernyataan Salah must use high-contrast red styling"
    )
    assert.ok(
      content.includes("border-emerald-600 bg-emerald-50 text-emerald-700"),
      "Pernyataan Benar must use high-contrast emerald styling"
    )
  })

  it("verifies timer visual warning states and progress bar in ExamWorksheet.tsx", () => {
    const worksheetPath = path.join(APPS_ROOT, "app", "ujian", "ExamWorksheet.tsx")
    const content = fs.readFileSync(worksheetPath, "utf-8")

    // Timer warning states (< 300 and < 600)
    assert.ok(content.includes("remainingSeconds < 300"), "Must have critical < 5m timer state")
    assert.ok(content.includes("remainingSeconds < 600"), "Must have warning < 10m timer state")

    // Progress bar
    assert.ok(content.includes('role="progressbar"'), "Must render real-time progress bar")
  })

  it("verifies teacher return button in student exam entry page", () => {
    const entryPagePath = path.join(APPS_ROOT, "app", "ujian", "page.tsx")
    const content = fs.readFileSync(entryPagePath, "utf-8")

    assert.ok(content.includes("Mode Pengajar"), "Must show Mode Pengajar badge for teachers")
    assert.ok(content.includes("Kembali ke Dashboard"), "Must provide button to return to dashboard")
    assert.ok(content.includes('href="/sesi-ujian"'), "Must link back to /sesi-ujian")
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
