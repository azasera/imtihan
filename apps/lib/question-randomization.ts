/**
 * Modul pengacakan butir soal ujian (Fisher-Yates deterministik).
 * Mendukung pengacakan terkelompok: Pilihan Ganda / Objektif di awal, Esai di akhir.
 */

/**
 * Fisher-Yates shuffle deterministik berdasarkan seed (misal participantId).
 * Menjamin urutan soal yang diacak tetap konsisten saat santri me-refresh halaman (SESI-AC-003).
 */
export function deterministicShuffle<T>(array: T[], seedStr: string): T[] {
  const result = [...array]
  let seed = 0
  for (let i = 0; i < seedStr.length; i++) {
    seed = (seed * 31 + seedStr.charCodeAt(i)) >>> 0
  }

  const random = () => {
    seed = (1664525 * seed + 1013904223) >>> 0
    return seed / 4294967296
  }

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    const temp = result[i]
    result[i] = result[j]
    result[j] = temp
  }

  return result
}

/**
 * Menyusun urutan butir soal untuk lembar ujian santri.
 * Jika pengacakan aktif, butir soal dikelompokkan secara terstruktur:
 * 1. Kelompok soal objektif (pilihan ganda, benar/salah, pg kompleks) diacak sesama objektif di nomor-nomor awal.
 * 2. Kelompok soal esai diacak sesama esai di nomor-nomor akhir.
 * Jika pengacakan nonaktif, butir soal diurutkan sesuai orderNumber aslinya.
 */
export function groupAndShuffleQuestions<T extends { type?: string; orderNumber: number }>(
  questions: T[],
  seedStr: string,
  shouldRandomize: boolean
): T[] {
  if (!shouldRandomize) {
    return [...questions].sort((a, b) => a.orderNumber - b.orderNumber)
  }

  const objectiveQuestions = questions.filter((q) => q.type !== "essay")
  const essayQuestions = questions.filter((q) => q.type === "essay")

  const shuffledObjective = deterministicShuffle(objectiveQuestions, seedStr)
  const shuffledEssay = deterministicShuffle(essayQuestions, `${seedStr}_essay`)

  return [...shuffledObjective, ...shuffledEssay]
}
