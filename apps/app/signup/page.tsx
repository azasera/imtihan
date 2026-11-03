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

export default async function SignupPage() {
  if (await isAuthenticated()) redirect("/account/")

  const credentialsEnabled =
    process.env.NEXT_PUBLIC_EMAIL_PASSWORD_AUTH_ENABLED === "true" ||
    process.env.E2E_EMAIL_PASSWORD_AUTH_ENABLED === "true"
  const googleEnabled = process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED !== "false"

  const authDescription =
    googleEnabled && credentialsEnabled
      ? "Continue with Google or create an account with email and password."
      : googleEnabled
        ? "Continue with Google to create your account."
        : "Create an account with your email and password."

  return (
    <main className="flex min-h-svh items-center justify-center bg-muted/30 px-4 py-12">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-lg">
            Create your {siteConfig.name} account
          </CardTitle>
          <CardDescription>{authDescription}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <AuthForm
            credentialsEnabled={credentialsEnabled}
            googleEnabled={googleEnabled}
            mode="signup"
          />
          <p className="text-center text-xs text-muted-foreground">
            Already have an account?{" "}
            <Link
              className="font-medium text-foreground underline"
              href="/login"
            >
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  )
}
