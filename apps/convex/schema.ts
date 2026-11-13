import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"

export default defineSchema({
  // Mata Pelajaran / Subjects
  subjects: defineTable({
    code: v.string(), // misal "PAI", "BINDO", "AQIDAH", "FIQIH"
    name: v.string(), // misal "Pendidikan Agama Islam", "Aqidah"
    description: v.optional(v.string()),
    category: v.optional(v.union(v.literal("umum"), v.literal("diniyah"))),
    passingScore: v.optional(v.number()), // KKM (misal 70 untuk mapel diniyah)
    // Baris lama tidak ikut ditulis ulang: absen berarti masih aktif dipakai.
    isActive: v.optional(v.boolean()),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  }).index("by_code", ["code"]),

  // Paket Bank Soal / Question Banks
  questionBanks: defineTable({
    title: v.string(), // misal "Ujian Tengah Semester Fiqih Kelas 7"
    subjectCode: v.string(), // referensi ke code subject
    gradeLevel: v.string(), // label tingkat resmi, misal "Kelas 7" atau "MTA 3"
    // Lembaga tempat tingkat itu berada. Kosong pada paket lama yang tingkatnya
    // masih memakai label karangan; nilainya divalidasi bersama gradeLevel saat ditulis.
    institution: v.optional(v.union(v.literal("SMPITA"), v.literal("SMAITA"), v.literal("MTA"))),
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
    stimulusMediaStorageId: v.optional(v.id("_storage")), // ID berkas gambar di Convex storage (bila diunggah langsung)
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
    // Tiga kolom di bawah ini hanya untuk pengajar: pembahasan tidak pernah ikut
    // ke payload santri, dan absennya berarti butir belum ditandai.
    explanation: v.optional(v.string()), // pembahasan / kunci uraian
    thinkingLevel: v.optional(
      v.union(
        v.literal("mengingat"),
        v.literal("memahami"),
        v.literal("mengaplikasikan"),
        v.literal("menganalisis")
      )
    ),
    achievementRef: v.optional(v.string()), // label capaian materi singkat
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
    passingScore: v.optional(v.number()), // Batas nilai tuntas khusus sesi; absen berarti tanpa penanda
    kind: v.optional(
      v.union(v.literal("reguler"), v.literal("remedial"), v.literal("susulan"))
    ), // Jenis sesi; absen dibaca sebagai reguler
    sourceSessionId: v.optional(v.id("examSessions")), // Sesi asal untuk remedial/susulan
    capAtPassingScore: v.optional(v.boolean()), // Nilai remedial dibatasi sampai batas tuntas
    eligibleNisns: v.optional(v.array(v.string())), // Peserta terpilih; absen berarti terbuka
    enforcementMode: v.optional(v.union(v.literal("record"), v.literal("lock"))), // Mode penegakan integritas
    violationThreshold: v.optional(v.number()), // Jumlah pelanggaran sebelum lembar terkunci
    tokenRotationMinutes: v.optional(v.number()), // Interval rotasi token; absen berarti tetap sampai diganti
    tokenRotatedAt: v.optional(v.number()), // Waktu token terakhir berganti, dipakai hitung mundur
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
    rawTotalScore: v.optional(v.number()), // Total sebelum pembatasan batas tuntas sesi remedial
    totalScore: v.optional(v.number()), // Total skor akhir santri (PG + Essay), sudah dibatasi bila berlaku
    gradingStatus: v.optional(
      v.union(v.literal("pending_essay"), v.literal("graded"))
    ), // Status penilaian
    lockedAt: v.optional(v.number()), // Waktu lembar dikunci mode penegakan; absen berarti dapat diisi
    unlockEvents: v.optional(
      v.array(
        v.object({
          unlockedAt: v.number(),
          unlockedBy: v.string(),
        })
      )
    ), // Riwayat pembukaan kunci oleh pengajar pemilik
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

  // Periode Akademik / Academic Periods
  academicPeriods: defineTable({
    year: v.string(), // e.g. "2026/2027"
    semester: v.union(v.literal(1), v.literal(2)),
    reportDate: v.string(), // e.g. "Pangkalpinang, 09 Oktober 2026"
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_active", ["isActive"])
    .index("by_year_semester", ["year", "semester"]),

  // Capaian Pembelajaran (CP/TP)
  learningObjectives: defineTable({
    subjectCode: v.string(),
    gradeLevel: v.string(), // misal "Kelas 7"
    semester: v.union(v.literal(1), v.literal(2)),
    code: v.string(), // misal "CP-01"
    description: v.string(), // ringkasan capaian materi
    curriculumType: v.union(v.literal("umum"), v.literal("diniyah")),
    authorTokenIdentifier: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_subject", ["subjectCode"])
    .index("by_subject_and_grade", ["subjectCode", "gradeLevel", "semester"]),

  // Rekap Nilai Rapor Mata Pelajaran
  reportGrades: defineTable({
    academicYear: v.string(), // e.g. "2026/2027"
    semester: v.union(v.literal(1), v.literal(2)),
    subjectCode: v.string(),
    santriId: v.string(),
    nisn: v.string(),
    studentName: v.string(),
    className: v.string(),
    institution: v.union(v.literal("SMPITA"), v.literal("SMAITA"), v.literal("MTA")),
    dailyScore: v.number(), // rata-rata PH/Tugas
    midtermScore: v.number(), // STS / PTS
    finalExamScore: v.number(), // SAS / PAS
    finalScore: v.number(), // Nilai Akhir Rapor (NAR)
    predicate: v.union(v.literal("A"), v.literal("B"), v.literal("C"), v.literal("D")),
    competencyNarrative: v.string(),
    sourcePtsSessionId: v.optional(v.id("examSessions")),
    sourcePasSessionId: v.optional(v.id("examSessions")),
    updatedBy: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_subject_and_class", ["subjectCode", "className", "academicYear", "semester"])
    .index("by_santri", ["santriId", "academicYear", "semester"])
    .index("by_class", ["className", "academicYear", "semester"]),

  // Asesmen Wali Kelas (Absensi, Ekskul, Hadits, P5, Catatan)
  homeroomAssessments: defineTable({
    academicYear: v.string(),
    semester: v.union(v.literal(1), v.literal(2)),
    santriId: v.string(),
    nisn: v.string(),
    studentName: v.string(),
    className: v.string(),
    institution: v.union(v.literal("SMPITA"), v.literal("SMAITA"), v.literal("MTA")),
    sickDays: v.number(),
    permissionDays: v.number(),
    absentDays: v.number(),
    extracurriculars: v.optional(
      v.array(
        v.object({
          name: v.string(),
          score: v.string(),
          description: v.string(),
        })
      )
    ),
    p5Dimensions: v.optional(
      v.array(
        v.object({
          dimension: v.string(),
          predicate: v.string(),
          description: v.string(),
        })
      )
    ),
    haditsTarget: v.optional(v.string()),
    haditsAchievement: v.optional(v.string()),
    tahfidzNotes: v.optional(v.string()),
    homeroomNotes: v.optional(v.string()),
    promotionDecision: v.optional(v.string()),
    updatedBy: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_class", ["className", "academicYear", "semester"])
    .index("by_santri", ["santriId", "academicYear", "semester"]),
})
