"use client"

import { FormEvent, useState } from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { authClient } from "@/lib/auth-client"

type AuthMode = "login" | "signup"
type PendingAction = "credentials" | "google" | null

const ACCOUNT_PATH = "/account/"

export function AuthForm({
  credentialsEnabled,
  googleEnabled,
  mode,
}: {
  credentialsEnabled: boolean
  googleEnabled: boolean
  mode: AuthMode
}) {
  const router = useRouter()
  const [pendingAction, setPendingAction] = useState<PendingAction>(null)
  const [error, setError] = useState<string | null>(null)
  const isPending = pendingAction !== null

  async function handleGoogle() {
    if (isPending) return

    setPendingAction("google")
    setError(null)

    try {
      const result = await authClient.signIn.social({
        provider: "google",
        callbackURL: ACCOUNT_PATH,
      })

      if (result.error) {
        setError(
          "Google authentication could not be started. Please try again."
        )
        setPendingAction(null)
      }
    } catch {
      setError("Google authentication could not be started. Please try again.")
      setPendingAction(null)
    }
  }

  async function handleCredentials(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!credentialsEnabled || isPending) return

    const form = new FormData(event.currentTarget)
    const email = String(form.get("email") ?? "").trim()
    const password = String(form.get("password") ?? "")
    const name = String(form.get("name") ?? "").trim()

    if (
      !email ||
      password.length < 8 ||
      (mode === "signup" && name.length < 2)
    ) {
      setError(
        mode === "signup"
          ? "Enter your name, a valid email address, and a password of at least 8 characters."
          : "Enter your email address and password (at least 8 characters)."
      )
      return
    }

    setPendingAction("credentials")
    setError(null)

    try {
      const result =
        mode === "signup"
          ? await authClient.signUp.email({
              name,
              email,
              password,
              callbackURL: ACCOUNT_PATH,
            })
          : await authClient.signIn.email({
              email,
              password,
              callbackURL: ACCOUNT_PATH,
            })

      if (result.error) {
        setError(
          mode === "signup"
            ? "That account could not be created. Check the details and try again."
            : "Those credentials could not be verified. Check the details and try again."
        )
        setPendingAction(null)
        return
      }

      router.replace(ACCOUNT_PATH)
      router.refresh()
    } catch {
      setError("Authentication is temporarily unavailable. Please try again.")
      setPendingAction(null)
    }
  }

  return (
    <div className="space-y-4">
      {googleEnabled ? (
        <Button
          className="w-full"
          disabled={isPending}
          onClick={handleGoogle}
          type="button"
          variant="outline"
        >
          {pendingAction === "google"
            ? "Connecting to Google…"
            : "Continue with Google"}
        </Button>
      ) : null}

      {credentialsEnabled ? (
        <>
          {googleEnabled ? (
            <div className="flex items-center gap-3 text-[11px] tracking-wider text-muted-foreground uppercase">
              <span className="h-px flex-1 bg-border" />
              or use email
              <span className="h-px flex-1 bg-border" />
            </div>
          ) : null}

          <form className="space-y-3" onSubmit={handleCredentials}>
            {mode === "signup" ? (
              <div className="space-y-1.5">
                <Label htmlFor="name">Name</Label>
                <Input
                  autoComplete="name"
                  disabled={isPending}
                  id="name"
                  minLength={2}
                  name="name"
                  required
                />
              </div>
            ) : null}

            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                autoComplete="email"
                disabled={isPending}
                id="email"
                name="email"
                required
                type="email"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                autoComplete={
                  mode === "signup" ? "new-password" : "current-password"
                }
                disabled={isPending}
                id="password"
                minLength={8}
                name="password"
                required
                type="password"
              />
            </div>

            <Button className="w-full" disabled={isPending} type="submit">
              {pendingAction === "credentials"
                ? mode === "signup"
                  ? "Creating account…"
                  : "Signing in…"
                : mode === "signup"
                  ? "Create account"
                  : "Sign in with email"}
            </Button>
          </form>
        </>
      ) : null}

      {error ? (
        <p aria-live="polite" className="text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}
