import { describe, it } from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const APPS_ROOT = path.resolve(__dirname, "..")

const TECHNICAL_LEAK_REGEX =
  /\b(SCR-[A-Z0-9\-]+|[A-Z]{2,10}-(FR|AC|NFR)-\d+|TASK-\d+|CHG-\d+|Fase\s+\d+)\b/g

async function loadMetrics() {
  return import(new URL("../convex/analysis/private/metrics.ts", import.meta.url).href)
}

async function loadClientHelpers() {
  return import(new URL("../lib/item-analysis.ts", import.meta.url).href)
}

function read(relativePath: string): string {
  return fs.readFileSync(path.join(APPS_ROOT, relativePath), "utf-8")
}

describe("Item quality metrics", () => {
  it("computes absorption from awarded item scores", async () => {
    const { absorptionPercent } = await loadMetrics()

    assert.equal(absorptionPercent([10, 5, 0], 10), 50)
    assert.equal(absorptionPercent([10, 10], 10), 100)
    assert.equal(absorptionPercent([0, 0], 10), 0)
    // Skor di luar rentang tetap dibatasi agar tidak menghasilkan angka negatif.
    assert.equal(absorptionPercent([12, -3], 10), 50)
    assert.equal(absorptionPercent([], 10), null)
    assert.equal(absorptionPercent([5], 0), null)
  })

  it("maps absorption to difficulty with fixed thresholds", async () => {
    const { difficultyFromAbsorption } = await loadMetrics()

    assert.equal(difficultyFromAbsorption(100), "mudah")
    assert.equal(difficultyFromAbsorption(70), "mudah")
    assert.equal(difficultyFromAbsorption(69.9), "sedang")
    assert.equal(difficultyFromAbsorption(40), "sedang")
    assert.equal(difficultyFromAbsorption(39.9), "sulit")
  })

  it("computes discrimination from upper and lower groups", async () => {
    const { discriminationIndex } = await loadMetrics()

    assert.equal(discriminationIndex([1, 1], [0, 0]), 1)
    assert.equal(discriminationIndex([1, 0.5], [0.5, 0]), 0.5)
    assert.equal(discriminationIndex([0, 0], [1, 1]), -1)
    // Seluruh peserta memperoleh skor sama: daya beda tidak terdefinisi.
    assert.equal(discriminationIndex([1, 1], [1, 1]), null)
    assert.equal(discriminationIndex([1], []), null)
    assert.equal(discriminationIndex([], [0]), null)
  })

  it("splits participants into upper and lower groups of 27 percent", async () => {
    const { splitUpperLowerGroups } = await loadMetrics()

    const participants = Array.from({ length: 10 }, (_, index) => ({
      participantId: `p${index}`,
      totalScore: index * 10,
    }))

    const groups = splitUpperLowerGroups(participants)
    assert.equal(groups.groupSize, 3)
    assert.deepEqual(
      groups.upper.map((entry: { totalScore: number }) => entry.totalScore),
      [90, 80, 70]
    )
    assert.deepEqual(
      groups.lower.map((entry: { totalScore: number }) => entry.totalScore),
      [20, 10, 0]
    )

    const tiny = splitUpperLowerGroups([
      { participantId: "a", totalScore: 90 },
      { participantId: "b", totalScore: 10 },
    ])
    assert.equal(tiny.groupSize, 1)
    assert.deepEqual(
      tiny.upper.map((entry: { participantId: string }) => entry.participantId),
      ["a"]
    )
    assert.deepEqual(
      tiny.lower.map((entry: { participantId: string }) => entry.participantId),
      ["b"]
    )
  })

  it("keeps item score fractions inside 0 and 1", async () => {
    const { itemScoreFraction } = await loadMetrics()

    assert.equal(itemScoreFraction(5, 10), 0.5)
    assert.equal(itemScoreFraction(12, 10), 1)
    assert.equal(itemScoreFraction(-2, 10), 0)
    assert.equal(itemScoreFraction(undefined, 10), 0)
    assert.equal(itemScoreFraction(5, 0), 0)
  })

  it("collects every review reason as text codes", async () => {
    const { reviewReasonsForItem, statusFromReasons } = await loadMetrics()

    const reasons = reviewReasonsForItem({
      absorption: 20,
      discrimination: -0.1,
      distribution: [
        { id: "a", label: "A", text: "Satu", isCorrect: true, count: 5 },
        { id: "b", label: "B", text: "Dua", isCorrect: false, count: 0 },
      ],
    })

    assert.deepEqual(reasons, ["negative_discrimination", "low_absorption", "unused_distractor"])
    assert.equal(statusFromReasons(reasons), "review")

    assert.deepEqual(
      reviewReasonsForItem({ absorption: 80, discrimination: 0 }),
      ["zero_discrimination"]
    )
    assert.deepEqual(
      reviewReasonsForItem({ absorption: 80, discrimination: null }),
      ["undefined_discrimination"]
    )
    assert.deepEqual(
      reviewReasonsForItem({ absorption: 80, discrimination: 0.5, distribution: null }),
      []
    )
  })

  it("guards passing percentage against zero participants", async () => {
    const { passingPercentage } = await loadMetrics()

    assert.equal(passingPercentage(0, 0), null)
    assert.equal(passingPercentage(3, 4), 75)
    assert.equal(passingPercentage(1, 3), 33.3)
  })
})

