export {
  requireAuthenticatedUser,
  type AuthenticatedUser,
} from "../../model/auth"

/**
 * Karakter yang aman dan mudah dibaca tanpa ambigu untuk token ujian.
 * Dikecualikan angka 0, 1 dan huruf O, I agar santri tidak salah ketik.
 */
const TOKEN_CHARACTERS = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"

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
