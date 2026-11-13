import { v } from "convex/values"

import { query } from "../../_generated/server"
import {
  absorptionPercent,
  difficultyFromAbsorption,
  discriminationIndex,
  itemScoreFraction,
  MIN_GRADED_PARTICIPANTS,
  passingPercentage,
  reviewReasonsForItem,
  splitUpperLowerGroups,
  statusFromReasons,
  type OptionDistributionInput,
} from "../private/metrics"

const THINKING_LEVEL_LABELS: Record<string, string> = {
  mengingat: "Mengingat",
  memahami: "Memahami",
  mengaplikasikan: "Mengaplikasikan",
  menganalisis: "Menganalisis",
}

/**
 * Ringkasan mutu butir, capaian, dan kelompok tindak lanjut untuk satu sesi.
 * Seluruh angka dihitung di server dari jawaban tersimpan; pengajar lain dan
 * pemanggil tanpa login memperoleh keadaan kosong, dan rute santri tidak
 * pernah memanggil query ini.
 */
export const getSessionAnalysis = query({
  args: {
    sessionId: v.id("examSessions"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      return null
    }

    const session = await ctx.db.get("examSessions", args.sessionId)
    if (!session || session.creatorTokenIdentifier !== identity.tokenIdentifier) {
      return null
    }

    const bank = await ctx.db.get("questionBanks", session.bankId)
    const questions = await ctx.db
      .query("questions")
      .withIndex("by_bank", (q) => q.eq("bankId", session.bankId))
      .collect()
    questions.sort((a, b) => a.orderNumber - b.orderNumber)

    const source = session.sourceSessionId
      ? await ctx.db.get("examSessions", session.sourceSessionId)
      : null

    const participants = await ctx.db
      .query("examParticipants")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .collect()

    const submitted = participants.filter((participant) => participant.status === "submitted")
    const graded = submitted.filter((participant) => participant.gradingStatus !== "pending_essay")

    const answerRows = await Promise.all(
      graded.map(async (participant) => ({
        participantId: participant._id,
        answers: await ctx.db
          .query("studentAnswers")
          .withIndex("by_participant", (q) => q.eq("participantId", participant._id))
          .collect(),
      }))
    )

    const answersByParticipant = new Map(
      answerRows.map((row) => [
        row.participantId,
        new Map(row.answers.map((answer) => [answer.questionId, answer])),
      ])
    )

    const gradedScores = graded.map((participant) => ({
      participantId: participant._id,
      totalScore: participant.totalScore ?? 0,
    }))

    // Peringkat kelompok atas/bawah memakai nilai sebelum pembatasan agar sesi
    // remedial yang nilainya dipotong tetap punya pembeda yang bermakna.
    const rankingScores = graded.map((participant) => ({
      participantId: participant._id,
      totalScore: participant.rawTotalScore ?? participant.totalScore ?? 0,
    }))

    const passingScore = session.passingScore ?? null
    const gradedCount = graded.length
    const hasEnoughData = gradedCount >= MIN_GRADED_PARTICIPANTS

    const scores = gradedScores.map((entry) => entry.totalScore)
    const summary =
      scores.length === 0
        ? null
        : {
            averageScore: roundTo(scores.reduce((sum, score) => sum + score, 0) / scores.length, 1),
            highestScore: Math.max(...scores),
            lowestScore: Math.min(...scores),
            passingCount:
              passingScore === null
                ? null
                : gradedScores.filter((entry) => entry.totalScore >= passingScore).length,
            passingPercentage:
              passingScore === null
                ? null
                : passingPercentage(
                    gradedScores.filter((entry) => entry.totalScore >= passingScore).length,
                    gradedCount
                  ),
          }

    const items = hasEnoughData
      ? buildItemMetrics({
          questions,
          rankingScores,
          answersByParticipant,
        })
      : []

    return {
      session: {
        id: session._id,
        title: session.title,
        kind: session.kind ?? "reguler",
        sourceTitle: source?.title ?? null,
        passingScore,
        capAtPassingScore:
          (session.kind ?? "reguler") === "remedial" ? session.capAtPassingScore ?? true : false,
        subjectCode: bank?.subjectCode ?? "-",
        gradeLevel: bank?.gradeLevel ?? "-",
        totalPoints: bank?.totalPoints ?? 100,
        questionCount: questions.length,
      },
      totalParticipantCount: participants.length,
      submittedParticipantCount: submitted.length,
      gradedParticipantCount: gradedCount,
      pendingGradingCount: submitted.length - gradedCount,
      minimumGradedParticipants: MIN_GRADED_PARTICIPANTS,
      hasEnoughData,
      summary,
      items,
      achievements: hasEnoughData ? buildAchievements(items) : emptyAchievements(),
      groups: passingScore === null
        ? { remedial: [], enrichment: [] }
        : buildGroups({
            graded,
            gradedScores,
            answersByParticipant,
            questions,
            passingScore,
          }),
    }
  },
})

type StoredQuestion = {
  _id: string
  orderNumber: number
  type: "multiple_choice" | "pg_kompleks" | "true_false" | "essay"
  points: number
  thinkingLevel?: string
  achievementRef?: string
  options?: Array<{
    id: string
    label: string
    text: string
    isCorrect: boolean
  }>
}

type StoredAnswer = {
  scoreAwarded?: number
  selectedOptionId?: string
  selectedOptionIds?: string[]
}

