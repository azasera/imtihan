export {
  requireAuthenticatedUser,
  type AuthenticatedUser,
} from "../../model/auth"

import { canonicalIdentifier } from "../../model/nisn"
export {
  deterministicShuffle,
  groupAndShuffleQuestions,
} from "../../../lib/question-randomization"

/**
 * Karakter yang aman dan mudah dibaca tanpa ambigu untuk token ujian.
 * Dikecualikan angka 0, 1, 8 dan huruf O, I, L, B agar santri tidak salah ketik di layar/proyektor.
 */
export const TOKEN_CHARACTERS = "2345679ACDEFGHJKMNPQRSTUVWXYZ"

/**
 * Menghasilkan token acak alfanumerik 6 digit.
 */
export function generateExamToken(length = 6): string {
  let result = ""
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * TOKEN_CHARACTERS.length)
    result += TOKEN_CHARACTERS[randomIndex]
  }
  return result
}

/** Batas tuntas sesi berupa bilangan bulat 0-100; nilai kosong berarti tanpa penanda. */
export function assertValidPassingScore(value: number | null | undefined): void {
  if (value === null || value === undefined) return

  if (!Number.isInteger(value) || value < 0 || value > 100) {
    throw new Error("Batas nilai tuntas harus bilangan bulat antara 0 dan 100, atau dikosongkan.")
  }
}

/** Ambang pelanggaran berupa bilangan bulat minimal 1 supaya mode kunci punya arti. */
export function assertValidViolationThreshold(value: number | null | undefined): void {
  if (value === null || value === undefined) return

  if (!Number.isInteger(value) || value < 1 || value > 20) {
    throw new Error("Ambang pelanggaran harus bilangan bulat antara 1 dan 20.")
  }
}

/**
 * Nomor induk dibandingkan tanpa spasi tepi, tanpa peduli besar-kecil huruf,
 * dan tanpa peduli nol di depan untuk nomor yang seluruhnya digit.
 */
export function normalizeNisn(value: string): string {
  return canonicalIdentifier(value)
}

/** Pilihan masa berlaku token yang ditawarkan ke pengajar; absen berarti token tetap. */
export const TOKEN_ROTATION_INTERVALS = [5, 15, 30] as const

export type TokenRotationInterval = (typeof TOKEN_ROTATION_INTERVALS)[number]

export function isTokenRotationInterval(value: number): value is TokenRotationInterval {
  return (TOKEN_ROTATION_INTERVALS as readonly number[]).includes(value)
}

/** Interval rotasi hanya boleh 5, 15, atau 30 menit; nilai kosong berarti token tetap. */
export function assertValidTokenRotationMinutes(value: number | null | undefined): void {
  if (value === null || value === undefined) return

  if (!Number.isInteger(value) || !isTokenRotationInterval(value)) {
    throw new Error("Masa berlaku token harus 5, 15, atau 30 menit, atau dipilih tetap sampai diganti.")
  }
}

/** Jatuh tempo pergantian berikutnya dihitung dari waktu token terakhir berganti. */
export function tokenRotationDueAt(rotatedAt: number, minutes: number): number {
  return rotatedAt + minutes * 60_000
}

export const DEFAULT_VIOLATION_THRESHOLD = 3

/**
 * Mode kunci baru berlaku setelah jumlah pelanggaran MELEWATI ambang sesi.
 * Ambang 3 berarti pelanggaran ke-4 yang mengunci; mode mencatat tidak pernah mengunci.
 */
export function shouldLockAfterViolation(
  enforcementMode: "record" | "lock" | undefined,
  violationThreshold: number | undefined,
  violationCount: number
): boolean {
  if (enforcementMode !== "lock") return false

  const threshold = violationThreshold ?? DEFAULT_VIOLATION_THRESHOLD
  return violationCount > threshold
}

/**
 * Nilai sesi remedial dipotong sampai batas tuntas sebagai bawaan. Pembatasan
 * hanya dilewati bila pengajar mematikannya atau batas tuntas tidak diisi.
 */
export function applyRemedialCap(
  session: {
    kind?: "reguler" | "remedial" | "susulan"
    capAtPassingScore?: boolean
    passingScore?: number
  },
  score: number
): number {
  if (session.kind !== "remedial") return score
  if (session.capAtPassingScore === false) return score
  if (typeof session.passingScore !== "number") return score
  return Math.min(score, session.passingScore)
}

/** Jawaban dianggap tersimpan bila berisi pilihan atau uraian, bukan sekadar penanda ragu-ragu. */
export function hasSavedAnswer(answer: {
  selectedOptionId?: string
  selectedOptionIds?: string[]
  essayAnswer?: string
}): boolean {
  return (
    Boolean(answer.selectedOptionId) ||
    (answer.selectedOptionIds?.length ?? 0) > 0 ||
    Boolean(answer.essayAnswer?.trim())
  )
}
