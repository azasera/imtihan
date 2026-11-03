import { v } from "convex/values"

import { mutation } from "../../_generated/server"
import { generateExamToken, requireAuthenticatedUser } from "../private/helpers"

/**
 * Membuat sesi ujian baru yang ditautkan ke paket Bank Soal.
 */
export const createExamSession = mutation({
  args: {
    title: v.string(),
    bankId: v.id("questionBanks"),
    startTime: v.string(),
    endTime: v.string(),
    durationMinutes: v.number(),
    randomizeQuestions: v.optional(v.boolean()),
    randomizeOptions: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const user = await requireAuthenticatedUser(ctx)

    if (args.durationMinutes <= 0) {
      throw new Error("Durasi ujian harus lebih besar dari 0 menit.")
    }

    const bank = await ctx.db.get("questionBanks", args.bankId)
    if (!bank) {
      throw new Error("Paket bank soal yang dipilih tidak ditemukan.")
    }

    // Generate token 6 digit unik
    let token = generateExamToken(6)
    let existing = await ctx.db
      .query("examSessions")
      .withIndex("by_token", (q) => q.eq("token", token))
      .first()

    // Regenerate jika kebetulan duplikat
    let attempts = 0
    while (existing && attempts < 5) {
      token = generateExamToken(6)
      existing = await ctx.db
        .query("examSessions")
        .withIndex("by_token", (q) => q.eq("token", token))
        .first()
      attempts++
    }

    const now = Date.now()
    const sessionId = await ctx.db.insert("examSessions", {
      title: args.title.trim(),
      bankId: args.bankId,
      token,
      startTime: args.startTime,
      endTime: args.endTime,
      durationMinutes: Math.round(args.durationMinutes),
      randomizeQuestions: args.randomizeQuestions ?? false,
      randomizeOptions: args.randomizeOptions ?? false,
      status: "draft",
      creatorTokenIdentifier: user.tokenIdentifier,
      creatorName: user.name,
      createdAt: now,
      updatedAt: now,
    })

    return {
      sessionId,
      token,
    }
  },
})

/**
 * Memperbarui data parameter sesi ujian.
 */
export const updateExamSession = mutation({
  args: {
    sessionId: v.id("examSessions"),
    title: v.optional(v.string()),
    bankId: v.optional(v.id("questionBanks")),
    startTime: v.optional(v.string()),
    endTime: v.optional(v.string()),
    durationMinutes: v.optional(v.number()),
    randomizeQuestions: v.optional(v.boolean()),
    randomizeOptions: v.optional(v.boolean()),
    status: v.optional(v.union(v.literal("draft"), v.literal("active"), v.literal("ended"))),
  },
  handler: async (ctx, args) => {
    const user = await requireAuthenticatedUser(ctx)

    const session = await ctx.db.get("examSessions", args.sessionId)
    if (!session) {
      throw new Error("Sesi ujian tidak ditemukan.")
    }

    if (session.creatorTokenIdentifier !== user.tokenIdentifier) {
      throw new Error("Akses ditolak: Anda tidak memiliki izin untuk mengubah sesi ini.")
    }

    if (args.durationMinutes !== undefined && args.durationMinutes <= 0) {
      throw new Error("Durasi ujian harus lebih besar dari 0 menit.")
    }

    if (args.bankId !== undefined) {
      const bank = await ctx.db.get("questionBanks", args.bankId)
      if (!bank) {
        throw new Error("Paket bank soal yang dipilih tidak ditemukan.")
      }
    }

    const updates: Partial<{
      title: string
      bankId: typeof args.bankId
      startTime: string
      endTime: string
      durationMinutes: number
      randomizeQuestions: boolean
      randomizeOptions: boolean
      status: "draft" | "active" | "ended"
      updatedAt: number
    }> = {
      updatedAt: Date.now(),
    }

    if (args.title !== undefined) updates.title = args.title.trim()
    if (args.bankId !== undefined) updates.bankId = args.bankId
    if (args.startTime !== undefined) updates.startTime = args.startTime
    if (args.endTime !== undefined) updates.endTime = args.endTime
    if (args.durationMinutes !== undefined) updates.durationMinutes = Math.round(args.durationMinutes)
    if (args.randomizeQuestions !== undefined) updates.randomizeQuestions = args.randomizeQuestions
    if (args.randomizeOptions !== undefined) updates.randomizeOptions = args.randomizeOptions
    if (args.status !== undefined) updates.status = args.status

    await ctx.db.patch("examSessions", args.sessionId, updates)

    return { success: true }
  },
})

