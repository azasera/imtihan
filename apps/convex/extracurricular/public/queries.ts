import { v } from "convex/values"
import { query } from "../../_generated/server"
import { getActiveAcademicPeriod, normalizeClassName } from "../private/helpers"

export const getGroups = query({
  args: {
    academicYear: v.optional(v.string()),
    semester: v.optional(v.union(v.literal(1), v.literal(2))),
  },
  handler: async (ctx, args) => {
    await ctx.auth.getUserIdentity()
    const period = await getActiveAcademicPeriod(ctx)
    const academicYear = args.academicYear || period.year
    const semester = args.semester || period.semester

    const groups = await ctx.db
      .query("extracurricularGroups")
      .withIndex("by_period", (q) =>
        q.eq("academicYear", academicYear).eq("semester", semester)
      )
      .collect()

    // Hitung jumlah peserta aktif per kelompok
    const enrollments = await ctx.db
      .query("extracurricularEnrollments")
      .withIndex("by_period_and_status", (q) =>
        q.eq("academicYear", academicYear).eq("semester", semester).eq("status", "active")
      )
      .collect()

    const countMap: Record<string, number> = {}
    for (const e of enrollments) {
      countMap[e.groupId] = (countMap[e.groupId] || 0) + 1
    }

    const enrichedGroups = groups.map((g) => ({
      ...g,
      memberCount: countMap[g._id] || 0,
    }))

    // Urutkan: Wajib (Rohis) pertama, lalu Pilihan berdasarkan nama
    enrichedGroups.sort((a, b) => {
      if (a.category === "wajib" && b.category !== "wajib") return -1
      if (a.category !== "wajib" && b.category === "wajib") return 1
      return a.name.localeCompare(b.name)
    })

    return {
      academicYear,
      semester,
      groups: enrichedGroups,
    }
  },
})

export const getGroupDetails = query({
  args: {
    groupId: v.id("extracurricularGroups"),
  },
  handler: async (ctx, args) => {
    await ctx.auth.getUserIdentity()
    return await ctx.db.get(args.groupId)
  },
})

export const getGroupMembers = query({
  args: {
    groupId: v.id("extracurricularGroups"),
    search: v.optional(v.string()),
    className: v.optional(v.string()),
    gender: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.auth.getUserIdentity()
    const group = await ctx.db.get(args.groupId)
    if (!group) {
      return { group: null, members: [] }
    }

    const members = await ctx.db
      .query("extracurricularEnrollments")
      .withIndex("by_group_and_status", (q) =>
        q.eq("groupId", args.groupId).eq("status", "active")
      )
      .collect()

    let filtered = members

    if (args.search && args.search.trim() !== "") {
      const q = args.search.toLowerCase().trim()
      filtered = filtered.filter(
        (m) =>
          m.studentName.toLowerCase().includes(q) ||
          m.santriId.toLowerCase().includes(q) ||
          m.nisn.toLowerCase().includes(q)
      )
    }

    if (args.className && args.className !== "ALL") {
      const targetNorm = normalizeClassName(args.className)
      filtered = filtered.filter(
        (m) =>
          normalizeClassName(m.className) === targetNorm ||
          m.className.toUpperCase().replace(/\s+/g, "") === targetNorm
      )
    }

    if (args.gender && args.gender !== "ALL") {
      filtered = filtered.filter((m) => m.gender === args.gender)
    }

    // Urutkan berdasarkan kelas, lalu nama santri
    filtered.sort((a, b) => {
      const classCompare = a.className.localeCompare(b.className)
      if (classCompare !== 0) return classCompare
      return a.studentName.localeCompare(b.studentName)
    })

    return {
      group,
      members: filtered,
    }
  },
})

export const getAvailableStudentsForGroup = query({
  args: {
    groupId: v.id("extracurricularGroups"),
    search: v.optional(v.string()),
    className: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await ctx.auth.getUserIdentity()
    const group = await ctx.db.get(args.groupId)
    if (!group) return []

    // Ambil santri yang sudah aktif di kelompok ini
    const existing = await ctx.db
      .query("extracurricularEnrollments")
      .withIndex("by_group_and_status", (q) =>
        q.eq("groupId", args.groupId).eq("status", "active")
      )
      .collect()

    const enrolledSantriIds = new Set(existing.map((e) => e.santriId))

    // Ambil data santri dari tabel students
    let students = await ctx.db.query("students").collect()

    // Terapkan batasan gender ekskul bila ada
    if (group.genderRestriction === "ikhwan") {
      students = students.filter((s) => s.jenisKelamin === "L")
    } else if (group.genderRestriction === "akhwat") {
      students = students.filter((s) => s.jenisKelamin === "P")
    }

    // Filter yang belum terdaftar
    let candidates = students.filter((s) => !enrolledSantriIds.has(s.santriId))

    if (args.className && args.className !== "ALL") {
      const targetNorm = normalizeClassName(args.className)
      candidates = candidates.filter(
        (s) =>
          normalizeClassName(s.kelas) === targetNorm ||
          s.kelas.toUpperCase().replace(/\s+/g, "") === targetNorm
      )
    }

    if (args.search && args.search.trim() !== "") {
      const q = args.search.toLowerCase().trim()
      candidates = candidates.filter(
        (s) =>
          s.nama.toLowerCase().includes(q) ||
          s.santriId.toLowerCase().includes(q) ||
          (s.nisn && s.nisn.toLowerCase().includes(q))
      )
    }

    candidates.sort((a, b) => {
      const classCompare = a.kelas.localeCompare(b.kelas)
      if (classCompare !== 0) return classCompare
      return a.nama.localeCompare(b.nama)
    })

    const max = args.limit || 50
    return candidates.slice(0, max)
  },
})

export const getAllActiveGroupsForTransfer = query({
  args: {
    academicYear: v.string(),
    semester: v.union(v.literal(1), v.literal(2)),
  },
  handler: async (ctx, args) => {
    await ctx.auth.getUserIdentity()
    const groups = await ctx.db
      .query("extracurricularGroups")
      .withIndex("by_period", (q) =>
        q.eq("academicYear", args.academicYear).eq("semester", args.semester)
      )
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect()

    return groups.map((g) => ({
      _id: g._id,
      code: g.code,
      name: g.name,
      category: g.category,
      genderRestriction: g.genderRestriction,
    }))
  },
})
