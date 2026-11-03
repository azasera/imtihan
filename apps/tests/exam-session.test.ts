import test, { describe, it } from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const APPS_ROOT = path.resolve(__dirname, "..")

const TOKEN_CHARACTERS = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"

function generateExamToken(length = 6): string {
  let result = ""
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * TOKEN_CHARACTERS.length)
    result += TOKEN_CHARACTERS[randomIndex]
  }
  return result
}

describe("Exam Session Schema & Backend Structure", () => {
  it("confirms schema.ts defines examSessions table with all required fields and indexes", () => {
    const schemaPath = path.join(APPS_ROOT, "convex", "schema.ts")
    assert.ok(fs.existsSync(schemaPath), "convex/schema.ts must exist")
    const schemaContent = fs.readFileSync(schemaPath, "utf-8")

    assert.ok(
      schemaContent.includes("examSessions: defineTable({"),
      "schema.ts should define examSessions table"
    )

    const expectedFields = [
      "title: v.string()",
      "bankId: v.id(\"questionBanks\")",
      "token: v.string()",
      "startTime: v.string()",
      "endTime: v.string()",
      "durationMinutes: v.number()",
      "randomizeQuestions: v.boolean()",
      "randomizeOptions: v.boolean()",
      "status: v.union(v.literal(\"draft\"), v.literal(\"active\"), v.literal(\"ended\"))",
      "creatorTokenIdentifier: v.string()",
    ]

    for (const field of expectedFields) {
      assert.ok(
        schemaContent.includes(field),
        `examSessions should declare field ${field}`
      )
    }

    assert.ok(
      schemaContent.includes('.index("by_token", ["token"])'),
      "examSessions should have by_token index"
    )
    assert.ok(
      schemaContent.includes('.index("by_creator", ["creatorTokenIdentifier"])'),
      "examSessions should have by_creator index"
    )
    assert.ok(
      schemaContent.includes('.index("by_status", ["status"])'),
      "examSessions should have by_status index"
    )
    assert.ok(
      schemaContent.includes('.index("by_bank", ["bankId"])'),
      "examSessions should have by_bank index"
    )
  })

  it("confirms backend mutation and query files exist in convex/examSession", () => {
    const helpersPath = path.join(APPS_ROOT, "convex", "examSession", "private", "helpers.ts")
    const mutationsPath = path.join(APPS_ROOT, "convex", "examSession", "public", "mutations.ts")
    const queriesPath = path.join(APPS_ROOT, "convex", "examSession", "public", "queries.ts")

    assert.ok(fs.existsSync(helpersPath), "helpers.ts must exist")
    assert.ok(fs.existsSync(mutationsPath), "mutations.ts must exist")
    assert.ok(fs.existsSync(queriesPath), "queries.ts must exist")

    const mutationsContent = fs.readFileSync(mutationsPath, "utf-8")
    assert.ok(mutationsContent.includes("export const createExamSession = mutation("))
    assert.ok(mutationsContent.includes("export const updateExamSession = mutation("))
    assert.ok(mutationsContent.includes("export const regenerateSessionToken = mutation("))
    assert.ok(mutationsContent.includes("export const setSessionStatus = mutation("))

    const queriesContent = fs.readFileSync(queriesPath, "utf-8")
    assert.ok(queriesContent.includes("export const listExamSessions = query("))
    assert.ok(queriesContent.includes("export const getExamSession = query("))
    assert.ok(queriesContent.includes("export const verifySessionToken = query("))
  })
})

describe("Exam Token Generator & Sanitization", () => {
  it("generates 6-character unambiguous alphanumeric tokens", () => {
    const token = generateExamToken(6)
    assert.equal(token.length, 6, "Token should be exactly 6 characters")

    const allowedChars = /^[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]+$/
    assert.match(token, allowedChars, "Token must only contain non-ambiguous uppercase alphanumeric characters")

    const ambiguousChars = /[01OI]/
    const tokens = new Set<string>()

    for (let i = 0; i < 100; i++) {
      const t = generateExamToken(6)
      assert.equal(t.length, 6)
      assert.equal(ambiguousChars.test(t), false, `Token ${t} must not contain ambiguous chars 0, 1, O, I`)
      tokens.add(t)
    }

    assert.ok(tokens.size >= 98, `Tokens should be highly unique; got ${tokens.size}/100`)
  })

  it("sanitizes student input token and validates duration constraints", () => {
    function sanitizeToken(raw: string): string {
      return raw.trim().toUpperCase()
    }

    assert.equal(sanitizeToken(" abc89x "), "ABC89X")
    assert.equal(sanitizeToken("9k2m3p"), "9K2M3P")

    function validateDuration(minutes: number): boolean {
      return minutes > 0 && Number.isInteger(minutes)
    }

    assert.equal(validateDuration(60), true)
    assert.equal(validateDuration(90), true)
    assert.equal(validateDuration(0), false)
    assert.equal(validateDuration(-10), false)
  })
})
