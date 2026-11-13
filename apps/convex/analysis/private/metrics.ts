/**
 * Perhitungan murni mutu butir soal. Modul ini tidak menyentuh basis data supaya
 * rumus dan ambangnya dapat diuji terpisah dari query Convex.
 */

/** Ambang minimal peserta ternilai sebelum metrik butir boleh ditampilkan. */
export const MIN_GRADED_PARTICIPANTS = 5

/** Proporsi kelompok atas dan bawah untuk daya beda (27% klasik). */
export const DISCRIMINATION_GROUP_RATIO = 0.27

/** Daya serap di bawah angka ini dianggap perlu ditinjau. */
export const LOW_ABSORPTION_PERCENT = 30

export type DifficultyLevel = "mudah" | "sedang" | "sulit"

export type ItemReviewReason =
  | "low_absorption"
  | "negative_discrimination"
  | "zero_discrimination"
  | "unused_distractor"
  | "undefined_discrimination"

export type ItemStatus = "good" | "review"

export interface OptionDistributionInput {
  id: string
  label: string
  text: string
  isCorrect: boolean
  count: number
}

export interface ScoredParticipant {
  participantId: string
  totalScore: number
}

export interface UpperLowerGroups {
  upper: ScoredParticipant[]
  lower: ScoredParticipant[]
  groupSize: number
}

/** Daya serap = rata-rata perolehan butir terhadap bobotnya, dalam persen. */
export function absorptionPercent(awardedScores: number[], points: number): number | null {
  if (points <= 0 || awardedScores.length === 0) return null

  const total = awardedScores.reduce((sum, score) => sum + Math.min(Math.max(score, 0), points), 0)
  return roundTo((total / (points * awardedScores.length)) * 100, 1)
}

/** Tingkat kesukaran mengikuti daya serap: 70% ke atas mudah, 40% ke atas sedang. */
export function difficultyFromAbsorption(absorption: number): DifficultyLevel {
  if (absorption >= 70) return "mudah"
  if (absorption >= 40) return "sedang"
  return "sulit"
}

/**
 * Daya beda = rata-rata perolehan kelompok atas dikurangi kelompok bawah.
 * Mengembalikan null bila tidak terdefinisi: peserta kurang dari dua atau
 * seluruh peserta memperoleh skor butir yang sama.
 */
export function discriminationIndex(
  upperFractions: number[],
  lowerFractions: number[]
): number | null {
  if (upperFractions.length === 0 || lowerFractions.length === 0) return null

  const all = [...upperFractions, ...lowerFractions]
  if (upperFractions.length + lowerFractions.length < 2) return null
  if (Math.max(...all) === Math.min(...all)) return null

  const mean = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / values.length
  return roundTo(mean(upperFractions) - mean(lowerFractions), 2)
}

/**
 * Membagi peserta menjadi kelompok atas dan bawah berdasarkan total nilai.
 * Jumlah kelompok minimal satu peserta agar sesi kecil tetap punya pembanding.
 */
export function splitUpperLowerGroups(
  participants: ScoredParticipant[],
  ratio = DISCRIMINATION_GROUP_RATIO
): UpperLowerGroups {
  const sorted = [...participants].sort((a, b) => {
    if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore
    return a.participantId.localeCompare(b.participantId)
  })

  if (sorted.length < 2) {
    return { upper: sorted, lower: [], groupSize: sorted.length }
  }

  const groupSize = Math.max(1, Math.round(sorted.length * ratio))
  return {
    upper: sorted.slice(0, groupSize),
    lower: sorted.slice(sorted.length - groupSize),
    groupSize,
  }
}

/** Perolehan butir seorang peserta sebagai pecahan bobot, dibatasi 0 sampai 1. */
export function itemScoreFraction(awarded: number | undefined, points: number): number {
  if (points <= 0) return 0
  return Math.min(Math.max((awarded ?? 0) / points, 0), 1)
}

/** Alasan butir perlu ditinjau. Alasan boleh lebih dari satu dan selalu berbentuk teks. */
export function reviewReasonsForItem(params: {
  absorption: number | null
  discrimination: number | null
  distribution?: OptionDistributionInput[] | null
}): ItemReviewReason[] {
  const reasons: ItemReviewReason[] = []

  if (params.discrimination === null) {
    reasons.push("undefined_discrimination")
  } else if (params.discrimination < 0) {
    reasons.push("negative_discrimination")
  } else if (params.discrimination === 0) {
    reasons.push("zero_discrimination")
  }

  if (params.absorption !== null && params.absorption < LOW_ABSORPTION_PERCENT) {
    reasons.push("low_absorption")
  }

  if (params.distribution?.some((option) => !option.isCorrect && option.count === 0)) {
    reasons.push("unused_distractor")
  }

  return reasons
}

export function statusFromReasons(reasons: ItemReviewReason[]): ItemStatus {
  return reasons.length > 0 ? "review" : "good"
}

/** Persentase ketuntasan peserta ternilai; null bila tidak ada peserta. */
export function passingPercentage(passingCount: number, gradedCount: number): number | null {
  if (gradedCount <= 0) return null
  return roundTo((passingCount / gradedCount) * 100, 1)
}

function roundTo(value: number, digits: number): number {
  const factor = 10 ** digits
  return Math.round((value + Number.EPSILON) * factor) / factor
}
