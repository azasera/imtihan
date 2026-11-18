/**
 * Modul sampling acak dan normalisasi pembobotan soal (Pilihan Ganda & Esai).
 * Mendukung pembagian proporsi soal (misal 20 PG bobot 70% dan 5 Esai bobot 30%).
 */

export interface QuestionCompositionConfig {
  enabled: boolean
  pgCount: number
  pgWeight: number // persentase bobot PG (misal 70)
  essayCount: number
  essayWeight: number // persentase bobot Esai (misal 30)
}

/**
 * Memvalidasi konfigurasi komposisi dan kecukupan stok butir soal di Bank Soal.
 */
export function validateQuestionComposition(
  config: QuestionCompositionConfig | undefined,
  totalPgAvailable: number,
  totalEssayAvailable: number
): { valid: boolean; error?: string } {
  if (!config || !config.enabled) {
    return { valid: true }
  }

  const { pgCount, pgWeight, essayCount, essayWeight } = config

  if (pgCount < 0 || essayCount < 0) {
    return { valid: false, error: "Jumlah butir soal tidak boleh bernilai negatif." }
  }

  if (pgCount === 0 && essayCount === 0) {
    return {
      valid: false,
      error: "Minimal harus ada 1 butir soal yang diujikan (Pilihan Ganda atau Esai).",
    }
  }

  const totalWeight = (pgWeight || 0) + (essayWeight || 0)
  if (totalWeight !== 100) {
    return {
      valid: false,
      error: `Total bobot nilai harus tepat 100% (saat ini ${totalWeight}%).`,
    }
  }

  if (pgCount > totalPgAvailable) {
    return {
      valid: false,
      error: `Jumlah butir Pilihan Ganda melebihi stok yang tersedia (diminta ${pgCount}, tersedia ${totalPgAvailable}).`,
    }
  }

  if (essayCount > totalEssayAvailable) {
    return {
      valid: false,
      error: `Jumlah butir Esai melebihi stok yang tersedia (diminta ${essayCount}, tersedia ${totalEssayAvailable}).`,
    }
  }

  return { valid: true }
}

/**
 * Mengambil sampel butir soal secara acak terpisah antara objektif (PG) dan esai (stratified random sampling).
 * Jika seedStr diberikan, pengacakan bersifat deterministik (dapat direproduksi).
 */
export function sampleQuestionsByComposition<T extends { _id: string; type: string }>(
  questions: T[],
  config: QuestionCompositionConfig,
  seedStr?: string
): T[] {
  if (!config.enabled) {
    return [...questions]
  }

  const objectiveQuestions = questions.filter((q) => q.type !== "essay")
  const essayQuestions = questions.filter((q) => q.type === "essay")

  const shuffle = (array: T[], seedPrefix: string) => {
    const arr = [...array]
    if (seedStr) {
      let seed = 0
      const combinedSeed = `${seedStr}_${seedPrefix}`
      for (let i = 0; i < combinedSeed.length; i++) {
        seed = (seed * 31 + combinedSeed.charCodeAt(i)) >>> 0
      }
      const random = () => {
        seed = (1664525 * seed + 1013904223) >>> 0
        return seed / 4294967296
      }
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1))
        const temp = arr[i]
        arr[i] = arr[j]
        arr[j] = temp
      }
    } else {
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        const temp = arr[i]
        arr[i] = arr[j]
        arr[j] = temp
      }
    }
    return arr
  }

  const sampledPg = shuffle(objectiveQuestions, "pg").slice(0, config.pgCount)
  const sampledEssay = shuffle(essayQuestions, "essay").slice(0, config.essayCount)

  return [...sampledPg, ...sampledEssay]
}

/**
 * Menghitung skor terbobot Pilihan Ganda (skala pgWeight, misal 70).
 * Rumus: (correctCount / totalPg) * pgWeight
 */
