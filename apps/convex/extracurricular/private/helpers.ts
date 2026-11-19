import type { MutationCtx, QueryCtx } from "../../_generated/server"
import { requireAuthenticatedUser, type AuthenticatedUser } from "../../model/auth"

export { requireAuthenticatedUser }
export type { AuthenticatedUser }

export async function getActiveAcademicPeriod(ctx: QueryCtx | MutationCtx) {
  const active = await ctx.db
    .query("academicPeriods")
    .withIndex("by_active", (q) => q.eq("isActive", true))
    .first()

  if (active) return active

  return {
    year: "2026/2027",
    semester: 1 as const,
    reportDate: "Pangkalpinang, 09 Oktober 2026",
    isActive: true,
  }
}

export function normalizeClassName(c: string): string {
  return c
    .toUpperCase()
    .replace(/^KELAS\s*/, "")
    .replace(/\s+/g, "")
    .replace(/^VII(?=[A-Z0-9]|$)/, "7")
    .replace(/^VIII(?=[A-Z0-9]|$)/, "8")
    .replace(/^IX(?=[A-Z0-9]|$)/, "9")
    .replace(/^X(?=[A-Z0-9]|$)/, "10")
    .replace(/^XI(?=[A-Z0-9]|$)/, "11")
    .replace(/^XII(?=[A-Z0-9]|$)/, "12")
}

export async function syncSantriExtracurricularsToHomeroom(
  ctx: MutationCtx,
  {
    santriId,
    academicYear,
    semester,
    updatedBy,
  }: {
    santriId: string
    academicYear: string
    semester: 1 | 2
    updatedBy: string
  }
) {
  // Ambil seluruh keanggotaan aktif santri di periode ini
  const activeEnrollments = await ctx.db
    .query("extracurricularEnrollments")
    .withIndex("by_santri_and_period", (q) =>
      q.eq("santriId", santriId).eq("academicYear", academicYear).eq("semester", semester)
    )
    .filter((q) => q.eq(q.field("status"), "active"))
    .collect()

  // Urutkan Rohis di posisi pertama bila ada, sisanya alfabetis
  const sorted = [...activeEnrollments].sort((a, b) => {
    if (a.groupCode.toLowerCase() === "rohis") return -1
    if (b.groupCode.toLowerCase() === "rohis") return 1
    return a.groupName.localeCompare(b.groupName)
  })

  const extracurriculars = sorted.map((item) => ({
    name: item.groupName,
    score: item.score,
    description: item.description,
  }))

  const existingHomeroom = await ctx.db
    .query("homeroomAssessments")
    .withIndex("by_santri", (q) =>
      q.eq("santriId", santriId).eq("academicYear", academicYear).eq("semester", semester)
    )
    .first()

  const now = Date.now()

  if (existingHomeroom) {
    await ctx.db.patch(existingHomeroom._id, {
      extracurriculars,
      updatedBy,
      updatedAt: now,
    })
    return existingHomeroom._id
  }

  // Jika record homeroom belum ada, ambil data santri untuk membuat record awal
  const student = await ctx.db
    .query("students")
    .withIndex("by_santri_id", (q) => q.eq("santriId", santriId))
    .first()

  if (!student) {
    return null
  }

  return await ctx.db.insert("homeroomAssessments", {
    academicYear,
    semester,
    santriId: student.santriId,
    nisn: student.nisn || student.nis || "-",
    studentName: student.nama,
    className: student.kelas,
    institution: student.jenjang,
    sickDays: 0,
    permissionDays: 0,
    absentDays: 0,
    extracurriculars,
    haditsTarget: "3 Hadits Arba'in",
    haditsAchievement: "3 Hadits Tuntas",
    homeroomNotes:
      "Alhamdulillah, semangat belajar dan tingkatkan terus prestasimu. Ta'at kepada guru dan orangtua serta istiqomah muraja'ah Al-Qur'an dan Hadits setiap hari.",
    promotionDecision: "-",
    updatedBy,
    createdAt: now,
    updatedAt: now,
  })
}
