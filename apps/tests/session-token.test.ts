import { describe, it } from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const APPS_ROOT = path.resolve(__dirname, "..")

const {
  TOKEN_ROTATION_OPTIONS,
  estimateTokenRotations,
  formatTokenCountdown,
  formatTokenRotationInterval,
} = (await import(new URL("../lib/session-token.ts", import.meta.url).href)) as typeof import(
  "../lib/session-token"
)

const TECHNICAL_LEAK_REGEX =
  /\b(SCR-[A-Z0-9\-]+|[A-Z]{2,10}-(FR|AC|NFR)-\d+|TASK-\d+|CHG-\d+|Fase\s+\d+)\b/

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
  const leaks = read(relativePath)
    .split("\n")
    .map((text, index) => ({ line: index + 1, text }))
    .filter(({ text }) => !text.includes("//") && !text.includes("data-testid"))
    .flatMap(({ line, text }) => {
      const match = text.match(TECHNICAL_LEAK_REGEX)
      return match ? [{ line, match: match[0] }] : []
    })

  assert.deepEqual(
    leaks,
    [],
    `Technical specification leak in ${relativePath}: ${JSON.stringify(leaks)}`
  )
}

describe("Masa berlaku token: label dan hitung mundur", () => {
  it("offers only the approved rotation intervals", () => {
    assert.deepEqual([...TOKEN_ROTATION_OPTIONS], [5, 15, 30])
  })

  it("labels fixed and rotating tokens in readable language", () => {
    assert.equal(formatTokenRotationInterval(null), "Tetap sampai diganti")
    assert.equal(formatTokenRotationInterval(undefined), "Tetap sampai diganti")
    assert.equal(formatTokenRotationInterval(5), "Berganti tiap 5 menit")
    assert.equal(formatTokenRotationInterval(30), "Berganti tiap 30 menit")
  })

  it("formats countdown seconds as mm:ss without going negative", () => {
    assert.equal(formatTokenCountdown(432), "Berganti dalam 07:12")
    assert.equal(formatTokenCountdown(59.9), "Berganti dalam 00:59")
    assert.equal(formatTokenCountdown(3600), "Berganti dalam 60:00")
    assert.equal(formatTokenCountdown(0), "Berganti dalam 00:00")
    assert.equal(formatTokenCountdown(-15), "Berganti dalam 00:00")
  })

  it("estimates how many times the token changes before the session window ends", () => {
    const start = "2026-11-04T08:00"
    const end = "2026-11-04T10:00"

    assert.equal(estimateTokenRotations(start, end, 5), 24)
    assert.equal(estimateTokenRotations(start, end, 15), 8)
    assert.equal(estimateTokenRotations(start, end, 30), 4)
    assert.equal(estimateTokenRotations("", end, 15), null)
    assert.equal(estimateTokenRotations(start, "not-a-date", 15), null)
    assert.equal(estimateTokenRotations(end, start, 15), null)
    assert.equal(estimateTokenRotations(start, end, 0), null)
  })
})

describe("Skema dan helper rotasi token", () => {
  it("adds optional rotation interval and last-rotation columns to examSessions", () => {
    const schema = read("convex/schema.ts")
    assert.ok(schema.includes("tokenRotationMinutes: v.optional(v.number())"))
    assert.ok(schema.includes("tokenRotatedAt: v.optional(v.number())"))
  })

  it("validates rotation intervals to 5, 15, or 30 minutes only", () => {
    const helpers = read("convex/examSession/private/helpers.ts")
    assert.ok(helpers.includes("export const TOKEN_ROTATION_INTERVALS = [5, 15, 30] as const"))
    assert.ok(helpers.includes("export function assertValidTokenRotationMinutes("))
    assert.ok(helpers.includes("Masa berlaku token harus 5, 15, atau 30 menit"))
    assert.ok(helpers.includes("export function tokenRotationDueAt(rotatedAt: number, minutes: number)"))
  })

  it("derives remaining seconds from the server rotation timestamp only for active sessions", () => {
    const tokenCode = read("convex/examSession/private/tokenCode.ts")
    assert.ok(tokenCode.includes("export async function generateUniqueSessionToken("))
    assert.ok(tokenCode.includes("export function tokenRotationState("))
    assert.ok(tokenCode.includes('session.status !== "active"'))
    assert.ok(tokenCode.includes("tokenRotationDueAt(tokenRotatedAt, tokenRotationMinutes)"))
    assert.ok(tokenCode.includes("Math.max(0, Math.ceil((expiresAt - now) / 1000))"))
  })
})

