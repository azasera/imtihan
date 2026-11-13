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

  // Fallback default bila belum diinisialisasi
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

export async function findStudentsByClassFlexible(
  ctx: QueryCtx | MutationCtx,
  className: string
) {
  // 1. Coba exact match terlebih dahulu lewat indeks
  const exact = await ctx.db
    .query("students")
    .withIndex("by_kelas", (q) => q.eq("kelas", className))
    .collect()

  if (exact.length > 0) return exact

  // 2. Jika tidak ditemukan, cari dengan normalisasi fleksibel (misal: "VII B" vs "7B" vs "7 B")
  const all = await ctx.db.query("students").collect()
  const targetNorm = normalizeClassName(className)
  return all.filter((s) => normalizeClassName(s.kelas) === targetNorm)
}
