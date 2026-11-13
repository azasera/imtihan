export type Institution = "SMPITA" | "SMAITA" | "MTA"

export interface InstitutionHeaderInfo {
  foundation: string
  city: string
  institutionName: string
  pesantrenTitle?: string
  pesantrenSubtitle?: string
  npsn?: string
  address: string
  province: string
}

export interface InstitutionLogoInfo {
  leftLogo: string
  rightLogo: string
  leftLogoAlt: string
  rightLogoAlt: string
}

/**
 * Metadata KOP Rapor resmi SiPAKSa sesuai lembaga santri di bawah naungan
 * Pondok Pesantren Islamic Centre At-Tauhid / Yayasan At-Tauhid Al Islamy Bangka Belitung.
 */
export const INSTITUTION_HEADERS: Record<Institution, InstitutionHeaderInfo> = {
  SMPITA: {
    foundation: "YAYASAN AT-TAUHID AL ISLAMY BANGKA BELITUNG",
    city: "KOTA PANGKALPINANG",
    pesantrenTitle: "PONDOK PESANTREN",
    pesantrenSubtitle: "ISLAMIC CENTRE  AT-TAUHID BANGKA BELITUNG",
    institutionName: "SMP ISLAM TAHFIDZ AL-QUR'AN AT-TAUHID",
    npsn: "69988220",
    address: "Jl. Gerunggang dalam RT 08 RW 03, Kel. Air Kepala Tujuh, Kec. Gerunggang Kota Pangkalpinang",
    province: "Provinsi Kepulauan Bangka Belitung",
  },
  SMAITA: {
    foundation: "YAYASAN AT-TAUHID AL ISLAMY BANGKA BELITUNG",
    city: "KOTA PANGKALPINANG",
    pesantrenTitle: "PONDOK PESANTREN",
    pesantrenSubtitle: "ISLAMIC CENTRE  AT-TAUHID BANGKA BELITUNG",
    institutionName: "SMA ISLAM TAHFIDZ AL-QUR'AN AT-TAUHID",
    address: "Jl. Gerunggang dalam RT 08 RW 03, Kel. Air Kepala Tujuh, Kec. Gerunggang Kota Pangkalpinang",
    province: "Provinsi Kepulauan Bangka Belitung",
  },
  MTA: {
    foundation: "YAYASAN AT-TAUHID AL ISLAMY BANGKA BELITUNG",
    city: "KOTA PANGKALPINANG",
    pesantrenTitle: "PONDOK PESANTREN",
    pesantrenSubtitle: "ISLAMIC CENTRE  AT-TAUHID BANGKA BELITUNG",
    institutionName: "MANZHUMAH TAKHOSHUSH AL-QUR'AN AT-TAUHID",
    address: "Jl. Gerunggang dalam RT 08 RW 03, Kel. Air Kepala Tujuh, Kec. Gerunggang Kota Pangkalpinang",
    province: "Provinsi Kepulauan Bangka Belitung",
  },
}

export function getInstitutionLogos(institution: Institution | string): InstitutionLogoInfo {
  const key = (institution || "").toUpperCase().trim()
  const rightLogo =
    key === "MTA" || key.includes("MANZHUMAH")
      ? "/logo/logo-mta.png"
      : key === "SMAITA" || key.includes("SMA")
        ? "/logo/logo-smaita.png"
        : "/logo/logo-smpita.png"

  const rightLogoAlt =
    key === "MTA" || key.includes("MANZHUMAH")
      ? "Logo MTA"
      : key === "SMAITA" || key.includes("SMA")
        ? "Logo SMAITA"
        : "Logo SMPITA"

  return {
    leftLogo: "/logo/ikon-ict.png",
    leftLogoAlt: "Logo Pesantren Islamic Centre At-Tauhid",
    rightLogo,
    rightLogoAlt,
  }
}

