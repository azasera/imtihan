import { v } from "convex/values"

import { query } from "../../_generated/server"
import { getActiveSessionForBank, requireAuthenticatedUser } from "../private/helpers"

/**
 * Mengambil daftar seluruh mata pelajaran yang tersedia.
 * Daftar ini milik bersama madrasah, jadi boleh dibaca tanpa login;
 * mata pelajaran nonaktif ikut dikembalikan agar paket lama tetap menampilkan namanya.
 */
export const listSubjects = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("subjects").collect()
  },
})

/**
 * Daftar mata pelajaran beserta jumlah paket yang memakainya, untuk layar kelola.
 * Jumlah dihitung dari indeks paket, bukan dari perkiraan, karena angka inilah yang
 * menentukan apakah sebuah mata pelajaran masih bisa dihapus permanen.
 */
export const listSubjectsWithUsage = query({
  args: {},
  handler: async (ctx) => {
    await requireAuthenticatedUser(ctx)

    const subjects = await ctx.db.query("subjects").collect()

    const withUsage = await Promise.all(
      subjects.map(async (subject) => {
        const banks = await ctx.db
          .query("questionBanks")
          .withIndex("by_subject", (idx) => idx.eq("subjectCode", subject.code))
          .collect()
        return { ...subject, isActive: subject.isActive !== false, bankCount: banks.length }
      })
    )

    return withUsage.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }))
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

    const filtered = banks.filter((b) => {
      if (b.isArchived) return false
      if (args.subjectCode && b.subjectCode !== args.subjectCode) return false
      if (args.gradeLevel && b.gradeLevel !== args.gradeLevel) return false
      return true
    })

    return await Promise.all(
      filtered.map(async (b) => {
        const sessions = await ctx.db
          .query("examSessions")
          .withIndex("by_bank", (idx) => idx.eq("bankId", b._id))
          .collect()
        const active = sessions.find((s) => s.status === "active")
        return {
          ...b,
          sessionCount: sessions.length,
          activeSessionTitle: active?.title ?? null,
        }
      })
    )
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

    // Nama dibaca lewat kode agar ganti nama pada daftar bersama langsung tercermin di editor.
    const subject = await ctx.db
      .query("subjects")
      .withIndex("by_code", (idx) => idx.eq("code", bank.subjectCode))
      .first()

    return {
      ...bank,
      subjectName: subject?.name ?? bank.subjectCode,
      questions,
    }
  },
})

/**
 * Label capaian materi yang sudah dipakai butir-butir pada mata pelajaran paket ini.
 * Dipakai sebagai saran isian agar pengajar memakai kosakata yang sama, tanpa memaksa
 * daftar kurikulum baku: label tetap tersimpan bersama butirnya masing-masing.
 */
export const listAchievementLabels = query({
  args: {
    bankId: v.id("questionBanks"),
  },
  handler: async (ctx, args) => {
    await requireAuthenticatedUser(ctx)

    const bank = await ctx.db.get("questionBanks", args.bankId)
    if (!bank) {
      return []
    }

    const siblingBanks = await ctx.db
      .query("questionBanks")
      .withIndex("by_subject", (idx) => idx.eq("subjectCode", bank.subjectCode))
      .collect()

    const labels = new Set<string>()
    for (const sibling of siblingBanks) {
      const questions = await ctx.db
        .query("questions")
        .withIndex("by_bank", (idx) => idx.eq("bankId", sibling._id))
        .collect()
      for (const question of questions) {
        const label = question.achievementRef?.trim()
        if (label) labels.add(label)
      }
    }

    return [...labels].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }))
  },
})

/**
 * Menandai apakah paket sedang dipakai sesi ujian yang masih berjalan.
 * Hanya pemilik paket yang memperoleh judul sesinya; pemanggil lain memperoleh kosong.
 */
export const getBankActiveLock = query({
  args: {
    bankId: v.id("questionBanks"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      return null
    }

    const bank = await ctx.db.get("questionBanks", args.bankId)
    if (!bank || bank.authorTokenIdentifier !== identity.tokenIdentifier) {
      return null
    }

    const session = await getActiveSessionForBank(ctx, args.bankId)
    if (!session) {
      return null
    }

    return { sessionId: session._id, title: session.title }
  },
})
