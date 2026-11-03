import { v } from "convex/values"

import { mutation } from "../../_generated/server"
import { requireAuthenticatedUser } from "../private/helpers"

/**
 * Membuat paket bank soal baru.
 */
export const createQuestionBank = mutation({
  args: {
    title: v.string(),
    subjectCode: v.string(),
    gradeLevel: v.string(),
    description: v.optional(v.string()),
    totalPoints: v.optional(v.number()),
    passingScore: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await requireAuthenticatedUser(ctx)

    const now = Date.now()
    const bankId = await ctx.db.insert("questionBanks", {
      title: args.title.trim(),
      subjectCode: args.subjectCode.trim(),
      gradeLevel: args.gradeLevel.trim(),
      description: args.description?.trim(),
      totalPoints: args.totalPoints ?? 100,
      passingScore: args.passingScore ?? 75,
      authorTokenIdentifier: user.tokenIdentifier,
      authorName: user.name,
      isArchived: false,
      createdAt: now,
      updatedAt: now,
    })

    return bankId
  },
})

/**
 * Memperbarui data paket bank soal.
 */
export const updateQuestionBank = mutation({
  args: {
    bankId: v.id("questionBanks"),
    title: v.optional(v.string()),
    subjectCode: v.optional(v.string()),
    gradeLevel: v.optional(v.string()),
    description: v.optional(v.string()),
    totalPoints: v.optional(v.number()),
    passingScore: v.optional(v.number()),
    isArchived: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const user = await requireAuthenticatedUser(ctx)
    const bank = await ctx.db.get("questionBanks", args.bankId)
    if (!bank) {
      throw new Error("Paket bank soal tidak ditemukan.")
    }

    if (bank.authorTokenIdentifier !== user.tokenIdentifier) {
      throw new Error("Akses ditolak: Anda bukan pemilik paket bank soal ini.")
    }

    const updates: Record<string, unknown> = {
      updatedAt: Date.now(),
    }
    if (args.title !== undefined) updates.title = args.title.trim()
    if (args.subjectCode !== undefined) updates.subjectCode = args.subjectCode.trim()
    if (args.gradeLevel !== undefined) updates.gradeLevel = args.gradeLevel.trim()
    if (args.description !== undefined) updates.description = args.description?.trim()
    if (args.totalPoints !== undefined) updates.totalPoints = args.totalPoints
    if (args.passingScore !== undefined) updates.passingScore = args.passingScore
    if (args.isArchived !== undefined) updates.isArchived = args.isArchived

    await ctx.db.patch("questionBanks", args.bankId, updates)
  },
})

/**
 * Menghapus paket bank soal dan butir-butir soal di dalamnya.
 */
export const deleteQuestionBank = mutation({
  args: {
    bankId: v.id("questionBanks"),
  },
  handler: async (ctx, args) => {
    const user = await requireAuthenticatedUser(ctx)
    const bank = await ctx.db.get("questionBanks", args.bankId)
    if (!bank) {
      throw new Error("Paket bank soal tidak ditemukan.")
    }

    if (bank.authorTokenIdentifier !== user.tokenIdentifier) {
      throw new Error("Akses ditolak: Anda bukan pemilik paket bank soal ini.")
    }

    // Hapus seluruh butir soal yang berelasi
    const questions = await ctx.db
      .query("questions")
      .withIndex("by_bank", (idx) => idx.eq("bankId", args.bankId))
      .collect()

    for (const q of questions) {
      await ctx.db.delete("questions", q._id)
    }

    await ctx.db.delete("questionBanks", args.bankId)
  },
})

/**
 * Menambahkan butir soal baru ke dalam bank soal.
 */