/**
 * Menghasilkan token acak 6 digit baru untuk sesi ujian (refresh token).
 */
export const regenerateSessionToken = mutation({
  args: {
    sessionId: v.id("examSessions"),
  },
  handler: async (ctx, args) => {
    const user = await requireAuthenticatedUser(ctx)

    const session = await ctx.db.get("examSessions", args.sessionId)
    if (!session) {
      throw new Error("Sesi ujian tidak ditemukan.")
    }

    if (session.creatorTokenIdentifier !== user.tokenIdentifier) {
      throw new Error("Akses ditolak: Anda tidak memiliki izin untuk mengubah token sesi ini.")
    }

    let newToken = generateExamToken(6)
    let existing = await ctx.db
      .query("examSessions")
      .withIndex("by_token", (q) => q.eq("token", newToken))
      .first()

    let attempts = 0
    while (existing && attempts < 5) {
      newToken = generateExamToken(6)
      existing = await ctx.db
        .query("examSessions")
        .withIndex("by_token", (q) => q.eq("token", newToken))
        .first()
      attempts++
    }

    await ctx.db.patch("examSessions", args.sessionId, {
      token: newToken,
      updatedAt: Date.now(),
    })

    return { token: newToken }
  },
})

/**
 * Mengubah status aktif sesi ujian (draft -> active -> ended).
 */
export const setSessionStatus = mutation({
  args: {
    sessionId: v.id("examSessions"),
    status: v.union(v.literal("draft"), v.literal("active"), v.literal("ended")),
  },
  handler: async (ctx, args) => {
    const user = await requireAuthenticatedUser(ctx)

    const session = await ctx.db.get("examSessions", args.sessionId)
    if (!session) {
      throw new Error("Sesi ujian tidak ditemukan.")
    }

    if (session.creatorTokenIdentifier !== user.tokenIdentifier) {
      throw new Error("Akses ditolak: Anda tidak memiliki izin untuk mengubah status sesi ini.")
    }

    await ctx.db.patch("examSessions", args.sessionId, {
      status: args.status,
      updatedAt: Date.now(),
    })

    return { success: true, status: args.status }
  },
})

/**
 * Menghapus sesi ujian.
 */
export const deleteExamSession = mutation({
  args: {
    sessionId: v.id("examSessions"),
  },
  handler: async (ctx, args) => {
    const user = await requireAuthenticatedUser(ctx)

    const session = await ctx.db.get("examSessions", args.sessionId)
    if (!session) {
      throw new Error("Sesi ujian tidak ditemukan.")
    }

    if (session.creatorTokenIdentifier !== user.tokenIdentifier) {
      throw new Error("Akses ditolak: Anda tidak berwenang menghapus sesi ini.")
    }

    await ctx.db.delete("examSessions", args.sessionId)

    return { success: true }
  },
})

/**
 * Pendaftaran dan masuk santri ke sesi ujian berbasis NISN dan Token 6 digit (tanpa perlu akun email).
 */
