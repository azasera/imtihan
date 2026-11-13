/**
 * Kosakata lembaga resmi dan tingkat paket bank soal.
 *
 * Berkas ini sengaja tidak mengimpor apa pun agar dapat dipakai fungsi Convex,
 * komponen klien, dan tes `node --test` dari satu sumber yang sama.
 */

export type Institution = "SMPITA" | "SMAITA" | "MTA"

export const INSTITUTIONS: readonly Institution[] = ["SMPITA", "SMAITA", "MTA"]

/** Nama resmi kepanjangan masing-masing lembaga. */
export const INSTITUTION_NAMES: Record<Institution, string> = {
  SMPITA: "Sekolah Menengah Pertama Islam Tahfizh Al Qur'an",
  SMAITA: "Sekolah Menengah Atas Islam Tahfizh Al Qur'an",
  MTA: "Manzhumah Takhoshush Al-Qur'an",
}

/** Label lembaga resmi. Untuk pilihan dropdown gunakan singkatan resminya: SMPITA, SMAITA, MTA. */
export const INSTITUTION_LABELS: Record<Institution, string> = {
  SMPITA: "SMPITA (Sekolah Menengah Pertama Islam Tahfizh Al Qur'an)",
  SMAITA: "SMAITA (Sekolah Menengah Atas Islam Tahfizh Al Qur'an)",
  MTA: "MTA (Manzhumah Takhoshush Al-Qur'an)",
}

/**
 * Tingkat yang tersimpan pada paket memakai label yang dikenali validasi kelas santri:
 * "Kelas 7" lolos pola `^(kelas\s*)?[7-9]` dan "MTA 3" lolos pola `^mta\s*[1-6]`,
 * sehingga suatu sesi dapat ditautkan ke daftar kelas tanpa menerjemahkan dua kosakata berbeda.
 */
export const INSTITUTION_LEVELS: Record<Institution, readonly string[]> = {
  SMPITA: ["Kelas 7", "Kelas 8", "Kelas 9"],
  SMAITA: ["Kelas 10", "Kelas 11", "Kelas 12"],
  MTA: ["MTA 1", "MTA 2", "MTA 3", "MTA 4", "MTA 5", "MTA 6"],
}

export function isInstitution(value: string): value is Institution {
  return (INSTITUTIONS as readonly string[]).includes(value)
}

export function levelsForInstitution(institution: Institution): readonly string[] {
  return INSTITUTION_LEVELS[institution]
}

/**
 * Lembaga tempat sebuah tingkat berada. Nilai warisan yang tidak lagi dipakai
 * (misalnya "Tarbiyah / Takhassus") menghasilkan kosong, bukan dipaksa masuk daftar.
 */
export function institutionForLevel(level: string): Institution | null {
  const trimmed = level.trim()
  if (!trimmed) return null
  for (const institution of INSTITUTIONS) {
    if (INSTITUTION_LEVELS[institution].some((candidate) => candidate.toLowerCase() === trimmed.toLowerCase())) {
      return institution
    }
  }
  return null
}

/**
 * Mencocokkan tulisan tingkat dengan label resmi lembaga. Selain label persis,
 * angka saja ("7") dan penulisan longgar ("kelas 10", "mta3") diterima dan
 * dikembalikan sebagai label baku; teks lain ditolak.
 */
export function matchInstitutionLevel(institution: Institution, level: string): string | null {
  const cleaned = level.trim().replace(/\s+/g, " ")
  const levels = INSTITUTION_LEVELS[institution]
  const exact = levels.find((candidate) => candidate.toLowerCase() === cleaned.toLowerCase())
  if (exact) return exact

  const bare = /^(?:\s*(?:kelas|mta)\s*)?(\d{1,2})\s*$/i.exec(cleaned)
  if (!bare) return null
  return levels.find((candidate) => candidate.endsWith(` ${bare[1]}`)) ?? null
}

export interface BankLevelPair {
  institution: Institution
  gradeLevel: string
}

/**
 * Memastikan pasangan lembaga dan tingkat yang akan disimpan pada paket.
 * Pesan yang dilempar adalah kalimat untuk pengajar, bukan galat teknis.
 */
export function resolveBankLevelPair(institution: string, gradeLevel: string): BankLevelPair {
  // Huruf besar-kecil nama lembaga ditoleransi di sisi tulis; pilihan layarnya tetap baku.
  const key = institution.trim().toUpperCase()
  if (!isInstitution(key)) {
    throw new Error(
      `Lembaga "${institution || "(kosong)"}" bukan lembaga resmi. Pilih salah satu: ${INSTITUTIONS.join(", ")}.`
    )
  }
  if (!gradeLevel.trim()) {
    throw new Error("Tingkat / kelas paket belum dipilih.")
  }

  const matched = matchInstitutionLevel(key, gradeLevel)
  if (!matched) {
    throw new Error(
      `Tingkat "${gradeLevel.trim()}" bukan jenjang resmi lembaga ${key}. Pilihan yang tersedia: ${INSTITUTION_LEVELS[key].join(", ")}.`
    )
  }

  return { institution: key, gradeLevel: matched }
}

/**
 * Kode mata pelajaran dipakai sebagai pengenal pada paket, jadi dibakukan huruf besar
 * dan tanpa spasi, serta tidak berubah setelah dipakai.
 */
export function normalizeSubjectCode(code: string): string {
  return code.trim().toUpperCase().replace(/[\s\-]+/g, "_").replace(/_+/g, "_").replace(/^_|_$/g, "")
}