export const createQuestion = mutation({
  args: {
    bankId: v.id("questionBanks"),
    type: v.union(
      v.literal("multiple_choice"),
      v.literal("pg_kompleks"),
      v.literal("true_false"),
      v.literal("essay")
    ),
    stimulusText: v.optional(v.string()),
    stimulusMediaUrl: v.optional(v.string()),
    questionText: v.string(),
    points: v.number(),
    options: v.optional(
      v.array(
        v.object({
          id: v.string(),
          label: v.string(),
          text: v.string(),
          isCorrect: v.boolean(),
        })
      )
    ),
    rubric: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireAuthenticatedUser(ctx)
    const bank = await ctx.db.get("questionBanks", args.bankId)
    if (!bank) {
      throw new Error("Paket bank soal tidak ditemukan.")
    }

    if (bank.authorTokenIdentifier !== user.tokenIdentifier) {
      throw new Error("Akses ditolak: Anda bukan pemilik paket bank soal ini.")
    }

    // Validasi opsi pilihan ganda
    if (args.type === "multiple_choice") {
      if (!args.options || args.options.length < 2) {
        throw new Error("Soal pilihan ganda harus memiliki minimal 2 opsi jawaban.")
      }
      const correctCount = args.options.filter((o) => o.isCorrect).length
      if (correctCount !== 1) {
        throw new Error("Soal pilihan ganda harus memiliki tepat satu kunci jawaban yang benar.")
      }
    }

    // Validasi opsi pilihan ganda kompleks (multi-kunci benar)
    if (args.type === "pg_kompleks") {
      if (!args.options || args.options.length < 3) {
        throw new Error("Soal pilihan ganda kompleks harus memiliki minimal 3 opsi jawaban.")
      }
      const correctCount = args.options.filter((o) => o.isCorrect).length
      if (correctCount < 2) {
        throw new Error("Soal pilihan ganda kompleks harus memiliki minimal 2 kunci jawaban yang benar.")
      }
    }

    // Validasi opsi benar/salah
    if (args.type === "true_false") {
      if (!args.options || args.options.length !== 2) {
        throw new Error("Soal benar/salah harus memiliki tepat 2 opsi pilihan (Benar dan Salah).")
      }
      const correctCount = args.options.filter((o) => o.isCorrect).length
      if (correctCount !== 1) {
        throw new Error("Soal benar/salah harus memiliki tepat satu status jawaban yang benar.")
      }
    }

    // Hitung nomor urut berikutnya
    const existing = await ctx.db
      .query("questions")
      .withIndex("by_bank", (idx) => idx.eq("bankId", args.bankId))
      .collect()

    const orderNumber = existing.length + 1
    const now = Date.now()

    const questionId = await ctx.db.insert("questions", {
      bankId: args.bankId,
      orderNumber,
      type: args.type,
      stimulusText: args.stimulusText?.trim() || undefined,
      stimulusMediaUrl: args.stimulusMediaUrl?.trim() || undefined,
      questionText: args.questionText.trim(),
      points: args.points,
      options: args.options,
      rubric: args.rubric?.trim(),
      createdAt: now,
      updatedAt: now,
    })

    return questionId
  },
})

/**
 * Menghapus butir soal.
 */
export const deleteQuestion = mutation({
  args: {
    questionId: v.id("questions"),
  },
  handler: async (ctx, args) => {
    const user = await requireAuthenticatedUser(ctx)
    const question = await ctx.db.get("questions", args.questionId)
    if (!question) {
      throw new Error("Butir soal tidak ditemukan.")
    }

    const bank = await ctx.db.get("questionBanks", question.bankId)
    if (!bank || bank.authorTokenIdentifier !== user.tokenIdentifier) {
      throw new Error("Akses ditolak.")
    }

    await ctx.db.delete("questions", args.questionId)
  },
})

/**
 * Inisialisasi daftar mata pelajaran default pesantren/madrasah.
 */
export const seedDefaultSubjects = mutation({
  args: {},
  handler: async (ctx) => {
    await requireAuthenticatedUser(ctx)

    const defaultSubjects = [
      { code: "TAHFIDZ", name: "Tahfidz & Tahsin Al-Qur'an", description: "Hafalan dan kaidah tajwid Al-Qur'an" },
      { code: "AQIDAH", name: "Aqidah & Tauhid", description: "Pemahaman tauhid dan keimanan Ahlus Sunnah wal Jama'ah" },
      { code: "FIQIH", name: "Fiqih Ibadah", description: "Kaidah dan hukum ibadah thaharah, shalat, puasa, dan zakat" },
      { code: "B_ARAB", name: "Bahasa Arab", description: "Mufradat, Nahwu, dan Sharaf dasar" },
      { code: "HADITS", name: "Hadits Nabawi", description: "Hafalan matan hadits dan pemahaman kandungan" },
      { code: "TARIKH", name: "Tarikh Islam & Siroh", description: "Sejarah Nabi Muhammad SAW dan para sahabat" },
    ]

    for (const s of defaultSubjects) {
      const existing = await ctx.db
        .query("subjects")
        .withIndex("by_code", (idx) => idx.eq("code", s.code))
        .first()

      if (!existing) {
        await ctx.db.insert("subjects", {
          code: s.code,
          name: s.name,
          description: s.description,
          createdAt: Date.now(),
        })
      }
    }
  },
})
