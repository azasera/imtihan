import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"

export default defineSchema({
  // Mata Pelajaran / Subjects
  subjects: defineTable({
    code: v.string(), // misal "TAHFIDZ", "FIQIH", "AQIDAH", "B_ARAB"
    name: v.string(), // misal "Tahfidz Al-Qur'an", "Fiqih Ibadah"
    description: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_code", ["code"]),

  // Paket Bank Soal / Question Banks
  questionBanks: defineTable({
    title: v.string(), // misal "Ujian Tengah Semester Fiqih Kelas 7"
    subjectCode: v.string(), // referensi ke code subject
    gradeLevel: v.string(), // misal "Kelas 7", "Marhalah Ula"
    description: v.optional(v.string()),
    totalPoints: v.number(), // bobot nilai total (default 100)
    passingScore: v.optional(v.number()), // nilai KKM misal 75
    authorTokenIdentifier: v.string(), // tokenIdentifier pengajar pembuat
    authorName: v.optional(v.string()),
    isArchived: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_author", ["authorTokenIdentifier"])
    .index("by_subject", ["subjectCode"])
    .index("by_grade", ["gradeLevel"]),

  // Butir Soal / Questions
  questions: defineTable({
    bankId: v.id("questionBanks"),
    orderNumber: v.number(),
    type: v.union(
      v.literal("multiple_choice"),
      v.literal("pg_kompleks"),
      v.literal("true_false"),
      v.literal("essay")
    ),
    stimulusText: v.optional(v.string()), // wacana teks panjang / stimulus
    stimulusMediaUrl: v.optional(v.string()), // URL gambar wacana / tabel / infografis
    questionText: v.string(),
    points: v.number(), // bobot butir soal
    // Pilihan Ganda & PG Kompleks & Benar/Salah:
    options: v.optional(
      v.array(
        v.object({
          id: v.string(), // "a", "b", "c", "d" atau "true", "false"
          label: v.string(), // "A", "B", "C", "D" atau "Benar", "Salah"
          text: v.string(),
          isCorrect: v.boolean(),
        })
      )
    ),
    // Essay:
    rubric: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_bank", ["bankId"])
    .index("by_bank_and_order", ["bankId", "orderNumber"]),

  // Sesi Ujian / Exam Sessions
  examSessions: defineTable({
    title: v.string(), // Nama sesi ujian, misal "Ujian Akhir Semester Fiqih"
    bankId: v.id("questionBanks"), // Bank soal rujukan
    token: v.string(), // Token akses 6 digit alfanumerik unik
    startTime: v.string(), // Waktu mulai pelaksanaan ujian
    endTime: v.string(), // Waktu batas akhir pelaksanaan ujian
    durationMinutes: v.number(), // Batas durasi pengerjaan per santri (menit)
    randomizeQuestions: v.boolean(), // Acak urutan butir soal
    randomizeOptions: v.boolean(), // Acak urutan opsi jawaban
    status: v.union(v.literal("draft"), v.literal("active"), v.literal("ended")), // Status sesi
    creatorTokenIdentifier: v.string(),
    creatorName: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_token", ["token"])
    .index("by_creator", ["creatorTokenIdentifier"])
    .index("by_status", ["status"])
    .index("by_bank", ["bankId"]),

  // Peserta Ujian / Exam Participants
  examParticipants: defineTable({
    sessionId: v.id("examSessions"),
    nisn: v.string(), // NISN atau Nomor Induk Santri
    studentName: v.string(), // Nama lengkap santri
    className: v.optional(v.string()), // Kelas santri
    tokenUsed: v.string(), // Token 6 digit yang digunakan saat masuk
    startedAt: v.number(), // Timestamp waktu santri mulai ujian
    finishedAt: v.optional(v.number()), // Timestamp waktu pengumpulan akhir
    status: v.union(v.literal("in_progress"), v.literal("submitted")), // Status pengerjaan
    tabViolations: v.optional(v.number()), // Jumlah frekuensi pelanggaran pindah tab/jendela
    multipleChoiceScore: v.optional(v.number()), // Skor pilihan ganda instan
    essayScore: v.optional(v.number()), // Skor butir essay setelah dikoreksi guru
    totalScore: v.optional(v.number()), // Total skor akhir santri (PG + Essay)
    gradingStatus: v.optional(
      v.union(v.literal("pending_essay"), v.literal("graded"))
    ), // Status penilaian
  })
    .index("by_session", ["sessionId"])
    .index("by_session_and_nisn", ["sessionId", "nisn"])
    .index("by_nisn", ["nisn"]),

  // Jawaban Santri / Student Answers
  studentAnswers: defineTable({
    participantId: v.id("examParticipants"),
    questionId: v.id("questions"),
    selectedOptionId: v.optional(v.string()), // ID opsi pilihan ganda / benar-salah yang dipilih santri
    selectedOptionIds: v.optional(v.array(v.string())), // Array ID opsi untuk PG Kompleks
    essayAnswer: v.optional(v.string()), // Jawaban uraian essay
    isDoubtful: v.boolean(), // Status ragu-ragu
    scoreAwarded: v.optional(v.number()), // Skor nilai yang diberikan untuk butir ini
    teacherFeedback: v.optional(v.string()), // Catatan evaluasi dari pengajar
    updatedAt: v.number(),
  })
    .index("by_participant", ["participantId"])
    .index("by_participant_and_question", ["participantId", "questionId"]),

  // Master Data Santri (SiPAKSa Sync)
  students: defineTable({
    santriId: v.string(), // e.g. "24.02.001" (primary identifier unik SiPAKSa)
    sipaksaId: v.string(), // ID dokumen/sistem di SiPAKSa
    nama: v.string(), // Nama lengkap santri
    nis: v.optional(v.string()), // Nomor Induk Santri lokal
    nisn: v.optional(v.string()), // NISN resmi
    jenjang: v.union(v.literal("SMPITA"), v.literal("SMAITA"), v.literal("MTA")),
    kelas: v.string(), // misal "7A", "10A", "MTA 1"
    jenisKelamin: v.string(), // "L" atau "P"
    status: v.string(), // "Aktif"
    dormitory: v.optional(v.string()),
    guruHalaqah: v.optional(v.string()),
    namaHalaqah: v.optional(v.string()),
    totalHafalan: v.optional(v.number()),
    targetJuz: v.optional(v.number()),
    syncedAt: v.number(),
  })
    .index("by_santri_id", ["santriId"])
    .index("by_nisn", ["nisn"])
    .index("by_nis", ["nis"])
    .index("by_jenjang", ["jenjang"])
    .index("by_kelas", ["kelas"]),
})
