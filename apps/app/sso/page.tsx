"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import {
  AlertCircleIcon,
  CheckCircle2Icon,
  KeyRoundIcon,
  Loader2Icon,
  LockIcon,
  ShieldCheckIcon,
} from "lucide-react"

import { authClient } from "@/lib/auth-client"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

function SsoReceiver() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handoffToken = searchParams.get("handoffToken")
  const handoffUid = searchParams.get("handoffUid")
  const handoffEmail = searchParams.get("handoffEmail")
  const handoffName = searchParams.get("handoffName")

  const [status, setStatus] = React.useState<
    "verifying" | "authenticating" | "linking" | "success" | "error"
  >("verifying")
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)
  const [attempted, setAttempted] = React.useState(false)

  // State untuk alur sinkronisasi akun yang sudah ada sebelumnya di E-Imtihan
  const [linkingEmail, setLinkingEmail] = React.useState("")
  const [linkingCredential, setLinkingCredential] = React.useState("")
  const [linkingPassword, setLinkingPassword] = React.useState("")
  const [linkingError, setLinkingError] = React.useState<string | null>(null)
  const [isLinkingSubmitting, setIsLinkingSubmitting] = React.useState(false)

  const processHandoff = React.useCallback(async () => {
    if (!handoffToken || !handoffUid || !handoffEmail) {
      setStatus("error")
      setErrorMessage(
        "Tautan masuk tidak memuat tiket autentikasi SiPAKSa yang lengkap. Pastikan Anda membuka E-Imtihan melalui tombol resmi di portal SiPAKSa iCentre."
      )
      return
    }

    try {
      setStatus("verifying")
      setErrorMessage(null)

      // 0. Cek apakah di peramban ini sudah aktif sesi akun yang sama
      try {
        const currentSession = await authClient.getSession()
        const activeUserEmail = currentSession?.data?.user?.email?.trim().toLowerCase()
        const targetEmail = handoffEmail.trim().toLowerCase()
        if (activeUserEmail && activeUserEmail === targetEmail) {
          setStatus("success")
          setTimeout(() => {
            router.push("/bank-soal")
          }, 600)
          return
        }
      } catch {
        // Abaikan kegagalan baca sesi lokal, lanjutkan verifikasi backend
      }

      // 1. Verifikasi tiket identitas SiPAKSa di backend
      const res = await fetch("/api/auth/sipaksa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: handoffToken,
          uid: handoffUid,
          email: handoffEmail,
          name: handoffName || undefined,
        }),
      })

      const data = (await res.json().catch(() => null)) as {
        success?: boolean
        email?: string
        name?: string
        credential?: string
        error?: string
      } | null

      if (!res.ok || !data?.success || !data.credential || !data.email) {
        setStatus("error")
        setErrorMessage(
          data?.error ||
            "Tiket autentikasi SiPAKSa tidak dapat divalidasi atau telah kedaluwarsa. Silakan muat ulang dari portal SiPAKSa."
        )
        return
      }

      // 2. Terbitkan sesi Better Auth untuk pengajar
      setStatus("authenticating")

      const signInResult = await authClient.signIn.email({
        email: data.email,
        password: data.credential,
        callbackURL: "/bank-soal",
      })

      if (signInResult.error) {
        // Coba lakukan provisioning otomatis bila akun baru pertama kali datang
        const signUpResult = await authClient.signUp.email({
          name: data.name || "Ustadz/Pengajar SiPAKSa",
          email: data.email,
          password: data.credential,
          callbackURL: "/bank-soal",
        })

        if (signUpResult.error) {
          const isUserAlreadyExists =
            signUpResult.error.status === 422 ||
            /already exists/i.test(signUpResult.error.message || "")

          if (isUserAlreadyExists) {
            // Akun email ini sudah terdaftar sebelumnya di E-Imtihan dengan kata sandi lama.
            // Buka form sinkronisasi satu kali agar ustadz dapat menghubungkan akunnya.
            setLinkingEmail(data.email)
            setLinkingCredential(data.credential)
            setLinkingError(null)
            setStatus("linking")
            return
          }

          setStatus("error")
          setErrorMessage(
            signUpResult.error.message ||
              "Gagal mendaftarkan profil pengajar ke sistem E-Imtihan. Silakan hubungi administrator."
          )
          return
        }
      }

      setStatus("success")
      setTimeout(() => {
        router.push("/bank-soal")
      }, 700)
    } catch {
      setStatus("error")
      setErrorMessage(
        "Terjadi gangguan koneksi saat menghubungkan ke server E-Imtihan. Periksa jaringan Anda dan coba kembali."
      )
    }
  }, [handoffToken, handoffUid, handoffEmail, handoffName, router])

  React.useEffect(() => {
    if (!attempted) {
      setAttempted(true)
      processHandoff()
    }
  }, [attempted, processHandoff])

  // Handler sinkronisasi kata sandi akun yang sudah ada ke kredensial terpadu SiPAKSa
  const handleLinkExistingAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!linkingPassword || isLinkingSubmitting) return

    try {
      setIsLinkingSubmitting(true)
      setLinkingError(null)

      // 1. Masuk menggunakan kata sandi lama yang dimasukkan guru
      const loginRes = await authClient.signIn.email({
        email: linkingEmail,
        password: linkingPassword,
        callbackURL: "/bank-soal",
      })

      if (loginRes.error) {
        setLinkingError(
          "Kata sandi E-Imtihan yang Anda masukkan tidak cocok. Pastikan kata sandi sesuai dengan saat Anda mendaftar di E-Imtihan."
        )
        setIsLinkingSubmitting(false)
        return
      }

      // 2. Perbarui kata sandi menjadi kredensial deterministik SiPAKSa
      // agar di masa mendatang pengajar dapat langsung masuk tanpa prompt ini lagi
      try {
        await authClient.changePassword({
          currentPassword: linkingPassword,
          newPassword: linkingCredential,
          revokeOtherSessions: false,
        })
      } catch {
        // Jika pembaruan kata sandi internal ditolak, sesi login tetap aktif
      }

      setStatus("success")
      setTimeout(() => {
        router.push("/bank-soal")
      }, 700)
    } catch {
      setLinkingError("Terjadi kendala jaringan saat menghubungkan akun. Silakan coba kembali.")
      setIsLinkingSubmitting(false)
    }
  }

  return (
    <Card className="w-full max-w-md border-border/80 shadow-md">
      <CardHeader className="text-center">
        <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          {status === "verifying" || status === "authenticating" ? (
            <Loader2Icon className="size-6 animate-spin" />
          ) : status === "success" ? (
            <CheckCircle2Icon className="size-6 text-emerald-600" />
          ) : status === "linking" ? (
            <KeyRoundIcon className="size-6 text-primary" />
          ) : (
            <AlertCircleIcon className="size-6 text-destructive" />
          )}
        </div>
        <CardTitle className="text-lg">
          {status === "verifying" && "Memverifikasi Tiket SiPAKSa"}
          {status === "authenticating" && "Menyiapkan Sesi Pengajar"}
          {status === "linking" && "Sinkronisasi Akun E-Imtihan"}
          {status === "success" && "Autentikasi Berhasil"}
          {status === "error" && "Gagal Menghubungkan Akun"}
        </CardTitle>
        <CardDescription>
          {status === "verifying" && "Memeriksa tanda tangan dan keabsahan data resmi SiPAKSa iCentre..."}
          {status === "authenticating" && `Menghubungkan akun ${handoffEmail || "pengajar"} ke ruang kerja CBT...`}
          {status === "linking" &&
            `Email ${linkingEmail} sudah terdaftar di E-Imtihan. Masukkan kata sandi akun Anda untuk sinkronisasi sekali saja dengan SiPAKSa.`}
          {status === "success" && "Identitas terkonfirmasi. Anda akan dialihkan ke Bank Soal..."}
          {status === "error" && "Sesi tidak dapat diteruskan secara otomatis."}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {status === "error" && errorMessage && (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            <p className="leading-relaxed">{errorMessage}</p>
          </div>
        )}

        {(status === "verifying" || status === "authenticating") && (
          <div className="space-y-2 py-2">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div className="h-full w-2/3 animate-pulse rounded-full bg-primary" />
            </div>
            <p className="text-center text-xs text-muted-foreground">
              Mohon tunggu beberapa detik, proses ini berlangsung secara otomatis...
            </p>
          </div>
        )}

        {status === "linking" && (
          <form onSubmit={handleLinkExistingAccount} className="space-y-3">
            {linkingError && (
              <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
                {linkingError}
              </div>
            )}

            <div className="space-y-1.5 text-left">
              <Label htmlFor="sso-linking-password" className="text-xs font-medium">
                Kata Sandi E-Imtihan Anda
              </Label>
              <div className="relative">
                <LockIcon className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                <Input
                  id="sso-linking-password"
                  type="password"
                  placeholder="Masukkan kata sandi akun Anda"
                  className="pl-9 text-sm"
                  value={linkingPassword}
                  onChange={(e) => setLinkingPassword(e.target.value)}
                  disabled={isLinkingSubmitting}
                  autoFocus
                  required
                />
              </div>
              <p className="text-[11px] text-muted-foreground leading-normal">
                Verifikasi ini hanya dilakukan satu kali. Setelah terhubung, Anda dapat membuka E-Imtihan langsung dari SiPAKSa tanpa kata sandi.
              </p>
            </div>

            <Button
              type="submit"
              className="w-full gap-2"
              disabled={isLinkingSubmitting || !linkingPassword}
            >
              {isLinkingSubmitting ? (
                <>
                  <Loader2Icon className="size-4 animate-spin" />
                  <span>Menghubungkan Akun...</span>
                </>
              ) : (
                <>
                  <ShieldCheckIcon className="size-4" />
                  <span>Hubungkan & Masuk ke Bank Soal</span>
                </>
              )}
            </Button>
          </form>
        )}

        {status === "success" && (
          <div className="rounded-md border border-emerald-500/20 bg-emerald-500/10 p-3 text-center text-sm text-emerald-700 dark:text-emerald-300">
            Selamat datang! Mengalihkan ke Bank Soal...
          </div>
        )}
      </CardContent>

      {(status === "error" || status === "linking") && (
        <CardFooter className="flex flex-col gap-2 sm:flex-row border-t pt-4">
          {status === "error" ? (
            <Button
              variant="default"
              className="w-full"
              onClick={() => {
                setAttempted(false)
                processHandoff()
              }}
            >
              Coba Lagi
            </Button>
          ) : null}
          <Link
            href="/login"
            className={buttonVariants({ variant: "outline", className: "w-full" })}
          >
            Masuk Manual
          </Link>
        </CardFooter>
      )}
    </Card>
  )
}

function SsoFallback() {
  return (
    <Card className="w-full max-w-md border-border/80 shadow-md">
      <CardHeader className="text-center">
        <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Loader2Icon className="size-6 animate-spin" />
        </div>
        <CardTitle className="text-lg">Memuat Sesi SiPAKSa</CardTitle>
        <CardDescription>Menghubungkan ke server E-Imtihan...</CardDescription>
      </CardHeader>
    </Card>
  )
}

export default function SsoPage() {
  return (
    <main className="flex min-h-svh items-center justify-center bg-muted/30 px-4 py-12">
      <div className="flex w-full max-w-md flex-col items-center gap-4">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <ShieldCheckIcon className="size-4 text-primary" />
          <span>Integrasi Terpadu SiPAKSa iCentre & E-Imtihan</span>
        </div>
        <React.Suspense fallback={<SsoFallback />}>
          <SsoReceiver />
        </React.Suspense>
      </div>
    </main>
  )
}
