export interface ExtracurricularItem {
  name: string
  score: "A" | "B" | "C" | string
  description: string
}

export const EXTRACURRICULAR_PREDICATES = [
  { value: "A", label: "A (Sangat Baik)" },
  { value: "B", label: "B (Baik)" },
  { value: "C", label: "C (Cukup)" },
] as const

export type ExtracurricularPredicate = "A" | "B" | "C"

export interface ExtracurricularDef {
  name: string
  category: "wajib" | "pilihan"
  defaultPredicate: ExtracurricularPredicate
  narratives: Record<ExtracurricularPredicate, string>
}

export const OFFICIAL_EXTRACURRICULARS: Record<string, ExtracurricularDef> = {
  Rohis: {
    name: "Rohis",
    category: "wajib",
    defaultPredicate: "A",
    narratives: {
      A: "Sangat aktif, bersemangat, dan menunjukkan adab yang mulia serta istiqomah dalam seluruh kegiatan pembinaan kerohanian Islam.",
      B: "Aktif dan berakhlak baik dalam mengikuti agenda pembinaan kerohanian Islam serta kegiatan ibadah harian.",
      C: "Cukup aktif dalam kegiatan pembinaan kerohanian Islam, perlu peningkatan disiplin dan kehadiran.",
    },
  },
  Futsal: {
    name: "Futsal",
    category: "pilihan",
    defaultPredicate: "A",
    narratives: {
      A: "Sangat menguasai teknik dasar bermain futsal, berstamina prima, dan menunjukkan sportivitas serta kerjasama tim yang tinggi.",
      B: "Mampu menerapkan teknik dasar bermain futsal dengan baik dan berpartisipasi aktif dalam latihan serta permainan tim.",
      C: "Cukup mampu mengikuti teknik bermain futsal, perlu peningkatan stamina, kelincahan, dan kedisiplinan berlatih.",
    },
  },
  Badminton: {
    name: "Badminton",
    category: "pilihan",
    defaultPredicate: "A",
    narratives: {
      A: "Sangat terampil dalam teknik servis, pukulan lob, smash, serta memiliki footwork dan kelincahan yang sangat baik.",
      B: "Terampil dalam teknik dasar bulu tangkis, servis, dan pukulan reli dengan koordinasi gerak yang baik.",
      C: "Cukup menguasai teknik dasar pukulan dan servis bulu tangkis, perlu memperbanyak latihan ketepatan bola.",
    },
  },
  Pingpong: {
    name: "Pingpong",
    category: "pilihan",
    defaultPredicate: "A",
    narratives: {
      A: "Sangat mahir dalam teknik pegangan bet, servis berputar, pukulan forehand dan backhand dengan respon cepat.",
      B: "Mampu melakukan servis dan reli pukulan forehand serta backhand dengan kontrol bola yang baik.",
      C: "Cukup mampu memukul dan mengembalikan bola, perlu melatih fokus gerak reflek dan koordinasi tangan.",
    },
  },
  Panahan: {
    name: "Panahan",
    category: "pilihan",
    defaultPredicate: "A",
    narratives: {
      A: "Sangat disiplin, fokus tinggi, memiliki postur memanah yang kokoh, dan akurasi bidikan sasaran sangat tepat.",
      B: "Mampu memegang busur dan anak panah dengan teknik yang benar serta konsisten membidik sasaran dengan baik.",
      C: "Cukup mampu mempraktikkan teknik dasar memanah, perlu peningkatan konsentrasi, ketenangan, dan kekuatan tarikan.",
    },
  },
  Volly: {
    name: "Volly",
    category: "pilihan",
    defaultPredicate: "A",
    narratives: {
      A: "Sangat mahir dalam teknik passing atas/bawah, servis, blocking, serta menunjukkan kekompakan kerjasama tim yang solid.",
      B: "Mampu melakukan passing bawah dan servis dengan baik serta aktif dalam formasi permainan tim voli.",
      C: "Cukup mampu melakukan teknik dasar passing, perlu melatih kelincahan gerak kaki dan kerjasama tim.",
    },
  },
  Agrobisnis: {
    name: "Agrobisnis",
    category: "pilihan",
    defaultPredicate: "A",
    narratives: {
      A: "Sangat antusias, teliti, dan terampil dalam teknik pembibitan, perawatan tanaman, serta pemanfaatan media tanam modern.",
      B: "Terampil dan bertanggung jawab dalam merawat tanaman, penyiraman, dan pemupukan dengan baik.",
      C: "Cukup peduli terhadap perawatan tanaman, perlu meningkatkan inisiatif dan ketelitian dalam berkebun.",
    },
  },
  TIK: {
    name: "TIK",
    category: "pilihan",
    defaultPredicate: "A",
    narratives: {
      A: "Sangat kreatif dan terampil dalam mengoperasikan perangkat komputer, aplikasi perkantoran, dan literasi digital secara produktif.",
      B: "Mampu mengoperasikan aplikasi komputer dan perangkat lunak dasar dengan baik serta bertanggung jawab.",
      C: "Cukup mampu menggunakan komputer untuk tugas dasar, perlu pendalaman penguasaan fitur aplikasi.",
    },
  },
  "Tata Boga": {
    name: "Tata Boga",
    category: "pilihan",
    defaultPredicate: "A",
    narratives: {
      A: "Sangat kreatif, higienis, dan terampil dalam praktik pengolahan bumbu, memasak, serta estetika penyajian hidangan.",
      B: "Terampil dalam menyiapkan bahan, memasak sesuai resep, dan menjaga kebersihan dapur dengan baik.",
      C: "Cukup mampu membantu proses memasak, perlu peningkatan kerapian, higienitas, dan ketepatan rasa masakan.",
    },
  },
  Jurnalis: {
    name: "Jurnalis",
    category: "pilihan",
    defaultPredicate: "A",
    narratives: {
      A: "Sangat berbakat dalam menggali ide berita, wawancara, menulis artikel inspiratif, dan penyuntingan media publikasi.",
      B: "Mampu menulis berita dan artikel dengan kaidah bahasa yang baik serta percaya diri dalam peliputan kegiatan.",
      C: "Cukup mampu menyusun rangkuman informasi, perlu memperkaya kosakata dan keaktifan menulis berita.",
    },
  },
  IPA: {
    name: "IPA",
    category: "pilihan",
    defaultPredicate: "A",
    narratives: {
      A: "Memiliki rasa ingin tahu ilmiah yang tinggi, kritis, dan sangat terampil dalam eksperimen serta pemecahan masalah sains.",
      B: "Memahami konsep sains dengan baik, aktif berdiskusi, dan cermat dalam melakukan pengamatan praktikum.",
      C: "Cukup memahami materi sains yang dipelajari, perlu peningkatan ketelitian dalam melakukan praktikum.",
    },
  },
  IPS: {
    name: "IPS",
    category: "pilihan",
    defaultPredicate: "A",
    narratives: {
      A: "Memiliki wawasan kebangsaan, sosial, dan sejarah yang luas, kritis dalam analisis fenomena kemasyarakatan.",
      B: "Aktif berdiskusi, memahami dinamika sosial dan geografis dengan baik serta memiliki kepekaan lingkungan.",
      C: "Cukup memahami topik sosial yang dibahas, perlu memperbanyak literasi bacaan dan keaktifan berpendapat.",
    },
  },
  Matematika: {
    name: "Matematika",
    category: "pilihan",
    defaultPredicate: "A",
    narratives: {
      A: "Memiliki logika berpikir analitis yang sangat tajam, cepat, dan tekun dalam menyelesaikan soal-soal eksploratif/olimpiade.",
      B: "Mampu memahami konsep hitung dan pola penalaran logika matematika dengan baik dan teliti.",
      C: "Cukup mampu menyelesaikan latihan soal matematika, perlu peningkatan ketekunan dan latihan mandiri.",
    },
  },
  Pramuka: {
    name: "Pramuka",
    category: "pilihan",
    defaultPredicate: "A",
    narratives: {
      A: "Sangat berjiwa kepemimpinan, disiplin, mandiri, dan menguasai keterampilan kepramukaan serta pengamalan dasa darma.",
      B: "Disiplin dan aktif mengikuti seluruh kegiatan kepanduan serta bekerjasama dengan baik dalam regu.",
      C: "Cukup mengikuti kegiatan kepramukaan, perlu peningkatan kedisiplinan dan inisiatif kepemimpinan.",
    },
  },
}