describe("Mutasi rotasi otomatis", () => {
  it("ships an internal mutation that only rotates active sessions with a due interval", () => {
    const rotation = read("convex/examSession/private/tokenRotation.ts")
    assert.ok(rotation.includes("export const rotateSessionTokenIfDue = internalMutation("))
    assert.ok(rotation.includes('if (session.status !== "active")'))
    assert.ok(rotation.includes("const interval = session.tokenRotationMinutes"))
    assert.ok(rotation.includes("if (!interval)"))
    assert.ok(rotation.includes("if (now < dueAt)"))
    assert.ok(rotation.includes("const token = await generateUniqueSessionToken(ctx)"))
    assert.ok(rotation.includes("token,\n      tokenRotatedAt: now,"))
    assert.ok(rotation.includes("tokenRotationDueAt(now, interval)"))
    assert.ok(
      rotation.includes(
        "internal.examSession.private.tokenRotation.rotateSessionTokenIfDue"
      )
    )
  })

  it("chains the next rotation through the Convex scheduler instead of a cron sweep", () => {
    const mutations = read("convex/examSession/public/mutations.ts")
    const schedulerBlock = blockBetween(
      mutations,
      "async function scheduleNextTokenRotation(",
      "export const createExamSession"
    )
    assert.ok(schedulerBlock.includes("if (!interval) return"))
    assert.ok(schedulerBlock.includes("await ctx.scheduler.runAt("))
    assert.ok(schedulerBlock.includes("tokenRotationDueAt(rotatedAt, interval)"))
    assert.equal(mutations.includes("crons.interval"), false)
  })

  it("stores the chosen interval on create and starts counting only when the session becomes active", () => {
    const mutations = read("convex/examSession/public/mutations.ts")

    assert.ok(mutations.includes("tokenRotationMinutes: v.optional(v.union(v.number(), v.null()))"))
    assert.ok(mutations.includes("assertValidTokenRotationMinutes(args.tokenRotationMinutes)"))
    assert.ok(mutations.includes("tokenRotationMinutes: args.tokenRotationMinutes ?? undefined"))

    const statusBlock = blockBetween(mutations, "export const setSessionStatus", "export const deleteExamSession")
    assert.ok(statusBlock.includes('session.status !== "active" && args.status === "active"'))
    assert.ok(statusBlock.includes("tokenRotatedAt: now"))
    assert.ok(statusBlock.includes("scheduleNextTokenRotation("))
  })

  it("records the rotation time on manual regeneration and reschedules the countdown", () => {
    const mutations = read("convex/examSession/public/mutations.ts")
    const regenerateBlock = blockBetween(
      mutations,
      "export const regenerateSessionToken",
      "export const setSessionStatus"
    )
    assert.ok(regenerateBlock.includes("const rotatedAt = Date.now()"))
    assert.ok(regenerateBlock.includes("tokenRotatedAt: rotatedAt"))
    assert.ok(regenerateBlock.includes("return { token: newToken, rotatedAt }"))
    assert.ok(regenerateBlock.includes("scheduleNextTokenRotation("))
    assert.ok(regenerateBlock.includes('session.creatorTokenIdentifier !== user.tokenIdentifier'))
  })

  it("accepts interval changes through the update mutation and clears them with null", () => {
    const mutations = read("convex/examSession/public/mutations.ts")
    const updateBlock = blockBetween(mutations, "export const updateExamSession", "export const regenerateSessionToken")
    assert.ok(updateBlock.includes("if (args.tokenRotationMinutes !== undefined)"))
    assert.ok(updateBlock.includes("updates.tokenRotationMinutes = args.tokenRotationMinutes ?? undefined"))
    assert.ok(updateBlock.includes("updates.tokenRotatedAt = args.tokenRotationMinutes === null ? undefined : now"))
    assert.ok(updateBlock.includes('if (effectiveStatus === "active" && effectiveInterval)'))
  })
})

