import { v } from "convex/values"

import { query } from "../../_generated/server"

/**
 * Mengambil daftar seluruh mata pelajaran yang tersedia.
 */
export const listSubjects = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("subjects").collect()
  },
})

/**
 * Mengambil daftar paket bank soal milik pengajar yang sedang login.
 */
export const listQuestionBanks = query({
  args: {
    subjectCode: v.optional(v.string()),
    gradeLevel: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      return []
    }

    const q = ctx.db
      .query("questionBanks")
      .withIndex("by_author", (idx) =>
        idx.eq("authorTokenIdentifier", identity.tokenIdentifier)
      )

    const banks = await q.collect()

    return banks.filter((b) => {
      if (b.isArchived) return false
      if (args.subjectCode && b.subjectCode !== args.subjectCode) return false
      if (args.gradeLevel && b.gradeLevel !== args.gradeLevel) return false
      return true
    })
  },
})

/**
 * Mengambil detail satu paket bank soal beserta butir-butir soal di dalamnya.
 */
export const getQuestionBank = query({
  args: {
    bankId: v.id("questionBanks"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      return null
    }

    const bank = await ctx.db.get("questionBanks", args.bankId)
    if (!bank) {
      return null
    }

    if (bank.authorTokenIdentifier !== identity.tokenIdentifier) {
      return null
    }

    const questions = await ctx.db
      .query("questions")
      .withIndex("by_bank_and_order", (idx) => idx.eq("bankId", args.bankId))
      .collect()

    return {
      ...bank,
      questions,
    }
  },
})
