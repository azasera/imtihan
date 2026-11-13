import Link from "next/link"
import { redirect } from "next/navigation"
import { ExternalLinkIcon, ShieldCheckIcon } from "lucide-react"

import { AuthForm } from "@/components/auth-form"
import { buttonVariants } from "@/components/ui/button"
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
    process.env.NEXT_PUBLIC_EMAIL_PASSWORD_AUTH_ENABLED !== "false" ||
    process.env.E2E_EMAIL_PASSWORD_AUTH_ENABLED === "true"
  const googleEnabled = process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED !== "false"

  return (
    <main className="flex min-h-svh items-center justify-center bg-muted/30 px-4 py-12">
      <Card className="w-full max-w-sm border-border/80 shadow-md">
        <CardHeader className="text-center">
          <CardTitle className="text-lg">
            Masuk ke {siteConfig.name}
          </CardTitle>
          <CardDescription>
            Pintu masuk pengajar dan administrator ujian terpadu.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-center space-y-2">
            <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-primary">
              <ShieldCheckIcon className="size-4" />
              <span>Masuk Cepat via SiPAKSa</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Ustadz dan ustadzah yang sudah masuk di SiPAKSa iCentre dapat membuka E-Imtihan langsung tanpa kata sandi.
            </p>
            <a
              href="https://icentresmart.my.id"
              target="_blank"
              rel="noopener noreferrer"
              className={buttonVariants({
                variant: "outline",
                size: "sm",
                className: "w-full gap-1.5 text-xs font-medium",
              })}
            >
              <span>Buka SiPAKSa iCentre</span>
              <ExternalLinkIcon className="size-3.5" />
            </a>
          </div>

          <div className="relative flex items-center justify-center text-[10px] uppercase tracking-wider">
            <div className="w-full border-t border-border" />
            <span className="bg-card px-2 text-muted-foreground">atau akses admin</span>
            <div className="w-full border-t border-border" />
          </div>

          <AuthForm
            credentialsEnabled={credentialsEnabled}
            googleEnabled={googleEnabled}
            mode="login"
          />

          <p className="text-center text-xs text-muted-foreground">
            Belum memiliki akses pengajar?{" "}
            <Link
              className="font-medium text-foreground underline"
              href="/signup"
            >
              Informasi Pendaftaran
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  )
}
