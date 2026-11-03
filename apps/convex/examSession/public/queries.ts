import { v } from "convex/values"

import { query } from "../../_generated/server"
import { deterministicShuffle } from "../private/helpers"

/**
 * Mengambil daftar sesi ujian yang dibuat oleh pengajar saat ini.
 */
export const listExamSessions = query({
  args: {
    status: v.optional(v.union(v.literal("draft"), v.literal("active"), v.literal("ended"))),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      return []
    }

    const sessions = await ctx.db
      .query("examSessions")
      .withIndex("by_creator", (q) => q.eq("creatorTokenIdentifier", identity.tokenIdentifier))
      .order("desc")
      .collect()

    const filtered = args.status
      ? sessions.filter((s) => s.status === args.status)
      : sessions

    // Perkaya data sesi dengan ringkasan bank soal
    const enriched = await Promise.all(
      filtered.map(async (session) => {
        const bank = await ctx.db.get("questionBanks", session.bankId)
        const questions = await ctx.db
          .query("questions")
          .withIndex("by_bank", (q) => q.eq("bankId", session.bankId))
          .collect()

        return {
          ...session,
          bankTitle: bank?.title ?? "Paket Bank Soal (Terhapus)",
          subjectCode: bank?.subjectCode ?? "-",
          gradeLevel: bank?.gradeLevel ?? "-",
          totalQuestions: questions.length,
          totalPoints: bank?.totalPoints ?? 100,
        }
      })
    )

    return enriched
  },
})

/**
 * Mengambil rincian detail satu sesi ujian berdasarkan ID.
 */
export const getExamSession = query({
  args: {
    sessionId: v.id("examSessions"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      return null
    }

    const session = await ctx.db.get("examSessions", args.sessionId)
    if (!session) {
      return null
    }

    if (session.creatorTokenIdentifier !== identity.tokenIdentifier) {
      return null
    }

    const bank = await ctx.db.get("questionBanks", session.bankId)
    const questions = await ctx.db
      .query("questions")
      .withIndex("by_bank", (q) => q.eq("bankId", session.bankId))
      .collect()

    return {
      ...session,
      bankTitle: bank?.title ?? "Paket Bank Soal",
      subjectCode: bank?.subjectCode ?? "-",
      gradeLevel: bank?.gradeLevel ?? "-",
      totalQuestions: questions.length,
      totalPoints: bank?.totalPoints ?? 100,
      passingScore: bank?.passingScore ?? 75,
    }
  },
})

/**
 * Memvalidasi token sesi ujian untuk santri (tanpa perlu autentikasi pengajar).
 * Mengembalikan informasi esensial sesi tanpa membocorkan soal atau kunci jawaban.
 */
export const verifySessionToken = query({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const cleanToken = args.token.trim().toUpperCase()

    if (cleanToken.length !== 6) {
      return {
        valid: false,
        message: "Format token tidak valid. Token ujian terdiri dari 6 karakter.",
      }
    }

    const session = await ctx.db
      .query("examSessions")
      .withIndex("by_token", (q) => q.eq("token", cleanToken))
      .first()

    if (!session) {
      return {
        valid: false,
        message: "Token ujian tidak ditemukan. Periksa kembali kombinasi karakter token Anda.",
      }
    }

    if (session.status === "draft") {
      return {
        valid: false,
        message: "Sesi ujian ini belum diaktifkan oleh pengawas ujian.",
      }
    }

    if (session.status === "ended") {
      return {
        valid: false,
        message: "Sesi ujian ini telah berakhir dan ditutup oleh pengawas.",
      }
    }

    // Ambil data ringkasan bank soal
    const bank = await ctx.db.get("questionBanks", session.bankId)
    const questions = await ctx.db
      .query("questions")
      .withIndex("by_bank", (q) => q.eq("bankId", session.bankId))
      .collect()

    return {
      valid: true,
      sessionId: session._id,
      title: session.title,
      durationMinutes: session.durationMinutes,
      startTime: session.startTime,
      endTime: session.endTime,
      subjectCode: bank?.subjectCode ?? "Ujian",
      gradeLevel: bank?.gradeLevel ?? "-",
      totalQuestions: questions.length,
      randomizeQuestions: session.randomizeQuestions,
      randomizeOptions: session.randomizeOptions,
    }
  },
})

/**
 * Mengambil lembar soal dan data pengerjaan santri yang aman.
 * Menghilangkan seluruh kunci jawaban dan rubrik dari payload client.
 */
