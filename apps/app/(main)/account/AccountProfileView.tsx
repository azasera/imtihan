"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  BookOpenIcon,
  CheckCircle2Icon,
  ChevronRightIcon,
  FileSpreadsheetIcon,
  GraduationCapIcon,
  LogOutIcon,
  MailIcon,
  MonitorIcon,
  ShieldCheckIcon,
  SparklesIcon,
  UserCheckIcon,
  UserIcon,
} from "lucide-react"
import { toast } from "sonner"

import { authClient } from "@/lib/auth-client"
import { siteConfig } from "@/lib/site-config"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"

function getInitials(name?: string | null, email?: string | null) {
  if (name?.trim()) {
    const segments = name.trim().split(/\s+/)
    if (segments.length > 1) {
      return `${segments[0].slice(0, 1)}${segments[segments.length - 1].slice(0, 1)}`.toUpperCase()
    }
    return segments[0].slice(0, 2).toUpperCase()
  }

  if (email?.trim()) {
    const localPart = email.split("@")[0]
    return localPart.slice(0, 2).toUpperCase()
  }

  return "P"
}

export function AccountProfileView() {
  const router = useRouter()
  const { data: session, isPending } = authClient.useSession()
  const [isSigningOut, setIsSigningOut] = React.useState(false)

  const user = session?.user
  const teacherName = user?.name?.trim() || "Pengajar / Asatidz"
  const teacherEmail = user?.email?.trim() || "Email belum disetel"
  const initials = getInitials(user?.name, user?.email)

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true)
      await authClient.signOut()
      toast.success("Berhasil keluar dari akun")
      router.push("/login")
      router.refresh()
    } catch {
      toast.error("Gagal keluar dari sesi. Silakan coba kembali.")
    } finally {
      setIsSigningOut(false)
    }
  }

  if (isPending) {
    return (
      <div className="flex flex-1 flex-col gap-6 px-4 py-6 lg:px-8 max-w-5xl">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <Skeleton className="size-20 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-6 w-56" />
                <Skeleton className="h-4 w-40" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-6 px-4 py-6 lg:px-8 max-w-5xl">
      {/* Header Halaman */}
      <div className="flex flex-col gap-1.5 border-b pb-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Link href="/" className="hover:text-foreground transition-colors">
            Dashboard
          </Link>
          <ChevronRightIcon className="size-3.5" />
          <span className="text-foreground font-medium">Pengaturan Akun</span>
        </div>
        <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground lg:text-3xl">
          Pengaturan Akun Pengajar
        </h1>
        <p className="text-sm text-muted-foreground">
          Informasi profil pengajar, hak akses asesmen, dan pengaturan keamanan akun di {siteConfig.name}.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Kartu Profil Guru / Pengajar Utama */}
        <Card className="md:col-span-2 border-border shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <Avatar className="size-20 ring-2 ring-emerald-500/20 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300">
                {user?.image ? (
                  <AvatarImage src={user.image} alt={teacherName} />
                ) : null}
                <AvatarFallback className="text-xl font-bold font-heading bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
                  {initials}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-xs font-medium">
                    <UserCheckIcon className="size-3.5 mr-1" />
                    Pengajar / Asatidz
                  </Badge>
                  <Badge variant="secondary" className="text-xs font-normal">
                    <ShieldCheckIcon className="size-3.5 mr-1 text-emerald-600 dark:text-emerald-400" />
                    Sesi Terverifikasi
                  </Badge>
                </div>
                <h2 className="text-xl font-bold tracking-tight text-foreground truncate sm:text-2xl" data-testid="teacher-name">
                  {teacherName}
                </h2>
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <MailIcon className="size-4 shrink-0" />
                  <span className="truncate">{teacherEmail}</span>
                </div>
              </div>
            </div>
          </CardHeader>

          <Separator />

          <CardContent className="pt-5 space-y-4 text-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3.5 rounded-lg border bg-muted/30 space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Lembaga Naungan
                </p>
                <div className="flex items-center gap-2 font-medium text-foreground">
                  <GraduationCapIcon className="size-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Pesantren Islamic Centre At-Tauhid</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  SMPITA · SMAITA · MTA
                </p>
              </div>

              <div className="p-3.5 rounded-lg border bg-muted/30 space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Status Akun
                </p>
                <div className="flex items-center gap-2 font-medium text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2Icon className="size-4" />
                  <span>Aktif & Berwenang</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Terdaftar dalam sistem evaluasi CBT
                </p>
              </div>
            </div>
          </CardContent>

          <CardFooter className="bg-muted/15 border-t flex flex-wrap items-center justify-between gap-3 pt-4 pb-4">
            <p className="text-xs text-muted-foreground">
              Untuk memperbarui nama atau kata sandi, hubungi admin sistem pesantren.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSignOut}
              disabled={isSigningOut}
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              <LogOutIcon className="size-4 mr-1.5" />
              {isSigningOut ? "Keluar..." : "Keluar Sesi"}
            </Button>
          </CardFooter>
        </Card>

        {/* Kartu Ringkasan Pintasan */}
        <div className="space-y-6">
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <SparklesIcon className="size-4 text-emerald-600 dark:text-emerald-400" />
                Akses Asesmen
              </CardTitle>
              <CardDescription className="text-xs">
                Modul utama yang dikelola oleh pengajar
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2.5 pt-0">
              <Link
                href="/bank-soal"
                className="flex items-center justify-between p-2.5 rounded-md hover:bg-accent transition-colors group text-sm border"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <BookOpenIcon className="size-4" />
                  </div>
                  <div>
                    <div className="font-medium text-foreground">Bank Soal</div>
                    <div className="text-xs text-muted-foreground">Kelola naskah & butir soal</div>
                  </div>
                </div>
                <ChevronRightIcon className="size-4 text-muted-foreground group-hover:text-foreground transition-transform group-hover:translate-x-0.5" />
              </Link>

              <Link
                href="/sesi-ujian"
                className="flex items-center justify-between p-2.5 rounded-md hover:bg-accent transition-colors group text-sm border"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400">
                    <MonitorIcon className="size-4" />
                  </div>
                  <div>
                    <div className="font-medium text-foreground">Sesi Ujian</div>
                    <div className="text-xs text-muted-foreground">Jadwal & token asesmen</div>
                  </div>
                </div>
                <ChevronRightIcon className="size-4 text-muted-foreground group-hover:text-foreground transition-transform group-hover:translate-x-0.5" />
              </Link>

              <Link
                href="/rekap-nilai"
                className="flex items-center justify-between p-2.5 rounded-md hover:bg-accent transition-colors group text-sm border"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400">
                    <FileSpreadsheetIcon className="size-4" />
                  </div>
                  <div>
                    <div className="font-medium text-foreground">Rekap Nilai</div>
                    <div className="text-xs text-muted-foreground">Hasil & koreksi santri</div>
                  </div>
                </div>
                <ChevronRightIcon className="size-4 text-muted-foreground group-hover:text-foreground transition-transform group-hover:translate-x-0.5" />
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