export const enterExamSession = mutation({
  args: {
    token: v.string(),
    nisn: v.string(),
    studentName: v.string(),
    institution: v.optional(v.union(v.literal("SMPITA"), v.literal("SMAITA"), v.literal("MTA"))),
    className: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const cleanToken = args.token.trim().toUpperCase()
    const cleanNisn = args.nisn.trim()
    let verifiedName = args.studentName.trim()

    if (!cleanNisn) {
      throw new Error("Nomor Induk Santri (NISN / NIS / ID Santri) wajib diisi.")
    }

    if (!verifiedName) {
      throw new Error("Nama lengkap santri wajib diisi.")
    }

    if (cleanToken.length !== 6) {
      throw new Error("Token ujian harus terdiri dari 6 karakter alfanumerik.")
    }

    const session = await ctx.db
      .query("examSessions")
      .withIndex("by_token", (q) => q.eq("token", cleanToken))
      .first()

    if (!session) {
      throw new Error("Token ujian tidak ditemukan. Periksa kembali token yang diberikan pengawas.")
    }

    if (session.status === "draft") {
      throw new Error("Sesi ujian belum diaktifkan oleh pengawas ujian.")
    }

    if (session.status === "ended") {
      throw new Error("Sesi ujian ini telah berakhir dan ditutup oleh pengawas.")
    }

    // Validasi identitas santri terhadap data master di database
    // Mencari santri berdasarkan santriId, nisn, atau nis
    let student = await ctx.db
      .query("students")
      .withIndex("by_santri_id", (q) => q.eq("santriId", cleanNisn))
      .first()

    if (!student) {
      student = await ctx.db
        .query("students")
        .withIndex("by_nisn", (q) => q.eq("nisn", cleanNisn))
        .first()
    }

    if (!student) {
      student = await ctx.db
        .query("students")
        .withIndex("by_nis", (q) => q.eq("nis", cleanNisn))
        .first()
    }

    if (!student) {
      const allStudents = await ctx.db.query("students").collect()
      const found = allStudents.find(
        (s) =>
          s.santriId.toLowerCase() === cleanNisn.toLowerCase() ||
          (s.nis && s.nis.toLowerCase() === cleanNisn.toLowerCase()) ||
          (s.nisn && s.nisn.toLowerCase() === cleanNisn.toLowerCase())
      )
      if (found) {
        student = found
      } else if (allStudents.length > 0) {
        throw new Error(
          "Nomor Induk Santri tidak ditemukan dalam basis data pesantren. Pastikan nomor induk Anda benar atau hubungi pengawas."
        )
      }
    }

    let finalClass = args.className?.trim() || ""

    if (student) {
      // Validasi kesesuaian Lembaga dengan database
      if (args.institution && student.jenjang !== args.institution) {
        throw new Error(
          `Lembaga yang dipilih (${args.institution}) tidak sesuai dengan data terdaftar santri (${student.jenjang}).`
        )
      }

      // Validasi kesesuaian Kelas dengan database
      if (finalClass && student.kelas) {
        const normSelected = finalClass.toLowerCase().replace(/\s+/g, "")
        const normDb = student.kelas.toLowerCase().replace(/\s+/g, "")
        if (normSelected !== normDb && !normDb.includes(normSelected) && !normSelected.includes(normDb)) {
          throw new Error(
            `Kelas yang dipilih (${finalClass}) tidak sesuai dengan data terdaftar santri (${student.kelas}).`
          )
        }
      }

      // Selalu gunakan nama resmi dari database agar tidak dapat dimanipulasi dari browser
      verifiedName = student.nama
      finalClass = student.kelas
    } else if (args.institution && finalClass) {
      // Jika database belum tersinkronisasi, validasi format kelas sesuai batasan lembaga resmi
      if (args.institution === "SMPITA" && !/^(kelas\s*)?[7-9]/i.test(finalClass)) {
        throw new Error("Lembaga SMPITA hanya mencakup kelas 7 sampai kelas 9.")
      }
      if (args.institution === "SMAITA" && !/^(kelas\s*)?(10|11|12)/i.test(finalClass)) {
        throw new Error("Lembaga SMAITA hanya mencakup kelas 10 sampai kelas 12.")
      }
      if (args.institution === "MTA" && !/^mta\s*[1-6]/i.test(finalClass)) {
        throw new Error("Lembaga MTA hanya mencakup tingkatan MTA 1 sampai MTA 6.")
      }
    }

    // Periksa apakah santri sudah terdaftar di sesi ini sebelumnya
    const existingParticipant = await ctx.db
      .query("examParticipants")
      .withIndex("by_session_and_nisn", (q) =>
        q.eq("sessionId", session._id).eq("nisn", cleanNisn)
      )
      .first()

    if (existingParticipant) {
      if (existingParticipant.status === "submitted") {
        throw new Error("Anda telah menyelesaikan dan mengumpulkan lembar ujian ini sebelumnya.")
      }

      // Lanjutkan kembali sesi pengerjaan santri yang sedang berjalan
      return {
        participantId: existingParticipant._id,
        sessionId: session._id,
        sessionTitle: session.title,
        durationMinutes: session.durationMinutes,
        startedAt: existingParticipant.startedAt,
        studentName: existingParticipant.studentName,
        nisn: existingParticipant.nisn,
        isResumed: true,
      }
    }

    const now = Date.now()
    const participantId = await ctx.db.insert("examParticipants", {
      sessionId: session._id,
      nisn: cleanNisn,
      studentName: verifiedName,
      className: finalClass,
      tokenUsed: cleanToken,
      startedAt: now,
      status: "in_progress",
      tabViolations: 0,
    })

    return {
      participantId,
      sessionId: session._id,
      sessionTitle: session.title,
      durationMinutes: session.durationMinutes,
      startedAt: now,
      studentName: verifiedName,
      nisn: cleanNisn,
      isResumed: false,
    }
  },
})

