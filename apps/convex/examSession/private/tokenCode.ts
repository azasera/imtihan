import type { MutationCtx } from "../../_generated/server"
import { generateExamToken, tokenRotationDueAt } from "./helpers"

/**
 * Token sesi selalu unik; pengulangan lima kali menutup tabrakan yang sangat jarang.
 */
export async function generateUniqueSessionToken(ctx: MutationCtx): Promise<string> {
  let token = generateExamToken(6)
  let existing = await ctx.db
    .query("examSessions")
    .withIndex("by_token", (q) => q.eq("token", token))
    .first()

  let attempts = 0
  while (existing && attempts < 5) {
    token = generateExamToken(6)
    existing = await ctx.db
      .query("examSessions")
      .withIndex("by_token", (q) => q.eq("token", token))
      .first()
    attempts++
  }

  return token
}

type RotationSource = {
  status: "draft" | "active" | "ended"
  tokenRotationMinutes?: number
  tokenRotatedAt?: number
}

/**
 * Menghitung sisa detik token berlaku dari nilai server. Absen saat sesi tidak aktif
 * atau rotasi dimatikan, supaya klien tidak menampilkan hitung mundur palsu.
 */
export function tokenRotationState(session: RotationSource, now: number) {
  const tokenRotationMinutes = session.tokenRotationMinutes ?? null
  const tokenRotatedAt = session.tokenRotatedAt ?? null

  if (session.status !== "active" || tokenRotationMinutes === null || tokenRotatedAt === null) {
    return { tokenRotationMinutes, tokenRotatedAt, tokenSecondsRemaining: null }
  }

  const expiresAt = tokenRotationDueAt(tokenRotatedAt, tokenRotationMinutes)
  return {
    tokenRotationMinutes,
    tokenRotatedAt,
    tokenSecondsRemaining: Math.max(0, Math.ceil((expiresAt - now) / 1000)),
  }
}
