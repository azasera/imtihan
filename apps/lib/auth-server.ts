import { convexBetterAuthNextJs } from "@convex-dev/better-auth/nextjs"

const convexUrl =
  process.env.NEXT_PUBLIC_CONVEX_URL || "https://tough-fennec-614.convex.cloud"
const convexSiteUrl =
  process.env.NEXT_PUBLIC_CONVEX_SITE_URL ||
  process.env.CONVEX_SITE_URL ||
  "https://tough-fennec-614.convex.site"

const auth = convexBetterAuthNextJs({
  convexUrl,
  convexSiteUrl,
  basePath: "/api/auth",
})

export const handler = auth.handler

export const getToken = async (): Promise<string | undefined> => {
  try {
    return await auth.getToken()
  } catch (error) {
    console.warn(
      "[auth-server] getToken gagal menjangkau server otentikasi Convex:",
      error instanceof Error ? error.message : String(error)
    )
    return undefined
  }
}

export const isAuthenticated = async (): Promise<boolean> => {
  try {
    return await auth.isAuthenticated()
  } catch (error) {
    console.warn(
      "[auth-server] isAuthenticated gagal menjangkau server otentikasi Convex:",
      error instanceof Error ? error.message : String(error)
    )
    return false
  }
}

export const {
  preloadAuthQuery,
  fetchAuthQuery,
  fetchAuthMutation,
  fetchAuthAction,
} = auth
