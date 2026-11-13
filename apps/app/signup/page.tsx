import Link from "next/link"
import { redirect } from "next/navigation"
import { ExternalLinkIcon, LockIcon, ShieldAlertIcon } from "lucide-react"

import { buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { isAuthenticated } from "@/lib/auth-server"
import { siteConfig } from "@/lib/site-config"

export default async function SignupPage() {
  if (await isAuthenticated()) redirect("/account/")

  return (
    <main className="flex min-h-svh items-center justify-center bg-muted/30 px-4 py-12">
      <Card className="w-full max-w-md border-border/80 shadow-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <LockIcon className="size-6" />
          </div>
          <CardTitle className="text-lg">
            Pendaftaran Mandiri Ditutup
          </CardTitle>
          <CardDescription>
            Sistem autentikasi {siteConfig.name} terintegrasi langsung dengan portal resmi SiPAKSa iCentre.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border border-border/70 bg-muted/40 p-3.5 text-xs text-muted-foreground">
            <div className="mb-2 flex items-center gap-1.5 font-medium text-foreground">
              <ShieldAlertIcon className="size-4 text-primary" />
              <span>Cara Masuk Bagi Pengajar & Staf:</span>
            </div>
            <ol className="list-inside list-decimal space-y-1.5 leading-relaxed">
              <li>Masuk ke akun Anda di portal SiPAKSa iCentre.</li>
              <li>Pilih menu atau tombol pintasan <strong>E-Imtihan (CBT)</strong>.</li>
              <li>Sesi Anda akan otomatis terhubung ke sistem tanpa perlu mendaftar atau mengingat kata sandi baru.</li>
            </ol>
          </div>

          <a
            href="https://icentresmart.my.id"
            target="_blank"
            rel="noopener noreferrer"
            className={buttonVariants({ variant: "default", className: "w-full gap-2" })}
          >
            <span>Buka Portal SiPAKSa iCentre</span>
            <ExternalLinkIcon className="size-4" />
          </a>
        </CardContent>
        <CardFooter className="justify-center border-t py-3">
          <p className="text-center text-xs text-muted-foreground">
            Akun administrator lokal?{" "}
            <Link
              className="font-medium text-foreground underline"
              href="/login"
            >
              Masuk di sini
            </Link>
          </p>
        </CardFooter>
      </Card>
    </main>
  )
}
