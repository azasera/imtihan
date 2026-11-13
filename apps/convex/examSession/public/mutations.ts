import { v } from "convex/values"

import { internal } from "../../_generated/api"
import type { Id } from "../../_generated/dataModel"
import { mutation, type MutationCtx } from "../../_generated/server"
import { identifierMatches } from "../../model/nisn"
import { extractStudentTwoDigits, getValidStudentTwoDigits, cleanStudentName } from "../../model/nisn"
import {
  applyRemedialCap,
  assertValidPassingScore,
  assertValidTokenRotationMinutes,
  assertValidViolationThreshold,
  normalizeNisn,
  requireAuthenticatedUser,
  shouldLockAfterViolation,
  tokenRotationDueAt,
} from "../private/helpers"
import { generateUniqueSessionToken } from "../private/tokenCode"

/** Menjadwalkan pergantian token berikutnya hanya untuk sesi yang sedang aktif. */
async function scheduleNextTokenRotation(
  ctx: MutationCtx,
  sessionId: Id<"examSessions">,
  interval: number | undefined,
  rotatedAt: number
): Promise<void> {
  if (!interval) return

  await ctx.scheduler.runAt(
    tokenRotationDueAt(rotatedAt, interval),
    internal.examSession.private.tokenRotation.rotateSessionTokenIfDue,
    { sessionId }
  )
}

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
    passingScore: v.optional(v.number()),
    enforcementMode: v.optional(v.union(v.literal("record"), v.literal("lock"))),
    violationThreshold: v.optional(v.number()),
    tokenRotationMinutes: v.optional(v.union(v.number(), v.null())),
  },
  handler: async (ctx, args) => {
    const user = await requireAuthenticatedUser(ctx)

    if (args.durationMinutes <= 0) {
      throw new Error("Durasi ujian harus lebih besar dari 0 menit.")
    }

    assertValidPassingScore(args.passingScore)
    assertValidViolationThreshold(args.violationThreshold)
    assertValidTokenRotationMinutes(args.tokenRotationMinutes)

    const bank = await ctx.db.get("questionBanks", args.bankId)
    if (!bank) {
      throw new Error("Paket bank soal yang dipilih tidak ditemukan.")
    }

    // Generate token 6 digit unik
    const token = await generateUniqueSessionToken(ctx)

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
      passingScore: args.passingScore,
      kind: "reguler",
      enforcementMode: args.enforcementMode ?? "record",
      violationThreshold: args.violationThreshold ?? 3,
      tokenRotationMinutes: args.tokenRotationMinutes ?? undefined,
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
 * Membuat sesi remedial atau susulan dari sesi yang sudah selesai.
 * Pengaturan sesi sumber disalin, peserta dipilih ulang, dan sesi sumber tidak disentuh.
 */
export const createContinuationSession = mutation({
  args: {
    sourceSessionId: v.id("examSessions"),
    kind: v.union(v.literal("remedial"), v.literal("susulan")),
    title: v.string(),
    startTime: v.string(),
    endTime: v.string(),
    participantNisns: v.array(v.string()),
    bankId: v.optional(v.id("questionBanks")),
    durationMinutes: v.optional(v.number()),
    randomizeQuestions: v.optional(v.boolean()),
    randomizeOptions: v.optional(v.boolean()),
    passingScore: v.optional(v.union(v.number(), v.null())),
    enforcementMode: v.optional(v.union(v.literal("record"), v.literal("lock"))),
    violationThreshold: v.optional(v.number()),
    capAtPassingScore: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const user = await requireAuthenticatedUser(ctx)

    const source = await ctx.db.get("examSessions", args.sourceSessionId)
    if (!source) {
      throw new Error("Sesi sumber tidak ditemukan.")
    }

    if (source.creatorTokenIdentifier !== user.tokenIdentifier) {
      throw new Error("Akses ditolak: Anda tidak memiliki izin untuk membuat sesi lanjutan dari sesi ini.")
    }

    if (source.status !== "ended") {
      throw new Error("Sesi lanjutan hanya dapat dibuat dari sesi yang sudah selesai.")
    }

    const cleanTitle = args.title.trim()
    if (!cleanTitle) {
      throw new Error("Judul sesi lanjutan wajib diisi.")
    }

    if (!args.startTime || !args.endTime) {
      throw new Error("Waktu mulai dan batas akhir sesi lanjutan wajib ditentukan.")
    }

    const bankId = args.bankId ?? source.bankId
    const bank = await ctx.db.get("questionBanks", bankId)
    if (!bank) {
      throw new Error("Paket bank soal yang dipilih tidak ditemukan.")
    }

    const durationMinutes = Math.round(args.durationMinutes ?? source.durationMinutes)
    if (durationMinutes <= 0) {
      throw new Error("Durasi ujian harus lebih besar dari 0 menit.")
    }

    const passingScore =
      args.passingScore === null ? undefined : args.passingScore ?? source.passingScore
    assertValidPassingScore(passingScore)

    const enforcementMode = args.enforcementMode ?? source.enforcementMode ?? "record"
    const violationThreshold = args.violationThreshold ?? source.violationThreshold ?? 3
    assertValidViolationThreshold(violationThreshold)

    const sourceParticipants = await ctx.db
      .query("examParticipants")
      .withIndex("by_session", (q) => q.eq("sessionId", source._id))
      .collect()

    const sourceByNisn = new Map(sourceParticipants.map((p) => [normalizeNisn(p.nisn), p.nisn]))
    const selectedNisns: string[] = []
    const seen = new Set<string>()

    for (const rawNisn of args.participantNisns) {
      const normalized = normalizeNisn(rawNisn)
      if (!normalized || seen.has(normalized)) continue

      const canonicalNisn = sourceByNisn.get(normalized)
      if (!canonicalNisn) {
        throw new Error(
          `Nomor induk ${rawNisn.trim()} bukan peserta sesi sumber, sehingga tidak dapat dipilih sebagai peserta sesi lanjutan.`
        )
      }

      seen.add(normalized)
      selectedNisns.push(canonicalNisn)
    }

    if (selectedNisns.length === 0) {
      throw new Error("Pilih paling sedikit satu santri sebagai peserta sesi lanjutan.")
    }

    const token = await generateUniqueSessionToken(ctx)
    const now = Date.now()
    const sessionId = await ctx.db.insert("examSessions", {
      title: cleanTitle,
      bankId,
      token,
      startTime: args.startTime,
      endTime: args.endTime,
      durationMinutes,
      randomizeQuestions: args.randomizeQuestions ?? source.randomizeQuestions,
      randomizeOptions: args.randomizeOptions ?? source.randomizeOptions,
      passingScore,
      kind: args.kind,
      sourceSessionId: source._id,
      capAtPassingScore: args.kind === "remedial" ? args.capAtPassingScore ?? true : false,
      eligibleNisns: selectedNisns,
      enforcementMode,
      violationThreshold,
      status: "draft",
      creatorTokenIdentifier: user.tokenIdentifier,
      creatorName: user.name,
      createdAt: now,
      updatedAt: now,
    })

    return {
      sessionId,
      token,
      kind: args.kind,
      participantCount: selectedNisns.length,
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
    tokenRotationMinutes: v.optional(v.union(v.number(), v.null())),
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
      tokenRotationMinutes: number
      tokenRotatedAt: number
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

    const now = Date.now()
    if (args.tokenRotationMinutes !== undefined) {
      assertValidTokenRotationMinutes(args.tokenRotationMinutes)
      updates.tokenRotationMinutes = args.tokenRotationMinutes ?? undefined
      updates.tokenRotatedAt = args.tokenRotationMinutes === null ? undefined : now
    }

    const effectiveStatus = args.status ?? session.status
    const effectiveInterval =
      args.tokenRotationMinutes === undefined
        ? session.tokenRotationMinutes
        : args.tokenRotationMinutes ?? undefined
    const effectiveRotatedAt =
      args.tokenRotationMinutes === undefined
        ? session.tokenRotatedAt
        : args.tokenRotationMinutes === null
          ? undefined
          : now

    if (effectiveStatus === "active" && effectiveInterval) {
      const startAt = effectiveRotatedAt ?? now
      if (!effectiveRotatedAt) updates.tokenRotatedAt = startAt
      await scheduleNextTokenRotation(ctx, args.sessionId, effectiveInterval, startAt)
    }

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

    const newToken = await generateUniqueSessionToken(ctx)
    const rotatedAt = Date.now()

    await ctx.db.patch("examSessions", args.sessionId, {
      token: newToken,
      tokenRotatedAt: rotatedAt,
      updatedAt: rotatedAt,
    })

    if (session.status === "active" && session.tokenRotationMinutes) {
      await scheduleNextTokenRotation(
        ctx,
        args.sessionId,
        session.tokenRotationMinutes,
        rotatedAt
      )
    }

    return { token: newToken, rotatedAt }
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

    const now = Date.now()
    const startsRotation =
      session.status !== "active" && args.status === "active" && session.tokenRotationMinutes

    await ctx.db.patch("examSessions", args.sessionId, {
      status: args.status,
      ...(startsRotation ? { tokenRotatedAt: now } : {}),
      updatedAt: now,
    })

    if (startsRotation && session.tokenRotationMinutes) {
      await scheduleNextTokenRotation(
        ctx,
        args.sessionId,
        session.tokenRotationMinutes,
        now
      )
    }

    return { success: true, status: args.status }
  },
})

/**
 * Menghapus sesi ujian beserta seluruh peserta dan lembar jawaban terkait (cascade delete).
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

    // 1. Ambil seluruh peserta ujian pada sesi ini
    const participants = await ctx.db
      .query("examParticipants")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .collect()

    // 2. Hapus seluruh lembar jawaban santri dari setiap peserta, lalu hapus peserta
    for (const p of participants) {
      const answers = await ctx.db
        .query("studentAnswers")
        .withIndex("by_participant", (q) => q.eq("participantId", p._id))
        .collect()
      for (const ans of answers) {
        await ctx.db.delete("studentAnswers", ans._id)
      }
      await ctx.db.delete("examParticipants", p._id)
    }

    // 3. Hapus dokumen sesi ujian
    await ctx.db.delete("examSessions", args.sessionId)

    return { success: true }
  },
})

/**
 * Mengeluarkan atau menghapus peserta tertentu dari sesi ujian beserta seluruh lembar jawabannya.
 */
export const removeSessionParticipant = mutation({
  args: {
    participantId: v.id("examParticipants"),
  },
  handler: async (ctx, args) => {
    const user = await requireAuthenticatedUser(ctx)

    const participant = await ctx.db.get("examParticipants", args.participantId)
    if (!participant) {
      throw new Error("Peserta ujian tidak ditemukan.")
    }

    const session = await ctx.db.get("examSessions", participant.sessionId)
    if (!session) {
      throw new Error("Sesi ujian tidak ditemukan.")
    }

    if (session.creatorTokenIdentifier !== user.tokenIdentifier) {
      throw new Error("Akses ditolak: Anda tidak berwenang mengelola peserta pada sesi ini.")
    }

    // 1. Hapus seluruh lembar jawaban santri ini
    const answers = await ctx.db
      .query("studentAnswers")
      .withIndex("by_participant", (q) => q.eq("participantId", args.participantId))
      .collect()
    for (const ans of answers) {
      await ctx.db.delete("studentAnswers", ans._id)
    }

    // 2. Hapus peserta dari sesi
    await ctx.db.delete("examParticipants", args.participantId)

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
    const rawToken = args.token.trim().toUpperCase()
    const cleanNisn = args.nisn.trim()
    let verifiedName = cleanStudentName(args.studentName.trim())

    if (!cleanNisn) {
      throw new Error("Nomor Induk Santri (NISN / NIS / ID Santri) wajib diisi.")
    }

    if (!verifiedName) {
      throw new Error("Nama lengkap santri wajib diisi.")
    }

    // Mendukung token 6 karakter (token dasar) atau 8 karakter (token + 2 digit santri)
    if (rawToken.length !== 6 && rawToken.length !== 8) {
      throw new Error("Token ujian harus terdiri dari 6 karakter sesi atau 8 karakter (termasuk 2 digit santri).")
    }

    const cleanToken = rawToken.slice(0, 6)
    const suppliedDigits = rawToken.length === 8 ? rawToken.slice(6) : null

    const session = await ctx.db
      .query("examSessions")
      .withIndex("by_token", (q) => q.eq("token", cleanToken))
      .first()

    if (!session) {
      throw new Error(
        "Token ujian tidak berlaku lagi. Minta token terbaru kepada pengawas, lalu ketik ulang token tersebut."
      )
    }

    if (session.status === "draft") {
      throw new Error("Sesi ujian belum diaktifkan oleh pengawas ujian.")
    }

    if (session.status === "ended") {
      throw new Error("Sesi ujian ini telah berakhir dan ditutup oleh pengawas.")
    }

    if (session.eligibleNisns !== undefined) {
      const allowed = session.eligibleNisns.some(
        (nisn) => normalizeNisn(nisn) === normalizeNisn(cleanNisn)
      )
      if (!allowed) {
        throw new Error(
          "Sesi ini hanya untuk santri yang dipilih pengajar. Nomor Induk Anda tidak termasuk daftar peserta sesi lanjutan."
        )
      }
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
          identifierMatches(s.santriId, cleanNisn) ||
          identifierMatches(s.nis, cleanNisn) ||
          identifierMatches(s.nisn, cleanNisn)
      )
      if (found) {
        student = found
      } else if (allStudents.length > 0) {
        throw new Error(
          "Nomor Induk Santri tidak ditemukan dalam basis data pesantren. Pastikan nomor induk Anda benar atau hubungi pengawas."
        )
      }
    }

    // Validasi 2 digit terakhir token jika menggunakan format 8 karakter (token + 2 digit santri)
    // Mendukung baik 2 angka terakhir NISN, NIS, maupun ID santri agar fleksibel bagi santri
    if (student && suppliedDigits !== null) {
      const validDigits = getValidStudentTwoDigits(student)
      if (!validDigits.includes(suppliedDigits)) {
        throw new Error(
          "2 angka terakhir token tidak cocok dengan nomor induk santri Anda. Pastikan memasukkan 6 huruf token sesi diikuti 2 angka terakhir nomor identitas Anda."
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
      verifiedName = cleanStudentName(verifiedName)
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

    // Nomor induk peserta disimpan dalam bentuk resmi dari data master. Tanpa ini,
    // satu santri dapat membuat dua baris peserta hanya karena beda format ketik.
    const officialNisn = student ? (student.nisn ?? student.nis ?? student.santriId) : cleanNisn

    // Periksa apakah santri sudah terdaftar di sesi ini sebelumnya
    const existingParticipant = await ctx.db
      .query("examParticipants")
      .withIndex("by_session_and_nisn", (q) =>
        q.eq("sessionId", session._id).eq("nisn", officialNisn)
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
      nisn: officialNisn,
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
      nisn: officialNisn,
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

    if (participant.lockedAt !== undefined) {
      throw new Error(
        "Lembar jawaban Anda sedang dikunci oleh pengawas. Jawaban tidak dapat diubah sampai pengawas membuka kunci."
      )
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
      return {
        success: true,
        count: participant.tabViolations ?? 0,
        tabViolations: participant.tabViolations ?? 0,
        locked: participant.lockedAt !== undefined,
      }
    }

    const session = await ctx.db.get("examSessions", participant.sessionId)
    if (session && session.status === "ended") {
      return {
        success: true,
        count: participant.tabViolations ?? 0,
        tabViolations: participant.tabViolations ?? 0,
        locked: participant.lockedAt !== undefined,
      }
    }

    const currentCount = participant.tabViolations ?? 0
    const newCount = currentCount + 1
    const now = Date.now()
    const shouldLock =
      participant.lockedAt === undefined &&
      shouldLockAfterViolation(
        session?.enforcementMode,
        session?.violationThreshold,
        newCount
      )

    await ctx.db.patch("examParticipants", args.participantId, {
      tabViolations: newCount,
      ...(shouldLock ? { lockedAt: now } : {}),
    })

    return {
      success: true,
      count: newCount,
      tabViolations: newCount,
      locked: shouldLock || participant.lockedAt !== undefined,
    }
  },
})

/**
 * Membuka kunci lembar peserta hanya oleh pengajar pemilik sesi.
 * Jawaban tersimpan tidak disentuh dan setiap pembukaan tercatat waktunya.
 */
export const unlockParticipant = mutation({
  args: {
    participantId: v.id("examParticipants"),
  },
  handler: async (ctx, args) => {
    const user = await requireAuthenticatedUser(ctx)

    const participant = await ctx.db.get("examParticipants", args.participantId)
    if (!participant) {
      throw new Error("Data peserta ujian tidak ditemukan.")
    }

    if (participant.status === "submitted") {
      throw new Error("Peserta sudah mengumpulkan lembar jawabannya.")
    }

    const session = await ctx.db.get("examSessions", participant.sessionId)
    if (!session) {
      throw new Error("Sesi ujian tidak ditemukan.")
    }

    if (session.creatorTokenIdentifier !== user.tokenIdentifier) {
      throw new Error("Akses ditolak: Anda tidak memiliki izin membuka kunci peserta ini.")
    }

    if (participant.lockedAt === undefined) {
      return { success: true, alreadyUnlocked: true }
    }

    const unlockedAt = Date.now()
    await ctx.db.patch("examParticipants", args.participantId, {
      lockedAt: undefined,
      unlockEvents: [
        ...(participant.unlockEvents ?? []),
        { unlockedAt, unlockedBy: user.name ?? "Pengajar" },
      ],
    })

    return { success: true, unlockedAt }
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
    const rawTotalScore = calculatedPgScore
    const totalScore = applyRemedialCap(session, rawTotalScore)

    await ctx.db.patch("examParticipants", args.participantId, {
      status: "submitted",
      finishedAt: now,
      multipleChoiceScore: calculatedPgScore,
      essayScore: 0,
      rawTotalScore,
      totalScore,
      gradingStatus,
    })

    return {
      success: true,
      submittedAt: now,
      multipleChoiceScore: calculatedPgScore,
      rawTotalScore,
      totalScore,
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

    const session = await ctx.db.get("examSessions", participant.sessionId)
    if (!session) {
      throw new Error("Sesi ujian tidak ditemukan.")
    }

    if (session.creatorTokenIdentifier !== user.tokenIdentifier) {
      throw new Error("Akses ditolak: Anda tidak memiliki izin mengoreksi peserta sesi ini.")
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
    const allQuestions = await ctx.db
      .query("questions")
      .withIndex("by_bank", (q) => q.eq("bankId", session.bankId))
      .collect()

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
    const rawTotalScore = pgScore + accumulatedEssayScore
    const finalTotal = applyRemedialCap(session, rawTotalScore)
    const newGradingStatus = allEssaysGraded ? "graded" : "pending_essay"

    await ctx.db.patch("examParticipants", args.participantId, {
      essayScore: accumulatedEssayScore,
      rawTotalScore,
      totalScore: finalTotal,
      gradingStatus: newGradingStatus,
    })

    return {
      success: true,
      essayScore: accumulatedEssayScore,
      rawTotalScore,
      totalScore: finalTotal,
      gradingStatus: newGradingStatus,
    }
  },
})