describe("Item analysis display helpers", () => {
  it("formats labels and metrics in Indonesian", async () => {
    const helpers = await loadClientHelpers()

    assert.equal(helpers.sessionKindLabel("remedial"), "Remedial")
    assert.equal(helpers.sessionKindLabel(undefined), "Reguler")
    assert.equal(helpers.difficultyLabel("sulit"), "Sulit")
    assert.equal(helpers.difficultyLabel(null), "-")
    assert.equal(helpers.formatMetricPercent(66.7), "66,7%")
    assert.equal(helpers.formatMetricPercent(null), "-")
    assert.equal(helpers.formatDiscrimination(null), "Tidak terdefinisi")
    assert.equal(helpers.itemTypeLabel("pg_kompleks"), "PG kompleks")
    assert.equal(
      helpers.reviewReasonsText(["low_absorption", "unused_distractor"]),
      "Daya serap rendah, Pengecoh tidak dipilih siapa pun"
    )
  })

  it("marks passing status only when the session has a passing score", async () => {
    const helpers = await loadClientHelpers()

    assert.equal(helpers.passingStatusLabel(80, 75), "Tuntas")
    assert.equal(helpers.passingStatusLabel(70, 75), "Belum tuntas")
    assert.equal(helpers.passingStatusLabel(70, null), null)
    assert.equal(helpers.passingStatusLabel(undefined, 75), null)
  })

  it("builds a CSV table with reasons, key labels, and BOM", async () => {
    const helpers = await loadClientHelpers()

    const analysis = {
      session: {
        id: "session-1",
        title: "Ujian Fiqih",
        kind: "reguler",
        sourceTitle: null,
        passingScore: 75,
        capAtPassingScore: false,
        subjectCode: "FIQIH",
        gradeLevel: "Kelas 7",
        totalPoints: 100,
        questionCount: 1,
      },
      totalParticipantCount: 5,
      submittedParticipantCount: 5,
      gradedParticipantCount: 5,
      pendingGradingCount: 0,
      minimumGradedParticipants: 5,
      hasEnoughData: true,
      summary: null,
      items: [
        {
          questionId: "q1",
          orderNumber: 1,
          type: "multiple_choice",
          points: 10,
          thinkingLevel: "memahami",
          achievementRef: "Dalil wudu",
          absorption: 40,
          difficulty: "sedang",
          discrimination: 0.2,
          distribution: [
            { id: "a", label: "A", text: "Satu", isCorrect: true, count: 3 },
            { id: "b", label: "B", text: "Dua", isCorrect: false, count: 0 },
          ],
          reasons: ["low_absorption", "unused_distractor"],
          status: "review",
        },
      ],
      achievements: { thinkingLevels: [], achievementRefs: [] },
      groups: { remedial: [], enrichment: [] },
    }

    const csv = helpers.buildItemAnalysisCsv(analysis)
    assert.ok(csv.startsWith("\uFEFF"))
    assert.ok(csv.includes("Daya Serap (%)"))
    assert.ok(csv.includes("A (kunci): 3"))
    assert.ok(csv.includes("Perlu ditinjau"))
    assert.ok(csv.includes("Daya serap rendah"))
    assert.ok(csv.includes("memahami"))
  })
})

