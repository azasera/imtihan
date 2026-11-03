import Link from "next/link"
import { redirect } from "next/navigation"

import { AuthForm } from "@/components/auth-form"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { isAuthenticated } from "@/lib/auth-server"
import { siteConfig } from "@/lib/site-config"

export default async function LoginPage() {
  if (await isAuthenticated()) redirect("/")

  const credentialsEnabled =
    process.env.NEXT_PUBLIC_EMAIL_PASSWORD_AUTH_ENABLED === "true" ||
    process.env.E2E_EMAIL_PASSWORD_AUTH_ENABLED === "true"
  const googleEnabled = process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED !== "false"

  const authDescription =
    googleEnabled && credentialsEnabled
      ? "Continue with Google or sign in with your email and password."
      : googleEnabled
        ? "Continue with Google to open your protected account."
        : "Sign in with your email and password."

  return (
    <main className="flex min-h-svh items-center justify-center bg-muted/30 px-4 py-12">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-lg">
            Sign in to {siteConfig.name}
          </CardTitle>
          <CardDescription>{authDescription}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <AuthForm
            credentialsEnabled={credentialsEnabled}
            googleEnabled={googleEnabled}
            mode="login"
          />
          <p className="text-center text-xs text-muted-foreground">
            New to {siteConfig.name}?{" "}
            <Link
              className="font-medium text-foreground underline"
              href="/signup"
            >
              Create an account
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  )
}
