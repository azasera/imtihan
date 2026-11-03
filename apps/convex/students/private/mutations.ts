import { internalMutation } from "../../_generated/server"
import { v } from "convex/values"

export const upsertStudentsBatch = internalMutation({
  args: {
    students: v.array(
      v.object({
        santriId: v.string(),
        sipaksaId: v.string(),
        nama: v.string(),
        nis: v.optional(v.string()),
        nisn: v.optional(v.string()),
        jenjang: v.union(v.literal("SMPITA"), v.literal("SMAITA"), v.literal("MTA")),
        kelas: v.string(),
        jenisKelamin: v.string(),
        status: v.string(),
        dormitory: v.optional(v.string()),
        guruHalaqah: v.optional(v.string()),
        namaHalaqah: v.optional(v.string()),
        totalHafalan: v.optional(v.number()),
        targetJuz: v.optional(v.number()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now()
    let inserted = 0
    let updated = 0

    for (const student of args.students) {
      const existing = await ctx.db
        .query("students")
        .withIndex("by_santri_id", (q) => q.eq("santriId", student.santriId))
        .first()

      if (existing) {
        await ctx.db.patch(existing._id, {
          sipaksaId: student.sipaksaId,
          nama: student.nama,
          nis: student.nis,
          nisn: student.nisn,
          jenjang: student.jenjang,
          kelas: student.kelas,
          jenisKelamin: student.jenisKelamin,
          status: student.status,
          dormitory: student.dormitory,
          guruHalaqah: student.guruHalaqah,
          namaHalaqah: student.namaHalaqah,
          totalHafalan: student.totalHafalan,
          targetJuz: student.targetJuz,
          syncedAt: now,
        })
        updated++
      } else {
        await ctx.db.insert("students", {
          ...student,
          syncedAt: now,
        })
        inserted++
      }
    }

    return { inserted, updated, total: inserted + updated }
  },
})