export function getInstitutionHeader(institution?: Institution | string): InstitutionHeaderInfo {
  const key = (institution || "SMPITA").toUpperCase().trim() as Institution
  return (
    INSTITUTION_HEADERS[key] ?? {
      foundation: "YAYASAN AT-TAUHID AL ISLAMY BANGKA BELITUNG",
      city: "KOTA PANGKALPINANG",
      pesantrenTitle: "PONDOK PESANTREN",
      pesantrenSubtitle: "ISLAMIC CENTRE  AT-TAUHID BANGKA BELITUNG",
      institutionName: "PONDOK PESANTREN AT-TAUHID",
      address: "Jl. Gerunggang dalam RT 08 RW 03, Kel. Air Kepala Tujuh, Kec. Gerunggang Kota Pangkalpinang",
      province: "Provinsi Kepulauan Bangka Belitung",
    }
  )
}

/**
 * Menghitung Nilai Akhir Rapor (NAR) dengan formula standar:
 * NAR = (2 * PH + STS + SAS) / 4
 */
export function calculateNAR(dailyScore: number, midtermScore: number, finalScore: number): number {
  const raw = (2 * dailyScore + midtermScore + finalScore) / 4
  return Math.round(raw * 100) / 100
}

/**
 * Menentukan predikat nilai rapor Kurikulum Merdeka & Diniyah At-Tauhid:
 * A: >= 89.5
 * B: >= 79.5
 * C: >= 69.5
 * D: < 69.5
 */
export function getGradePredicate(score: number): "A" | "B" | "C" | "D" {
  if (score >= 89.5) return "A"
  if (score >= 79.5) return "B"
  if (score >= 69.5) return "C"
  return "D"
}

/**
 * Menyusun deskripsi narasi Capaian Pembelajaran secara otomatis berdasarkan rentang nilai:
 * >= 85.5: Sangat baik dalam [CP]
 * >= 74.5: Baik dalam [CP]
 * >= 64.5: Cukup dalam [CP]
 * < 64.5: Perlu ditingkatkan dalam [CP]
 */
export function generateCompetencyNarrative(score: number, cpText: string): string {
  const cleanedCp = cpText.trim()
  if (!cleanedCp) return "-"

  if (score >= 85.5) {
    return `Sangat baik dalam ${cleanedCp}`
  }
  if (score >= 74.5) {
    return `Baik dalam ${cleanedCp}`
  }
  if (score >= 64.5) {
    return `Cukup dalam ${cleanedCp}`
  }
  return `Perlu ditingkatkan dalam ${cleanedCp}`
}

/**
 * Daftar Dimensi Profil Pelajar Pancasila (P5) standar Kurikulum Merdeka
 */
export const P5_DIMENSIONS = [
  "Beriman, bertakwa kepada Tuhan Yang Maha Esa, dan berakhlak mulia",
  "Berkebinekaan global",
  "Bergotong-royong",
  "Mandiri",
  "Bernalar kritis",
  "Kreatif",
] as const

/**
 * Mata Pelajaran Resmi dari Berkas Rapor Excel Pesantren At-Tauhid
 * (10 Mapel Umum Kurikulum Merdeka + 6 Mapel Diniyah Kepesantrenan KKM 70)
 */
export interface OfficialSubjectDefinition {
  code: string
  name: string
  category: "umum" | "diniyah"
  passingScore?: number
  defaultCp: string
}

