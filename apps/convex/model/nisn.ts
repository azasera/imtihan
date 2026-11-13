/**
 * Normalisasi nomor induk santri untuk perbandingan.
 *
 * Nilai resmi dapat tersimpan atau diketik dengan maupun tanpa nol di depan
 * (contoh: `0127121695` dan `127121695` adalah orang yang sama), sehingga
 * perbandingan string persis akan menolak santri yang mengetik format kartu.
 * Aturan nol depan hanya diterapkan pada nilai yang seluruhnya digit supaya
 * ID non-numerik seperti `24.02.001` tetap dibandingkan apa adanya.
 */
export function canonicalIdentifier(value: string): string {
  const trimmed = value.trim().toLowerCase()
  if (!/^\d+$/.test(trimmed)) return trimmed

  return trimmed.replace(/^0+(?=\d)/, "")
}

/** Dua nomor induk dianggap sama setelah dinormalisasi. */
export function identifierMatches(value: string | undefined, candidate: string): boolean {
  if (value === undefined) return false

  return canonicalIdentifier(value) === canonicalIdentifier(candidate)
}

/** Panjang NISN resmi pada kartu peserta dan ekspor identitas pesantren. */
const OFFICIAL_NISN_LENGTH = 10

/**
 * Bentuk resmi NISN untuk disimpan: seluruh digit dengan nol depan sampai 10 digit.
 * Sumber SiPAKSa mengirim nomor yang nol depannya sudah hilang (mis. `127121695`
 * untuk kartu `0127121695`), jadi dipulihkan di sini agar data master dan rekap
 * sama dengan kartu peserta. Nilai 10 digit atau lebih, dan nilai non-digit,
 * dibiarkan apa adanya.
 */
export function officialNisn(value: string | null | undefined): string | undefined {
  const trimmed = value?.trim() ?? ""
  if (!trimmed) return undefined
  if (!/^\d+$/.test(trimmed) || trimmed.length >= OFFICIAL_NISN_LENGTH) return trimmed

  return trimmed.padStart(OFFICIAL_NISN_LENGTH, "0")
}

/**
 * Mengambil 2 digit terakhir nomor identitas santri untuk verifikasi token ujian.
 * Standar utama: 2 angka terakhir NISN santri.
 * Jika santri belum memiliki NISN, sistem fallback ke 2 angka terakhir NIS atau santriId.
 */
export function extractStudentTwoDigits(student: {
  nisn?: string | null
  nis?: string | null
  santriId?: string | null
}): string {
  const nisnDigits = (student.nisn ?? "").replace(/\D/g, "")
  if (nisnDigits.length >= 2) {
    return nisnDigits.slice(-2)
  }

  const nisDigits = (student.nis ?? "").replace(/\D/g, "")
  if (nisDigits.length >= 2) {
    return nisDigits.slice(-2)
  }

  const santriIdDigits = (student.santriId ?? "").replace(/\D/g, "")
  if (santriIdDigits.length >= 2) {
    return santriIdDigits.slice(-2)
  }

  return "00"
}

export function getValidStudentTwoDigits(student: {
  nisn?: string | null
  nis?: string | null
  santriId?: string | null
}): string[] {
  return [extractStudentTwoDigits(student)]
}

/**
 * Membersihkan nama santri dari sufiks NISN atau angka dalam tanda kurung di ujung nama
 * Contoh: "Abdullah Muhammad Roestam (3142990266)" -> "Abdullah Muhammad Roestam"
 */
export function cleanStudentName(name: string): string {
  if (!name) return ""
  return name.replace(/\s*\((?:nisn[:\s]*)?\d+\)\s*$/i, "").trim()
}