/**
 * Menyimpan jawaban pilihan ganda, PG kompleks, benar/salah, atau essay santri secara otomatis (auto-save).
 */
export const saveStudentAnswer = mutation({
  args: {
    participantId: v.id("examParticipants"),
    questionId: v.id("questions"),
    selectedOptionId: v.optional(v.string()),
    selectedOptionIds: v.optional(v.array(v.string())),
    essayAnswer: v.optional(v.string()),
    isDoubtful: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const participant = await ctx.db.get("examParticipants", args.participantId)
    if (!participant) {
      throw new Error("Data peserta ujian tidak ditemukan.")
    }

    if (participant.status === "submitted") {
      throw new Error("Ujian telah selesai dikumpulkan. Jawaban tidak dapat diubah lagi.")
    }

    const session = await ctx.db.get("examSessions", participant.sessionId)
    if (session && session.status === "ended") {
      throw new Error("Sesi ujian telah ditutup oleh pengawas.")
    }

    const now = Date.now()
    const existingAnswer = await ctx.db
      .query("studentAnswers")
      .withIndex("by_participant_and_question", (q) =>
        q.eq("participantId", args.participantId).eq("questionId", args.questionId)
      )
      .first()

    if (existingAnswer) {
      const updates: Partial<{
        selectedOptionId: string
        selectedOptionIds: string[]
        essayAnswer: string
        isDoubtful: boolean
        updatedAt: number
      }> = {
        updatedAt: now,
      }

      if (args.selectedOptionId !== undefined) updates.selectedOptionId = args.selectedOptionId
      if (args.selectedOptionIds !== undefined) updates.selectedOptionIds = args.selectedOptionIds
      if (args.essayAnswer !== undefined) updates.essayAnswer = args.essayAnswer
      if (args.isDoubtful !== undefined) updates.isDoubtful = args.isDoubtful

      await ctx.db.patch("studentAnswers", existingAnswer._id, updates)
      return { success: true, savedAt: now }
    } else {
      await ctx.db.insert("studentAnswers", {
        participantId: args.participantId,
        questionId: args.questionId,
        selectedOptionId: args.selectedOptionId,
        selectedOptionIds: args.selectedOptionIds,
        essayAnswer: args.essayAnswer,
        isDoubtful: args.isDoubtful ?? false,
        updatedAt: now,
      })
      return { success: true, savedAt: now }
    }
  },
})

