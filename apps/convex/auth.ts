import { createClient, type GenericCtx } from "@convex-dev/better-auth"
import { convex } from "@convex-dev/better-auth/plugins"
import { betterAuth } from "better-auth/minimal"

import { components } from "./_generated/api"
import type { DataModel } from "./_generated/dataModel"
import { env } from "./_generated/server"
import authConfig from "./auth.config"

// These fields are declared in convex.config.ts. The intersection keeps a
// clean, unconfigured starter type-safe before a user's first codegen run.
const authEnv = env as typeof env & {
  EMAIL_PASSWORD_AUTH_ENABLED?: string
  GOOGLE_AUTH_ENABLED?: string
}

const emailAndPasswordEnabled =
  authEnv.EMAIL_PASSWORD_AUTH_ENABLED !== "false" ||
  env.E2E_EMAIL_PASSWORD_AUTH_ENABLED === "true"

const googleCredentials =
  env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
    ? {
        clientId: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
      }
    : null

const googleEnabled =
  authEnv.GOOGLE_AUTH_ENABLED === "true" ||
  (authEnv.GOOGLE_AUTH_ENABLED !== "false" && googleCredentials !== null)

if (authEnv.GOOGLE_AUTH_ENABLED === "true" && googleCredentials === null) {
  throw new Error(
    "Google authentication is enabled, but GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET is missing."
  )
}

export const authComponent = createClient<DataModel>(components.betterAuth)

export const createAuth = (ctx: GenericCtx<DataModel>) =>
  betterAuth({
    baseURL: env.SITE_URL,
    trustedOrigins: [
      "https://e-imtihan.online",
      "https://www.e-imtihan.online",
      "https://icentresmart.my.id",
      "http://localhost:3000",
      "http://localhost:3001",
      "http://localhost:3002",
      "http://127.0.0.1:3000",
      "http://127.0.0.1:3001",
      "http://127.0.0.1:3002",
      "http://localhost:*",
      "http://127.0.0.1:*",
      "http://192.168.*:*",
      ...(env.SITE_URL ? [env.SITE_URL] : []),
    ],
    basePath: "/api/auth",
    database: authComponent.adapter(ctx),
    secret: env.BETTER_AUTH_SECRET,
    emailAndPassword: {
      enabled: emailAndPasswordEnabled,
      requireEmailVerification: false,
    },
    socialProviders:
      googleEnabled && googleCredentials ? { google: googleCredentials } : {},
    plugins: [convex({ authConfig })],
  })
