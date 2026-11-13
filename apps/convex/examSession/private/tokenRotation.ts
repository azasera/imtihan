import { v } from "convex/values"

import { internal } from "../../_generated/api"
import { internalMutation } from "../../_generated/server"
import { tokenRotationDueAt } from "./helpers"
import { generateUniqueSessionToken } from "./tokenCode"

/**
 * Mengganti token sesi ketika jatuh tempo, lalu menjadwalkan pergantian berikutnya.
 * Pekerjaan terjadwal yang berjalan ganda tidak menggandakan pergantian karena
 * jatuh tempo selalu dihitung ulang dari `tokenRotatedAt` terbaru.
 */
export const rotateSessionTokenIfDue = internalMutation({
  args: {
    sessionId: v.id("examSessions"),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get("examSessions", args.sessionId)
    if (!session) return { rotated: false }

    if (session.status !== "active") {
      return { rotated: false }
    }

    const interval = session.tokenRotationMinutes
    if (!interval) {
      return { rotated: false }
    }

    const now = Date.now()
    const rotatedAt = session.tokenRotatedAt ?? session.updatedAt
    const dueAt = tokenRotationDueAt(rotatedAt, interval)

    if (now < dueAt) {
      await ctx.scheduler.runAt(
        dueAt,
        internal.examSession.private.tokenRotation.rotateSessionTokenIfDue,
        { sessionId: args.sessionId }
      )
      return { rotated: false }
    }

    const token = await generateUniqueSessionToken(ctx)
    await ctx.db.patch("examSessions", args.sessionId, {
      token,
      tokenRotatedAt: now,
      updatedAt: now,
    })

    await ctx.scheduler.runAt(
      tokenRotationDueAt(now, interval),
      internal.examSession.private.tokenRotation.rotateSessionTokenIfDue,
      { sessionId: args.sessionId }
    )

    return { rotated: true, token, rotatedAt: now }
  },
})