export function calculateNormalizedPgScore(
  correctCount: number,
  totalPg: number,
  pgWeight: number
): number {
  if (totalPg <= 0 || correctCount <= 0 || pgWeight <= 0) return 0
  const score = (correctCount / totalPg) * pgWeight
  return Math.round(score * 100) / 100
}

/**
 * Menghitung skor terbobot Esai (skala essayWeight, misal 30).
 * Rumus: (awardedPoints / maxPossiblePoints) * essayWeight
 */
export function calculateNormalizedEssayScore(
  awardedPoints: number,
  maxPossiblePoints: number,
  essayWeight: number
): number {
  if (maxPossiblePoints <= 0 || awardedPoints <= 0 || essayWeight <= 0) return 0
  const score = (awardedPoints / maxPossiblePoints) * essayWeight
  return Math.round(score * 100) / 100
}

export interface CompositionPreset {
  id: string
  label: string
  pgWeight: number
  essayWeight: number
}

export const COMPOSITION_PRESETS: CompositionPreset[] = [
  { id: "obj_only", label: "Hanya Objektif (100% : 0%)", pgWeight: 100, essayWeight: 0 },
  { id: "standard", label: "Standar (70% : 30%)", pgWeight: 70, essayWeight: 30 },
  { id: "balanced", label: "Seimbang (50% : 50%)", pgWeight: 50, essayWeight: 50 },
  { id: "essay_only", label: "Hanya Esai (0% : 100%)", pgWeight: 0, essayWeight: 100 },
]

export interface WeightBalanceResult {
  pgWeight: number
  essayWeight: number
}

/**
 * Menyeimbangkan bobot antara Objektif (PG/Benar-Salah) dan Esai secara cerdas.
 * - Jika jumlah butir salah satu model adalah 0, bobotnya otomatis 0% dan pasangannya 100%.
 * - Jika changedField diubah, model pasangannya otomatis melengkapi sisa 100% (100 - newValue).
 */
export function autoBalanceWeights(
  changedField: "pgWeight" | "essayWeight" | "pgCount" | "essayCount",
  current: {
    pgCount: number
    essayCount: number
    pgWeight: number
    essayWeight: number
  },
  newValue?: number
): WeightBalanceResult {
  const pgCount = changedField === "pgCount" ? (newValue ?? current.pgCount) : current.pgCount
  const essayCount = changedField === "essayCount" ? (newValue ?? current.essayCount) : current.essayCount

  // Aturan butir nol
  if (essayCount === 0 && pgCount > 0) {
    return { pgWeight: 100, essayWeight: 0 }
  }
  if (pgCount === 0 && essayCount > 0) {
    return { pgWeight: 0, essayWeight: 100 }
  }

  // Jika bobot Objektif diubah
  if (changedField === "pgWeight") {
    const val = Math.max(0, Math.min(100, newValue ?? current.pgWeight))
    return { pgWeight: val, essayWeight: 100 - val }
  }

  // Jika bobot Esai diubah
  if (changedField === "essayWeight") {
    const val = Math.max(0, Math.min(100, newValue ?? current.essayWeight))
    return { pgWeight: 100 - val, essayWeight: val }
  }

  // Jika jumlah butir berubah dan keduanya > 0, tapi bobot saat ini tidak berjumlah 100
  const currentTotal = current.pgWeight + current.essayWeight
  if (currentTotal !== 100) {
    if (current.pgWeight > 0 && current.essayWeight === 0) {
      return { pgWeight: 70, essayWeight: 30 }
    }
    const safePg = Math.max(0, Math.min(100, current.pgWeight))
    return { pgWeight: safePg, essayWeight: 100 - safePg }
  }

  return { pgWeight: current.pgWeight, essayWeight: current.essayWeight }
}

/**
 * Mengakumulasi skor PG dan Esai menjadi skor akhir (maksimal 100).
 */
export function calculateCompositeFinalScore(
  pgScore: number,
  essayScore: number
): number {
  const sum = (pgScore || 0) + (essayScore || 0)
  return Math.min(100, Math.max(0, Math.round(sum * 100) / 100))
}
