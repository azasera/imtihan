export type SessionKind = "reguler" | "remedial" | "susulan"

export type ItemDifficulty = "mudah" | "sedang" | "sulit"

export type ItemReviewReasonCode =
  | "low_absorption"
  | "negative_discrimination"
  | "zero_discrimination"
  | "unused_distractor"
  | "undefined_discrimination"

export interface OptionDistribution {
  id: string
  label: string
  text: string
  isCorrect: boolean
  count: number
}

export interface SessionAnalysisItem {
  questionId: string
  orderNumber: number
  type: "multiple_choice" | "pg_kompleks" | "true_false" | "essay"
  points: number
  thinkingLevel: string | null
  achievementRef: string | null
  absorption: number | null
  difficulty: ItemDifficulty | null
  discrimination: number | null
  distribution: OptionDistribution[] | null
  reasons: ItemReviewReasonCode[]
  status: "good" | "review"
}

export interface AchievementRow {
  key: string
  label: string
  itemCount: number
  averageAbsorption: number
}

export interface AnalysisGroupMember {
  participantId: string
  studentName: string
  nisn: string
  className: string | null
  totalScore: number
  rawTotalScore: number
  wrongQuestions: Array<{ questionId: string; orderNumber: number }>
}

export interface SessionAnalysis {
  session: {
    id: string
    title: string
    kind: SessionKind
    sourceTitle: string | null
    passingScore: number | null
    capAtPassingScore: boolean
    subjectCode: string
    gradeLevel: string
    totalPoints: number
    questionCount: number
  }
  totalParticipantCount: number
  submittedParticipantCount: number
  gradedParticipantCount: number
  pendingGradingCount: number
  minimumGradedParticipants: number
  hasEnoughData: boolean
  summary: {
    averageScore: number
    highestScore: number
    lowestScore: number
    passingCount: number | null
    passingPercentage: number | null
  } | null
  items: SessionAnalysisItem[]
  achievements: {
    thinkingLevels: AchievementRow[]
    achievementRefs: AchievementRow[]
  }
  groups: {
    remedial: AnalysisGroupMember[]
    enrichment: AnalysisGroupMember[]
  }
}

const REVIEW_REASON_LABELS: Record<ItemReviewReasonCode, string> = {
  low_absorption: "Daya serap rendah",
  negative_discrimination: "Daya pembeda negatif",
  zero_discrimination: "Daya pembeda nol",
  unused_distractor: "Pengecoh tidak dipilih siapa pun",
  undefined_discrimination: "Daya pembeda tidak terdefinisi",
}

const ITEM_TYPE_LABELS: Record<SessionAnalysisItem["type"], string> = {
  multiple_choice: "Pilihan ganda",
  pg_kompleks: "PG kompleks",
  true_false: "Benar/Salah",
  essay: "Essay",
}

const SESSION_KIND_LABELS: Record<SessionKind, string> = {
  reguler: "Reguler",
  remedial: "Remedial",
  susulan: "Susulan",
}

export function reviewReasonLabel(reason: ItemReviewReasonCode): string {
  return REVIEW_REASON_LABELS[reason]
}

export function reviewReasonsText(reasons: ItemReviewReasonCode[]): string {
  if (reasons.length === 0) return "-"
  return reasons.map(reviewReasonLabel).join(", ")
}

export function itemTypeLabel(type: SessionAnalysisItem["type"]): string {
  return ITEM_TYPE_LABELS[type]
}

export function sessionKindLabel(kind: SessionKind | undefined): string {
  return SESSION_KIND_LABELS[kind ?? "reguler"]
}

export function difficultyLabel(difficulty: ItemDifficulty | null): string {
  if (difficulty === null) return "-"
  return difficulty.charAt(0).toUpperCase() + difficulty.slice(1)
}

export function formatMetricPercent(value: number | null): string {
  if (value === null) return "-"
  return `${value.toLocaleString("id-ID", { maximumFractionDigits: 1 })}%`
}

export function formatDiscrimination(value: number | null): string {
  if (value === null) return "Tidak terdefinisi"
  return value.toLocaleString("id-ID", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export function formatScore(value: number | undefined): string {
  return value === undefined ? "-" : String(value)
}

export function passingStatusLabel(
  totalScore: number | undefined,
  passingScore: number | null
): "Tuntas" | "Belum tuntas" | null {
  if (passingScore === null || totalScore === undefined) return null
  return totalScore >= passingScore ? "Tuntas" : "Belum tuntas"
}

export function escapeCsvCell(value: string | number): string {
  return `"${String(value).replace(/"/g, '""')}"`
}

/** Tabel unduhan memakai kolom yang sama dengan laporan di layar. */
export function buildItemAnalysisCsv(analysis: SessionAnalysis): string {
  const headers = [
    "No",
    "Tipe",
    "Bobot",
    "Daya Serap (%)",
    "Tingkat Kesukaran",
    "Daya Beda",
    "Sebaran Pilihan",
    "Status",
    "Alasan",
    "Tingkat Berpikir",
    "Rujukan Capaian",
  ]

  const rows = analysis.items.map((item) => {
    const distribution = item.distribution
      ? item.distribution
          .map((option) => `${option.label}${option.isCorrect ? " (kunci)" : ""}: ${option.count}`)
          .join("; ")
      : "-"

    return [
      item.orderNumber,
      itemTypeLabel(item.type),
      item.points,
      item.absorption ?? "",
      difficultyLabel(item.difficulty),
      item.discrimination === null ? "Tidak terdefinisi" : item.discrimination.toFixed(2),
      escapeCsvCell(distribution),
      item.status === "review" ? "Perlu ditinjau" : "Baik",
      escapeCsvCell(reviewReasonsText(item.reasons)),
      escapeCsvCell(item.thinkingLevel ?? "-"),
      escapeCsvCell(item.achievementRef ?? "-"),
    ]
  })

  const csv = [headers.join(","), ...rows.map((row) => row.join(","))].join("\r\n")
  return "\uFEFF" + csv
}