describe("Query pemilik dan gerbang santri", () => {
  it("enriches both owner queries with the server-derived rotation state", () => {
    const queries = read("convex/examSession/public/queries.ts")
    const occurrences = queries.split("tokenRotationState(session, ").length - 1
    assert.ok(occurrences >= 2, `Expected both list and detail queries, found ${occurrences}`)
  })

  it("tells students to ask for the newest token when the typed token is no longer valid", () => {
    const queries = read("convex/examSession/public/queries.ts")
    const mutations = read("convex/examSession/public/mutations.ts")
    const message =
      "Token ujian tidak berlaku lagi. Minta token terbaru kepada pengawas, lalu ketik ulang token tersebut."

    assert.ok(queries.includes(message))
    assert.ok(mutations.includes(message))
  })

  it("checks the token before creating a participant so an old token never adds a row", () => {
    const mutations = read("convex/examSession/public/mutations.ts")
    const entryBlock = blockBetween(mutations, "export const enterExamSession", "export const saveStudentAnswer")

    const tokenLookup = entryBlock.indexOf('.withIndex("by_token"')
    const participantInsert = entryBlock.indexOf('ctx.db.insert("examParticipants"')
    assert.notEqual(tokenLookup, -1)
    assert.notEqual(participantInsert, -1)
    assert.ok(tokenLookup < participantInsert, "Token must be resolved before participant insert")
  })

  it("keeps saving and submitting independent from the current token", () => {
    const mutations = read("convex/examSession/public/mutations.ts")
    const saveBlock = blockBetween(mutations, "export const saveStudentAnswer", "export const recordTabViolation")
    const submitBlock = blockBetween(mutations, "export const submitStudentExam", "export const gradeEssayAnswer")

    for (const block of [saveBlock, submitBlock]) {
      assert.equal(block.includes("session.token"), false)
      assert.equal(block.includes("by_token"), false)
      assert.ok(block.includes("participantId"))
    }
  })
})

describe("Formulir jadwal dan kartu token monitoring", () => {
  it("offers a fixed/rotating segment with 5, 15, and 30 minute choices", () => {
    const page = read("app/(main)/sesi-ujian/page.tsx")
    assert.ok(page.includes("<ToggleGroup"))
    assert.ok(page.includes("Tetap sampai diganti"))
    assert.ok(page.includes("Berganti berkala"))
    assert.ok(page.includes("TOKEN_ROTATION_OPTIONS.map"))
    assert.ok(page.includes("Tiap {minutes} menit"))
    assert.ok(page.includes("estimateTokenRotations("))
    assert.ok(page.includes("Token diperkirakan berganti"))
  })

  it("sends the rotation interval only when the teacher enables it", () => {
    const page = read("app/(main)/sesi-ujian/page.tsx")
    assert.ok(page.includes("tokenRotationMinutes: rotationEnabled ? rotationMinutes : undefined"))
  })

  it("renders the monitoring token card with copy, fullscreen, regenerate, and countdown", () => {
    const monitoring = read("app/(main)/monitoring-sesi/page.tsx")
    assert.ok(monitoring.includes('import { SessionTokenCard } from "@/components/sesi-ujian/session-token-card"'))
    assert.ok(monitoring.includes("<SessionTokenCard"))
    assert.equal(monitoring.includes("KeyRoundIcon"), false)
  })

  it("keeps the fullscreen token layer free of student data and closable", () => {
    const card = read("components/sesi-ujian/session-token-card.tsx")

    assert.ok(card.includes('role="dialog"'))
    assert.ok(card.includes('aria-modal="true"'))
    assert.ok(card.includes('event.key === "Escape"'))
    assert.ok(card.includes('event.key !== "Tab"'))
    assert.ok(card.includes("trigger?.focus()"))
    assert.ok(card.includes("Tayangkan layar penuh"))
    assert.ok(card.includes("Keluar"))
    assert.ok(card.includes("formatTokenCountdown("))
    assert.ok(card.includes("document.body.style.overflow = \"hidden\""))

    assert.equal(card.includes("studentName"), false)
    assert.equal(card.includes("nisn"), false)
    assert.equal(card.includes("className ?"), false)
  })

  it("requests a fresh token copy from the server on manual regeneration", () => {
    const card = read("components/sesi-ujian/session-token-card.tsx")
    assert.ok(card.includes("regenerateSessionToken"))
    assert.ok(card.includes("result.rotatedAt"))
    assert.ok(card.includes("Token baru:"))
  })

  it("uses responsive token sizing for projectors and small screens", () => {
    const card = read("components/sesi-ujian/session-token-card.tsx")
    assert.ok(card.includes("text-[clamp(4rem,20vw,14rem)]"))
    const page = read("app/(main)/sesi-ujian/page.tsx")
    assert.ok(page.includes("grid-cols-1 sm:grid-cols-2 gap-3 items-start"))
  })
})

describe("Kebocoran kode spesifikasi teknis", () => {
  for (const relativePath of [
    "app/(main)/sesi-ujian/page.tsx",
    "app/(main)/monitoring-sesi/page.tsx",
    "components/sesi-ujian/session-token-card.tsx",
    "lib/session-token.ts",
  ]) {
    it(`keeps ${relativePath} free of technical specification codes`, () => {
      assertNoTechnicalLeak(relativePath)
    })
  }
})
