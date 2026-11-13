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

describe("Student Exam Entry & Verification (TASK-005 & TASK-010)", () => {
  it("confirms examParticipants table is properly defined in schema.ts", () => {
    const schemaPath = path.join(APPS_ROOT, "convex", "schema.ts")
    assert.ok(fs.existsSync(schemaPath), "convex/schema.ts must exist")
    const content = fs.readFileSync(schemaPath, "utf-8")

    assert.ok(
      content.includes("examParticipants: defineTable({"),
      "schema.ts should define examParticipants table"
    )
    assert.ok(content.includes('sessionId: v.id("examSessions")'))
    assert.ok(content.includes("nisn: v.string()"))
    assert.ok(content.includes("studentName: v.string()"))
    assert.ok(content.includes("tokenUsed: v.string()"))
    assert.ok(content.includes("startedAt: v.number()"))
    assert.ok(content.includes('.index("by_session_and_nisn", ["sessionId", "nisn"])'))
  })

  it("confirms enterExamSession mutation validates institution, class, and student identity from database", () => {
    const mutationsPath = path.join(APPS_ROOT, "convex", "examSession", "public", "mutations.ts")
    assert.ok(fs.existsSync(mutationsPath), "mutations.ts must exist")
    const content = fs.readFileSync(mutationsPath, "utf-8")

    assert.ok(
      content.includes("export const enterExamSession = mutation("),
      "enterExamSession mutation must be exported"
    )
    assert.ok(content.includes("rawToken.length !== 6 && rawToken.length !== 8"))
    assert.ok(content.includes("institution: v.optional(v.union(v.literal(\"SMPITA\"), v.literal(\"SMAITA\"), v.literal(\"MTA\")))"))
    assert.ok(content.includes("className: v.optional(v.string())"))
    assert.ok(content.includes("student.jenjang !== args.institution"))
    assert.ok(content.includes("verifiedName = student.nama"))
  })

  it("confirms getClassesByLembaga query filters classes according to official ranges", () => {
    const queriesPath = path.join(APPS_ROOT, "convex", "students", "public", "queries.ts")
    assert.ok(fs.existsSync(queriesPath), "convex/students/public/queries.ts must exist")
    const content = fs.readFileSync(queriesPath, "utf-8")

    assert.ok(content.includes("export const getClassesByLembaga = query("))
    // SMPITA: kelas 7 s.d. 9
    assert.ok(content.includes("/^(kelas\\s*)?[7-9]/i"))
    // SMAITA: kelas 10 s.d. 12
    assert.ok(content.includes("/^(kelas\\s*)?(10|11|12)/i"))
    // MTA: MTA 1 s.d. MTA 6
    assert.ok(content.includes("/^mta\\s*[1-6]/i"))
  })

  it("confirms student exam entry page follows the reference 3-step wizard and verification", () => {
    const pagePath = path.join(APPS_ROOT, "app", "ujian", "page.tsx")
    assert.ok(fs.existsSync(pagePath), "app/ujian/page.tsx must exist")
    const content = fs.readFileSync(pagePath, "utf-8")

    // Langkah 1: Input Nomor Induk & Token Ujian
    assert.ok(content.includes("Nomor induk santri"), "Field Nomor Induk Santri must exist")
    assert.ok(content.includes("Token ujian"), "Field Token Ujian must exist")

    // Langkah 2: Konfirmasi Data Saya vs Bukan Data Saya
    assert.ok(content.includes("Periksa data Anda"), "Layar Konfirmasi Data must exist")
    assert.ok(content.includes("Benar, masuk ruang ujian"), "Tombol Benar Masuk Ruang Ujian must exist")
    assert.ok(content.includes("Bukan data saya"), "Tombol Bukan Data Saya must exist")

    // Langkah 3: Siap Memulai
    assert.ok(content.includes("Siap memulai"), "Layar Siap Memulai must exist")
    assert.ok(content.includes("Mulai ujian"), "Tombol Mulai Ujian must exist")
  })

  it("confirms security features against guessing (8-char token with NISN digits, lockout on 5 failed attempts)", () => {
    const pagePath = path.join(APPS_ROOT, "app", "ujian", "page.tsx")
    const content = fs.readFileSync(pagePath, "utf-8")

    // Maksimal 8 karakter token (6 karakter sesi + 2 angka santri)
    assert.ok(content.includes("maxLength={8}"))

    // Proteksi percobaan gagal maksimal 5 kali
    assert.ok(content.includes("failedAttempts"))
    assert.ok(content.includes("isLocked"))
    assert.ok(content.includes("5 - nextFailed") || content.includes("dikunci sementara"))

    // Validasi token lengkap 8 karakter dan kecocokan 2 digit santri di Langkah 1
    assert.ok(content.includes("cleanToken.length < 8"), "Must enforce 8-character token in step 1")
    assert.ok(content.includes("twoDigits"), "Must check student twoDigits in step 1")
    assert.ok(content.includes("cleanErrorMessage"), "Must clean error messages for notifications")
  })

  it("confirms studentGateProfile and verifySessionToken include twoDigits token support", () => {
    const studentQueriesPath = path.join(APPS_ROOT, "convex", "students", "public", "queries.ts")
    const studentQueries = fs.readFileSync(studentQueriesPath, "utf-8")
    assert.ok(studentQueries.includes("twoDigits: extractStudentTwoDigits(student)"), "Must return twoDigits in gate profile")

    const sessionQueriesPath = path.join(APPS_ROOT, "convex", "examSession", "public", "queries.ts")
    const sessionQueries = fs.readFileSync(sessionQueriesPath, "utf-8")
    assert.ok(sessionQueries.includes("identifier: v.optional(v.string())"), "verifySessionToken must support identifier")
    assert.ok(sessionQueries.includes("validDigits.includes(suppliedDigits)"), "verifySessionToken must validate 2 digits")
  })

  it("ensures zero technical specification leaks in app/ujian/page.tsx", () => {
    const pagePath = path.join(APPS_ROOT, "app", "ujian", "page.tsx")
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
      `Detected technical specification leaks in app/ujian/page.tsx: ${JSON.stringify(leakMatches)}`
    )
  })
})