/**
 * Mencatat penambahan frekuensi pelanggaran tab/jendela ujian santri (UJIAN-FR-009, NILAI-FR-006).
 */
export const recordTabViolation = mutation({
  args: {
    participantId: v.id("examParticipants"),
  },
  handler: async (ctx, args) => {
    const participant = await ctx.db.get("examParticipants", args.participantId)
    if (!participant) {
      throw new Error("Data peserta ujian tidak ditemukan.")
    }

    if (participant.status === "submitted") {
      return { success: true, count: participant.tabViolations ?? 0 }
    }

    const currentCount = participant.tabViolations ?? 0
    const newCount = currentCount + 1

    await ctx.db.patch("examParticipants", args.participantId, {
      tabViolations: newCount,
    })

    return {
      success: true,
      tabViolations: newCount,
    }
  },
})

/**
 * Mengumpulkan lembar jawaban ujian santri secara final dan menghitung skor otomatis instan (NILAI-FR-001, NILAI-FR-005).
 */
export const submitStudentExam = mutation({
  args: {
    participantId: v.id("examParticipants"),
  },
  handler: async (ctx, args) => {
    const participant = await ctx.db.get("examParticipants", args.participantId)
    if (!participant) {
      throw new Error("Data peserta ujian tidak ditemukan.")
    }

    if (participant.status === "submitted") {
      return { success: true, alreadySubmitted: true }
    }

    const session = await ctx.db.get("examSessions", participant.sessionId)
    if (!session) {
      throw new Error("Sesi ujian tidak ditemukan.")
    }

    // Ambil seluruh butir soal paket bank soal rujukan
    const allQuestions = await ctx.db
      .query("questions")
      .withIndex("by_bank", (q) => q.eq("bankId", session.bankId))
      .collect()

    // Ambil seluruh jawaban yang diinput santri
    const studentAnswers = await ctx.db
      .query("studentAnswers")
      .withIndex("by_participant", (q) => q.eq("participantId", args.participantId))
      .collect()

    const answersByQuestionId = new Map(studentAnswers.map((a) => [a.questionId, a]))

    let calculatedPgScore = 0
    let hasEssayQuestions = false

    // Koreksi otomatis soal Pilihan Ganda, PG Kompleks, dan Benar/Salah (NILAI-FR-001, NILAI-FR-005)
    for (const q of allQuestions) {
      const studentAns = answersByQuestionId.get(q._id)
      let awarded = 0

      if (q.type === "multiple_choice") {
        const correctOption = q.options?.find((opt) => opt.isCorrect)
        if (studentAns && correctOption && studentAns.selectedOptionId === correctOption.id) {
          awarded = q.points
        }
      } else if (q.type === "true_false") {
        const correctOption = q.options?.find((opt) => opt.isCorrect)
        if (studentAns && correctOption && studentAns.selectedOptionId === correctOption.id) {
          awarded = q.points
        }
      } else if (q.type === "pg_kompleks") {
        // PG Kompleks: Semua kunci benar harus dicentang dan tidak ada kunci salah yang dicentang
        const correctIds = new Set(q.options?.filter((opt) => opt.isCorrect).map((opt) => opt.id) || [])
        const selectedIds = new Set(studentAns?.selectedOptionIds || [])

        if (
          correctIds.size > 0 &&
          selectedIds.size === correctIds.size &&
          [...selectedIds].every((id) => correctIds.has(id))
        ) {
          awarded = q.points
        }
      } else if (q.type === "essay") {
        hasEssayQuestions = true
      }

      calculatedPgScore += awarded

      // Catat skor butir soal otomatis ke database
      if (studentAns && q.type !== "essay") {
        await ctx.db.patch("studentAnswers", studentAns._id, {
          scoreAwarded: awarded,
        })
      }
    }

    const now = Date.now()
    const gradingStatus = hasEssayQuestions ? "pending_essay" : "graded"
    const totalScore = calculatedPgScore

    await ctx.db.patch("examParticipants", args.participantId, {
      status: "submitted",
      finishedAt: now,
      multipleChoiceScore: calculatedPgScore,
      essayScore: 0,
      totalScore,
      gradingStatus,
    })

    return {
      success: true,
      submittedAt: now,
      multipleChoiceScore: calculatedPgScore,
      gradingStatus,
    }
  },
})

