"use client"

import * as React from "react"
import { useMutation } from "convex/react"
import {
  CheckIcon,
  ClockIcon,
  CopyIcon,
  Maximize2Icon,
  RefreshCwIcon,
  XIcon,
} from "lucide-react"
import { toast } from "sonner"

import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { formatTokenCountdown } from "@/lib/session-token"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export type TokenRotationSession = {
  _id: Id<"examSessions">
  title: string
  token: string
  status: "draft" | "active" | "ended"
  tokenRotationMinutes: number | null
  tokenRotatedAt: number | null
  tokenSecondsRemaining: number | null
}

function TokenCountdown({
  initialSeconds,
  tone = "default",
}: {
  initialSeconds: number
  tone?: "default" | "inverse"
}) {
  const [seconds, setSeconds] = React.useState(initialSeconds)

  React.useEffect(() => {
    const tick = setInterval(() => {
      setSeconds((current) => (current <= 0 ? 0 : current - 1))
    }, 1000)
    return () => clearInterval(tick)
  }, [])

  return (
    <span
      className={`flex items-center gap-1.5 font-mono text-xs tabular-nums ${
        tone === "inverse" ? "text-emerald-200" : "text-amber-700 dark:text-amber-400"
      }`}
    >
      <ClockIcon className="size-3.5 shrink-0" />
      {formatTokenCountdown(seconds)}
    </span>
  )
}

function formatRotationClock(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function SessionTokenCard({ session }: { session: TokenRotationSession }) {
  const regenerateToken = useMutation(api.examSession.public.mutations.regenerateSessionToken)

  const [copied, setCopied] = React.useState(false)
  const [isFullscreen, setIsFullscreen] = React.useState(false)
  const [isRegenerating, setIsRegenerating] = React.useState(false)
  const dialogRef = React.useRef<HTMLDivElement>(null)
  const fullscreenTriggerRef = React.useRef<HTMLButtonElement>(null)

  const rotationActive =
    session.status === "active" &&
    session.tokenRotationMinutes !== null &&
    session.tokenSecondsRemaining !== null

  React.useEffect(() => {
    if (!isFullscreen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsFullscreen(false)
        return
      }

      if (event.key !== "Tab" || !dialogRef.current) return

      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
      )
      if (focusable.length === 0) return

      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    const previousOverflow = document.body.style.overflow
    const trigger = fullscreenTriggerRef.current
    document.body.style.overflow = "hidden"
    document.addEventListener("keydown", handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener("keydown", handleKeyDown)
      trigger?.focus()
    }
  }, [isFullscreen])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(session.token)
      setCopied(true)
      toast.success(`Token ${session.token} disalin ke clipboard!`)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error("Token gagal disalin. Salin manual dari layar.")
    }
  }

  const handleRegenerate = async () => {
    const confirmed = confirm(
      `Ganti token sesi "${session.title}" sekarang? Token lama langsung tidak berlaku dan hitung mundur dimulai ulang.`
    )
    if (!confirmed) return

    setIsRegenerating(true)
    try {
      const result = await regenerateToken({ sessionId: session._id })
      toast.success(
        `Token baru: ${result.token} • pukul ${formatRotationClock(result.rotatedAt)}`
      )
    } catch (err: unknown) {
      const error = err as Error
      toast.error(error.message || "Gagal mengganti token sesi.")
    } finally {
      setIsRegenerating(false)
    }
  }

  const statusHint =
    session.status === "draft"
      ? "Sesi belum aktif. Token dapat dibagikan menjelang sesi dimulai."
      : session.status === "ended"
        ? "Sesi telah berakhir; token tidak dapat dipakai lagi."
        : rotationActive
          ? "Token berganti otomatis selama sesi aktif."
          : "Token tetap sampai diganti manual."

  const countdown =
    rotationActive && session.tokenSecondsRemaining !== null ? (
      <TokenCountdown
        key={`${session.token}:${session.tokenSecondsRemaining}`}
        initialSeconds={session.tokenSecondsRemaining}
      />
    ) : null

  return (
    <>
      <Card className="border shadow-xs">
        <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between gap-2">
          <CardTitle className="text-sm font-heading flex items-center gap-2">
            Token Sesi
            <Badge variant="outline" className="text-[10px] font-normal">
              {rotationActive
                ? `${session.tokenRotationMinutes} menit`
                : session.status === "active"
                  ? "Tetap"
                  : session.status === "draft"
                    ? "Draf"
                    : "Berakhir"}
            </Badge>
          </CardTitle>
          {countdown}
        </CardHeader>
        <CardContent className="p-4 pt-2 flex flex-col lg:flex-row lg:items-center gap-3">
          <div className="flex items-center gap-3">
            <span className="font-mono text-3xl font-bold tracking-[0.25em] text-foreground">
              {session.token}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 lg:ml-auto">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={handleCopy}
              title="Salin token ke clipboard"
            >
              {copied ? <CheckIcon className="size-3.5" /> : <CopyIcon className="size-3.5" />}
              {copied ? "Tersalin" : "Salin"}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5"
              ref={fullscreenTriggerRef}
              onClick={() => setIsFullscreen(true)}
              title="Tayangkan token ke layar kelas"
            >
              <Maximize2Icon className="size-3.5" />
              Tayangkan layar penuh
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={handleRegenerate}
              disabled={isRegenerating}
              title="Ganti token sekarang"
            >
              <RefreshCwIcon className={`size-3.5 ${isRegenerating ? "animate-spin" : ""}`} />
              {isRegenerating ? "Mengganti..." : "Ganti token"}
            </Button>
          </div>

          <p className="text-[11px] text-muted-foreground lg:w-full">{statusHint}</p>
        </CardContent>
      </Card>

      {isFullscreen && (
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="token-fullscreen-title"
          className="fixed inset-0 z-50 flex flex-col bg-emerald-950 text-emerald-50"
        >
          <div className="flex items-start justify-between gap-4 p-5 sm:p-8">
            <div className="space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-300">
                Token Ujian
              </p>
              <h2
                id="token-fullscreen-title"
                className="text-xl sm:text-3xl font-heading font-bold"
              >
                {session.title}
              </h2>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              autoFocus
              onClick={() => setIsFullscreen(false)}
              className="gap-1.5 border-emerald-400/40 bg-emerald-900/60 text-emerald-50 hover:bg-emerald-800 hover:text-white"
            >
              <XIcon className="size-4" />
              Keluar
            </Button>
          </div>

          <div className="flex flex-1 flex-col items-center justify-center gap-6 px-4 pb-10 text-center">
            <p
              className="font-mono font-bold tracking-[0.25em] leading-none select-all text-[clamp(4rem,20vw,14rem)]"
            >
              {session.token}
            </p>
            {rotationActive && session.tokenSecondsRemaining !== null && (
              <TokenCountdown
                key={`fs:${session.token}:${session.tokenSecondsRemaining}`}
                initialSeconds={session.tokenSecondsRemaining}
                tone="inverse"
              />
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="gap-1.5 border-emerald-400/40 bg-emerald-900/60 text-emerald-50 hover:bg-emerald-800 hover:text-white"
            >
              {copied ? <CheckIcon className="size-4" /> : <CopyIcon className="size-4" />}
              {copied ? "Tersalin" : "Salin token"}
            </Button>
          </div>
        </div>
      )}
    </>
  )
}
