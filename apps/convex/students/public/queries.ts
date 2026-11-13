import { query } from "../../_generated/server"
import type { Doc } from "../../_generated/dataModel"
import { identifierMatches, extractStudentTwoDigits, cleanStudentName } from "../../model/nisn"
import { v } from "convex/values"

/**
 * Identitas minimal yang dibutuhkan gerbang ujian santri.
 * NIS/NISN, asrama, pembimbing halaqah, dan capaian hafalan sengaja tidak
 * ikut dikirim: query ini dapat dipanggil tanpa login.
 * Menghasilkan twoDigits (2 angka terakhir) untuk validasi instan token santri di client.
 */
function studentGateProfile(student: Doc<"students">) {
  return {
    santriId: student.santriId,
    nama: cleanStudentName(student.nama),
    jenjang: student.jenjang,
    kelas: student.kelas,
    twoDigits: extractStudentTwoDigits(student),
  }
}

export const getStudents = query({
  args: {
    jenjang: v.optional(
      v.union(v.literal("ALL"), v.literal("SMPITA"), v.literal("SMAITA"), v.literal("MTA"))
    ),
    searchQuery: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Audit identitas pemanggil bila tersedia
    await ctx.auth.getUserIdentity()

    let studentDocs = []

    if (args.jenjang && args.jenjang !== "ALL") {
      studentDocs = await ctx.db
        .query("students")
        .withIndex("by_jenjang", (q) => q.eq("jenjang", args.jenjang as "SMPITA" | "SMAITA" | "MTA"))
        .collect()
    } else {
      studentDocs = await ctx.db.query("students").collect()
    }

    if (args.searchQuery && args.searchQuery.trim()) {
      const q = args.searchQuery.trim().toLowerCase()
      studentDocs = studentDocs.filter((s) => {
        return (
          s.nama.toLowerCase().includes(q) ||
          s.santriId.toLowerCase().includes(q) ||
          (s.nis && s.nis.toLowerCase().includes(q)) ||
          (s.nisn && s.nisn.toLowerCase().includes(q)) ||
          s.kelas.toLowerCase().includes(q)
        )
      })
    }

    // Sort by jenjang then kelas then nama
    studentDocs.sort((a, b) => {
      if (a.jenjang !== b.jenjang) return a.jenjang.localeCompare(b.jenjang)
      if (a.kelas !== b.kelas) return a.kelas.localeCompare(b.kelas)
      return a.nama.localeCompare(b.nama)
    })

    const limit = args.limit || 500
    const sliced = studentDocs.slice(0, limit)
    return sliced.map((s) => ({
      ...s,
      nama: cleanStudentName(s.nama),
    }))
  },
})

export const getStudentStats = query({
  args: {},
  handler: async (ctx) => {
    const stats = {
      total: 0,
      SMPITA: 0,
      SMAITA: 0,
      MTA: 0,
      lastSyncedAt: 0,
    }

    // Audit identitas pemanggil bila tersedia
    await ctx.auth.getUserIdentity()

    const all = await ctx.db.query("students").collect()
    stats.total = all.length

    for (const s of all) {
      if (s.jenjang === "SMPITA") stats.SMPITA++
      else if (s.jenjang === "SMAITA") stats.SMAITA++
      else if (s.jenjang === "MTA") stats.MTA++

      if (s.syncedAt > stats.lastSyncedAt) {
        stats.lastSyncedAt = s.syncedAt
      }
    }

    return stats
  },
})

export const lookupStudent = query({
  args: {
    identifier: v.string(),
  },
  handler: async (ctx, args) => {
    const clean = args.identifier.trim()
    if (!clean) return null

    // 1. Coba cari by santriId (exact match, case-insensitive)
    const byId = await ctx.db
      .query("students")
      .withIndex("by_santri_id", (q) => q.eq("santriId", clean))
      .first()
    if (byId) return studentGateProfile(byId)

    // 2. Coba cari by nisn
    const byNisn = await ctx.db
      .query("students")
      .withIndex("by_nisn", (q) => q.eq("nisn", clean))
      .first()
    if (byNisn) return studentGateProfile(byNisn)

    // 3. Coba cari by nis
    const byNis = await ctx.db
      .query("students")
      .withIndex("by_nis", (q) => q.eq("nis", clean))
      .first()
    if (byNis) return studentGateProfile(byNis)

    // 4. Fallback: abaikan beda besar-kecil huruf dan nol depan pada nomor induk
    const all = await ctx.db.query("students").collect()
    const found = all.find(
      (s) =>
        identifierMatches(s.santriId, clean) ||
        identifierMatches(s.nis, clean) ||
        identifierMatches(s.nisn, clean)
    )

    return found ? studentGateProfile(found) : null
  },
})

/**
 * Mengambil daftar kelas unik resmi yang tersedia di database untuk lembaga tertentu.
 * - SMPITA: kelas 7 sampai 9
 * - SMAITA: kelas 10 sampai 12
 * - MTA: MTA 1 sampai MTA 4
 * Jika kelas belum tersedia di database, mengembalikan array kosong.
 */
export const getClassesByLembaga = query({
  args: {
    jenjang: v.union(v.literal("SMPITA"), v.literal("SMAITA"), v.literal("MTA")),
  },
  handler: async (ctx, args) => {
    const students = await ctx.db
      .query("students")
      .withIndex("by_jenjang", (q) => q.eq("jenjang", args.jenjang))
      .collect()

    const classSet = new Set<string>()

    for (const student of students) {
      if (student.kelas && student.kelas.trim() && student.kelas !== "-") {
        const k = student.kelas.trim()
        if (args.jenjang === "SMPITA") {
          // Memastikan hanya kelas 7 sampai 9
          if (/^(kelas\s*)?[7-9]/i.test(k)) {
            classSet.add(k)
          }
        } else if (args.jenjang === "SMAITA") {
          // Memastikan hanya kelas 10 sampai 12
          if (/^(kelas\s*)?(10|11|12)/i.test(k)) {
            classSet.add(k)
          }
        } else if (args.jenjang === "MTA") {
          // Memastikan hanya MTA 1 sampai 6
          if (/^mta\s*[1-6]/i.test(k)) {
            classSet.add(k)
          }
        }
      }
    }

    return Array.from(classSet).sort((a, b) =>
      a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" })
    )
  },
})

