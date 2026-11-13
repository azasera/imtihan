import { describe, it } from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const APPS_ROOT = path.resolve(__dirname, "..")

const {
  buildContinuationTitle,
  formatPassingScore,
  parsePassingScoreInput,
  sessionKindLabel,
} = (await import(new URL("../lib/session-continuation.ts", import.meta.url).href)) as typeof import(
  "../lib/session-continuation"
)

const TECHNICAL_LEAK_REGEX = /\b(SCR-[A-Z0-9\-]+|[A-Z]{2,10}-(FR|AC|NFR)-\d+|TASK-\d+|CHG-\d+|Fase\s+\d+)\b/

function read(relativePath: string): string {
  return fs.readFileSync(path.join(APPS_ROOT, relativePath), "utf-8")
}

function blockBetween(content: string, startMarker: string, endMarker: string): string {
  const start = content.indexOf(startMarker)
  assert.notEqual(start, -1, `Missing marker: ${startMarker}`)
  const end = content.indexOf(endMarker, start + startMarker.length)
  assert.notEqual(end, -1, `Missing end marker: ${endMarker}`)
  return content.slice(start, end)
}

function assertNoTechnicalLeak(relativePath: string): void {
  const content = read(relativePath)
  const leaks = content
    .split("\n")
    .map((line, idx) => ({ line: idx + 1, text: line }))
    .filter(({ text }) => !text.includes("//") && !text.includes("data-testid"))
    .flatMap(({ line, text }) => {
      const match = text.match(TECHNICAL_LEAK_REGEX)
      return match ? [{ line, match: match[0] }] : []
    })

  assert.deepEqual(leaks, [], `Technical specification leak in ${relativePath}: ${JSON.stringify(leaks)}`)
}

describe("Label dan judul sesi lanjutan", () => {
  it("maps every kind to a readable label, treating an absent kind as reguler", () => {
    assert.equal(sessionKindLabel("reguler"), "Reguler")
    assert.equal(sessionKindLabel("remedial"), "Remedial")
    assert.equal(sessionKindLabel("susulan"), "Susulan")
    assert.equal(sessionKindLabel(undefined), "Reguler")
  })

  it("builds a continuation title from the source title", () => {
    assert.equal(buildContinuationTitle("Ujian Fiqih", "remedial"), "Ujian Fiqih — Remedial")
    assert.equal(buildContinuationTitle("  Ujian Fiqih  ", "susulan"), "Ujian Fiqih — Susulan")
    assert.equal(buildContinuationTitle("", "remedial"), "Remedial")
  })

  it("does not duplicate the kind suffix on a continuation of a continuation", () => {
    assert.equal(
      buildContinuationTitle("Ujian Fiqih — Remedial", "remedial"),
      "Ujian Fiqih — Remedial"
    )
    assert.equal(
      buildContinuationTitle("Ujian Fiqih (Susulan)", "susulan"),
      "Ujian Fiqih (Susulan)"
    )
    assert.equal(
      buildContinuationTitle("Ujian Fiqih — Remedial", "susulan"),
      "Ujian Fiqih — Remedial — Susulan"
    )
  })
})

describe("Penafsiran batas nilai tuntas", () => {
  it("treats an empty input as no threshold", () => {
    assert.deepEqual(parsePassingScoreInput(""), { ok: true, value: null })
    assert.deepEqual(parsePassingScoreInput("   "), { ok: true, value: null })
  })

  it("accepts whole numbers from 0 to 100, including the boundaries", () => {
    assert.deepEqual(parsePassingScoreInput("0"), { ok: true, value: 0 })
    assert.deepEqual(parsePassingScoreInput(" 75 "), { ok: true, value: 75 })
    assert.deepEqual(parsePassingScoreInput("100"), { ok: true, value: 100 })
  })

  it("rejects decimals, out-of-range values, and non-numeric text", () => {
    for (const input of ["75.5", "-1", "101", "abc", "NaN", "Infinity", "1e2", "+5"]) {
      const result = parsePassingScoreInput(input)
      assert.equal(result.ok, false, `${input} should be rejected`)
      if (!result.ok) {
        assert.match(result.message, /bilangan bulat antara 0 dan 100/)
      }
    }
  })

  it("formats thresholds for the copied-settings summary", () => {
    assert.equal(formatPassingScore(75), "75")
    assert.equal(formatPassingScore(0), "0")
    assert.equal(formatPassingScore(null), "Tanpa batas tuntas")
    assert.equal(formatPassingScore(undefined), "Tanpa batas tuntas")
  })
})