export function normalizeEkskulName(rawName: string): string {
  const trimmed = rawName.trim()
  if (/^jurnalis/i.test(trimmed)) return "Jurnalis"
  if (/^tik/i.test(trimmed)) return "TIK"
  if (/^tataboga|tata boga/i.test(trimmed)) return "Tata Boga"
  if (/^futsal/i.test(trimmed)) return "Futsal"
  if (/^badminton|bulutangkis/i.test(trimmed)) return "Badminton"
  if (/^pingpong|tenis meja/i.test(trimmed)) return "Pingpong"
  if (/^panahan/i.test(trimmed)) return "Panahan"
  if (/^volly|voli/i.test(trimmed)) return "Volly"
  if (/^agrobisnis/i.test(trimmed)) return "Agrobisnis"
  if (/^ipa|sains/i.test(trimmed)) return "IPA"
  if (/^ips/i.test(trimmed)) return "IPS"
  if (/^matematika/i.test(trimmed)) return "Matematika"
  if (/^rohis/i.test(trimmed)) return "Rohis"
  if (/^pramuka/i.test(trimmed)) return "Pramuka"
  return trimmed
}

export function getExtracurricularNarrative(
  ekskulName: string,
  predicate: "A" | "B" | "C" | string
): string {
  const normName = normalizeEkskulName(ekskulName)
  const def = OFFICIAL_EXTRACURRICULARS[normName]
  const p = (predicate.toUpperCase() === "A" || predicate.toUpperCase() === "B" || predicate.toUpperCase() === "C"
    ? predicate.toUpperCase()
    : "B") as ExtracurricularPredicate

  if (def && def.narratives[p]) {
    return def.narratives[p]
  }

  // Fallback umum bila nama ekskul belum terdaftar
  if (p === "A") {
    return `Sangat aktif, bersemangat tinggi, dan menunjukkan penguasaan keterampilan ${ekskulName} dengan sangat memuaskan.`
  }
  if (p === "C") {
    return `Cukup aktif dalam kegiatan ${ekskulName}, perlu meningkatkan ketekunan dan kedisiplinan dalam berlatih.`
  }
  return `Aktif dan terampil dalam mengikuti seluruh rangkaian kegiatan dan latihan ${ekskulName} dengan baik.`
}

export const OFFICIAL_CLASSES = [
  "7A",
  "7B",
  "7C",
  "8A",
  "8B",
  "8C",
  "8D",
  "9A",
  "9B",
  "9C",
  "10A",
  "10B",
  "11A",
  "11B",
  "12A",
  "12B",
  "MTA 1",
  "MTA 2",
  "MTA 3",
] as const

export function formatClassDisplay(className: string): string {
  if (!className) return ""
  return className
    .trim()
    .replace(/^KELAS\s*/i, "")
    .replace(/^VII\s*([A-D])/i, "7$1")
    .replace(/^VIII\s*([A-D])/i, "8$1")
    .replace(/^IX\s*([A-D])/i, "9$1")
    .replace(/^X\s*([A-B])/i, "10$1")
    .replace(/^XI\s*([A-B])/i, "11$1")
    .replace(/^XII\s*([A-B])/i, "12$1")
}