/**
 * Pengajar memberikan skor nilai dan catatan evaluasi untuk butir soal essay (NILAI-FR-002, NILAI-FR-003).
 */
export const gradeEssayAnswer = mutation({
  args: {
    participantId: v.id("examParticipants"),
    questionId: v.id("questions"),
    scoreAwarded: v.number(),
    teacherFeedback: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireAuthenticatedUser(ctx)

    const participant = await ctx.db.get("examParticipants", args.participantId)
    if (!participant) {
      throw new Error("Data peserta ujian tidak ditemukan.")
    }

    const question = await ctx.db.get("questions", args.questionId)
    if (!question) {
      throw new Error("Butir soal tidak ditemukan.")
    }

    if (question.type !== "essay") {
      throw new Error("Koreksi manual hanya dapat dilakukan pada butir soal essay.")
    }

    if (args.scoreAwarded < 0 || args.scoreAwarded > question.points) {
      throw new Error(`Skor nilai essay harus berada di antara 0 dan bobot maksimal (${question.points} poin).`)
    }

    const now = Date.now()
    const existingAnswer = await ctx.db
      .query("studentAnswers")
      .withIndex("by_participant_and_question", (q) =>
        q.eq("participantId", args.participantId).eq("questionId", args.questionId)
      )
      .first()

    if (existingAnswer) {
      await ctx.db.patch("studentAnswers", existingAnswer._id, {
        scoreAwarded: args.scoreAwarded,
        teacherFeedback: args.teacherFeedback?.trim(),
        updatedAt: now,
      })
    } else {
      await ctx.db.insert("studentAnswers", {
        participantId: args.participantId,
        questionId: args.questionId,
        isDoubtful: false,
        scoreAwarded: args.scoreAwarded,
        teacherFeedback: args.teacherFeedback?.trim(),
        updatedAt: now,
      })
    }

    // Ambil seluruh butir soal essay pada paket ini untuk mengakumulasi essayScore
    const session = await ctx.db.get("examSessions", participant.sessionId)
    const allQuestions = session
      ? await ctx.db
          .query("questions")
          .withIndex("by_bank", (q) => q.eq("bankId", session.bankId))
          .collect()
      : []

    const essayQuestions = allQuestions.filter((q) => q.type === "essay")
    const allStudentAnswers = await ctx.db
      .query("studentAnswers")
      .withIndex("by_participant", (q) => q.eq("participantId", args.participantId))
      .collect()

    const studentAnswersMap = new Map(allStudentAnswers.map((a) => [a.questionId, a]))

    let accumulatedEssayScore = 0
    let allEssaysGraded = true

    for (const eq of essayQuestions) {
      const sa = studentAnswersMap.get(eq._id)
      if (sa && sa.scoreAwarded !== undefined) {
        accumulatedEssayScore += sa.scoreAwarded
      } else {
        allEssaysGraded = false
      }
    }

    const pgScore = participant.multipleChoiceScore ?? 0
    const finalTotal = pgScore + accumulatedEssayScore
    const newGradingStatus = allEssaysGraded ? "graded" : "pending_essay"

    await ctx.db.patch("examParticipants", args.participantId, {
      essayScore: accumulatedEssayScore,
      totalScore: finalTotal,
      gradingStatus: newGradingStatus,
    })

    return {
      success: true,
      essayScore: accumulatedEssayScore,
      totalScore: finalTotal,
      gradingStatus: newGradingStatus,
    }
  },
})
