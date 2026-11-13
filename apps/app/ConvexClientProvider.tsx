"use client"

import {
  ConvexBetterAuthProvider,
  type AuthClient,
} from "@convex-dev/better-auth/react"
import { ConvexReactClient } from "convex/react"
import { ReactNode } from "react"

import { authClient } from "@/lib/auth-client"

const convex = new ConvexReactClient(
  process.env.NEXT_PUBLIC_CONVEX_URL || "https://tough-fennec-614.convex.cloud"
)

export function ConvexClientProvider({
  children,
  initialToken,
}: {
  children: ReactNode
  initialToken?: string | null
}) {
  return (
    <ConvexBetterAuthProvider
      client={convex}
      // Both packages share this runtime contract; Better Auth patch releases
      // currently infer a narrower session generic than the wrapper exports.
      authClient={authClient as unknown as AuthClient}
      initialToken={initialToken}
    >
      {children}
    </ConvexBetterAuthProvider>
  )
}
