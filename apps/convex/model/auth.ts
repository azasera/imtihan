import type { ActionCtx, MutationCtx, QueryCtx } from "../_generated/server"

export interface AuthenticatedUser {
  tokenIdentifier: string
  name: string
  email?: string
}

/**
 * Autentikasi pemanggil (pengajar/admin) di query, mutation, maupun action.
 * Identitas selalu diambil dari sisi server, never from a client-supplied argument.
 */
export async function requireAuthenticatedUser(
  ctx: QueryCtx | MutationCtx | ActionCtx
): Promise<AuthenticatedUser> {
  const identity = await ctx.auth.getUserIdentity()
  if (!identity) {
    throw new Error("Akses ditolak: Anda harus login untuk melakukan tindakan ini.")
  }

  return {
    tokenIdentifier: identity.tokenIdentifier,
    name: identity.name ?? "Pengajar",
    email: identity.email,
  }
}