describe("Skema dan mutasi sesi lanjutan", () => {
  it("adds every session-level field as optional so existing rows stay valid", () => {
    const schema = read("convex/schema.ts")

    for (const field of [
      "passingScore: v.optional(v.number())",
      "kind: v.optional(",
      "sourceSessionId: v.optional(v.id(\"examSessions\"))",
      "capAtPassingScore: v.optional(v.boolean())",
      "eligibleNisns: v.optional(v.array(v.string()))",
      "enforcementMode: v.optional(v.union(v.literal(\"record\"), v.literal(\"lock\")))",
      "violationThreshold: v.optional(v.number())",
    ]) {
      assert.ok(schema.includes(field), `examSessions should declare ${field}`)
    }
  })

  it("validates and stores the passing score on regular session creation", () => {
    const mutations = read("convex/examSession/public/mutations.ts")
    const block = blockBetween(
      mutations,
      "export const createExamSession = mutation(",
      "export const createContinuationSession = mutation("
    )

    assert.match(block, /passingScore: v\.optional\(v\.number\(\)\)/)
    assert.match(block, /assertValidPassingScore\(args\.passingScore\)/)
    assert.match(block, /passingScore: args\.passingScore,/)
    assert.match(block, /kind: "reguler",/)
    assert.match(block, /enforcementMode: args\.enforcementMode \?\? "record",/)
    assert.match(block, /violationThreshold: args\.violationThreshold \?\? 3,/)
  })

  it("requires the owner, an ended source, and a non-empty roster in createContinuationSession", () => {
    const mutations = read("convex/examSession/public/mutations.ts")
    const block = blockBetween(
      mutations,
      "export const createContinuationSession = mutation(",
      "export const updateExamSession = mutation("
    )

    assert.match(block, /requireAuthenticatedUser\(ctx\)/)
    assert.match(block, /source\.creatorTokenIdentifier !== user\.tokenIdentifier/)
    assert.match(block, /source\.status !== "ended"/)
    assert.match(block, /Pilih paling sedikit satu santri/)
    assert.match(block, /bukan peserta sesi sumber/)
    assert.match(block, /normalizeNisn/)
  })

  it("copies settings and lets explicit arguments override the source", () => {
    const mutations = read("convex/examSession/public/mutations.ts")
    const block = blockBetween(
      mutations,
      "export const createContinuationSession = mutation(",
      "export const updateExamSession = mutation("
    )

    assert.match(block, /args\.bankId \?\? source\.bankId/)
    assert.match(block, /Math\.round\(args\.durationMinutes \?\? source\.durationMinutes\)/)
    assert.match(block, /args\.randomizeQuestions \?\? source\.randomizeQuestions/)
    assert.match(block, /args\.randomizeOptions \?\? source\.randomizeOptions/)
    assert.match(block, /args\.passingScore === null \? undefined : args\.passingScore \?\? source\.passingScore/)
    assert.match(block, /args\.enforcementMode \?\? source\.enforcementMode \?\? "record"/)
    assert.match(block, /args\.violationThreshold \?\? source\.violationThreshold \?\? 3/)
  })

  it("stores kind, source, roster, and the remedial cap rule", () => {
    const mutations = read("convex/examSession/public/mutations.ts")
    const block = blockBetween(
      mutations,
      "export const createContinuationSession = mutation(",
      "export const updateExamSession = mutation("
    )

    assert.match(block, /kind: args\.kind,/)
    assert.match(block, /sourceSessionId: source\._id,/)
    assert.match(block, /eligibleNisns: selectedNisns,/)
    assert.match(block, /capAtPassingScore: args\.kind === "remedial" \? args\.capAtPassingScore \?\? true : false,/)
    assert.match(block, /status: "draft",/)
    assert.match(block, /generateUniqueSessionToken\(ctx\)/)
  })

  it("never mutates the source session or copies its participants", () => {
    const mutations = read("convex/examSession/public/mutations.ts")
    const block = blockBetween(
      mutations,
      "export const createContinuationSession = mutation(",
      "export const updateExamSession = mutation("
    )

    assert.doesNotMatch(block, /ctx\.db\.patch\(/)
    assert.doesNotMatch(block, /ctx\.db\.delete\(/)
    assert.doesNotMatch(block, /ctx\.db\.insert\("examParticipants"/)
    assert.doesNotMatch(block, /examParticipants",[\s\S]*?tokenUsed/)
  })

  it("enforces the selected roster when a santri enters the session gate", () => {
    const mutations = read("convex/examSession/public/mutations.ts")
    const block = blockBetween(
      mutations,
      "export const enterExamSession = mutation(",
      "export const saveStudentAnswer = mutation("
    )

    assert.match(block, /session\.eligibleNisns !== undefined/)
    assert.match(block, /normalizeNisn\(nisn\) === normalizeNisn\(cleanNisn\)/)
    assert.match(block, /tidak termasuk daftar peserta sesi lanjutan/)
  })
})

describe("Query pemilik dan payload santri", () => {
  it("enriches owner listings with kind, source title, and the session threshold", () => {
    const queries = read("convex/examSession/public/queries.ts")
    const listBlock = blockBetween(
      queries,
      "export const listExamSessions = query(",
      "export const getExamSession = query("
    )

    assert.match(listBlock, /kind: session\.kind \?\? "reguler",/)
    assert.match(listBlock, /sourceTitle: source\?\.title \?\? null,/)
    assert.match(listBlock, /passingScore: session\.passingScore \?\? null,/)
    assert.match(listBlock, /creatorTokenIdentifier/)

    const detailBlock = blockBetween(
      queries,
      "export const getExamSession = query(",
      "export const verifySessionToken = query("
    )
    assert.match(detailBlock, /sourceTitle: source\?\.title \?\? null,/)
    assert.match(detailBlock, /passingScore: session\.passingScore \?\? null,/)
    assert.doesNotMatch(detailBlock, /bank\?\.passingScore/)
  })

  it("never exposes kind, source, roster, or threshold to the santri payloads", () => {
    const queries = read("convex/examSession/public/queries.ts")
    const verifyBlock = blockBetween(
      queries,
      "export const verifySessionToken = query(",
      "export const getStudentExamSheet = query("
    )
    const sheetBlock = blockBetween(
      queries,
      "export const getStudentExamSheet = query(",
      "export const getParticipantAnswersForGrading = query("
    )

    for (const block of [verifyBlock, sheetBlock]) {
      assert.doesNotMatch(block, /passingScore/)
      assert.doesNotMatch(block, /sourceSessionId/)
      assert.doesNotMatch(block, /eligibleNisns/)
      assert.doesNotMatch(block, /enforcementMode/)
    }
  })
})

describe("Antarmuka batas tuntas dan sesi lanjutan", () => {
  it("adds an optional passing-score field to the schedule form", () => {
    const page = read("app/(main)/sesi-ujian/page.tsx")

    assert.ok(page.includes("Batas Nilai Tuntas"))
    assert.ok(page.includes('id="session-passing-score"'))
    assert.ok(page.includes("parsePassingScoreInput"))
    assert.ok(page.includes("passingScore: passingScore.value ?? undefined"))
    assert.ok(page.includes("Kosong berarti tanpa penanda"))
  })

  it("offers the continuation action only on ended session cards", () => {
    const page = read("app/(main)/sesi-ujian/page.tsx")

    assert.ok(page.includes('session.status === "ended"'))
    assert.ok(page.includes("Buat Remedial / Susulan"))
    assert.ok(page.includes("<SessionContinuationDialog"))
    assert.ok(page.includes("Sesi sumber: {session.sourceTitle}"))
    assert.ok(page.includes("sessionKindLabel(session.kind)"))
  })

  it("offers the same continuation action from the monitoring header", () => {
    const page = read("app/(main)/monitoring-sesi/page.tsx")

    assert.ok(page.includes("Buat Remedial / Susulan"))
    assert.ok(page.includes('selectedSession.status === "ended"'))
    assert.ok(page.includes("<SessionContinuationDialog"))
  })

  it("keeps the continuation dialog roster empty and blocks submit until a santri is chosen", () => {
    const dialog = read("components/sesi-ujian/session-continuation-dialog.tsx")

    assert.match(dialog, /React\.useState<string\[\]>\(\[\]\)/)
    assert.ok(dialog.includes("Semua kotak centang mulai kosong."))
    assert.ok(dialog.includes("disabled={isSubmitting || pickedNisns.length === 0}"))
    assert.ok(dialog.includes("<Checkbox"))
    assert.ok(dialog.includes("Peserta Sesi Lanjutan"))
    assert.ok(dialog.includes("Memuat peserta sesi sumber..."))
    assert.ok(dialog.includes("Belum ada santri yang masuk ke sesi sumber"))
  })

  it("shows the remedial cap switch only for remedial and copies the enforcement mode", () => {
    const dialog = read("components/sesi-ujian/session-continuation-dialog.tsx")

    assert.ok(dialog.includes('kind === "remedial"'))
    assert.ok(dialog.includes("Nilai maksimal dibatasi sampai batas tuntas"))
    assert.ok(dialog.includes("Penegakan Integritas"))
    assert.ok(dialog.includes("enforcementMode"))
    assert.ok(dialog.includes("violationThreshold"))
    assert.ok(dialog.includes("Pengaturan yang Tersalin"))
  })

  it("uses the session threshold on the recap and removes the hardcoded 75", () => {
    const page = read("app/(main)/rekap-nilai/page.tsx")

    assert.ok(page.includes("selectedSession?.passingScore"))
    assert.ok(page.includes("Batas tuntas sesi belum diisi"))
    assert.ok(page.includes("passingScore !== null"))
    assert.ok(page.includes('"Batas Tuntas"'))
    assert.ok(!page.includes("const kkm = 75"))
  })

  it("contains no technical specification leak in changed user-facing files", () => {
    for (const file of [
      "app/(main)/sesi-ujian/page.tsx",
      "app/(main)/monitoring-sesi/page.tsx",
      "app/(main)/rekap-nilai/page.tsx",
      "components/sesi-ujian/session-continuation-dialog.tsx",
      "lib/session-continuation.ts",
    ]) {
      assertNoTechnicalLeak(file)
    }
  })
})