function buildItemMetrics(params: {
  questions: StoredQuestion[]
  rankingScores: Array<{ participantId: string; totalScore: number }>
  answersByParticipant: Map<string, Map<string, StoredAnswer>>
}) {
  const { upper, lower } = splitUpperLowerGroups(params.rankingScores)

  return params.questions.map((question) => {
    const awardedScores = params.rankingScores.map(
      (participant) =>
        params.answersByParticipant.get(participant.participantId)?.get(question._id)?.scoreAwarded
    )

    const absorption = absorptionPercent(
      awardedScores.map((awarded) => awarded ?? 0),
      question.points
    )

    const fractionFor = (participantId: string) =>
      itemScoreFraction(
        params.answersByParticipant.get(participantId)?.get(question._id)?.scoreAwarded,
        question.points
      )

    const discrimination = discriminationIndex(
      upper.map((participant) => fractionFor(participant.participantId)),
      lower.map((participant) => fractionFor(participant.participantId))
    )

    const distribution =
      question.type === "essay" ? null : buildDistribution(question, params.answersByParticipant)

    const reasons = reviewReasonsForItem({ absorption, discrimination, distribution })

    return {
      questionId: question._id,
      orderNumber: question.orderNumber,
      type: question.type,
      points: question.points,
      thinkingLevel: question.thinkingLevel ?? null,
      achievementRef: question.achievementRef?.trim() || null,
      absorption,
      difficulty: absorption === null ? null : difficultyFromAbsorption(absorption),
      discrimination,
      distribution,
      reasons,
      status: statusFromReasons(reasons),
    }
  })
}

function buildDistribution(
  question: StoredQuestion,
  answersByParticipant: Map<string, Map<string, StoredAnswer>>
): OptionDistributionInput[] | null {
  if (!question.options || question.options.length === 0) return null

  const counts = new Map<string, number>()

  for (const answers of answersByParticipant.values()) {
    const answer = answers.get(question._id)
    if (!answer) continue

    if (question.type === "pg_kompleks") {
      for (const optionId of answer.selectedOptionIds ?? []) {
        counts.set(optionId, (counts.get(optionId) ?? 0) + 1)
      }
    } else if (answer.selectedOptionId) {
      counts.set(answer.selectedOptionId, (counts.get(answer.selectedOptionId) ?? 0) + 1)
    }
  }

  return question.options.map((option) => ({
    id: option.id,
    label: option.label,
    text: option.text,
    isCorrect: option.isCorrect,
    count: counts.get(option.id) ?? 0,
  }))
}

function buildAchievements(
  items: Array<{
    absorption: number | null
    thinkingLevel: string | null
    achievementRef: string | null
  }>
) {
  const byThinking = new Map<string, { label: string; total: number; count: number }>()
  const byAchievement = new Map<string, { label: string; total: number; count: number }>()

  for (const item of items) {
    if (item.absorption === null) continue

    if (item.thinkingLevel) {
      const entry = byThinking.get(item.thinkingLevel) ?? {
        label: THINKING_LEVEL_LABELS[item.thinkingLevel] ?? item.thinkingLevel,
        total: 0,
        count: 0,
      }
      entry.total += item.absorption
      entry.count += 1
      byThinking.set(item.thinkingLevel, entry)
    }

    if (item.achievementRef) {
      const entry = byAchievement.get(item.achievementRef) ?? {
        label: item.achievementRef,
        total: 0,
        count: 0,
      }
      entry.total += item.absorption
      entry.count += 1
      byAchievement.set(item.achievementRef, entry)
    }
  }

  const toRows = (map: Map<string, { label: string; total: number; count: number }>) =>
    [...map.entries()]
      .map(([key, entry]) => ({
        key,
        label: entry.label,
        itemCount: entry.count,
        averageAbsorption: roundTo(entry.total / entry.count, 1),
      }))
      .sort((a, b) => a.label.localeCompare(b.label))

  return {
    thinkingLevels: toRows(byThinking),
    achievementRefs: toRows(byAchievement),
  }
}

function emptyAchievements() {
  return { thinkingLevels: [], achievementRefs: [] }
}

function buildGroups(params: {
  graded: Array<{
    _id: string
    studentName: string
    nisn: string
    className?: string
    totalScore?: number
    rawTotalScore?: number
  }>
  gradedScores: Array<{ participantId: string; totalScore: number }>
  answersByParticipant: Map<string, Map<string, StoredAnswer>>
  questions: StoredQuestion[]
  passingScore: number
}) {
  const scoreByParticipant = new Map(
    params.gradedScores.map((entry) => [entry.participantId, entry.totalScore])
  )

  const toMember = (participant: (typeof params.graded)[number]) => {
    const answers = params.answersByParticipant.get(participant._id)
    const wrongQuestions = params.questions
      .filter((question) => (answers?.get(question._id)?.scoreAwarded ?? 0) < question.points)
      .map((question) => ({
        questionId: question._id,
        orderNumber: question.orderNumber,
      }))

    return {
      participantId: participant._id,
      studentName: participant.studentName,
      nisn: participant.nisn,
      className: participant.className ?? null,
      totalScore: scoreByParticipant.get(participant._id) ?? 0,
      rawTotalScore: participant.rawTotalScore ?? participant.totalScore ?? 0,
      wrongQuestions,
    }
  }

  const remedial = params.graded
    .filter((participant) => (scoreByParticipant.get(participant._id) ?? 0) < params.passingScore)
    .sort((a, b) => (scoreByParticipant.get(a._id) ?? 0) - (scoreByParticipant.get(b._id) ?? 0))
    .map(toMember)

  const enrichment = params.graded
    .filter((participant) => (scoreByParticipant.get(participant._id) ?? 0) >= params.passingScore)
    .sort((a, b) => (scoreByParticipant.get(b._id) ?? 0) - (scoreByParticipant.get(a._id) ?? 0))
    .map(toMember)

  return { remedial, enrichment }
}

function roundTo(value: number, digits: number): number {
  const factor = 10 ** digits
  return Math.round((value + Number.EPSILON) * factor) / factor
}
