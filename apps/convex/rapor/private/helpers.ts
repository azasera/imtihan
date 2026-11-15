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

export function getDefaultHomeroomForClass(className: string): { name: string; niy: string } {
  const norm = normalizeClassName(className)

  const map: Record<string, { name: string; niy: string }> = {
    "7A": { name: "Riko", niy: "200109290320231159" },
    "7B": { name: "Randhy Raviza, S.Pd.", niy: "199507180720181019" },
    "7C": { name: "Ayu Ratnapury, M.Pd.", niy: "" },
    "8A": { name: "Hendy Sumpeno, S.T", niy: "" },
    "8B": { name: "Adi Saputra, S.H.", niy: "" },
    "8C": { name: "Ipikasari, M.Pd.", niy: "" },
    "8D": { name: "Nurrahma Firmania, S.Pd.I", niy: "" },
    "9A": { name: "Muhammad Yasser, S.Pd.", niy: "199512310120191027" },
    "9B": { name: "Muhlis Annas, S.Pd.", niy: "" },
    "9C": { name: "Hevi Ratna Sari, S.Si.", niy: "" },
    "10A": { name: "Ahmad Reihan, S.Pd.", niy: "" },
  }

  return map[norm] ?? { name: "Muhammad Yasser, S.Pd.", niy: "199512310120191027" }
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
