import { describe, it } from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const APPS_ROOT = path.resolve(__dirname, "..")

const {
  DEFAULT_VIOLATION_THRESHOLD,
  enforcementSummary,
  formatSavedAnswerCount,
  parseViolationThresholdInput,
  violationThresholdHint,
} = (await import(new URL("../lib/session-integrity.ts", import.meta.url).href)) as typeof import(
  "../lib/session-integrity"
)

const TECHNICAL_LEAK_REGEX =
  /\b(SCR-[A-Z0-9\-]+|[A-Z]{2,10}-(FR|AC|NFR)-\d+|TASK-\d+|CHG-\d+|Fase\s+\d+)\b/

function read(relativePath: string): string {
  return fs.readFileSync(path.join(APPS_ROOT, relativePath), "utf-8")
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

describe("Ambang pelanggaran: isian pengajar", () => {
  it("menerima bilangan bulat 1 sampai 20", () => {
    assert.deepEqual(parseViolationThresholdInput("3"), { ok: true, value: 3 })
    assert.deepEqual(parseViolationThresholdInput(" 1 "), { ok: true, value: 1 })
    assert.deepEqual(parseViolationThresholdInput("20"), { ok: true, value: 20 })
  })

  it("menolak isian kosong, pecahan, dan nilai di luar batas", () => {
    assert.equal(parseViolationThresholdInput("").ok, false)
    assert.equal(parseViolationThresholdInput("0").ok, false)
    assert.equal(parseViolationThresholdInput("21").ok, false)
    assert.equal(parseViolationThresholdInput("2.5").ok, false)
    assert.equal(parseViolationThresholdInput("tiga").ok, false)
  })

  it("memakai ambang bawaan tiga kali", () => {
    assert.equal(DEFAULT_VIOLATION_THRESHOLD, 3)
    assert.equal(
      enforcementSummary("lock", undefined),
      "Kunci setelah 3 kali pindah tab."
    )
  })
})

describe("Ringkasan mode penegakan", () => {
  it("mode mencatat tidak pernah menyebut penguncian", () => {
    const record = enforcementSummary("record", 5)
    assert.ok(record.startsWith("Catat saja"))
    assert.ok(!record.includes("Kunci setelah"))
  })

  it("sesi lama tanpa kolom mode dianggap mencatat", () => {
    assert.ok(enforcementSummary(undefined, undefined).startsWith("Catat saja"))
  })

  it("mode kunci menyebut ambang yang dipilih", () => {
    assert.equal(enforcementSummary("lock", 7), "Kunci setelah 7 kali pindah tab.")
  })

  it("kalimat bantuan mengikuti validitas isian", () => {
    assert.ok(violationThresholdHint("4").includes("melewati 4 kali"))
    assert.ok(violationThresholdHint("").includes("wajib diisi"))
    assert.ok(violationThresholdHint("99").includes("antara 1 dan 20"))
  })

  it("jumlah jawaban tersimpan selalu berupa angka", () => {
    assert.equal(formatSavedAnswerCount(undefined), "0 jawaban tersimpan")
    assert.equal(formatSavedAnswerCount(4), "4 jawaban tersimpan")
  })
})

describe("Sumber backend mode penegakan", () => {
  const schema = read("convex/schema.ts")
  const helpers = read("convex/examSession/private/helpers.ts")
  const mutations = read("convex/examSession/public/mutations.ts")
  const queries = read("convex/examSession/public/queries.ts")

  it("menyimpan waktu kunci dan riwayat pembukaan pada peserta", () => {
    assert.ok(schema.includes("lockedAt: v.optional(v.number())"))
    assert.ok(schema.includes("unlockEvents: v.optional("))
    assert.ok(schema.includes("unlockedBy: v.string()"))
  })

  it("mengunci hanya mode kunci setelah pelanggaran melewati ambang", () => {
    assert.ok(helpers.includes("export function shouldLockAfterViolation("))
    assert.ok(helpers.includes('if (enforcementMode !== "lock") return false'))
    assert.ok(helpers.includes("return violationCount > threshold"))
    assert.ok(helpers.includes("DEFAULT_VIOLATION_THRESHOLD = 3"))
  })

  it("menolak penyimpanan jawaban selama lembar terkunci", () => {
    assert.ok(mutations.includes("participant.lockedAt !== undefined"))
    assert.ok(mutations.includes("Lembar jawaban Anda sedang dikunci oleh pengawas"))
  })

  it("pencatat pelanggaran mengembalikan status kunci dan dedupe di klien", () => {
    assert.ok(mutations.includes("export const recordTabViolation = mutation("))
    assert.ok(mutations.includes("locked: shouldLock || participant.lockedAt !== undefined"))
    assert.ok(mutations.includes("...(shouldLock ? { lockedAt: now } : {})"))
  })

  it("pembukaan kunci hanya oleh pengajar pemilik sesi dan tercatat", () => {
    assert.ok(mutations.includes("export const unlockParticipant = mutation("))
    assert.ok(mutations.includes("await requireAuthenticatedUser(ctx)"))
    assert.ok(mutations.includes("session.creatorTokenIdentifier !== user.tokenIdentifier"))
    assert.ok(mutations.includes("unlockedAt, unlockedBy: user.name"))
  })

  it("payload santri dan daftar monitoring memuat status kunci yang diperlukan", () => {
    assert.ok(queries.includes("isLocked: participant.lockedAt !== undefined"))
    assert.ok(queries.includes("savedAnswerCount: existingAnswers.filter(hasSavedAnswer).length"))
    assert.ok(queries.includes("savedAnswerCount: answers.filter(hasSavedAnswer).length"))
  })
})

describe("Sumber antarmuka mode penegakan", () => {
  const sesiPage = read("app/(main)/sesi-ujian/page.tsx")
  const monitoringPage = read("app/(main)/monitoring-sesi/page.tsx")
  const worksheet = read("app/ujian/ExamWorksheet.tsx")

  it("formulir jadwal menyediakan dua mode dan ambang hanya pada mode kunci", () => {
    assert.ok(sesiPage.includes("Catat saja"))
    assert.ok(sesiPage.includes("Kunci setelah ambang"))
    assert.ok(sesiPage.includes('enforcementMode: "lock" as const, violationThreshold'))
    assert.ok(sesiPage.includes("parseViolationThresholdInput(violationThresholdInput)"))
  })

  it("monitoring menampilkan label terkunci dan aksi buka kunci", () => {
    assert.ok(monitoringPage.includes("Terkunci"))
    assert.ok(monitoringPage.includes("Buka Kunci"))
    assert.ok(monitoringPage.includes("api.examSession.public.mutations.unlockParticipant"))
    assert.ok(monitoringPage.includes("formatSavedAnswerCount(participant.savedAnswerCount)"))
  })

  it("lembar santri menampilkan panel terkunci dan menonaktifkan pilihan", () => {
    assert.ok(worksheet.includes("Lembar Anda dikunci"))
    assert.ok(worksheet.includes("disabled={isLocked}"))
    assert.ok(worksheet.includes("disabled={isSubmittingFinal || isLocked}"))
    assert.ok(worksheet.includes("formatSavedAnswerCount(activeSheet?.savedAnswerCount)"))
  })

  it("satu perpindahan hanya dicatat sekali dan berhenti saat terkunci", () => {
    assert.ok(worksheet.includes("const isAwayRef = React.useRef(false)"))
    assert.ok(worksheet.includes("if (isAwayRef.current) return"))
    assert.ok(worksheet.includes("isAwayRef.current = false"))
    assert.ok(worksheet.includes("!sheet?.found || isLocked"))
  })
})

describe("Kebocoran kode spesifikasi pada berkas mode penegakan", () => {
  it("tidak membocorkan kode ke antarmuka pengguna", () => {
    assertNoTechnicalLeak("app/(main)/sesi-ujian/page.tsx")
    assertNoTechnicalLeak("app/(main)/monitoring-sesi/page.tsx")
    assertNoTechnicalLeak("app/ujian/ExamWorksheet.tsx")
  })
})