export const getStudentExamSheet = query({
  args: {
    participantId: v.id("examParticipants"),
  },
  handler: async (ctx, args) => {
    const participant = await ctx.db.get("examParticipants", args.participantId)
    if (!participant) {
      return {
        found: false,
        message: "Data peserta ujian tidak ditemukan.",
      }
    }

    if (participant.status === "submitted") {
      return {
        found: true,
        isSubmitted: true,
        message: "Lembar jawaban ujian ini telah berhasil dikumpulkan.",
        finishedAt: participant.finishedAt,
      }
    }

    const session = await ctx.db.get("examSessions", participant.sessionId)
    if (!session) {
      return {
        found: false,
        message: "Sesi ujian tidak ditemukan.",
      }
    }

    if (session.status === "ended") {
      return {
        found: true,
        isEnded: true,
        message: "Sesi ujian ini telah ditutup oleh pengawas ujian.",
      }
    }

    const bank = await ctx.db.get("questionBanks", session.bankId)
    const rawQuestions = await ctx.db
      .query("questions")
      .withIndex("by_bank", (q) => q.eq("bankId", session.bankId))
      .collect()

    // Urutkan soal: acak deterministik berdasarkan participant ID atau urut nomor standar
    let orderedQuestions = [...rawQuestions]
    if (session.randomizeQuestions) {
      orderedQuestions = deterministicShuffle(orderedQuestions, participant._id)
    } else {
      orderedQuestions.sort((a, b) => a.orderNumber - b.orderNumber)
    }

    // Bersihkan payload (sanitasi ketat: jangan pernah kirim isCorrect atau rubric ke santri)
    const sanitizedQuestions = orderedQuestions.map((q, idx) => {
      let options = q.options?.map((opt) => ({
        id: opt.id,
        label: opt.label,
        text: opt.text,
      }))

      if (session.randomizeOptions && options) {
        options = deterministicShuffle(options, `${participant._id}_${q._id}`)
        // Beri label A, B, C, D baru sesuai urutan tampilan yang konsisten
        const standardLabels = ["A", "B", "C", "D", "E"]
        options = options.map((opt, i) => ({
          ...opt,
          label: standardLabels[i] || opt.label,
        }))
      }

      return {
        id: q._id,
        displayNumber: idx + 1,
        type: q.type,
        stimulusText: q.stimulusText,
        stimulusMediaUrl: q.stimulusMediaUrl,
        questionText: q.questionText,
        points: q.points,
        options,
      }
    })

    // Ambil jawaban yang telah tersimpan untuk peserta ini
    const existingAnswers = await ctx.db
      .query("studentAnswers")
      .withIndex("by_participant", (q) => q.eq("participantId", participant._id))
      .collect()

    const formattedAnswers = existingAnswers.map((ans) => ({
      questionId: ans.questionId,
      selectedOptionId: ans.selectedOptionId,
      selectedOptionIds: ans.selectedOptionIds,
      essayAnswer: ans.essayAnswer,
      isDoubtful: ans.isDoubtful,
    }))

    // Hitung sisa waktu pengerjaan santri
    const elapsedMs = Date.now() - participant.startedAt
    const totalAllowedMs = session.durationMinutes * 60 * 1000
    const remainingMs = Math.max(0, totalAllowedMs - elapsedMs)

    return {
      found: true,
      isSubmitted: false,
      isEnded: false,
      participant: {
        id: participant._id,
        studentName: participant.studentName,
        nisn: participant.nisn,
        className: participant.className,
        startedAt: participant.startedAt,
        durationMinutes: session.durationMinutes,
        remainingMs,
        tabViolations: participant.tabViolations ?? 0,
      },
      session: {
        id: session._id,
        title: session.title,
        subjectCode: bank?.subjectCode ?? "Ujian",
        gradeLevel: bank?.gradeLevel ?? "-",
        totalPoints: bank?.totalPoints ?? 100,
      },
      questions: sanitizedQuestions,
      answers: formattedAnswers,
    }
  },
})

/**
 * Mengambil rincian jawaban santri untuk dikoreksi pengajar (termasuk rubrik dan kunci jawaban PG).
 */
export const getParticipantAnswersForGrading = query({
  args: {
    participantId: v.id("examParticipants"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      return null
    }

    const participant = await ctx.db.get("examParticipants", args.participantId)
    if (!participant) {
      return null
    }

    const session = await ctx.db.get("examSessions", participant.sessionId)
    if (!session) {
      return null
    }

    if (session.creatorTokenIdentifier !== identity.tokenIdentifier) {
      return null
    }

    const bank = await ctx.db.get("questionBanks", session.bankId)
    const questions = await ctx.db
      .query("questions")
      .withIndex("by_bank", (q) => q.eq("bankId", session.bankId))
      .collect()

    questions.sort((a, b) => a.orderNumber - b.orderNumber)

    const studentAnswers = await ctx.db
      .query("studentAnswers")
      .withIndex("by_participant", (q) => q.eq("participantId", args.participantId))
      .collect()

    const answersMap = new Map(studentAnswers.map((a) => [a.questionId, a]))

    const detailedQuestions = questions.map((q) => {
      const ans = answersMap.get(q._id)
      return {
        id: q._id,
        orderNumber: q.orderNumber,
        type: q.type,
        questionText: q.questionText,
        points: q.points,
        rubric: q.rubric,
        options: q.options, // Guru melihat opsi lengkap dengan isCorrect
        studentAnswer: ans
          ? {
              selectedOptionId: ans.selectedOptionId,
              essayAnswer: ans.essayAnswer,
              isDoubtful: ans.isDoubtful,
              scoreAwarded: ans.scoreAwarded,
              teacherFeedback: ans.teacherFeedback,
            }
          : null,
      }
    })

    return {
      participant,
      session,
      bank,
      questions: detailedQuestions,
    }
  },
})

/**
 * Mengambil daftar santri peserta dalam satu sesi ujian beserta nilai dan status koreksi.
 */
export const listSessionParticipants = query({
  args: {
    sessionId: v.id("examSessions"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      return []
    }

    const session = await ctx.db.get("examSessions", args.sessionId)
    if (!session || session.creatorTokenIdentifier !== identity.tokenIdentifier) {
      return []
    }

    const participants = await ctx.db
      .query("examParticipants")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .order("desc")
      .collect()

    return participants
  },
})
