/**
 * Aturan daftar opsi jawaban pada formulir butir soal.
 * Dipakai layar pengajar dan dites tanpa browser karena menentukan jumlah opsi (A sampai E)
 * dan perpindahan kunci jawaban saat sebuah opsi dihapus.
 */

export const MIN_CHOICE_OPTIONS = 2
export const MAX_CHOICE_OPTIONS = 5

const OPTION_IDS = ["a", "b", "c", "d", "e"]
const OPTION_LABELS = ["A", "B", "C", "D", "E"]

export interface QuestionOptionDraft {
  id: string
  label: string
  text: string
  isCorrect: boolean
}

/** Label huruf untuk posisi tertentu, dipakai sampai batas atas lima opsi. */
export function optionLabel(index: number): string {
  return OPTION_LABELS[index] ?? String(index + 1)
}

/** Daftar opsi bawaan layar: empat baris kosong dengan kunci pada baris pertama. */
export function defaultChoiceOptions(count = 4): QuestionOptionDraft[] {
  return Array.from({ length: count }, (_, i) => ({
    id: OPTION_IDS[i] ?? `x${i}`,
    label: OPTION_LABELS[i] ?? String(i + 1),
    text: "",
    isCorrect: i === 0,
  }))
}

/** Menomori ulang huruf dan id opsi agar selalu mengikuti posisi setelah tambah/kurang. */
export function relabelOptions(options: QuestionOptionDraft[]): QuestionOptionDraft[] {
  return options.map((opt, i) => ({ ...opt, id: OPTION_IDS[i] ?? opt.id, label: optionLabel(i) }))
}

/** Menambah satu opsi di akhir daftar. Sudah lima? Daftar dikembalikan apa adanya. */
export function addChoiceOption(options: QuestionOptionDraft[]): QuestionOptionDraft[] {
  if (options.length >= MAX_CHOICE_OPTIONS) return options
  return relabelOptions([
    ...options,
    { id: "x", label: "?", text: "", isCorrect: false },
  ])
}

/**
 * Menghapus satu opsi. Dua opsi adalah batas bawah, jadi baris terakhir yang tersisa tidak bisa dihapus.
 * Bila opsi yang dihapus sedang menjadi kunci dan tidak ada kunci lain yang tersisa,
 * kunci dipindahkan ke opsi terdekat yang masih ada.
 */
export function removeChoiceOption(
  options: QuestionOptionDraft[],
  index: number
): QuestionOptionDraft[] {
  if (options.length <= MIN_CHOICE_OPTIONS) return options
  if (index < 0 || index >= options.length) return options

  const remaining = options.filter((_, i) => i !== index)
  const next = relabelOptions(remaining)

  const removedWasKey = options[index]?.isCorrect ?? false
  if (removedWasKey && !next.some((o) => o.isCorrect) && next.length > 0) {
    const fallbackIndex = Math.min(index, next.length - 1)
    next[fallbackIndex] = { ...next[fallbackIndex], isCorrect: true }
  }

  return next
}

/**
 * Opsi tersimpan dari basis data siap diisi ulang ke formulir sunting.
 * Butir essay dan butir lama tanpa opsi tidak memunculkan baris opsi sama sekali.
 */
export function resolveChoiceOptions(
  stored?: Array<{ id: string; label: string; text: string; isCorrect: boolean }> | null
): QuestionOptionDraft[] {
  if (!stored || stored.length === 0) return defaultChoiceOptions()
  return relabelOptions(stored.map((o) => ({ ...o })))
}

/** Kunci benar/salah dibaca dari opsi tersimpan; bawaannya "Benar". */
export function resolveTrueFalseAnswer(
  stored?: Array<{ id: string; isCorrect: boolean }> | null
): "true" | "false" {
  const correct = stored?.find((o) => o.isCorrect)
  return correct?.id === "false" ? "false" : "true"
}

/**
 * Baris opsi yang dikirim ke server: hanya baris berisi teks, dengan huruf mengikuti posisi.
 * Baris kosong yang belum diisi tidak ikut tersimpan supaya lembar santri tidak menampilkan opsi hampa.
 */
export function toStoredOptions(options: QuestionOptionDraft[]): QuestionOptionDraft[] {
  return options
    .filter((o) => o.text.trim().length > 0)
    .map((o, i) => ({
      id: OPTION_IDS[i] ?? o.id,
      label: optionLabel(i),
      text: o.text.trim(),
      isCorrect: o.isCorrect,
    }))
}

/** Kunci tunggal ikut dibuang bila baris kuncinya kosong, agar server tidak menolak diam-diam. */
export function normalizeSingleKey(options: QuestionOptionDraft[]): QuestionOptionDraft[] {
  const stored = toStoredOptions(options)
  if (stored.length === 0) return stored
  if (stored.some((o) => o.isCorrect)) return stored
  return stored.map((o, i) => ({ ...o, isCorrect: i === 0 }))
}