export const OFFICIAL_SUBJECTS: OfficialSubjectDefinition[] = [
  // 10 Mapel Umum (Kurikulum Merdeka)
  {
    code: "PAI",
    name: "Pendidikan Agama Islam dan Budi Pekerti",
    category: "umum",
    defaultCp: "memahami materi Al-Qur'an, Hadits, akidah, dan akhlak terpuji",
  },
  {
    code: "PP",
    name: "Pendidikan Pancasila",
    category: "umum",
    defaultCp: "memahami norma dan hak kewajiban warga negara dalam UUD 1945",
  },
  {
    code: "BINDO",
    name: "Bahasa Indonesia",
    category: "umum",
    defaultCp: "menulis teks deskripsi dan menyampaikan gagasan secara runtut",
  },
  {
    code: "MTK",
    name: "Matematika",
    category: "umum",
    defaultCp: "menyelesaikan operasi bilangan bulat, pecahan, dan aljabar",
  },
  {
    code: "IPA",
    name: "Ilmu Pengetahuan Alam",
    category: "umum",
    defaultCp: "menganalisis hakikat sains, pengukuran, dan zat serta perubahannya",
  },
  {
    code: "IPS",
    name: "Ilmu Pengetahuan Sosial",
    category: "umum",
    defaultCp: "memahami konsep keluarga awal kehidupan dan interaksi sosial masyarakat",
  },
  {
    code: "BING",
    name: "Bahasa Inggris",
    category: "umum",
    defaultCp: "mengidentifikasi ungkapan sapaan, perkenalan diri, dan teks deskriptif",
  },
  {
    code: "PJOK",
    name: "Pendidikan Jasmani Olahraga dan Kesehatan",
    category: "umum",
    defaultCp: "memahami, membaca dan menganalisis olahraga bola basket dan bola volley",
  },
  {
    code: "INFOR",
    name: "Informatika",
    category: "umum",
    defaultCp: "memahami konsep berpikir komputasional dan teknologi informasi",
  },
  {
    code: "PRA",
    name: "Prakarya Kerajinan",
    category: "umum",
    defaultCp: "merancang dan membuat kerajinan bahan alam ramah lingkungan",
  },

  // 6 Mapel Diniyah (Kepesantrenan - KKM 70)
  {
    code: "AQIDAH",
    name: "Aqidah",
    category: "diniyah",
    passingScore: 70,
    defaultCp: "memahami prinsip-prinsip tauhid rububiyah, uluhiyah, dan asma wa sifat",
  },
  {
    code: "ADAB",
    name: "Adab & Akhlak",
    category: "diniyah",
    passingScore: 70,
    defaultCp: "menerapkan adab thalabul ilmi dan akhlakul karimah terhadap sesama",
  },
  {
    code: "FIQIH",
    name: "Fiqih",
    category: "diniyah",
    passingScore: 70,
    defaultCp: "memahami tata cara thaharah, shalat fardhu, dan shalat berjamaah",
  },
  {
    code: "BARAB",
    name: "Bahasa Arab",
    category: "diniyah",
    passingScore: 70,
    defaultCp: "menghafal mufradat dasar dan menyusun kalimat sederhana berbahasa Arab",
  },
  {
    code: "NAHWU",
    name: "Nahwu",
    category: "diniyah",
    passingScore: 70,
    defaultCp: "memahami pembagian kalam, isim, fi'il, dan huruf serta tanda i'rab",
  },
  {
    code: "SHIROH",
    name: "Shiroh",
    category: "diniyah",
    passingScore: 70,
    defaultCp: "memahami garis besar sejarah perjuangan Rasulullah SAW dan para sahabat",
  },
]

export const DINIYAH_SUBJECT_CODES = ["AQIDAH", "ADAB", "FIQIH", "BARAB", "B_ARAB", "NAHWU", "SHIROH"] as const
export const UMUM_SUBJECT_CODES = ["PAI", "PP", "BINDO", "MTK", "IPA", "IPS", "BING", "PJOK", "INFOR", "PRA"] as const

export function isDiniyahSubject(subjectCode: string): boolean {
  const upper = subjectCode.toUpperCase().replace(/\s+/g, "")
  return (DINIYAH_SUBJECT_CODES as readonly string[]).includes(upper) || upper.startsWith("DINIYAH")
}

export function isUmumSubject(subjectCode: string): boolean {
  const upper = subjectCode.toUpperCase().replace(/\s+/g, "")
  return (UMUM_SUBJECT_CODES as readonly string[]).includes(upper) || (!isDiniyahSubject(upper) && upper !== "")
}

export function getDefaultCpForSubject(subjectCode: string): string {
  const found = OFFICIAL_SUBJECTS.find((s) => s.code.toUpperCase() === subjectCode.toUpperCase())
  return found?.defaultCp ?? "memahami capaian pembelajaran semester ini dengan baik"
}

/**
 * Membersihkan nama santri dari sufiks NISN atau angka dalam tanda kurung di ujung nama
 * Contoh: "Abdullah Muhammad Roestam (3142990266)" -> "Abdullah Muhammad Roestam"
 */
export function cleanStudentName(name: string): string {
  if (!name) return ""
  return name.replace(/\s*\((?:nisn[:\s]*)?\d+\)\s*$/i, "").trim()
}