describe("Analysis backend wiring", () => {
  it("stores the raw total alongside the capped total", () => {
    const schema = read("convex/schema.ts")
    assert.ok(schema.includes("rawTotalScore: v.optional(v.number())"))
    assert.ok(schema.includes("capAtPassingScore: v.optional(v.boolean())"))
  })

  it("caps remedial scores in both automatic and essay grading paths", () => {
    const mutations = read("convex/examSession/public/mutations.ts")
    const helpers = read("convex/examSession/private/helpers.ts")

    assert.ok(helpers.includes("export function applyRemedialCap"))
    assert.ok(helpers.includes('if (session.kind !== "remedial") return score'))
    assert.ok(helpers.includes("if (session.capAtPassingScore === false) return score"))
    assert.ok(helpers.includes("return Math.min(score, session.passingScore)"))

    const submitBlock = mutations.slice(
      mutations.indexOf("export const submitStudentExam"),
      mutations.indexOf("export const gradeEssayAnswer")
    )
    const gradeBlock = mutations.slice(mutations.indexOf("export const gradeEssayAnswer"))

    assert.match(submitBlock, /const totalScore = applyRemedialCap\(session, rawTotalScore\)/)
    assert.match(submitBlock, /rawTotalScore,\s*\n\s*totalScore,/)
    assert.match(gradeBlock, /const finalTotal = applyRemedialCap\(session, rawTotalScore\)/)
    assert.match(gradeBlock, /rawTotalScore,\s*\n\s*totalScore: finalTotal,/)
    // Koreksi essay hanya boleh dilakukan pemilik sesi, bukan sekadar pengajar yang login.
    assert.ok(gradeBlock.includes("session.creatorTokenIdentifier !== user.tokenIdentifier"))
  })

  it("gates the analysis query by identity and session ownership", () => {
    const queries = read("convex/analysis/public/queries.ts")

    assert.ok(queries.includes("await ctx.auth.getUserIdentity()"))
    assert.ok(queries.includes("if (!identity)"))
    assert.ok(queries.includes("session.creatorTokenIdentifier !== identity.tokenIdentifier"))
    assert.ok(queries.includes("MIN_GRADED_PARTICIPANTS"))
    assert.ok(queries.includes('gradingStatus !== "pending_essay"'))
    assert.ok(queries.includes('type === "essay" ? null : buildDistribution'))
    assert.ok(queries.includes("wrongQuestions"))
  })

  it("never exposes analysis numbers to the student sheet", () => {
    const queries = read("convex/examSession/public/queries.ts")
    const sheetBlock = queries.slice(
      queries.indexOf("export const getStudentExamSheet"),
      queries.indexOf("export const getParticipantAnswersForGrading")
    )

    assert.ok(!sheetBlock.includes("analysis"))
    assert.ok(!sheetBlock.includes("discrimination"))
    assert.ok(!sheetBlock.includes("achievement"))
  })

  it("links the analysis screen from recap and monitoring", () => {
    const recap = read("app/(main)/rekap-nilai/page.tsx")
    const monitoring = read("app/(main)/monitoring-sesi/page.tsx")

    assert.ok(recap.includes("/rekap-nilai/analisis/"))
    assert.ok(recap.includes("Jenis Sesi"))
    assert.ok(recap.includes("Nilai Sebelum Pembatasan"))
    assert.ok(recap.includes("Ketuntasan"))
    assert.ok(monitoring.includes("/rekap-nilai/analisis/"))
    assert.ok(monitoring.includes("Analisis Butir"))
  })

  it("renders the analysis screen states required by the contract", () => {
    const page = read("app/(main)/rekap-nilai/analisis/[idSesi]/page.tsx")
    const table = read("components/rekap-nilai/item-quality-table.tsx")
    const groups = read("components/rekap-nilai/remedial-groups.tsx")

    assert.ok(page.includes("Data belum cukup"))
    assert.ok(page.includes("minimumGradedParticipants"))
    assert.ok(page.includes("Unduh tabel"))
    assert.ok(page.includes("window.print()"))
    assert.ok(page.includes("Belum ada peserta pada sesi ini."))
    assert.ok(page.includes("masih menunggu koreksi essay"))
    assert.ok(table.includes("Perlu ditinjau"))
    assert.ok(table.includes("kunci"))
    assert.ok(table.includes("min-[900px]"))
    assert.ok(read("lib/item-analysis.ts").includes("Tidak terdefinisi"))
    assert.ok(groups.includes("/rekap-nilai/koreksi/"))
    assert.ok(groups.includes("butir-"))
  })

  it("keeps technical specification codes out of user-facing analysis text", () => {
    const files = [
      "app/(main)/rekap-nilai/analisis/[idSesi]/page.tsx",
      "components/rekap-nilai/item-quality-table.tsx",
      "components/rekap-nilai/achievement-breakdown.tsx",
      "components/rekap-nilai/remedial-groups.tsx",
      "app/(main)/rekap-nilai/page.tsx",
      "app/(main)/monitoring-sesi/page.tsx",
    ]

    for (const relativePath of files) {
      const content = read(relativePath)
      const leaks: string[] = []

      content.split("\n").forEach((line, index) => {
        if (line.includes("//") || line.includes("data-testid")) return
        const matches = line.match(TECHNICAL_LEAK_REGEX)
        if (matches) matches.forEach((match) => leaks.push(`${index + 1}:${match}`))
      })

      assert.deepEqual(leaks, [], `Specification codes leaked in ${relativePath}: ${leaks.join(", ")}`)
    }
  })
})
